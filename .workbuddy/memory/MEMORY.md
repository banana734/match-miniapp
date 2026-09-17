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
- 起后端：`cd server && node app.js`（监听 `0.0.0.0:3000`，局域网可达）。
- **前端 `src/utils/api.js` 必须填「电脑的局域网 IP」，不能填 `127.0.0.1`**。原因：真机上的 `127.0.0.1` 指向手机自己，手机没有后端 → 页面报「后端未连接」。改成局域网 IP 后模拟器一样能用（电脑访问自己的局域网 IP 也通）。
  - ⚠️ **这个 IP 是 DHCP 动态分配的，换 Wi-Fi / 重连路由就会变，一变就"后端没连接"**。已发生三次：2026-09-16 填 `192.168.2.152`；2026-09-17 凌晨换网变 `10.134.43.137`；2026-09-17 早上又变回 **`192.168.2.152`**（当前值）。
  - 排查顺序：① `netstat -ano | grep :3000` 看后端在不在；② 用 node `os.networkInterfaces()` 列当前 IPv4，**认准 WLAN，别选 VMware VMnet / WSL 虚拟网卡**；③ `curl http://<新IP>:3000/api/admin/families` 自测 200；④ 改 `src/utils/api.js` 后 grep `dist/dev/mp-weixin/utils/api.js` 确认重建。
- 排查真机连不上后端的三步：① `netstat -ano | grep :3000` 确认监听的是 `0.0.0.0` 而不是 `127.0.0.1`；② `curl http://<局域网IP>:3000/api/...` 在电脑上自测；③ 手机和电脑必须连**同一个 Wi-Fi**。
  - 防火墙：本机 node.exe（`C:\Users\Banana\.workbuddy\binaries\node\versions\22.22.2\node.exe`）已有 Inbound Allow 规则（TCP、端口 Any、**Public 配置文件**），而 WLAN 正好是 Public 类别，所以防火墙默认不拦；若是别的机器/别的 node 路径，需要新放行。
- **新增页面 / 新增 tab 的清单**（2026-09-17 修正，原来那条「必须重启编译进程」已被实测推翻）：
  1. `pages.json` 的 `pages` 数组注册页面；要进底栏再往 `tabBar.list` 加一项。
  2. ⚠️ **tabBar 插入位置会影响 `setTabBarBadge` 的下标**（代码里硬编码 `index: 2` 指「联系」）→ 要插在「联系」之后，别插在它前面。
  3. ⚠️ `src/store/user.js` 的 `syncMessageBadge` 里有 `tabBarPages` 白名单，新增 tab 页面**必须把新路由加进去**，否则用户停在新 tab 时徽标不刷新。
  4. 校验产物：grep `dist/dev/mp-weixin/app.json`，确认新页进了 `pages` 列表、`tabBar.list` 顺序正确、且 `pages/<新页>/` 下 js/json/wxml/wxss 都已生成。
  - 实测结论：**dev watcher 会自动处理 `pages.json` 变更并重建**（`app.json` 与页面产物都会更新），不需要手动重启编译进程；早前"必须重启、否则新页静默跳不过去"的判断在本项目的 uni 版本下不成立。仍建议 grep 产物确认，别只看 DevTools 界面。（表现为"按钮点不开"）。
- 改 `src/utils/api.js` 这类源码后，dev watcher 会自动重建 `dist/dev/mp-weixin`；**但 `dist/build/mp-weixin` 不会自动更新**，跑真机/发布前要手动 `npm run build:mp-weixin`。排查产物是否生效直接 grep 产物文件最准。
- 微信开发者工具需勾「详情 → 本地设置 → 不校验合法域名」。

