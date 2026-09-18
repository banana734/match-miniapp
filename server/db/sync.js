/**
 * 库间全量同步（覆盖式）。
 *
 * syncDatabases(sourceConfig, targetConfig)：
 *   把 source 库的所有表 + 视图，原样覆盖到 target 库。
 *   - 表：DROP 旧表 → 按 source 的 SHOW CREATE TABLE 重建 → 逐行 INSERT
 *   - 视图：DROP 旧视图 → 最后再重建（视图依赖表，必须先有表）
 *   - JSON 列读出是 JS 对象，插入前必须 JSON.stringify，否则会落 '[object Object]'
 *   - Date 列交给 mysql2 的 escape 处理，无需特殊处理
 *
 * 这是「线下 ↔ 线上」互相覆盖的核心：本地后端能同时连两端库（本地直连 +
 * 云库外网地址），所以同步动作始终从本地机器发起。
 *
 * 注意：覆盖式，target 中 source 没有的表/行会保留（不会主动删 source 不存在的表）。
 *      同一张表是整体替换（先 DROP 再 INSERT），所以 target 里该表的旧数据会被清掉。
 */
const mysql = require('mysql2/promise')

const escapeSql = (conn, value) => conn.escape(value)

// 取某库里所有表名（不含视图）和视图名
const getTablesAndViews = async (conn) => {
  const [rows] = await conn.query('SHOW FULL TABLES')
  const items = rows.map((r) => ({
    name: Object.values(r)[0],
    type: Object.values(r)[1]
  }))
  return {
    tables: items.filter((i) => i.type !== 'VIEW'),
    views: items.filter((i) => i.type === 'VIEW')
  }
}

const syncDatabases = async (sourceConfig, targetConfig) => {
  const src = await mysql.createConnection({
    ...sourceConfig,
    charset: 'utf8mb4',
    multipleStatements: true
  })
  const tgt = await mysql.createConnection({
    ...targetConfig,
    charset: 'utf8mb4',
    multipleStatements: true
  })

  try {
    const { tables, views } = await getTablesAndViews(src)

    // 1) 先清 target 的旧视图、旧表（视图依赖表，先删视图）
    for (const v of views) {
      await tgt.query(`DROP VIEW IF EXISTS \`${v.name}\``)
    }
    for (const t of tables) {
      await tgt.query(`DROP TABLE IF EXISTS \`${t.name}\``)
    }

    const summary = {}

    // 2) 重建所有表 + 灌数据
    for (const t of tables) {
      const [cr] = await src.query(`SHOW CREATE TABLE \`${t.name}\``)
      await tgt.query(cr[0]['Create Table'])

      const [rows] = await src.query(`SELECT * FROM \`${t.name}\``)
      summary[t.name] = rows.length
      if (!rows.length) continue

      // 找出 JSON 列，插入前要把对象 stringify
      const [colRows] = await src.query(
        'SELECT COLUMN_NAME FROM information_schema.columns ' +
          'WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND DATA_TYPE = ?',
        [sourceConfig.database, t.name, 'json']
      )
      const jsonCols = new Set(colRows.map((c) => c.COLUMN_NAME))

      const cols = Object.keys(rows[0])
        .map((c) => `\`${c}\``)
        .join(', ')
      const chunk = 100

      for (let i = 0; i < rows.length; i += chunk) {
        const vals = rows
          .slice(i, i + chunk)
          .map((row) => {
            const parts = Object.keys(row).map((c) => {
              let v = row[c]
              if (jsonCols.has(c) && v !== null && typeof v !== 'string') {
                v = JSON.stringify(v)
              }
              return escapeSql(tgt, v)
            })
            return '(' + parts.join(', ') + ')'
          })
          .join(',\n')
        await tgt.query(`INSERT INTO \`${t.name}\` (${cols}) VALUES\n${vals}`)
      }
    }

    // 3) 最后重建视图（去掉 DEFINER，避免换环境后权限报错）
    for (const v of views) {
      const [cr] = await src.query(`SHOW CREATE VIEW \`${v.name}\``)
      const cv = cr[0]['Create View'].replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '')
      await tgt.query(cv)
      summary['view:' + v.name] = 'ok'
    }

    return { success: true, summary }
  } finally {
    await src.end()
    await tgt.end()
  }
}

module.exports = { syncDatabases }
