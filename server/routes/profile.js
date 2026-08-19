const {
  readUnifiedDb,
  writeUnifiedDb,
  getUserRecords,
  getRoleBindings
} = require('../utils/unified-db')

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

const bindRole = async (body = {}) => {
  const { openid = '', role = '' } = body
  const db = await readUnifiedDb()
  const bindings = getRoleBindings(db)
  const users = getUserRecords(db)
  const binding = bindings.find((item) => item.openid === openid)
  const user = users.find((item) => item.openid === openid && item.role)
  const lockedRole = binding?.role || user?.role || ''

  if (lockedRole && lockedRole !== role) {
    return {
      success: false,
      message: '当前微信账号已绑定其他身份',
      boundRole: lockedRole
    }
  }

  const now = new Date().toISOString()

  if (binding) {
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

  await writeUnifiedDb(db)

  return {
    success: true,
    message: '身份已绑定',
    boundRole: role
  }
}

const saveProfile = async (body = {}) => {
  const { openid = '', role = '', profile = {} } = body
  const lockedRole = await getBoundRole(openid)

  if (lockedRole && lockedRole !== role) {
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

  if (binding) {
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

  if (existedUser) {
    existedUser.profile = profile
    existedUser.updatedAt = now
  } else {
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
