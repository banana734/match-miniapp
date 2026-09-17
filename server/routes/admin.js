/**
 * 管理后台数据路由（给 server/admin/dashboard.html 页面提供数据）。
 *
 * 对应接口（均为 GET，无分页参数，一次返回全部）：
 *   /api/admin/families           全部家庭资料（走 family_profiles_view 视图）
 *   /api/admin/mentors            全部导师资料（走 mentor_profiles_view 视图）
 *   /api/admin/family-feedbacks   全部家庭试课反馈（走 family_trial_feedback_view）
 *   /api/admin/mentor-feedbacks   全部导师试课反馈（走 mentor_trial_feedback_view）
 *
 * 为什么查视图不查表：资料原文是 users.profile_json 一个大 JSON 列，
 * 4 个视图在数据库层用 JSON_EXTRACT 把常用字段摊平成列，
 * 管理页拿到就能直接渲染表格，不用再解析。
 */
const { queryRows } = require('../db/database')

// 尝试把 *_json 列的字符串解析回对象/数组；解析失败或为空就原样返回。
const parseJsonField = (value) => {
  if (value === null || value === undefined || value === '') {
    return value
  }

  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    return value
  }
}

// 把 Date 对象转成 ISO 字符串，方便前端直接显示。
const normalizeDate = (value) => {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}

// 行数据规范化（返回给管理页前的最后一道处理）：
//   - 列名以 _json 结尾 → 尝试 JSON.parse 成对象/数组
//   - 列名以 _at 结尾（created_at / updated_at）→ Date 转 ISO 字符串
//   - 其他列原样保留
const normalizeRow = (row = {}) => {
  const normalized = {}

  Object.entries(row).forEach(([key, value]) => {
    if (key.endsWith('_json')) {
      normalized[key] = parseJsonField(value)
      return
    }

    if (key.endsWith('_at')) {
      normalized[key] = normalizeDate(value)
      return
    }

    normalized[key] = value
  })

  return normalized
}

// 查询全部家庭资料：/api/admin/families
// 视图已摊平字段（孩子姓名、家长称呼、电话、微信号、地区……），按更新时间倒序。
const getAdminFamilies = async () => {
  const rows = await queryRows(`
    SELECT *
    FROM family_profiles_view
    ORDER BY updated_at DESC, created_at DESC
  `)

  return {
    success: true,
    total: rows.length,
    list: rows.map(normalizeRow)
  }
}

// 查询全部导师资料：/api/admin/mentors
// 视图已摊平字段（姓名、学校、专业、学院、擅长科目……），按更新时间倒序。
const getAdminMentors = async () => {
  const rows = await queryRows(`
    SELECT *
    FROM mentor_profiles_view
    ORDER BY updated_at DESC, created_at DESC
  `)

  return {
    success: true,
    total: rows.length,
    list: rows.map(normalizeRow)
  }
}

// 查询全部家庭试课反馈：/api/admin/family-feedbacks
// 排序由视图里的 ORDER BY 保证（最新在前）。
const getAdminFamilyFeedbacks = async () => {
  const rows = await queryRows(`
    SELECT *
    FROM family_trial_feedback_view
  `)

  return {
    success: true,
    total: rows.length,
    list: rows.map(normalizeRow)
  }
}

// 查询全部导师试课反馈：/api/admin/mentor-feedbacks
// 排序由视图里的 ORDER BY 保证（最新在前）。
const getAdminMentorFeedbacks = async () => {
  const rows = await queryRows(`
    SELECT *
    FROM mentor_trial_feedback_view
  `)

  return {
    success: true,
    total: rows.length,
    list: rows.map(normalizeRow)
  }
}

// 查询全部反馈（试课 + 日常，家长 + 导师），管理页「反馈管理」页签用。
// 4 张表 UNION ALL：家庭/导师试课反馈 + 家庭/导师日常反馈。
// 每条带 role（family/mentor）、kind（trial/daily），并把日期/时长字段
// 统一别名为 event_date / event_duration，方便前端按人聚合后渲染。
const getAdminFeedbacks = async () => {
  const rows = await queryRows(`
    SELECT
      id, openid, 'family' AS role, 'trial' AS kind,
      trial_record_id, card_id, target_title, target_subtitle,
      trial_date AS event_date, trial_duration AS event_duration,
      satisfaction_points_json, satisfaction_point_other,
      objective_unsatisfied_json, objective_unsatisfied_other,
      subjective_unsatisfied_json, subjective_unsatisfied_other,
      continue_choice, continue_choice_other, status_after_feedback,
      feedback_json, created_at, updated_at
    FROM family_trial_feedback
    UNION ALL
    SELECT
      id, openid, 'mentor' AS role, 'trial' AS kind,
      trial_record_id, card_id, target_title, target_subtitle,
      trial_date AS event_date, trial_duration AS event_duration,
      satisfaction_points_json, satisfaction_point_other,
      objective_unsatisfied_json, objective_unsatisfied_other,
      subjective_unsatisfied_json, subjective_unsatisfied_other,
      continue_choice, continue_choice_other, status_after_feedback,
      feedback_json, created_at, updated_at
    FROM mentor_trial_feedback
    UNION ALL
    SELECT
      id, openid, 'family' AS role, 'daily' AS kind,
      trial_record_id, card_id, target_title, target_subtitle,
      class_date AS event_date, class_duration AS event_duration,
      satisfaction_points_json, satisfaction_point_other,
      objective_unsatisfied_json, objective_unsatisfied_other,
      subjective_unsatisfied_json, subjective_unsatisfied_other,
      continue_choice, continue_choice_other, status_after_feedback,
      feedback_json, created_at, updated_at
    FROM family_daily_feedback
    UNION ALL
    SELECT
      id, openid, 'mentor' AS role, 'daily' AS kind,
      trial_record_id, card_id, target_title, target_subtitle,
      class_date AS event_date, class_duration AS event_duration,
      satisfaction_points_json, satisfaction_point_other,
      objective_unsatisfied_json, objective_unsatisfied_other,
      subjective_unsatisfied_json, subjective_unsatisfied_other,
      continue_choice, continue_choice_other, status_after_feedback,
      feedback_json, created_at, updated_at
    FROM mentor_daily_feedback
    ORDER BY updated_at DESC, created_at DESC
  `)

  return {
    success: true,
    total: rows.length,
    list: rows.map(normalizeRow)
  }
}

