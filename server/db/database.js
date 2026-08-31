/**
 * MySQL 数据层（全后端唯一碰 SQL 的文件）。
 *
 * 连接配置：优先读同目录的 mysql.local.json（已被 .gitignore 排除，
 * 不进版本库）；文件不存在再退回环境变量。首次使用时会自动生成
 * mysql.config.example.json 模板提醒后来人。
 *
 * 初始化流程（ensureDatabase，服务启动后第一次查询时懒执行，只跑一次）：
 *   建连接池 → 建表（5 张，IF NOT EXISTS）→ 补列/索引 → 建视图（4 个）
 *
 * 数据表一览：
 *   users                 用户资料（openid+role 联合主键，profile_json 整份资料存 JSON 列）
 *   role_bindings         身份绑定（openid 主键，一人一身份）
 *   trial_records         试课记录（card_data_json 存卡片快照）
 *   family_trial_feedback 家庭试课反馈（每次反馈 INSERT 一条）
 *   mentor_trial_feedback 导师试课反馈（结构与家庭表完全相同）
 *
 * 视图一览（把 JSON 列摊平成普通列，管理后台查询用）：
 *   family_profiles_view / mentor_profiles_view
 *   family_trial_feedback_view / mentor_trial_feedback_view
 *
 * 对外导出 4 个函数：
 *   ensureDatabase  确保库表就绪（一般不用直接调）
 *   readDatabase    全量读出三张核心表 → { users, trialRecords, roleBindings }
 *   replaceDatabase 整体重写三张核心表（⚠️ 全表重灌，见 unified-db.js 文件头）
 *   queryRows       执行任意 SQL（admin.js 的视图查询、trial.js 的反馈 INSERT 用）
 */
const fs = require('node:fs')
const path = require('node:path')
const mysql = require('mysql2/promise')

const DB_DIR = __dirname
const MYSQL_CONFIG_PATH = path.join(DB_DIR, 'mysql.local.json')// 真实连接配置（含密码，不进 git）
const MYSQL_CONFIG_EXAMPLE_PATH = path.join(DB_DIR, 'mysql.config.example.json')// 给新人的模板

let pool// MySQL 连接池（懒创建，全局唯一）
let initPromise// 初始化 Promise（保证建表建视图只跑一次）

// 当前时间的 ISO 字符串（如 2026-08-31T10:00:00.000Z）。
const getNow = () => new Date().toISOString()

// 把任意时间值转成 MySQL DATETIME 格式（2026-08-31 10:00:00）；
// 传空或非法值时用当前时间兜底。
const toMysqlDateTime = (value) => {
  const source = value || getNow()
  const date = new Date(source)

  if (Number.isNaN(date.getTime())) {
    return getNow().slice(0, 19).replace('T', ' ')
  }

  return date.toISOString().slice(0, 19).replace('T', ' ')
}

// 尝试把 JSON 字符串解析回对象/数组；空值返回 fallback，解析失败也返回 fallback。
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

// 读取 MySQL 连接配置：
//   1. 优先读 mysql.local.json（本地开发）
//   2. 没有该文件 → 用 MATCH_MYSQL_* 环境变量拼配置（线上部署方式）
//   3. 密码为空则直接抛错，提示怎么配置，避免连不上还静默失败
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

// 若模板文件 mysql.config.example.json 不存在则生成一份，
// 提示后来人把真实配置放进 mysql.local.json。
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

// 获取（或懒创建）全局唯一的 MySQL 连接池：
// 最大 10 个连接，排队不设上限，字符集 utf8mb4（支持 emoji 和生僻字）。
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

// 按顺序逐条执行 SQL 建表 / 建视图语句（DDL，非事务）。
const runStatements = async (statements = []) => {
  const mysqlPool = ensurePool()

  for (const statement of statements) {
    await mysqlPool.query(statement)
  }
}

// 创建 / 刷新 4 个查询视图（每次启动都 CREATE OR REPLACE，改了会自动生效）：
//   family_profiles_view / mentor_profiles_view
//     —— 从 users 表按 role 拆分，用 JSON_EXTRACT 把 profile_json 里的字段
//        摊平成列；选「其他」的字段用 CASE 展示用户自填内容（area/grade 等）。
//   family_trial_feedback_view / mentor_trial_feedback_view
//     —— 反馈表的直通视图，带 ORDER BY updated_at DESC（最新在前）。
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

// 创建 5 张核心表（全部 IF NOT EXISTS，已存在则跳过），见文件头的表清单。
// 之后给 trial_records 补 openid 列和联合索引 ——
// 老库升级用：早期版本 trial_records 没有 openid 列，这里保证加上。
// （ADD COLUMN IF NOT EXISTS 是 MySQL 8 语法；失败则回退成普通 ALTER，
//   再失败就静默忽略，说明列/索引已存在。）
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

// 整体重写三张核心表（users / role_bindings / trial_records）：
// 在一个事务里 DELETE 全表 → 把传入的 db 对象全量 INSERT 回去。
// ⚠️ 这就是 unified-db.js 文件头说的「全表重灌」实现：
//    事务保证不写坏库，但并发请求会互相覆盖、静默丢数据（P0 遗留问题）。
const replaceDatabase = async (db = {}) => {
  const mysqlPool = ensurePool()
  const connection = await mysqlPool.getConnection()

  const users = Array.isArray(db.users) ? db.users : []
  const roleBindings = Array.isArray(db.roleBindings) ? db.roleBindings : []
  const trialRecords = Array.isArray(db.trialRecords) ? db.trialRecords : []

  try {
    await connection.beginTransaction()// 开事务：三张表要么全写成功，要么全部回滚

    await connection.query('DELETE FROM users')// 清空旧数据
    await connection.query('DELETE FROM role_bindings')
    await connection.query('DELETE FROM trial_records')

    for (const [index, item] of users.entries()) {// 用户逐条插回（openid 缺失时用下标兜底）
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

    for (const [index, item] of roleBindings.entries()) {// 身份绑定逐条插回
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

    for (const [index, item] of trialRecords.entries()) {// 试课记录逐条插回
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

    await connection.commit()// 全部插入成功，提交事务
  } catch (error) {
    await connection.rollback()// 任何一步失败，回滚，数据库保持原样
    throw error
  } finally {
    connection.release()// 无论成败，把连接还回连接池
  }
}

// 确保数据库就绪（连接池 + 建表 + 建视图）。
// 用 initPromise 缓存：服务生命周期内只初始化一次，并发调用共享同一个 Promise。
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

// 全量读取三张核心表，转成业务层统一的驼峰结构：
// { users: [{openid, role, profile, createdAt, updatedAt}],
//   trialRecords: [{id, openid, role, cardId, status, continueChoice, cardData, ...}],
//   roleBindings: [{openid, role, createdAt, updatedAt}] }
// 注意：profile_json / card_data_json 会解析回对象；Date 转成 ISO 字符串。
// 三张表都按「更新时间倒序」返回。
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

// 通用 SQL 查询：先确保库就绪，再从连接池取连接执行，返回结果行数组。
// admin.js 的视图查询和 trial.js 的反馈 INSERT 都走这里。
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