## 小程序里加图片 / 背景图的硬约束（2026-09-17 实测）
1. **WXSS 的 `background-image` 不支持本地文件路径**（网页可以，小程序不行）→ 只能用 **base64**、**网络图**，或改用 **`<image>` 元素**。写成 `url('/static/x.jpg')` 时 uni-app 会原样保留路径、且 `dist` 里不会生成 `static/`，等于完全失效。
2. **`page` 的背景 `background-size: cover` 是按「整页高度」算的，不是视口** → 页面一长图片就被放大成一团糊，而且每个页面糊的程度不一样。要「固定壁纸」效果必须用 `position: fixed` 的独立图层。
3. 运行中的 **dev watcher 发现不了「新建」的 `src/static` 目录** → `dist/dev/mp-weixin/static/` 不会生成，**正确做法只有一条：重启 dev 编译进程**（`npm run dev:mp-weixin`），让它自己拷。
   - 补充（2026-09-17 实测）：**目录已存在时，往里面新增文件是能自动同步进 dist 的**（当天加了 10 个 tabBar 图标，watcher 正常拷进产物）。上一条只对「首次创建 static 目录」成立。
4. 🚨 **绝对不要手动往 `dist/` 里拷文件**（2026-09-17 踩坑）。手动塞进去后，下次 watcher 拷贝同名文件时会先删旧的，而删除要走本机的 **safe-delete 垫片（移到回收站）**，该操作会失败并抛出 `[safe-delete] 操作失败 … Some operations were aborted`，**导致整个编译进程崩溃退出**。症状极具迷惑性：**编译进程静默死亡**，之后改源码再也不重建，看起来像"改了没生效"。修法：删掉手动拷的那份（`rm -f dist/dev/mp-weixin/static/xxx`）再重启编译进程。
5. 🔍 **判断编译进程是否还活着**：比较产物与源码的修改时间 ——
   `find dist/dev/mp-weixin -type f -printf '%TY-%Tm-%Td %TH:%TM  %p\n' | sort -r | head`
   若产物最新时间 **早于** 你刚改的源码时间，说明编译进程已死，别再去查代码问题。
6. 全屏背景走的是「`.page-bg`（fixed + z-index:-1）+ `<image mode="aspectFill">`」这个组合，样式在 `src/styles/common.scss`，**每个页面模板最外层手动加一行**（15 个页面都加了）。
6.1 🚨 **`<text>` 里的换行会被编译成「空格」，不是换行**（2026-09-17 实测）。在源码 `<text>` 内敲回车分行，产物 wxml 里那个换行变成一个空格，页面渲染出来是连成一整段的。**要分行必须每个条目写一个独立元素**（如 `<text class="guide-line">` × 3），不能靠回车。首页 `项目简介` 中间那个突兀空格就是这么来的。
7. 隔夜/休眠后大概率要**重启两样**：后端 `node app.js` + 编译进程 `npm run dev:mp-weixin`。后台页面打不开时先查这两样，别急着怀疑代码。

## 匹配页「池子里少了卡片」的排查顺序（2026-09-17 踩过）
`match.vue` 的 `visiblePool` 会把**已经在本账号 pending / formal 列表里**的卡片从匹配池剔除（避免重复申请）。所以「搜不到某人 / 池子里少一张卡」**默认先怀疑这个，别先怀疑搜索**：
1. `curl "http://127.0.0.1:3000/api/match/list?role=mentor"` 确认卡片是否在接口返回里（返回了 = 是前端隐藏的）。
2. `curl "http://127.0.0.1:3000/api/admin/pairings"` 查 `cardId` 等于那张卡 id、且 `status` 为 `pending`/`formal` 的记录（能看出是哪个账号拿走了）。
3. 卡片 id 形如 `<role>-<openid>`，用 `/api/admin/mentors`、`/api/admin/families` 反查账号名。
隐藏的卡片在「联系」页的「待试课 / 正式上课」里能找到，这是预期行为。