// 删除单条反馈：POST /api/admin/delete-feedback
// body: { id, role: 'family'|'mentor', kind: 'trial'|'daily' }
// 按 role+kind 选表后按主键 id 删除。表名由固定映射决定（不拼接外部输入），无注入风险。
const deleteAdminFeedback = async ({ id, role, kind } = {}) => {
  if (!id) {
    throw new Error('缺少反馈 id')
  }

  const tableMap = {
    'family-trial': 'family_trial_feedback',
    'mentor-trial': 'mentor_trial_feedback',
    'family-daily': 'family_daily_feedback',
    'mentor-daily': 'mentor_daily_feedback'
  }

  const table = tableMap[`${role}-${kind}`]

  if (!table) {
    throw new Error('未知的反馈类型')
  }

  await queryRows(`DELETE FROM ${table} WHERE id = ?`, [id])

  return {
    success: true,
    deletedId: id,
    role,
    kind
  }
}

// 彻底删除一个人：资料 + 身份绑定 + 他相关的试课记录 + 他提交的反馈。
// POST /api/admin/delete-profile  body: { openid, role: 'family'|'mentor' }
//
// 试课记录要删两个方向，否则会留下「用户 xxxx」的孤儿卡片：
//   1. openid = 他          —— 他发起的记录
//   2. card_id = `角色-他openid` —— 别人记录里指向他的那条镜像记录
//      （trial_records.card_id 固定是 `<对方角色>-<对方openid>`）
//
// 反馈按 openid 在 4 张表里各扫一遍（一个人只有一种身份，实际只会命中自己角色那两张）。
const deleteAdminProfile = async ({ openid, role } = {}) => {
  if (!openid || !role) {
    throw new Error('缺少 openid 或 role')
  }

  const targetOpenid = String(openid)
  const targetRole = String(role)
  const targetCardId = `${targetRole}-${targetOpenid}`

  const deleted = {
    users: 0,
    roleBindings: 0,
    trialRecords: 0,
    feedbacks: 0
  }

  const userResult = await queryRows(
    'DELETE FROM users WHERE openid = ? AND role = ?',
    [targetOpenid, targetRole]
  )
  deleted.users = userResult.affectedRows || 0

  const bindingResult = await queryRows(
    'DELETE FROM role_bindings WHERE openid = ?',
    [targetOpenid]
  )
  deleted.roleBindings = bindingResult.affectedRows || 0

  const ownRecordResult = await queryRows(
    'DELETE FROM trial_records WHERE openid = ?',
    [targetOpenid]
  )
  deleted.trialRecords += ownRecordResult.affectedRows || 0

  const mirroredRecordResult = await queryRows(
    'DELETE FROM trial_records WHERE card_id = ?',
    [targetCardId]
  )
  deleted.trialRecords += mirroredRecordResult.affectedRows || 0

  // 表名来自代码里的固定数组，不拼接外部输入，无注入风险
  const feedbackTables = [
    'family_trial_feedback',
    'mentor_trial_feedback',
    'family_daily_feedback',
    'mentor_daily_feedback'
  ]

  for (const table of feedbackTables) {
    const result = await queryRows(`DELETE FROM ${table} WHERE openid = ?`, [targetOpenid])
    deleted.feedbacks += result.affectedRows || 0
  }

  return {
    success: true,
    openid: targetOpenid,
    role: targetRole,
    deleted
  }
}

// 查询全部配对关系：/api/admin/pairings（开发调试用）
// trial_records 里每条记录是「单向」的：openid=发起方、card_id=对方（带 family-/mentor- 前缀）、
// role=发起方角色、status=配对状态（pending=试课 / formal=正式上课 等）。
// 这里只把原始字段原样返回，双向展开、前缀剥离都交给前端做（dev-data.vue）。
// 注意：早期脏数据 openid 可能为空，前端会跳过；前端配对展示依赖此接口。
const getAdminPairings = async () => {
  const rows = await queryRows(`
    SELECT
      openid,
      role,
      card_id,
      status,
      continue_choice
    FROM trial_records
    ORDER BY updated_at DESC
  `)

  return {
    success: true,
    total: rows.length,
    list: rows.map((row) => ({
      myOpenid: row.openid,
      myRole: row.role,
      counterpartOpenid: row.card_id,
      counterpartRole: row.role === 'mentor' ? 'family' : 'mentor',
      status: row.status,
      cardId: row.card_id,
      continueChoice: row.continue_choice || ''
    }))
  }
}

module.exports = {
  getAdminFamilies,
  getAdminMentors,
  getAdminFamilyFeedbacks,
  getAdminMentorFeedbacks,
  getAdminFeedbacks,
  deleteAdminFeedback,
  deleteAdminProfile,
  getAdminPairings
}
