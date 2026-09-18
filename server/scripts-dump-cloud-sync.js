// 把本地 match 库全量导出为 SQL（结构+数据+视图），用于导入 Sealos 云库
const fs = require('fs');
const mysql = require('mysql2/promise');
const cfg = require('./db/mysql.local.json');

(async () => {
  const conn = await mysql.createConnection({
    host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password,
    database: cfg.database, charset: 'utf8mb4'
  });

  const [tabs] = await conn.query('SHOW FULL TABLES');
  const items = tabs.map(r => ({ name: Object.values(r)[0], type: Object.values(r)[1] }));

  let sql = '-- Match local -> cloud full sync\n';
  sql += '-- Generated at ' + new Date().toISOString() + '\n';
  sql += 'CREATE DATABASE IF NOT EXISTS `match` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n';
  sql += 'USE `match`;\n';
  sql += 'SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\n';

  // 先删视图再删表（视图可能依赖表）
  for (const it of items.filter(i => i.type === 'VIEW')) {
    sql += 'DROP VIEW IF EXISTS `' + it.name + '`;\n';
  }
  for (const it of items.filter(i => i.type !== 'VIEW')) {
    sql += 'DROP TABLE IF EXISTS `' + it.name + '`;\n';
  }
  sql += '\n';

  // 先建所有表+插数据，最后才建视图（视图引用表，必须等表就位）
  const tables = items.filter(i => i.type !== 'VIEW');
  const views = items.filter(i => i.type === 'VIEW');
  for (const it of tables) {
    const [r] = await conn.query('SHOW CREATE TABLE `' + it.name + '`');
    sql += '-- 表 ' + it.name + '\n' + r[0]['Create Table'] + ';\n';
    const [rows] = await conn.query('SELECT * FROM `' + it.name + '`');
    console.log(it.name + ': ' + rows.length + ' 行');
    if (!rows.length) { sql += '\n'; continue; }
    const cols = Object.keys(rows[0]).map(c => '`' + c + '`').join(', ');
    const chunk = 50;
    for (let i = 0; i < rows.length; i += chunk) {
      const vals = rows.slice(i, i + chunk).map(row =>
        '(' + Object.values(row).map(v => {
          // JSON 字段读出来是 JS 对象，必须先 stringify，否则 escape 会变成 '[object Object]'
          if (v !== null && typeof v === 'object' && !(v instanceof Date) && !Buffer.isBuffer(v)) {
            return conn.escape(JSON.stringify(v));
          }
          return conn.escape(v);
        }).join(', ') + ')'
      ).join(',\n');
      sql += 'INSERT INTO `' + it.name + '` (' + cols + ') VALUES\n' + vals + ';\n';
    }
    sql += '\n';
  }
  for (const it of views) {
    const [r] = await conn.query('SHOW CREATE VIEW `' + it.name + '`');
    let cv = r[0]['Create View'];
    cv = cv.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '');
    sql += '-- 视图 ' + it.name + '\n' + cv + ';\n\n';
  }

  sql += 'SET FOREIGN_KEY_CHECKS=1;\n';
  fs.writeFileSync('match-cloud-sync.sql', sql, 'utf8');
  console.log('已生成 match-cloud-sync.sql，大小 ' + (fs.statSync('match-cloud-sync.sql').size / 1024).toFixed(1) + ' KB');
  await conn.end();
})().catch(e => { console.error('导出失败:', e.message); process.exit(1); });
