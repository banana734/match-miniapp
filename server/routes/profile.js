const {
  readUnifiedDb,
  writeUnifiedDb,
  getUserRecords,
  getRoleBindings
} = require('../utils/unified-db')

const getBoundRole = async (openid = '') => {
  if (!openid) {
    return ''
  }

  const db = await readUnifiedDb()
  const bindings = getRoleBindings(db)
  const users = getUserRecords(db)
  const existedBinding = bindings.find((item) => item.openid === openid)

  if (existedBinding?.role) {
    return existedBinding.role
  }

  const existedUser = users.find((item) => item.openid === openid && item.role)
  return existedUser?.role || ''
}

const bindRole = async (body = {}) => {
  const { openid = '', role = '' } = body

  if (!openid) {
    return {
      success: false,
      message: '缺少 openid'
    }
  }

  if (!role) {
    return {
      success: false,
      message: '缺少 role'
    }
  }

  const db = await readUnifiedDb()
  const bindings = getRoleBindings(db)
  const users = getUserRecords(db)
  const existedBinding = bindings.find((item) => item.openid === openid)
  const existedUser = users.find((item) => item.openid === openid && item.role)
  const lockedRole = existedBinding?.role || existedUser?.role || ''

  if (lockedRole && lockedRole !== role) {
    return {
      success: false,
      message: '当前微信账号已绑定其他身份',
      boundRole: lockedRole
    }
  }

  if (existedBinding) {
    existedBinding.role = role
    existedBinding.updatedAt = new Date().toISOString()
  } else {
    const now = new Date().toISOString()
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

// 保存某个 openid 在某个身份下的资料。
const saveProfile = async (body = {}) => {
  const { openid = '', role = '', profile = {} } = body

  if (!openid) {
    return {
      success: false,
      message: '缺少 openid'
    }
  }

  if (!role) {
    return {
      success: false,
      message: '缺少 role'
    }
  }

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
  const existed = users.find((item) => item.openid === openid && item.role === role)
  const existedBinding = bindings.find((item) => item.openid === openid)
  const now = new Date().toISOString()

  if (existedBinding) {
    existedBinding.role = role
    existedBinding.updatedAt = now
  } else {
    bindings.unshift({
      openid,
      role,
      createdAt: now,
      updatedAt: now
    })
  }

  if (existed) {
    existed.profile = profile
    existed.updatedAt = now
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
    message: existed ? '保存成功，已覆盖原资料' : '资料已保存',
    mode: existed ? 'updated' : 'created',
    profile,
    boundRole: role
  }
}

// 根据 openid 和身份读取资料。
const getProfileDetail = async (openid = '', role = '') => {
  if (!openid) {
    return {
      success: false,
      message: '缺少 openid'
    }
  }

  if (!role) {
    return {
      success: false,
      message: '缺少 role'
    }
  }

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