## 卡片序号约定（2026-09-17 用户要求）
- 匹配 / 联系 / 反馈 三页的卡片左上角都要有序号，样式是 `common.scss` 里的 **`.card-index`**（蓝色小方牌），**序号 = 列表下标 + 1**，搜索/筛选后从 1 重新排。
- 卡片头统一结构：`[.card-index 序号] + [.match-heading 名字/副标题竖排]`，外层容器（`.match-top-left` / `.feedback-top-left`）是 `row`。
- ⚠️ `v-for` 的外层下标变量**必须叫 `cardIndex`，不能叫 `index`** —— 卡片内部本来就有 `v-for="(choice, index) in ..."`，会遮蔽。
- 注意：`{{ cardIndex + 1 }}` 会被 uni-app 编译进循环数据，wxml 里看起来是 `{{item.a}}`，属正常。

## 卡片相关接口一览
| 接口 | 作用 |
|---|---|
| `GET /api/match/list?role=mentor\|family` | 返回**对侧**卡片池（mentor 看家庭卡） |
| `GET /api/match/my-card?openid=&role=` | 返回**自己**那张卡（title/subtitle/badge/preview，不含 details），「我的」页用 |
| `GET /api/trial/list?openid=&role=` | 我的待试课 / 正式上课列表 |
| `GET /api/profile/detail?openid=&role=` | 原始资料对象（资料表单回填用） |
- 「我的」页展示自己资料时**必须走 `/api/match/my-card`**，不要在前端自己拼字段 —— 它内部复用 `buildFamilyCard`/`buildMentorCard`，保证和对方在匹配页看到的字段一致。
- 卡片构造函数在 `server/routes/match.js`：`buildFamilyCard(user)` / `buildMentorCard(user)`，返回 `{ id, title, subtitle, badge, preview, details }`。

## 匹配卡片的数据结构（`server/routes/match.js` 生成，2026-09-17 核对）
```
{ id, title, subtitle, badge, preview: [[line,...],...], details: [line,...] }
line = { label: 题目名, kind: 'single'|'multi'|'sort', value?: 单个答案, items?: [答案...] }
```
- **哪些是「用户填的」**：`title`（`profile.name`）、`subtitle`（家庭=地区 / 导师=`学校 · 专业`）、`line.value`、`line.items`。
- **哪些不是**：`line.label`（题目名，**每张卡都一样**）、`badge`（家庭卡固定 `'家庭'`；导师卡按 `coreMember` 出 `'骨干成员'/'普通成员'`）。
- ⚠️ **搜索/筛选只应匹配「用户填的」那几项。** 把 `label` 或 `badge` 混进搜索文本会导致「搜任何题目名都返回全部卡片」（2026-09-17 修过一次，别改回去）。见 `src/pages/match/match.vue` 的 `getCardSearchText()`。

## UI 约定：列表页统一用「大底卡 + 白卡片」嵌套（2026-09-17 用户指定）
用户明确要求各页向「联系」页看齐。标准结构（见 `src/pages/message/message.vue`，`src/pages/match/match.vue` 已同步）：
```
.card.card-gap-20.card-mb-18.section-panel        ← 大底卡（每页 scoped 里本地定义）
├─ .summary-top                                   ← 标题行
│   ├─ .section-title.section-title-sm            ← 左对齐标题（不是居中的 .title.title-sm）
│   └─ .count-badge                               ← 数量角标
├─ .panel-note                                    ← 可选（匹配页 2026-09-17 已删，当前无人使用）
├─ .search-bar                                    ← 可选：白底小搜索卡
├─ .section-empty                                 ← 空状态（居中）
└─ .match-list / .trial-list → .match-card × N    ← 白卡片列表
```
- 复用来源：`.summary-top` / `.count-badge` / `.match-list` / `.trial-list` / `.match-card` / `.section-title*` 在 `common.scss`；**`.card.section-panel` 和 `.section-empty` 各页自己 in-scoped 写**，值固定为 `background: rgba(233,238,247,0.8); border: 2rpx solid #cdd8e8;`。
- 底卡用 `card-gap-20`，**里面的子元素不要再加 `card-mb-*`**，间距交给底卡的 `gap`。
- 标题进底卡后一律降级为 `.section-title.section-title-sm`（28rpx 左对齐），不再用居中的大标题。

