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

module.exports = {
  getAdminFamilies,
  getAdminMentors,
  getAdminFamilyFeedbacks,
  getAdminMentorFeedbacks
}
