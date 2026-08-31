/**
 * Match 后端服务入口（Node 原生 http，无框架）
 *
 * 职责一共三块：
 *   1. API 路由分发 —— 按「方法 + 路径」查路由表，转发给 routes/ 里的业务函数
 *   2. 管理后台静态页 —— 浏览器访问 /admin 时直接返回 server/admin/ 下的 html/js/css
 *   3. 统一响应 —— 所有 JSON 响应都带 CORS 头，方便小程序本地联调
 *
 * 目录导览：
 *   routes/auth-real.js  登录（微信 code 换 openid，含开发回退）
 *   routes/profile.js    身份绑定 + 资料（users / role_bindings 表）
 *   routes/match.js      匹配池（把对方资料组装成卡片）
 *   routes/trial.js      试课全流程（申请 / 反馈 / 移除）
 *   routes/admin.js      管理后台数据查询（走 4 个视图）
 *   db/database.js       MySQL 连接池、建表建视图、读写实现
 *   utils/unified-db.js  业务层读写入口（统一数据结构）
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')
//获取后端业务函数
const {
  getAdminFamilies,
  getAdminMentors,
  getAdminFamilyFeedbacks,
  getAdminMentorFeedbacks
} = require('./routes/admin')
const { postWechatLogin } = require('./routes/auth-real')
const { getMatchList } = require('./routes/match')
const { bindRole, saveProfile, getProfileDetail } = require('./routes/profile')
const {
  applyTrial,
  getTrialList,
  submitTrialFeedback,
  removeTrialRecord
} = require('./routes/trial')

const PORT = Number(process.env.PORT || 3000)// 监听端口，可用环境变量 PORT 覆盖
const HOST = process.env.HOST || '0.0.0.0'// 监听地址，0.0.0.0 表示所有网卡都能访问
const ADMIN_DIR = path.join(__dirname, 'admin')// 管理后台静态文件所在目录（server/admin/）
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*'// CORS 允许的来源，默认放开（开发期方便）
// 静态文件后缀 → Content-Type 的映射，/admin 页面返回文件时用
const contentTypeMap = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
}

// 统一返回 JSON：写入状态码 + CORS 头（允许跨域），并把 data 序列化后发给前端。
const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {//说明
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  res.end(JSON.stringify(data))//结束响应发送数据给前端
}

// 统一处理 500：打印错误到控制台，同时给前端返回 success: false 的 JSON。
const sendServerError = (res, error) => {
  console.error(error)//打印错误
  sendJson(res, 500, {
    success: false,//操作失败
    message: error?.message || 'server error'//信息
  })
}


// 发送本地静态文件（仅管理后台 /admin 在用）：
// 文件不存在返回 404；存在则按后缀设置 Content-Type 后读出内容返回。
const sendFile = (res, filePath) => {
  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, {
      success: false,
      message: 'file not found'
    })
    return
  }

  const extension = path.extname(filePath)
  const contentType = contentTypeMap[extension] || 'text/plain; charset=utf-8'

  res.writeHead(200, {
    'Content-Type': contentType
  })

  res.end(fs.readFileSync(filePath))
}



// GET 接口表：路径 → 处理函数，入参是 URL 查询参数对象（searchParams）。
// 前端通过 GET 请求的「读」类接口都在这里。
const getRoutes = {
  '/api/match/list': (query) => getMatchList(query.get('role')),
  '/api/trial/list': (query) => getTrialList(
    query.get('openid') || '',
    query.get('role') || 'family'
  ),
  '/api/profile/detail': (query) => getProfileDetail(
    query.get('openid') || '',
    query.get('role') || ''
  ),
  '/api/admin/families': () => getAdminFamilies(),
  '/api/admin/mentors': () => getAdminMentors(),
  '/api/admin/family-feedbacks': () => getAdminFamilyFeedbacks(),
  '/api/admin/mentor-feedbacks': () => getAdminMentorFeedbacks()
}

// POST 接口表：路径 → 业务处理函数，入参是解析后的请求体 JSON。
// 前端通过 POST 请求的「写」类接口（登录、绑定、保存、试课）都在这里。
const postRoutes = {
  '/api/auth/wechat': postWechatLogin,
  '/api/trial/apply': applyTrial,
  '/api/profile/save': saveProfile,
  '/api/profile/bind-role': bindRole,
  '/api/trial/feedback': submitTrialFeedback,
  '/api/trial/remove': removeTrialRecord
}

// 读取 POST 请求体中的 JSON 内容：
// 分片收完 → 尝试 JSON.parse → 成功则回调正常数据，格式错误则回调 { success: false }。
const readRequestBody = (req, callback) => {
  let body = ''// 逐步拼接的原始文本数据

  req.on('data', (chunk) => {
    body += chunk
  })// 每收到一段数据就拼接一次

  req.on('end', () => {// 数据接收完毕，开始解析
    let parsedBody = {}// 解析后的 JSON 对象，默认空对象

    try {
      parsedBody = body ? JSON.parse(body) : {}
    } catch (error) {
      callback({
        success: false,
        message: '请求体格式不正确'
      })
      return
    }

    callback(parsedBody)
  })
}

// 核心请求处理函数：所有请求都会经过这里。
// 处理顺序：OPTIONS 预检 → /admin 静态页 → GET 路由表 → POST 路由表 → 404。
const handleRequest = async (req, res) => {
  if (req.method === 'OPTIONS') {// 浏览器跨域前的预检请求，直接放行
    sendJson(res, 200, { ok: true })
    return
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`)// 把请求 url 解析成对象，方便取 pathname 和查询参数

  if (req.method === 'GET' && requestUrl.pathname === '/admin') {// 管理后台首页 → 返回 dashboard.html
    sendFile(res, path.join(ADMIN_DIR, 'dashboard.html'))
    return
  }

  if (req.method === 'GET' && requestUrl.pathname.startsWith('/admin/')) {// 管理后台的子资源（js/css）
    const relativePath = requestUrl.pathname.replace('/admin/', '')// 去掉 /admin/ 前缀得到相对路径
    const targetPath = path.join(ADMIN_DIR, relativePath)// 拼出服务器上的真实文件路径

    // 路径穿越防护：拼接后的路径必须还在 admin 目录内，
    // 否则像 /admin/../app.js 这种请求就能读到任意文件。
    if (!targetPath.startsWith(ADMIN_DIR)) {
      sendJson(res, 403, {
        success: false,
        message: 'forbidden'
      })
      return
    }

    sendFile(res, targetPath)
    return
  }


  // 从两张路由表里按「方法 + 路径」精确匹配（用 hasOwnProperty 避免命中原型链上的属性）。
  // 注意必须同时校验 req.method：这样 POST 打一个 GET 路径会落到 404，行为与旧版逐个 if 判断一致。
  const getHandler = Object.prototype.hasOwnProperty.call(getRoutes, requestUrl.pathname)
    ? getRoutes[requestUrl.pathname]
    : null
  const postHandler = Object.prototype.hasOwnProperty.call(postRoutes, requestUrl.pathname)
    ? postRoutes[requestUrl.pathname]
    : null

  if (req.method === 'GET' && getHandler) {// 命中 GET 路由：直接执行业务函数并返回结果
    const data = await getHandler(requestUrl.searchParams)
    sendJson(res, 200, data)
    return
  }

  if (req.method === 'POST' && postHandler) {// 命中 POST 路由：先读请求体，再执行业务函数
    readRequestBody(req, async (parsedBody) => {
      if (parsedBody.success === false) {// 请求体本身格式就不合法（readRequestBody 回调的错误）
        sendJson(res, 400, parsedBody)
        return
      }

      try {
        const data = await postHandler(parsedBody)// 执行业务逻辑
        sendJson(res, 200, data)// 业务成功，返回 200
      } catch (error) {
        sendServerError(res, error)// 业务抛异常，统一走 500
      }
    })
    return
  }

  // 以上都没命中：方法不匹配或路径不存在，统一 404。
  sendJson(res, 404, {
    success: false,
    message: 'route not found'
  })
}

const server = http.createServer((req, res) => {// 创建 http 服务器，每个请求都交给 handleRequest
  handleRequest(req, res).catch((error) => {
    sendServerError(res, error)// handleRequest 自身出错时的兜底，防止进程崩溃
  })
})

server.listen(PORT, HOST, () => {// 开始监听端口，服务正式启动
  console.log(`Server is running at http://${HOST}:${PORT}`)
})
