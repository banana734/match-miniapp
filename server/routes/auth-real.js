const https = require('https')
const { getBoundRole } = require('./profile')

const WECHAT_APP_ID = process.env.WECHAT_APP_ID || ''
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || ''

// 调用微信官方 jscode2session，把前端 uni.login 拿到的 code 换成真实 openid。
const requestWechatSession = (code) => {
  return new Promise((resolve, reject) => {
    const requestUrl =
      `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(WECHAT_APP_ID)}` +
      `&secret=${encodeURIComponent(WECHAT_APP_SECRET)}` +
      `&js_code=${encodeURIComponent(code)}` +
      '&grant_type=authorization_code'

    https
      .get(requestUrl, (response) => {
        let rawData = ''

        response.on('data', (chunk) => {
          rawData += chunk
        })

        response.on('end', () => {
          try {
            resolve(JSON.parse(rawData || '{}'))
          } catch (error) {
            reject(new Error('微信登录返回解析失败'))
          }
        })
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

// 如果还没配置微信密钥，就暂时回退到开发登录，避免现有流程完全中断。
const buildDevLoginResult = async ({ code = '', devClientId = '' }) => {
  const openid = devClientId
    ? `dev-openid-${devClientId}`
    : `dev-openid-${code}`

  return {
    success: true,
    token: `dev-token-${devClientId || code}`,
    openid,
    boundRole: await getBoundRole(openid),
    message: '当前使用开发回退登录',
    loginMode: 'dev-fallback'
  }
}

const postWechatLogin = async (body = {}) => {
  const code = body.code || ''
  const devClientId = body.devClientId || ''

  if (!code) {
    return {
      success: false,
      message: '缺少微信登录 code'
    }
  }

  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
    return buildDevLoginResult({
      code,
      devClientId
    })
  }

  const sessionResult = await requestWechatSession(code)

  if (!sessionResult.openid) {
    return {
      success: false,
      message: sessionResult.errmsg || '微信登录失败',
      errcode: sessionResult.errcode || ''
    }
  }

  return {
    success: true,
    token: `wechat-token-${sessionResult.openid}`,
    openid: sessionResult.openid,
    boundRole: await getBoundRole(sessionResult.openid),
    message: '微信登录成功',
    loginMode: 'wechat'
  }
}

module.exports = {
  postWechatLogin
}
