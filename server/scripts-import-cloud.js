// 把 match-cloud-sync.sql 导入 Sealos 云库（外网地址）
const fs = require('fs');
const mysql = require('mysql2/promise');

const CLOUD = {
  host: 'dbconn.sealosbja.site',
  port: 40720,
  user: 'root',
  password: 'pcxgfl3vw',
  database: 'match'
};

(async () => {
  // 先不带 database 连，确认能通 + 检查 match 库是否存在
  const base = await mysql.createConnection({
    host: CLOUD.host, port: CLOUD.port, user: CLOUD.user, password: CLOUD.password,
    charset: 'utf8mb4', multipleStatements: true
  });
  const [dbs] = await base.query("SHOW DATABASES LIKE 'match'");
  if (!dbs.length) {
    await base.query('CREATE DATABASE `match` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('已创建数据库 match');
  } else {
    console.log('数据库 match 已存在');
  }
  await base.end();

  // 连上 match 库执行 SQL
  const conn = await mysql.createConnection({
    host: CLOUD.host, port: CLOUD.port, user: CLOUD.user, password: CLOUD.password,
    database: CLOUD.database, charset: 'utf8mb4', multipleStatements: true
  });

  const sql = fs.readFileSync(__dirname + '/match-cloud-sync.sql', 'utf8');
  console.log('开始执行 SQL，大小', (sql.length / 1024).toFixed(1), 'KB ...');
  await conn.query(sql);
  console.log('SQL 执行完成');

  // 核对
  const [tabs] = await conn.query('SHOW FULL TABLES');
  for (const r of tabs) {
    const name = Object.values(r)[0], type = Object.values(r)[1];
    if (type === 'VIEW') { console.log(`[视图] ${name}`); continue; }
    const [c] = await conn.query(`SELECT COUNT(*) AS n FROM \`${name}\``);
    console.log(`[表] ${name}: ${c[0].n} 行`);
  }
  await conn.end();
  console.log('全部完成 ✅');
})().catch(e => { console.error('导入失败:', e.message); process.exit(1); });
