/**
 * 业务层的统一数据读写入口。
 *
 * 「统一」指：routes/ 里的业务代码不直接写 SQL，而是面对一个内存中的
 * db 对象 = { users, trialRecords, roleBindings }（三个数组）。
 * 读的时候 readUnifiedDb 把 MySQL 的行转成这个结构；
 * 改的时候业务函数直接改内存对象，再 writeUnifiedDb 写回。
 *
 * 写回实现（writeUnifiedDb → database.upsertDatabase）：按每张表的主键做
 * INSERT ... ON DUPLICATE KEY UPDATE（users: openid+role / role_bindings: openid /
 * trial_records: id）。存在就更新、不存在就插入，不再清空整张表，
 * 因此并发请求之间不会互相覆盖、不会静默丢数据（原 P0 已修复）。
 */
const {
  readDatabase,
  upsertDatabase
} = require('../db/database')

// 从 MySQL 读取统一的数据对象（users / trialRecords / roleBindings），
// 保持旧路由的数据结构不变。
const readUnifiedDb = async () => readDatabase()

// 把路由修改后的数据对象写回 MySQL（按主键 upsert，见文件头说明）。
const writeUnifiedDb = async (db) => upsertDatabase(db)

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
