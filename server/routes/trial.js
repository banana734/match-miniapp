const {
  readUnifiedDb,
  writeUnifiedDb,
  getTrialRecords
} = require('../utils/unified-db')
const { queryRows } = require('../db/database')
const { getPoolByViewerRole } = require('./match')

const isActiveStatus = (status) => ['pending', 'formal'].includes(status)

const getRecordTime = (record = {}) => {
  return new Date(record.updatedAt || record.createdAt || 0).getTime() || 0
}

const getRoleCardRecords = (records = [], openid = '', role = 'family', cardId = '') => {
  return records.filter((item) => {
    return item.openid === openid && item.role === role && String(item.cardId) === String(cardId)
  })
}

const getLatestRoleCardRecord = (records = [], openid = '', role = 'family', cardId = '') => {
  return getRoleCardRecords(records, openid, role, cardId)
    .slice()
    .sort((left, right) => getRecordTime(right) - getRecordTime(left))[0]
}

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

const getFeedbackTableName = (role = 'family') => {
  return role === 'mentor' ? 'mentor_trial_feedback' : 'family_trial_feedback'
}

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

const applyTrial = async (body = {}) => {
  const { openid = '', role = 'family', cardId } = body
  const db = await readUnifiedDb()
  const records = getTrialRecords(db)
  const sourcePool = await getPoolByViewerRole(role)
  const targetCard = sourcePool.find((item) => String(item.id) === String(cardId)) || {}
  const activeRecords = getRoleCardRecords(records, openid, role, cardId)
    .filter((item) => isActiveStatus(item.status))

  if (activeRecords.length) {
    const latestActiveRecord = activeRecords
      .slice()
      .sort((left, right) => getRecordTime(right) - getRecordTime(left))[0]

    latestActiveRecord.cardData = targetCard
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

  if (latestRecord) {
    latestRecord.status = 'pending'
    latestRecord.continueChoice = ''
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
  const newRecord = {
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

  records.unshift(newRecord)
  await writeUnifiedDb(db)

  return {
    success: true,
    status: 'created',
    message: '已加入待试课',
    card: newRecord.cardData,
    ...buildTrialListPayload(openid, role, records)
  }
}

const getTrialList = async (openid = '', role = 'family') => {
  const db = await readUnifiedDb()
  const records = getTrialRecords(db)

  return {
    success: true,
    ...buildTrialListPayload(openid, role, records)
  }
}

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

  let nextStatus = 'rejected'

  if (continueChoice === '愿意') {
    nextStatus = 'formal'
  } else if (continueChoice === '需要调整后再试一次') {
    nextStatus = 'pending'
  }

  activeRecords.forEach((item) => {
    item.continueChoice = continueChoice
    item.status = nextStatus
    item.updatedAt = new Date().toISOString()
  })

  await writeUnifiedDb(db)

  await saveTrialFeedbackRow({
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
