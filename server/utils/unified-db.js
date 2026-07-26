const {
  readDatabase,
  replaceDatabase
} = require('../db/database')

// 从 MySQL 读取统一的数据对象，保持旧路由的数据结构不变。
const readUnifiedDb = async () => readDatabase()

// 把路由修改后的数据对象整体写回 MySQL。
const writeUnifiedDb = async (db) => replaceDatabase(db)

const getUserRecords = (db) => {
  if (!Array.isArray(db.users)) {
    db.users = []
  }

  return db.users
}

const getTrialRecords = (db) => {
  if (!Array.isArray(db.trialRecords)) {
    db.trialRecords = []
  }

  return db.trialRecords
}

const getRoleBindings = (db) => {
  if (!Array.isArray(db.roleBindings)) {
    db.roleBindings = []
  }

  return db.roleBindings
}

module.exports = {
  readUnifiedDb,
  writeUnifiedDb,
  getUserRecords,
  getTrialRecords,
  getRoleBindings
}
