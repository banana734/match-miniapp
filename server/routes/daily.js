/**
 * 日常反馈路由（正式上课期间的周期性反馈）。
 *
 * 对应接口：
 *   POST /api/daily/feedback  提交日常反馈（决定是否维持或解除正式上课配对）
 *
 * 与试课反馈（trial.js）对称，但更简单：
 *   - 反馈内容写入 family_daily_feedback / mentor_daily_feedback 两张表（每次追加一行）；
 *   - 最后一道题「是否愿意继续合作」只有 愿意 / 不愿意 两个值：
 *       愿意     → 维持正式上课，不改变 trial_records 状态；
 *       不愿意   → 把这张配对从「正式上课」区解除（见下）。
 *
 * 关于「解除双方配对」：
 *   一个配对在 trial_records 里由「双方向各一条」记录组成：
 *     导师侧 openid=M, role=mentor, cardId=family-<F>
 *     家庭侧 openid=F, role=family, cardId=mentor-<M>
 *   选「不愿意」时，把这两端记录的状态都改成 terminated，
 *   它们就同时退出 pending / formal（活跃）集合，从双方的「正式上课」列表消失。
 *   terminated 状态只结束配对关系，不动 role_bindings（一人一身份的账号绑定）。
 */

const {
  readUnifiedDb,
  writeUnifiedDb
} = require('../utils/unified-db')
const { queryRows } = require('../db/database')
const { getTrialList } = require('./trial')

// 判断试课记录是否处于活跃状态（pending 待试课 / formal 已转正式）。
// terminated 等非活跃状态不会出现在列表里（即被移出正式上课区）。
const isActiveStatus = (status) => ['pending', 'formal'].includes(status)

// 取记录的排序时间：优先 updatedAt（最后修改时间），没有再用 createdAt。
const getRecordTime = (record = {}) => {
  return new Date(record.updatedAt || record.createdAt || 0).getTime() || 0
}

// 规范化反馈内容：补齐默认值，只保留这 10 个已知字段，
// 防止前端传入的意外字段直接进库。
const buildStoredFeedback = (feedback = {}) => {
  return {
    classDate: feedback.classDate || '',
    classDuration: feedback.classDuration || '',
    satisfactionPoints: feedback.satisfactionPoints || [],
    satisfactionPointOther: feedback.satisfactionPointOther || '',
    objectiveUnsatisfied: feedback.objectiveUnsatisfied || [],
    objectiveUnsatisfiedOther: feedback.objectiveUnsatisfiedOther || '',
    subjectiveUnsatisfied: feedback.subjectiveUnsatisfied || [],
    subjectiveUnsatisfiedOther: feedback.subjectiveUnsatisfiedOther || '',
    continueChoice: feedback.continueChoice || '',
    continueChoiceOther: feedback.continueChoiceOther || ''
  }
}

// 按反馈人身份决定写哪张反馈表（family / mentor 各一张，结构完全相同）。
const getFeedbackTableName = (role = 'family') => {
  return role === 'mentor' ? 'mentor_daily_feedback' : 'family_daily_feedback'
}

