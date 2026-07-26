const fs = require('node:fs')
const path = require('node:path')
const mysql = require('mysql2/promise')

const DB_DIR = __dirname
const MYSQL_CONFIG_PATH = path.join(DB_DIR, 'mysql.local.json')
const MYSQL_CONFIG_EXAMPLE_PATH = path.join(DB_DIR, 'mysql.config.example.json')

let pool
let initPromise

const getNow = () => new Date().toISOString()

const toMysqlDateTime = (value) => {
  const source = value || getNow()
  const date = new Date(source)

  if (Number.isNaN(date.getTime())) {
    return getNow().slice(0, 19).replace('T', ' ')
  }

  return date.toISOString().slice(0, 19).replace('T', ' ')
}

const parseJson = (value, fallback) => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    return fallback
  }
}

const getMysqlConfig = () => {
  if (fs.existsSync(MYSQL_CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(MYSQL_CONFIG_PATH, 'utf-8'))
  }

  const fallbackConfig = {
    host: process.env.MATCH_MYSQL_HOST || 'localhost',
    port: Number(process.env.MATCH_MYSQL_PORT || 3306),
    user: process.env.MATCH_MYSQL_USER || 'root',
    password: process.env.MATCH_MYSQL_PASSWORD || '',
    database: process.env.MATCH_MYSQL_DATABASE || 'match'
  }

  if (!fallbackConfig.password) {
    throw new Error(
      `未找到 MySQL 本地配置，请创建 ${MYSQL_CONFIG_PATH}，或设置 MATCH_MYSQL_PASSWORD 环境变量。`
    )
  }

  return fallbackConfig
}

const ensureConfigExample = () => {
  if (fs.existsSync(MYSQL_CONFIG_EXAMPLE_PATH)) {
    return
  }

  fs.writeFileSync(
    MYSQL_CONFIG_EXAMPLE_PATH,
    JSON.stringify(
      {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '请填写你自己的 MySQL 密码',
        database: 'match'
      },
      null,
      2
    ),
    'utf-8'
  )
}

const ensurePool = () => {
  if (pool) {
    return pool
  }

  ensureConfigExample()
  const config = getMysqlConfig()

  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })

  return pool
}

const runStatements = async (statements = []) => {
  const mysqlPool = ensurePool()

  for (const statement of statements) {
    await mysqlPool.query(statement)
  }
}

const ensureViews = async () => {
  await runStatements([
    `
      CREATE OR REPLACE VIEW family_profiles_view AS
      SELECT
        openid,
        role,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.name')) AS child_name,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.parentName')) AS parent_name,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.phone')) AS phone,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.wechat')) AS wechat,
        CASE
          WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.area')) = '其他'
            THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.areaOther'))
          ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.area'))
        END AS area_text,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.gender')) AS gender,
        CASE
          WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.grade')) = '其他'
            THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.gradeOther'))
          ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.grade'))
        END AS grade_text,
        JSON_EXTRACT(profile_json, '$.subjects') AS subjects_json,
        JSON_EXTRACT(profile_json, '$.difficulties') AS difficulties_json,
        JSON_EXTRACT(profile_json, '$.teacherTraits') AS teacher_traits_json,
        JSON_EXTRACT(profile_json, '$.teachingStyles') AS teaching_styles_json,
        CASE
          WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mainFocus')) = '其他'
            THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mainFocusOther'))
          ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mainFocus'))
        END AS main_focus_text,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.learningState')) AS learning_state,
        CASE
          WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.communicationExpectation')) = '其他'
            THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.communicationExpectationOther'))
          ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.communicationExpectation'))
        END AS communication_expectation_text,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.understanding')) AS understanding,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.feedbackWillingness')) AS feedback_willingness,
        JSON_EXTRACT(profile_json, '$.classModes') AS class_modes_json,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.classFrequency')) AS class_frequency,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.intro')) AS intro,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.extraNote')) AS extra_note,
        created_at,
        updated_at
      FROM users
      WHERE role = 'family';
    `,
    `
      CREATE OR REPLACE VIEW mentor_profiles_view AS
      SELECT
        openid,
        role,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.name')) AS name,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.gender')) AS gender,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorProject')) AS mentor_project,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.coreMember')) AS core_member,
        CASE
          WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.grade')) = '其他'
            THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.gradeOther'))
          ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.grade'))
        END AS grade_text,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.school')) AS school,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.major')) AS major,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.college')) AS college,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.wechat')) AS wechat,
        JSON_EXTRACT(profile_json, '$.mentorSubjects') AS mentor_subjects_json,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorTeachingGradeRange')) AS mentor_teaching_grade_range,
        JSON_EXTRACT(profile_json, '$.mentorStyleTypes') AS mentor_style_types_json,
        JSON_EXTRACT(profile_json, '$.mentorTeachingModes') AS mentor_teaching_modes_json,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorSummerLocation')) AS mentor_summer_location,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorSchoolLocation')) AS mentor_school_location,
        JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorClassFrequency')) AS mentor_class_frequency,
        created_at,
        updated_at
      FROM users
      WHERE role = 'mentor';
    `,
    `
      CREATE OR REPLACE VIEW family_trial_feedback_view AS
      SELECT
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
        created_at,
        updated_at
      FROM family_trial_feedback
      ORDER BY updated_at DESC, created_at DESC;
    `,
    `
      CREATE OR REPLACE VIEW mentor_trial_feedback_view AS
      SELECT
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
        created_at,
        updated_at
      FROM mentor_trial_feedback
      ORDER BY updated_at DESC, created_at DESC;
    `
  ])
}

