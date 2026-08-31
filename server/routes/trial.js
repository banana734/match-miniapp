const {
  readUnifiedDb,
  writeUnifiedDb,
  getUserRecords,
  getTrialRecords
} = require('../utils/unified-db')
const { queryRows } = require('../db/database')
const { buildPoolFromUsers } = require('./match')

/**
 * 试课全流程路由（核心业务）。
 *
 * 对应接口：
 *   POST /api/trial/apply     申请试课（把匹配页的卡片加入待试课）
 *   GET  /api/trial/list      查询我的试课列表（待试课 + 已转正式）
 *   POST /api/trial/feedback  提交试课反馈（决定转正式 / 再试一次 / 拒绝）
 *   POST /api/trial/remove    把卡片移出待试课
 *
 * 试课状态机（存在 trial_records.status）：
 *   pending  待试课（初始状态）
 *   formal   转正式（反馈选了「愿意」）
 *   rejected 已拒绝（反馈选了「不愿意」等）
 *   removed  手动移除（用户自己从待试课移出）
 * 其中 pending / formal 算「活跃」状态，会出现在列表里。
 */
// 判断试课记录是否处于活跃状态（pending 待试课 / formal 已转正式）。
const isActiveStatus = (status) => ['pending', 'formal'].includes(status)

// 取记录的排序时间：优先 updatedAt（最后修改时间），没有再用 createdAt。
const getRecordTime = (record = {}) => {
  return new Date(record.updatedAt || record.createdAt || 0).getTime() || 0
}

// 从所有试课记录里筛出「某用户 + 某身份 + 对某张卡片」的全部记录。
// 同一个人对同一张卡片可能多次申请（被拒后再申请），所以是数组。
const getRoleCardRecords = (records = [], openid = '', role = 'family', cardId = '') => {
  return records.filter((item) => {
    return item.openid === openid && item.role === role && String(item.cardId) === String(cardId)
  })
}

// 在上面筛出的记录里取时间最近的一条（历史最新记录）。
const getLatestRoleCardRecord = (records = [], openid = '', role = 'family', cardId = '') => {
  return getRoleCardRecords(records, openid, role, cardId)
    .slice()
    .sort((left, right) => getRecordTime(right) - getRecordTime(left))[0]
}

