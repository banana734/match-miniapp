const { queryRows } = require('../db/database')

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

const normalizeDate = (value) => {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}

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
