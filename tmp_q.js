const { queryRows } = require('D:/VScode/Match/server/db/database.js')
;(async () => {
  const r = await queryRows('SELECT openid, role, card_id, status, updated_at FROM trial_records ORDER BY updated_at DESC LIMIT 6')
  r.forEach(x => console.log(JSON.stringify({ openid: x.openid, role: x.role, card_id: x.card_id, status: x.status, updated: x.updated_at })))
})().catch(e => console.log('ERR', e.message))
