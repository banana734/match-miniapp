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

const PORT = Number(process.env.PORT || 3000)//端口号
const HOST = process.env.HOST || '0.0.0.0'//服务器地址
const ADMIN_DIR = path.join(__dirname, 'admin')//后台页面目录
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*'//跨域设置
//？？？
const contentTypeMap = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
}

// 统一返回 JSON，并放开开发阶段的本地跨域。
const sendJson = (res, statusCode, data) => {//响应对象，状态码，实际数据
  res.writeHead(statusCode, {//说明
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  res.end(JSON.stringify(data))//结束响应发送数据给前端
}

const sendServerError = (res, error) => {//统一处理服务器报错
  console.error(error)//打印错误
  sendJson(res, 500, {
    success: false,//操作失败
    message: error?.message || 'server error'//信息
  })
}


//？？？网页静态服务，返回后台数据
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



// 读取 POST 请求体中的 JSON 内容。
const readRequestBody = (req, callback) => {
  let body = ''//接受文本数据

  req.on('data', (chunk) => {
    body += chunk
  })//监听事件，拼接信息

  req.on('end', () => {//接受完毕，开始处理
    let parsedBody = {}//解析后的JSON数据

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

const handleRequest = async (req, res) => {
  if (req.method === 'OPTIONS') {//预处理
    sendJson(res, 200, { ok: true })
    return
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`)//解析url

  if (req.method === 'GET' && requestUrl.pathname === '/admin') {//后台数据???
    sendFile(res, path.join(ADMIN_DIR, 'dashboard.html'))
    return
  }

  if (req.method === 'GET' && requestUrl.pathname.startsWith('/admin/')) {//后台显示
    const relativePath = requestUrl.pathname.replace('/admin/', '')
    const targetPath = path.join(ADMIN_DIR, relativePath)

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


  if (req.method === 'GET' && requestUrl.pathname === '/api/match/list') {//匹配页列表
    const data = await getMatchList(requestUrl.searchParams.get('role'))
    sendJson(res, 200, data)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/trial/list') {
    const data = await getTrialList(
      requestUrl.searchParams.get('openid') || '',
      requestUrl.searchParams.get('role') || 'family'
    )
    sendJson(res, 200, data)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/profile/detail') {
    const data = await getProfileDetail(
      requestUrl.searchParams.get('openid') || '',
      requestUrl.searchParams.get('role') || ''
    )
    sendJson(res, 200, data)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/admin/families') {
    const data = await getAdminFamilies()
    sendJson(res, 200, data)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/admin/mentors') {
    const data = await getAdminMentors()
    sendJson(res, 200, data)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/admin/family-feedbacks') {
    const data = await getAdminFamilyFeedbacks()
    sendJson(res, 200, data)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/admin/mentor-feedbacks') {
    const data = await getAdminMentorFeedbacks()
    sendJson(res, 200, data)
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/auth/wechat') {
    readRequestBody(req, async (parsedBody) => {
      if (parsedBody.success === false) {
        sendJson(res, 400, parsedBody)
        return
      }

      try {
        const data = await postWechatLogin(parsedBody)
        sendJson(res, 200, data)
      } catch (error) {
        sendServerError(res, error)
      }
    })
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/trial/apply') {
    readRequestBody(req, async (parsedBody) => {
      if (parsedBody.success === false) {
        sendJson(res, 400, parsedBody)
        return
      }

      try {
        const data = await applyTrial(parsedBody)
        sendJson(res, 200, data)
      } catch (error) {
        sendServerError(res, error)
      }
    })
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/profile/save') {
    readRequestBody(req, async (parsedBody) => {
      if (parsedBody.success === false) {
        sendJson(res, 400, parsedBody)
        return
      }

      try {
        const data = await saveProfile(parsedBody)
        sendJson(res, 200, data)
      } catch (error) {
        sendServerError(res, error)
      }
    })
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/profile/bind-role') {
    readRequestBody(req, async (parsedBody) => {
      if (parsedBody.success === false) {
        sendJson(res, 400, parsedBody)
        return
      }

      try {
        const data = await bindRole(parsedBody)
        sendJson(res, 200, data)
      } catch (error) {
        sendServerError(res, error)
      }
    })
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/trial/feedback') {
    readRequestBody(req, async (parsedBody) => {
      if (parsedBody.success === false) {
        sendJson(res, 400, parsedBody)
        return
      }

      try {
        const data = await submitTrialFeedback(parsedBody)
        sendJson(res, 200, data)
      } catch (error) {
        sendServerError(res, error)
      }
    })
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/trial/remove') {
    readRequestBody(req, async (parsedBody) => {
      if (parsedBody.success === false) {
        sendJson(res, 400, parsedBody)
        return
      }

      try {
        const data = await removeTrialRecord(parsedBody)
        sendJson(res, 200, data)
      } catch (error) {
        sendServerError(res, error)
      }
    })
    return
  }

  sendJson(res, 404, {
    success: false,
    message: 'route not found'
  })
}

const server = http.createServer((req, res) => {//启动服务器,交给handleRequest处理
  handleRequest(req, res).catch((error) => {
    sendServerError(res, error)
  })
})

server.listen(PORT, HOST, () => {//服务器开始监听
  console.log(`Server is running at http://${HOST}:${PORT}`)
})
