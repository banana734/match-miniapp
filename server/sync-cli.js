// 本地一键双向同步（不经过 HTTP / 不校验 token，仅在你自己机器上跑）。
//
// 用法：
//   node sync-cli.js toCloud   线下 → 线上（开服时：本地库覆盖云库）
//   node sync-cli.js toLocal   线上 → 线下（收服时：云库覆盖本地库）
//
// 云端库连接读取顺序：
//   1. 当前目录 db/cloud.local.json（已 gitignore，含密码，不进版本库）
//   2. 环境变量 CLOUD_MYSQL_HOST / CLOUD_MYSQL_PASSWORD ...
const fs = require('fs')
const path = require('path')
const { getMysqlConfig } = require('./db/database')
const { syncDatabases } = require('./db/sync')

const getPeer = () => {
  const jsonPath = path.join(__dirname, 'db', 'cloud.local.json')
  if (fs.existsSync(jsonPath)) return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const host = process.env.CLOUD_MYSQL_HOST
  const password = process.env.CLOUD_MYSQL_PASSWORD
  if (!host || !password) {
    console.error('缺少云端库配置：请创建 server/db/cloud.local.json 或设置 CLOUD_MYSQL_* 环境变量')
    process.exit(1)
  }
  return {
    host,
    port: Number(process.env.CLOUD_MYSQL_PORT || 3306),
    user: process.env.CLOUD_MYSQL_USER || 'root',
    password,
    database: process.env.CLOUD_MYSQL_DATABASE || 'match'
  }
}

;(async () => {
  const direction = process.argv[2]
  if (direction !== 'toCloud' && direction !== 'toLocal') {
    console.error('用法: node sync-cli.js toCloud|toLocal')
    process.exit(1)
  }

  const local = getMysqlConfig()
  const peer = getPeer()
  const source = direction === 'toCloud' ? local : peer
  const target = direction === 'toCloud' ? peer : local

  console.log(`开始同步 [${direction === 'toCloud' ? '线下 → 线上' : '线上 → 线下'}] ...`)
  const result = await syncDatabases(source, target)
  console.log('同步完成 ✅')
  console.log(JSON.stringify(result.summary, null, 2))
})().catch((e) => {
  console.error('同步失败 ❌:', e.message)
  process.exit(1)
})
