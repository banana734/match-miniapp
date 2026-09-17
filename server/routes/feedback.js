/**
 * 「反馈」页数据路由（小程序底部「反馈」tab 用）。
 *
 * 接口（GET，一次返回当前账号的全部历史反馈）：
 *   GET /api/feedback/list?openid=xxx&role=family|mentor
 *   → { success, trial: [...], daily: [...] }
 *
 * 数据来源：按当前身份从 4 张反馈表里取其中 2 张
 *   family → family_trial_feedback / family_daily_feedback
 *   mentor → mentor_trial_feedback / mentor_daily_feedback
 *
 * 两张表的列几乎完全一样，只有日期/时长列名不同
 * （试课表是 trial_date / trial_duration，日常表是 class_date / class_duration），
 * 所以共用一个查询函数、把列名当参数传进来，再统一别名为
 * event_date / event_duration —— 前端两段就能共用同一套渲染。
 */
const { queryRows } = require('../db/database')

// 尝试把 *_json 列的字符串解析回数组/对象；
// 已经是对象、或为空值，就原样返回（不强行转换）。
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

// 行数据规范化：*_json 列解析成数组/对象，*_at 列（Date）转 ISO 字符串，其余原样。
const normalizeRow = (row = {}) => {
  const normalized = {}

  Object.entries(row).forEach(([key, value]) => {
    if (key.endsWith('_json')) {
      normalized[key] = parseJsonField(value)
      return
    }

    if (key.endsWith('_at')) {
      normalized[key] = value instanceof Date ? value.toISOString() : value
      return
    }

    normalized[key] = value
  })

  return normalized
}

// 读出某张反馈表里属于某个 openid 的全部记录（最新在前）。
// table / dateColumn / durationColumn 全部由下面的 getMyFeedback 用固定字面量传入，
// 不含用户输入，所以直接拼进 SQL 是安全的。
const readFeedbackList = async ({ table, dateColumn, durationColumn, openid }) => {
  const rows = await queryRows(
    `
      SELECT
        id,
        target_title,
        target_subtitle,
        ${dateColumn} AS event_date,
        ${durationColumn} AS event_duration,
        satisfaction_points_json,
        satisfaction_point_other,
        objective_unsatisfied_json,
        objective_unsatisfied_other,
        subjective_unsatisfied_json,
        subjective_unsatisfied_other,
        continue_choice,
        continue_choice_other,
        status_after_feedback,
        created_at,
        updated_at
      FROM ${table}
      WHERE openid = ?
      ORDER BY updated_at DESC, created_at DESC
    `,
    [openid]
  )

  return rows.map(normalizeRow)
}

// 「反馈」tab 主入口：一次返回当前账号的试课反馈 + 日常反馈
const getMyFeedback = async (openid = '', role = 'family') => {
  if (!openid) {
    return {
      success: false,
      message: '缺少 openid',
      trial: [],
      daily: []
    }
  }

  const isMentor = role === 'mentor'

  const trial = await readFeedbackList({
    table: isMentor ? 'mentor_trial_feedback' : 'family_trial_feedback',
    dateColumn: 'trial_date',
    durationColumn: 'trial_duration',
    openid
  })

  const daily = await readFeedbackList({
    table: isMentor ? 'mentor_daily_feedback' : 'family_daily_feedback',
    dateColumn: 'class_date',
    durationColumn: 'class_duration',
    openid
  })

  return {
    success: true,
    trial,
    daily
  }
}

module.exports = {
  getMyFeedback
}
