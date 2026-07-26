const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

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

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'
const ADMIN_DIR = path.join(__dirname, 'admin')
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*'

const contentTypeMap = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
}

// 统一返回 JSON，并放开开发阶段的本地跨域。
const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  res.end(JSON.stringify(data))
}

const sendServerError = (res, error) => {
  console.error(error)
  sendJson(res, 500, {
    success: false,
    message: error?.message || 'server error'
  })
}

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
  let body = ''

  req.on('data', (chunk) => {
    body += chunk
  })

  req.on('end', () => {
    let parsedBody = {}

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
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true })
    return
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && requestUrl.pathname === '/admin') {
    sendFile(res, path.join(ADMIN_DIR, 'dashboard.html'))
    return
  }

  if (req.method === 'GET' && requestUrl.pathname.startsWith('/admin/')) {
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

  if (req.method === 'GET' && requestUrl.pathname === '/api/ping') {
    sendJson(res, 200, {
      success: true,
      message: 'backend is running',
      date: '2026-07-25'
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/match/list') {
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

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    sendServerError(res, error)
  })
})

server.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`)
})
