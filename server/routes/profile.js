const {
  readUnifiedDb,
  writeUnifiedDb,
  getUserRecords,
  getRoleBindings
} = require('../utils/unified-db')

/**
 * 身份绑定与资料路由。
 *
 * 对应接口：
 *   POST /api/profile/bind-role   绑定身份（family / mentor，一经绑定不可换）
 *   POST /api/profile/save        保存资料（首次创建 / 再次覆盖更新）
 *   GET  /api/profile/detail      按 openid + role 查回资料
 *
 * 身份锁定规则（bindRole 和 saveProfile 双重校验，谁先到都拦得住）：
 *   一个微信 openid 只能绑定一种身份。已绑定 family 再想绑 mentor
 *   → 返回 success: false「当前微信账号已绑定其他身份」。
 *   绑定关系存 role_bindings 表；users 表里也带 role（双写冗余，两边都查）。
 */
// 查询某 openid 当前已绑定的身份：先查 role_bindings 绑定表，
// 没有再退回 users 表里带 role 的记录，都没有返回 ''（未绑定）。
const getBoundRole = async (openid = '') => {
  const db = await readUnifiedDb()
  const bindings = getRoleBindings(db)
  const users = getUserRecords(db)
  const binding = bindings.find((item) => item.openid === openid)

  if (binding?.role) {
    return binding.role
  }

  const user = users.find((item) => item.openid === openid && item.role)
  return user?.role || ''
}

// 绑定身份：POST /api/profile/bind-role  body: { openid, role }
// 已绑定其他身份 → 拒绝；未绑定或绑定相同身份 → 写入 / 更新 role_bindings。
const bindRole = async (body = {}) => {
  const { openid = '', role = '' } = body
  const db = await readUnifiedDb()
  const bindings = getRoleBindings(db)
  const users = getUserRecords(db)
  const binding = bindings.find((item) => item.openid === openid)
  const user = users.find((item) => item.openid === openid && item.role)
  const lockedRole = binding?.role || user?.role || ''// 已锁定的身份（两张表取其一）

  if (lockedRole && lockedRole !== role) {// 已绑过别的身份，拒绝换绑
    return {
      success: false,
      message: '当前微信账号已绑定其他身份',
      boundRole: lockedRole
    }
  }

  const now = new Date().toISOString()

  if (binding) {// 绑定表里已有这条记录 → 更新身份和时间
    binding.role = role
    binding.updatedAt = now
  } else {// 没有则新增一条绑定记录
    bindings.unshift({
      openid,
      role,
      createdAt: now,
      updatedAt: now
    })
  }

  await writeUnifiedDb(db)

  return {
    success: true,
    message: '身份已绑定',
    boundRole: role
  }
}

// 保存资料：POST /api/profile/save  body: { openid, role, profile }
// 保存前先做身份锁定校验（和 bindRole 同一套规则），然后：
//   1. 同步写入 / 更新 role_bindings（保证绑定关系不丢）
//   2. users 表里同 openid + 同 role 的记录存在 → 覆盖 profile（mode: 'updated'）
//      不存在 → 新增一条用户记录（mode: 'created'）
const saveProfile = async (body = {}) => {
  const { openid = '', role = '', profile = {} } = body
  const lockedRole = await getBoundRole(openid)

  if (lockedRole && lockedRole !== role) {// 身份锁定校验：绑过别的身份就不让保存
    return {
      success: false,
      message: '当前微信账号已绑定其他身份',
      boundRole: lockedRole
    }
  }

  const db = await readUnifiedDb()
  const users = getUserRecords(db)
  const bindings = getRoleBindings(db)
  const existedUser = users.find((item) => item.openid === openid && item.role === role)
  const binding = bindings.find((item) => item.openid === openid)
  const now = new Date().toISOString()

  if (binding) {// 同步维护绑定表：有则更新，无则新增
    binding.role = role
    binding.updatedAt = now
  } else {
    bindings.unshift({
      openid,
      role,
      createdAt: now,
      updatedAt: now
    })
  }

  if (existedUser) {// 用户表：同 openid + 同 role 已有记录 → 覆盖资料
    existedUser.profile = profile
    existedUser.updatedAt = now
  } else {// 没有 → 新增用户记录
    users.unshift({
      openid,
      role,
      profile,
      createdAt: now,
      updatedAt: now
    })
  }

  await writeUnifiedDb(db)

  return {
    success: true,
    message: existedUser ? '保存成功，已覆盖原资料' : '资料已保存',
    mode: existedUser ? 'updated' : 'created',
    profile,
    boundRole: role
  }
}

// 查询资料：GET /api/profile/detail?openid=xxx&role=family
// 返回 { success, found: 是否已有资料, profile: 资料对象或 null }。
// 资料页 onLoad 时用它决定是「新建模式」还是「回填编辑模式」。
const getProfileDetail = async (openid = '', role = '') => {
  const db = await readUnifiedDb()
  const users = getUserRecords(db)
  const target = users.find((item) => item.openid === openid && item.role === role)

  if (!target) {
    return {
      success: true,
      found: false,
      profile: null
    }
  }

  return {
    success: true,
    found: true,
    profile: target.profile
  }
}

module.exports = {
  bindRole,
  getBoundRole,
  saveProfile,
  getProfileDetail
}