// 把一条日常反馈写入对应的反馈表（INSERT 一行，只追加不更新）。
// 多选字段（satisfactionPoints 等）序列化成 JSON 字符串存进 *_json 列，
// 同时把完整反馈整体存一份到 feedback_json 作备份。
const saveDailyFeedbackRow = async ({
  role = 'family',
  openid = '',
  trialRecordId = '',
  cardId = '',
  targetTitle = '',
  targetSubtitle = '',
  statusAfterFeedback = '',
  feedback = {}
}) => {
  const storedFeedback = buildStoredFeedback(feedback)
  const feedbackId = `daily-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  await queryRows(
    `
      INSERT INTO ${getFeedbackTableName(role)} (
        id,
        openid,
        trial_record_id,
        card_id,
        target_title,
        target_subtitle,
        class_date,
        class_duration,
        satisfaction_points_json,
        satisfaction_point_other,
        objective_unsatisfied_json,
        objective_unsatisfied_other,
        subjective_unsatisfied_json,
        subjective_unsatisfied_other,
        continue_choice,
        continue_choice_other,
        status_after_feedback,
        feedback_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      feedbackId,
      String(openid || ''),
      String(trialRecordId || ''),
      String(cardId || ''),
      String(targetTitle || ''),
      String(targetSubtitle || ''),
      String(storedFeedback.classDate || ''),
      String(storedFeedback.classDuration || ''),
      JSON.stringify(storedFeedback.satisfactionPoints),
      String(storedFeedback.satisfactionPointOther || ''),
      JSON.stringify(storedFeedback.objectiveUnsatisfied),
      String(storedFeedback.objectiveUnsatisfiedOther || ''),
      JSON.stringify(storedFeedback.subjectiveUnsatisfied),
      String(storedFeedback.subjectiveUnsatisfiedOther || ''),
      String(storedFeedback.continueChoice || ''),
      String(storedFeedback.continueChoiceOther || ''),
      String(statusAfterFeedback || ''),
      JSON.stringify(storedFeedback),
      now,
      now
    ]
  )
}

// 提交日常反馈：POST /api/daily/feedback
// body: { openid, role, cardId, continueChoice: 愿意/不愿意, feedback: 完整反馈对象 }
// 做两件事：
//   1. 把这次反馈原文 INSERT 进对应的反馈表，供管理后台查看；
//   2. 如果选了「不愿意」，把配对两端记录的状态改成 terminated（移出正式上课区）。
// 最后返回最新的试课/正式列表，方便前端刷新。
const submitDailyFeedback = async (body = {}) => {
  const {
    role = 'family',
    openid = '',
    cardId,
    continueChoice = '',
    feedback = {}
  } = body

  const db = await readUnifiedDb()
  const records = db.trialRecords || []

  // 提交者自己这一端的活跃记录
  const submitterRecords = records
    .filter((item) => item.openid === openid && item.role === role && String(item.cardId) === String(cardId))
    .filter((item) => isActiveStatus(item.status))
  const latestSubmitterRecord = submitterRecords
    .slice()
    .sort((left, right) => getRecordTime(right) - getRecordTime(left))[0] || { id: '', cardData: {} }

  // 对方那一端：对方持有的卡片 id 就是「提交者角色-提交者openid」，身份是另一角色
  const oppositeRole = role === 'mentor' ? 'family' : 'mentor'
  const counterpartRecords = records
    .filter((item) => String(item.cardId) === `${role}-${openid}` && item.role === oppositeRole)
    .filter((item) => isActiveStatus(item.status))

  // 只处理「不愿意」：把配对两端都移出正式上课区（维持则不动 trial_records）
  let statusAfterFeedback = 'maintained'

  if (continueChoice === '不愿意') {
    statusAfterFeedback = 'terminated'

    const now = new Date().toISOString()
    ;[...submitterRecords, ...counterpartRecords].forEach((item) => {
      item.status = 'terminated'
      item.updatedAt = now
    })

    await writeUnifiedDb(db)
  }

  // 把反馈原文写入反馈表（无论愿意与否都记录）
  await saveDailyFeedbackRow({
    role,
    openid,
    trialRecordId: latestSubmitterRecord.id,
    cardId,
    targetTitle: latestSubmitterRecord.cardData?.title || '',
    targetSubtitle: latestSubmitterRecord.cardData?.subtitle || '',
    statusAfterFeedback,
    feedback: {
      ...feedback,
      continueChoice
    }
  })

  // 重新拉一次列表返回给前端刷新（愿意→卡片仍在；不愿意→卡片已从正式上课区消失）
  const list = await getTrialList(openid, role)

  return {
    success: true,
    message: '反馈已保存',
    status: statusAfterFeedback,
    ...list
  }
}

module.exports = {
  submitDailyFeedback
}
