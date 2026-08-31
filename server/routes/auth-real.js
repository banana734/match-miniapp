/**
 * 登录路由：POST /api/auth/wechat
 * body: { code: uni.login 拿到的微信临时凭证, devClientId: 开发调试用的客户端标识 }
 *
 * 两条登录路径：
 *   1. 真实微信登录：配置了环境变量 WECHAT_APP_ID / WECHAT_APP_SECRET 时，
 *      拿 code 调微信官方 jscode2session 接口换真实 openid。
 *   2. 开发回退：没配置密钥时，用前端传的 devClientId 拼一个
 *      dev-openid-xxx 的假 openid，保证本地开发流程不中断。
 *
 * 返回：{ success, token, openid, boundRole: 该账号已绑定的身份, loginMode }
 * 注意：token 目前只是拼接字符串，后端并不校验（已知遗留问题）。
 */
const https = require('https')
const { getBoundRole } = require('./profile')

// 微信小程序的 AppID / Secret，从环境变量读取；不配置则自动走开发回退登录。
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

// 开发回退登录：没配微信密钥时的兜底。
// 用 devClientId（或 code）拼一个稳定的假 openid，同一个客户端多次登录
// 拿到的是同一个 openid，等于「记住」了这个开发身份。
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

// 登录入口：POST /api/auth/wechat
// 校验 code → 没配密钥走开发回退 → 有密钥调微信接口换真实 openid →
// 附带返回该账号当前绑定的身份（前端据此决定跳身份选择页还是直接进首页）。
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