const ensureTables = async () => {
  await runStatements([
    `
      CREATE TABLE IF NOT EXISTS users (
        openid VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        profile_json JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (openid, role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS role_bindings (
        openid VARCHAR(255) NOT NULL PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS trial_records (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        openid VARCHAR(255) NOT NULL DEFAULT '',
        role VARCHAR(50) NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        continue_choice VARCHAR(100) NOT NULL DEFAULT '',
        card_data_json JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        KEY idx_role_status_updated (role, status, updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS family_trial_feedback (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        openid VARCHAR(255) NOT NULL,
        trial_record_id VARCHAR(255) NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        target_title VARCHAR(255) NOT NULL DEFAULT '',
        target_subtitle VARCHAR(255) NOT NULL DEFAULT '',
        trial_date VARCHAR(50) NOT NULL DEFAULT '',
        trial_duration VARCHAR(100) NOT NULL DEFAULT '',
        satisfaction_points_json JSON NOT NULL,
        satisfaction_point_other VARCHAR(255) NOT NULL DEFAULT '',
        objective_unsatisfied_json JSON NOT NULL,
        objective_unsatisfied_other VARCHAR(255) NOT NULL DEFAULT '',
        subjective_unsatisfied_json JSON NOT NULL,
        subjective_unsatisfied_other VARCHAR(255) NOT NULL DEFAULT '',
        continue_choice VARCHAR(100) NOT NULL DEFAULT '',
        continue_choice_other VARCHAR(255) NOT NULL DEFAULT '',
        status_after_feedback VARCHAR(50) NOT NULL DEFAULT '',
        feedback_json JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        KEY idx_family_feedback_openid (openid),
        KEY idx_family_feedback_card_id (card_id),
        KEY idx_family_feedback_updated (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS mentor_trial_feedback (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        openid VARCHAR(255) NOT NULL,
        trial_record_id VARCHAR(255) NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        target_title VARCHAR(255) NOT NULL DEFAULT '',
        target_subtitle VARCHAR(255) NOT NULL DEFAULT '',
        trial_date VARCHAR(50) NOT NULL DEFAULT '',
        trial_duration VARCHAR(100) NOT NULL DEFAULT '',
        satisfaction_points_json JSON NOT NULL,
        satisfaction_point_other VARCHAR(255) NOT NULL DEFAULT '',
        objective_unsatisfied_json JSON NOT NULL,
        objective_unsatisfied_other VARCHAR(255) NOT NULL DEFAULT '',
        subjective_unsatisfied_json JSON NOT NULL,
        subjective_unsatisfied_other VARCHAR(255) NOT NULL DEFAULT '',
        continue_choice VARCHAR(100) NOT NULL DEFAULT '',
        continue_choice_other VARCHAR(255) NOT NULL DEFAULT '',
        status_after_feedback VARCHAR(50) NOT NULL DEFAULT '',
        feedback_json JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        KEY idx_mentor_feedback_openid (openid),
        KEY idx_mentor_feedback_card_id (card_id),
        KEY idx_mentor_feedback_updated (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  ])

  await runStatements([
    `
      ALTER TABLE trial_records
      ADD COLUMN IF NOT EXISTS openid VARCHAR(255) NOT NULL DEFAULT ''
    `,
    `
      CREATE INDEX idx_trial_openid_role_status
      ON trial_records (openid, role, status, updated_at)
    `
  ]).catch(async () => {
    await runStatements([
      `
        ALTER TABLE trial_records
        ADD COLUMN openid VARCHAR(255) NOT NULL DEFAULT ''
      `
    ]).catch(() => {})
  })
}

const replaceDatabase = async (db = {}) => {
  const mysqlPool = ensurePool()
  const connection = await mysqlPool.getConnection()

  const users = Array.isArray(db.users) ? db.users : []
  const roleBindings = Array.isArray(db.roleBindings) ? db.roleBindings : []
  const trialRecords = Array.isArray(db.trialRecords) ? db.trialRecords : []

  try {
    await connection.beginTransaction()

    await connection.query('DELETE FROM users')
    await connection.query('DELETE FROM role_bindings')
    await connection.query('DELETE FROM trial_records')

    for (const [index, item] of users.entries()) {
      const createdAt = item.createdAt || getNow()

      await connection.query(
        `
          INSERT INTO users (openid, role, profile_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          String(item.openid || `user-${index}`),
          String(item.role || ''),
          JSON.stringify(item.profile || {}),
          toMysqlDateTime(createdAt),
          toMysqlDateTime(item.updatedAt || createdAt)
        ]
      )
    }

    for (const [index, item] of roleBindings.entries()) {
      const createdAt = item.createdAt || getNow()

      await connection.query(
        `
          INSERT INTO role_bindings (openid, role, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `,
        [
          String(item.openid || `binding-${index}`),
          String(item.role || ''),
          toMysqlDateTime(createdAt),
          toMysqlDateTime(item.updatedAt || createdAt)
        ]
      )
    }

    for (const [index, item] of trialRecords.entries()) {
      const createdAt = item.createdAt || getNow()

      await connection.query(
        `
          INSERT INTO trial_records (
            id, openid, role, card_id, status, continue_choice, card_data_json, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          String(item.id || `trial-${Date.now()}-${index}`),
          String(item.openid || ''),
          String(item.role || ''),
          String(item.cardId ?? ''),
          String(item.status || 'pending'),
          String(item.continueChoice || ''),
          JSON.stringify(item.cardData || {}),
          toMysqlDateTime(createdAt),
          toMysqlDateTime(item.updatedAt || createdAt)
        ]
      )
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

const ensureDatabase = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      ensurePool()
      await ensureTables()
      await ensureViews()
      return pool
    })()
  }

  return initPromise
}

const readDatabase = async () => {
  await ensureDatabase()
  const mysqlPool = ensurePool()

  const [userRows] = await mysqlPool.query(`
    SELECT openid, role, profile_json, created_at, updated_at
    FROM users
    ORDER BY updated_at DESC, created_at DESC
  `)

  const [bindingRows] = await mysqlPool.query(`
    SELECT openid, role, created_at, updated_at
    FROM role_bindings
    ORDER BY updated_at DESC, created_at DESC
  `)

  const [trialRows] = await mysqlPool.query(`
    SELECT id, openid, role, card_id, status, continue_choice, card_data_json,
           created_at, updated_at
    FROM trial_records
    ORDER BY updated_at DESC, created_at DESC
  `)

  const users = userRows.map((item) => ({
    openid: item.openid,
    role: item.role,
    profile: parseJson(item.profile_json, {}),
    createdAt: item.created_at instanceof Date ? item.created_at.toISOString() : item.created_at,
    updatedAt: item.updated_at instanceof Date ? item.updated_at.toISOString() : item.updated_at
  }))

  const roleBindings = bindingRows.map((item) => ({
    openid: item.openid,
    role: item.role,
    createdAt: item.created_at instanceof Date ? item.created_at.toISOString() : item.created_at,
    updatedAt: item.updated_at instanceof Date ? item.updated_at.toISOString() : item.updated_at
  }))

  const trialRecords = trialRows.map((item) => ({
    id: item.id,
    openid: item.openid || '',
    role: item.role,
    cardId: item.card_id,
    status: item.status,
    continueChoice: item.continue_choice,
    cardData: parseJson(item.card_data_json, {}),
    createdAt: item.created_at instanceof Date ? item.created_at.toISOString() : item.created_at,
    updatedAt: item.updated_at instanceof Date ? item.updated_at.toISOString() : item.updated_at
  }))

  return {
    users,
    trialRecords,
    roleBindings
  }
}

const queryRows = async (sql, params = []) => {
  await ensureDatabase()
  const mysqlPool = ensurePool()
  const [rows] = await mysqlPool.query(sql, params)
  return rows
}

module.exports = {
  MYSQL_CONFIG_PATH,
  ensureDatabase,
  readDatabase,
  replaceDatabase,
  queryRows
}