// 规范化反馈内容：补齐默认值，只保留这 10 个已知字段，
// 防止前端传入的意外字段直接进库。
const buildStoredFeedback = (feedback = {}) => {
  return {
    trialDate: feedback.trialDate || '',
    trialDuration: feedback.trialDuration || '',
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
  return role === 'mentor' ? 'mentor_trial_feedback' : 'family_trial_feedback'
}

// 把一条试课反馈写入对应的反馈表（INSERT 一行，只追加不更新）。
// 每次提交反馈都会新增一条记录，管理后台看到的历史就是这张表。
// 多选字段（satisfactionPoints 等）序列化成 JSON 字符串存进 *_json 列，
// 同时把完整反馈整体存一份到 feedback_json 作备份。
const saveTrialFeedbackRow = async ({
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
  const feedbackId = `${role}-feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
        trial_date,
        trial_duration,
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
      String(storedFeedback.trialDate || ''),
      String(storedFeedback.trialDuration || ''),
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

// 组装试课列表的返回数据（GET /api/trial/list 和各写接口都会附带返回它）：
//   1. 只保留该用户 + 该身份的活跃记录（pending / formal）
//   2. 按时间倒序排
//   3. 同一张卡片去重，只保留最新一条 —— 每张卡片在列表里只出现一次
//   4. 按 status 拆成 pending（待试课）/ formal（已转正式）两个数组
const buildTrialListPayload = (openid = '', role = 'family', records = []) => {
  const activeRecords = records
    .filter((item) => item.openid === openid && item.role === role && isActiveStatus(item.status))
    .slice()
    .sort((left, right) => getRecordTime(right) - getRecordTime(left))

  const seenCardIds = new Set()
  const pending = []
  const formal = []

  activeRecords.forEach((item) => {
    const cardKey = String(item.cardId)

    if (seenCardIds.has(cardKey)) {
      return
    }

    seenCardIds.add(cardKey)

    if (item.status === 'pending') {
      pending.push(item.cardData)
      return
    }

    formal.push(item.cardData)
  })

  return {
    role,
    pending,
    formal
  }
}

// 申请试课：POST /api/trial/apply  body: { openid, role, cardId }
// 三种情况：
//   1. 已有活跃记录（pending/formal）→ 不新建，只刷新卡片数据为最新版，返回 status: 'exists'
//   2. 只有历史记录（被拒/被移除过）→ 复活最新一条记录重置为 pending
//   3. 从没申请过 → 新建一条 pending 记录
const applyTrial = async (body = {}) => {
  const { openid = '', role = 'family', cardId } = body
  const db = await readUnifiedDb()
  const records = getTrialRecords(db)
  // 复用本次已经读到的 users，不再为了拿匹配池重复读一遍全库。
  const sourcePool = buildPoolFromUsers(getUserRecords(db), role)
  const targetCard = sourcePool.find((item) => String(item.id) === String(cardId)) || {}
  const activeRecords = getRoleCardRecords(records, openid, role, cardId)
    .filter((item) => isActiveStatus(item.status))

  if (activeRecords.length) {// 情况 1：已在试课流程中，复用记录并刷新卡片快照
    const latestActiveRecord = activeRecords
      .slice()
      .sort((left, right) => getRecordTime(right) - getRecordTime(left))[0]

    latestActiveRecord.cardData = targetCard// 用最新的资料覆盖卡片快照
    latestActiveRecord.updatedAt = new Date().toISOString()
    await writeUnifiedDb(db)

    return {
      success: true,
      status: 'exists',
      message: '该卡片已在试课流程中',
      card: latestActiveRecord.cardData,
      ...buildTrialListPayload(openid, role, records)
    }
  }

  const latestRecord = getLatestRoleCardRecord(records, openid, role, cardId)

  if (latestRecord) {// 情况 2：之前申请过但已结束（rejected/removed），复活最新一条
    latestRecord.status = 'pending'// 重置回待试课
    latestRecord.continueChoice = ''// 清空上次反馈的选择
    latestRecord.cardData = targetCard
    latestRecord.updatedAt = new Date().toISOString()
    await writeUnifiedDb(db)

    return {
      success: true,
      status: 'created',
      message: '已加入待试课',
      card: latestRecord.cardData,
      ...buildTrialListPayload(openid, role, records)
    }
  }

  const now = new Date().toISOString()
  const newRecord = {// 情况 3：第一次申请，新建 pending 记录
    id: `trial-${Date.now()}`,
    openid,
    role,
    cardId: String(cardId),
    status: 'pending',
    continueChoice: '',
    cardData: targetCard,
    createdAt: now,
    updatedAt: now
  }

  records.unshift(newRecord)// 插到记录数组最前面（最新的在前）
  await writeUnifiedDb(db)

  return {
    success: true,
    status: 'created',
    message: '已加入待试课',
    card: newRecord.cardData,
    ...buildTrialListPayload(openid, role, records)
  }
}

// 试课列表：GET /api/trial/list?openid=xxx&role=family
// 返回 { success, role, pending: 待试课卡片数组, formal: 已转正式卡片数组 }。
const getTrialList = async (openid = '', role = 'family') => {
  const db = await readUnifiedDb()
  const records = getTrialRecords(db)

  return {
    success: true,
    ...buildTrialListPayload(openid, role, records)
  }
}

// 提交试课反馈：POST /api/trial/feedback
// body: { openid, role, cardId, continueChoice: 反馈里的继续意愿, feedback: 完整反馈对象 }
// 做两件事：
//   1. 更新该卡片所有活跃试课记录的状态（状态机转换见文件头）
//   2. 把这次反馈原文 INSERT 进对应的反馈表，供管理后台查看
const submitTrialFeedback = async (body = {}) => {
  const {
    role = 'family',
    openid = '',
    cardId,
    continueChoice = '',
    feedback = {}
  } = body

  const db = await readUnifiedDb()
  const records = getTrialRecords(db)
  const activeRecords = getRoleCardRecords(records, openid, role, cardId)
    .filter((item) => isActiveStatus(item.status))
  const latestActiveRecord = activeRecords
    .slice()
    .sort((left, right) => getRecordTime(right) - getRecordTime(left))[0] || { id: '', cardData: {} }

  let nextStatus = 'rejected'// 默认结局是拒绝

  if (continueChoice === '愿意') {// 愿意 → 转正式
    nextStatus = 'formal'
  } else if (continueChoice === '需要调整后再试一次') {// 需调整 → 打回待试课
    nextStatus = 'pending'
  }

  activeRecords.forEach((item) => {// 同一卡片的活跃记录统一改状态
    item.continueChoice = continueChoice
    item.status = nextStatus
    item.updatedAt = new Date().toISOString()
  })

  await writeUnifiedDb(db)// 先落库试课记录的变更

  await saveTrialFeedbackRow({// 再把反馈原文写入反馈表
    role,
    openid,
    trialRecordId: latestActiveRecord.id,
    cardId,
    targetTitle: latestActiveRecord.cardData?.title || '',
    targetSubtitle: latestActiveRecord.cardData?.subtitle || '',
    statusAfterFeedback: nextStatus,
    feedback: {
      ...feedback,
      continueChoice
    }
  })

  return {
    success: true,
    message: '反馈已保存',
    status: nextStatus,
    ...buildTrialListPayload(openid, role, records)
  }
}

// 移出待试课：POST /api/trial/remove  body: { openid, role, cardId }
// 把该卡片所有活跃记录标记为 removed（软删除，历史数据保留，反馈表不受影响）。
const removeTrialRecord = async (body = {}) => {
  const { openid = '', role = 'family', cardId } = body
  const db = await readUnifiedDb()
  const records = getTrialRecords(db)
  const activeRecords = getRoleCardRecords(records, openid, role, cardId)
    .filter((item) => isActiveStatus(item.status))

  activeRecords.forEach((item) => {
    item.status = 'removed'
    item.continueChoice = ''
    item.updatedAt = new Date().toISOString()
  })

  await writeUnifiedDb(db)

  return {
    success: true,
    message: '已移出待试课',
    ...buildTrialListPayload(openid, role, records)
  }
}

module.exports = {
  applyTrial,
  getTrialList,
  submitTrialFeedback,
  removeTrialRecord
}
