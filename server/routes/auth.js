const { getBoundRole } = require('./profile')

// 开发阶段先用假登录结果，帮助前端先把登录流程跑通。
// 后面如果你接真实微信登录，只需要把这里替换成调用微信接口即可。
const postWechatLogin = async (body = {}) => {
  const code = body.code || ''
  const devClientId = body.devClientId || ''

  if (!code) {
    return {
      success: false,
      message: '缺少微信登录 code'
    }
  }

  const openid = devClientId
    ? `dev-openid-${devClientId}`
    : `dev-openid-${code}`

  return {
    success: true,
    token: `dev-token-${devClientId || code}`,
    openid,
    boundRole: await getBoundRole(openid),
    message: '开发阶段登录成功'
  }
}

module.exports = {
  postWechatLogin
}