## 样式避坑：`.content` 是个「哑类」（2026-09-17）
- `class="content"` 在本项目**全项目没有任何定义**（`common.scss` 和页面 scoped 里都搜不到），只有配套的 `.text-block { display: block }` 是真生效的。
- **后果**：挂了 `content` 的 `<text>` 等于「没人管字号」，会掉到**小程序默认字号 32rpx**。和项目里常用的 24/26/28rpx 摆在一起，看起来就像"换了字体"（其实字体族由 `page{}` 全局统一，差别只在字号）。
- 现有 `content` 残留位置：`src/pages/My/My.vue` L13/L16/L19（**用户已知，尚未改**）。首页那处已于 2026-09-17 清掉。
- 规则：写新页面时**别用 `content`**；正文文字要么复用现成的语义类，要么显式写 `font-size`。项目常见字号档：正文 26rpx、次要 24rpx、小标题 28rpx、卡片标题 34rpx（`.title-sm`）。
- 首页正文统一用 `src/pages/home/home.vue` scoped 里的 `.card-text`（26rpx / #4b5563 / line-height 1.7），项目简介与匹配指南共用。

## 核心业务状态机：试课 / 日常反馈（2026-09-17 核对代码确认）
存在 `trial_records.status`，**活跃状态只有 `pending` / `formal`**，其余（`rejected` / `removed` / `terminated`）都会从列表里消失。
- **试课反馈** —— `server/routes/trial.js` → `submitTrialFeedback`；选项在 `src/constants/trial-feedback-options.js`：
  选项实际 **4 个**：`愿意` / `需要调整后再试一次` / `不愿意` / `其他`。
  ```
  愿意            → formal    （转正式上课）
  需要调整后再试一次 → pending   （退回「待试课」，可再约）
  其余一切值(含「其他」/空值) → rejected（解除联系）
  ```
  状态会经 `syncPartnerRecord` 同步给对方那条镜像记录，两端一致。
- **日常反馈** —— `server/routes/daily.js`；最后只有 `愿意` / `不愿意` 两个值，且**只有「不愿意」才动数据**（配对两端记录一起置 `terminated`，移出正式上课区）；`愿意` 只落一条反馈、不动 `trial_records`。
- ⚠️ **「其他」选项归到 rejected 这个口径，用户已明确说「保持现状不动」，不要自作主张改。**
- 卡片 id 固定格式 `<role>-<openid>`；配对由「双方向各一条」记录组成，镜像定位见 `getPartnerLocator`。
- 前端术语统一用「待试课」「正式上课」（见 `message.vue` 的分区标题），写文案时沿用。

## tabBar 图标约定（2026-09-17 建立）
- 源文件放 `D:\VScode\Match\icon\`（中文名，如 `首页.png` / `首页灰.png`），**拷进 `src/static/` 时一律改 ASCII 名**，避免中文文件名进产物出乱码。
- 命名规则：`tab-<模块>[(-gray)].png` —— 无后缀 = **选中态（有色）**，`-gray` = **未选中态（灰色）**。
  现有：`tab-home` / `tab-match` / `tab-message` / `tab-feedback` / `tab-my`，各带 `-gray`。
- 图标规格：200×200、RGBA 带透明通道；有色统一 `#1296DB`，灰色统一 `#CDCDCD`。
- `pages.json` 写法（路径相对 **src 根**，不带前导 `/`）：
  `"iconPath": "static/tab-home-gray.png"`、`"selectedIconPath": "static/tab-home.png"`
- tabBar 文字色已对齐图标：`"color": "#999999"`、`"selectedColor": "#1296DB"`。
- 预览脚本：`node scripts/gen-icon-preview.js` → 生成根目录 `icon-preview.html`（内联 base64，可独立打开看效果）。纯粹是给人看的，不参与小程序构建。
