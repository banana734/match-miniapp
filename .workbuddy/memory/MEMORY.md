# Match 项目长期记忆

## 代码风格约定（用户 2026-08-31 明确）
重构 / 写代码时遵循，优先级从高到低：
- **新手可读优先**：显式、直白、不秀技巧；宁可少量重复，也不要绕弯的通用抽象。
- **标准规范**：用 uni-app / Vue 3 常规写法（ref / reactive / computed / Pinia store），命名清晰贴切。
- **解耦合**：模块职责单一、边界清楚；去重只抽「明显重复且简单」的纯函数，放进命名贴切的工具文件。
- **避免高度抽象封装**：不写通用的 wrapper / 基类 / 工厂；不为了「优雅」而加间接层。
佐证：用户曾让我删除 `safeSwitchTab`（判定为过度封装），并明确要求「别用高度抽象封装，尽量新手代码、标准规范、再解耦合」。

## 当前重构进度（详见每日日志 2026-08-31）
- 可读性改造主体已落地并提交：抽 display.js、store 加 currentRole getter、删 views.sql、DB 全表重灌→UPSERT（修并发丢数据）、match/message 去重、useOrderedTagGroup 重写更直白。
- 工作区当前未提交（2026-08-31 晚）：仅剩反馈页平铺改造尾巴——`src/pages/mentor-feedback.vue`、`src/pages/family-feedback.vue` 各自把状态/路由回填/题目事件/校验/提交平铺进本文件（去掉 useTrialFeedbackPage 依赖），并删除 `src/composables/useTrialFeedbackPage.js`。共 4 项（含日志文件）。
- **优先级（2026-08-31 22:00 用户明确）：安全/鉴权 P0 先不急，当前唯一目标是「看得懂」。**
- 暂缓真问题：后端无鉴权（/api 只信前端 openid、/admin 裸奔暴露手机号/微信号），待用户拍板再做。
- **新增「日常反馈」功能（未提交）**：镜像试课反馈，含 6 题 + 最后「是否愿意继续合作」(愿意/不愿意)；选不愿意→配对两端 trial_records 置 terminated、移出正式上课区。风格与现有试课反馈（composable 版）一致。详见每日日志。

## 本地开发须知
- 起后端：`cd server && node app.js`（监听 3000）。前端 `src/utils/api.js` 指向 `http://127.0.0.1:3000/api`。
- **改 `pages.json` 新增页面后，必须重启 uni 编译进程做全量重建**（`npm run dev:mp-weixin`），热重载 / DevTools 普通「重新编译」不会把新页写进编译产物 `app.json` 的 pages 列表，`uni.navigateTo` 跳未注册页会静默失败（表现为"按钮点不开"）。
- 微信开发者工具需勾「详情 → 本地设置 → 不校验合法域名」。
