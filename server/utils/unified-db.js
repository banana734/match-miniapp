/**
 * 业务层的统一数据读写入口。
 *
 * 「统一」指：routes/ 里的业务代码不直接写 SQL，而是面对一个内存中的
 * db 对象 = { users, trialRecords, roleBindings }（三个数组）。
 * 读的时候 readUnifiedDb 把 MySQL 的行转成这个结构；
 * 改的时候业务函数直接改内存对象，再 writeUnifiedDb 整体写回。
 *
 * ⚠️ 已知遗留问题（P0）：writeUnifiedDb 的实现是 replaceDatabase ——
 * 全表 DELETE 后全量 INSERT 重灌。并发请求下会互相覆盖丢数据，
 * 上线前需要改成按主键的增量 UPSERT。
 */
const {
  readDatabase,
  replaceDatabase
} = require('../db/database')

// 从 MySQL 读取统一的数据对象（users / trialRecords / roleBindings），
// 保持旧路由的数据结构不变。
const readUnifiedDb = async () => readDatabase()

// 把路由修改后的数据对象整体写回 MySQL（见文件头的已知问题）。
const writeUnifiedDb = async (db) => replaceDatabase(db)

// 取用户数组；字段异常时兜底成空数组（防 routes 层拿到 undefined 崩溃）。
const getUserRecords = (db) => {
  if (!Array.isArray(db.users)) {
    db.users = []
  }

  return db.users
}

// 取试课记录数组；同样带空数组兜底。
const getTrialRecords = (db) => {
  if (!Array.isArray(db.trialRecords)) {
    db.trialRecords = []
  }

  return db.trialRecords
}

// 取身份绑定数组；同样带空数组兜底。
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
