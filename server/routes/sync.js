/**
 * 双向同步接口（HTTP 版）。
 *
 * 设计前提（网络拓扑约束）：
 *   云服务器连不到本地 MySQL（本地在 NAT/防火墙后，无公网地址），
 *   只有「本地后端」能同时碰两端库（本地直连 + 云库外网地址）。
 *   所以不管 toCloud 还是 toLocal，都由本地后端发起，云库那端不用动。
 *
 * direction 语义：
 *   toCloud  —— 线下覆盖线上（开服时调用）：source=本地库, target=云库
 *   toLocal  —— 线上覆盖线下（收服时调用）：source=云库,   target=本地库
 *
 * 安全：破坏性接口，必须带正确 token（服务端环境变量 SYNC_API_TOKEN），
 *       未配置则禁止调用。
 */
const { getMysqlConfig } = require('../db/database')
const { syncDatabases } = require('../db/sync')

// 读取「对侧」库（线上云库）的连接配置：
//   1. 环境变量 CLOUD_MYSQL_*（部署场景）
//   2. 本地文件 db/cloud.local.json（已在 .gitignore，含密码不进版本库）
const getPeerConfig = () => {
  const host = process.env.CLOUD_MYSQL_HOST
  const password = process.env.CLOUD_MYSQL_PASSWORD
  if (host && password) {
    return {
      host,
      port: Number(process.env.CLOUD_MYSQL_PORT || 3306),
      user: process.env.CLOUD_MYSQL_USER || 'root',
      password,
      database: process.env.CLOUD_MYSQL_DATABASE || 'match'
    }
  }

  const fs = require('fs')
  const path = require('path')
  const jsonPath = path.join(__dirname, '..', 'db', 'cloud.local.json')
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  }

  throw new Error('未配置云端库：请设置 CLOUD_MYSQL_* 环境变量，或创建 server/db/cloud.local.json')
}

const handleSync = async (query) => {
  const expectedToken = process.env.SYNC_API_TOKEN
  if (!expectedToken) {
    return { success: false, message: '服务端未设置 SYNC_API_TOKEN，已禁止同步' }
  }
  const token = query.get('token') || ''
  if (token !== expectedToken) {
    return { success: false, message: 'token 错误' }
  }

  const direction = query.get('direction')
  if (direction !== 'toCloud' && direction !== 'toLocal') {
    return { success: false, message: "direction 必须是 toCloud 或 toLocal" }
  }

  const local = getMysqlConfig()
  const peer = getPeerConfig()

  const source = direction === 'toCloud' ? local : peer
  const target = direction === 'toCloud' ? peer : local

  const result = await syncDatabases(source, target)
  return { success: true, direction, summary: result.summary }
}

module.exports = { handleSync, getPeerConfig }
