/**
 * 后端接口基础地址（统一入口）。
 *
 * 用途：所有页面发请求时都从这里取 API_BASE_URL 拼接完整地址，
 * 切换部署环境（本地开发 / 线上服务器）时只需要改这一行。
 *
 * 线上模式：填 Sealos 外网地址（https）。
 *   真机 / 体验版走这个域名；公众平台「服务器域名 → request合法域名」需加
 *   https://jymlbzjmwtbw.sealosbja.site（或对方手机打开体验版时开「调试」模式跳过校验）。
 *
 * 本地联调需改回局域网 IP：电脑 `ipconfig` 查 WLAN 的 IPv4（如 192.168.2.152），
 * 并勾选开发者工具「不校验合法域名…」。改完跑 npm run dev:mp-weixin 重建 dist/dev。
 *
 * 注意：build 产物（dist/build/mp-weixin）才会被上传成体验版，所以改完必须
 * 重新 npm run build:mp-weixin 并重新上传。
 */
export const API_BASE_URL = 'https://jymlbzjmwtbw.sealosbja.site/api'
