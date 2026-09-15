/**
 * 日常反馈页的文案与选项常量。
 *
 * 日常反馈是「正式上课」期间的周期性反馈（区别于试课反馈），结构与之对称：
 *   - 文案：默认对象名、标题后缀、Toast 提示；
 *   - 选项：满意点 / 客观困难 / 主观困难三组多选 + 继续合作意愿单选。
 * 选项文案是家长端和导师端唯一的实质差异（视角互换：家长评老师，导师评学生）。
 *
 * 与试课反馈的关键区别：
 *   - 最后一道题「是否愿意继续合作」只有「愿意 / 不愿意」两个值（试课反馈是三个）；
 *   - 「不愿意」由后端把这张配对从正式上课区解除（见 server/routes/daily.js）。
 * 这两个值直接对应后端逻辑，不能随意改字。
 */

// ---------- 页面文案 ----------

// 路由没传反馈对象名时的兜底标题前缀
export const dailyFeedbackDefaultObjectName = '该对象'
// 导航栏标题后缀，与对象名拼成「XX的日常反馈」
export const dailyFeedbackTitleSuffix = '的日常反馈'
// 校验不通过时的 Toast 文案
export const dailyFeedbackIncompleteToast = '请先补全反馈内容'
// 反馈提交成功后的 Toast 文案
export const dailyFeedbackSuccessToast = '反馈已保存'

// ---------- 导师端（评价学生）选项 ----------

// 导师端：本次课程中，学生表现好的地方（多选）
export const mentorDailySatisfactionOptions = [
  '学习态度积极，愿意配合',
  '能主动提问或回应',
  '知识点理解到位',
  '按时完成练习任务',
  '其他'
]

// 导师端：遇到的困难（多选，归因于学生 / 环境等客观因素）
export const mentorDailyObjectiveUnsatisfiedOptions = [
  '学生状态不佳，比较疲惫',
  '基础薄弱，进度偏慢',
  '上课环境有干扰（网络 / 场地等）',
  '时间紧张，内容没讲完',
  '其他'
]

// 导师端：遇到的困难（多选，归因于导师自身）
export const mentorDailySubjectiveUnsatisfiedOptions = [
  '我的讲解节奏没把握好',
  '互动不够充分',
  '备课不够充分',
  '其他'
]

// ---------- 家长端（评价老师）选项 ----------

// 家长端：本次课程中，友导师做得好的地方（多选）
export const familyDailySatisfactionOptions = [
  '讲解清晰，孩子容易理解',
  '孩子愿意配合、有互动',
  '有耐心，情绪稳定',
  '课程进度安排合适',
  '其他'
]

// 家长端：遇到的困难（多选，归因于老师 / 安排等客观因素）
export const familyDailyObjectiveUnsatisfiedOptions = [
  '网络或上课条件不理想',
  '时间安排不太方便',
  '孩子当天状态一般',
  '其他'
]

// 家长端：遇到的困难（多选，归因于孩子 / 家庭自身）
export const familyDailySubjectiveUnsatisfiedOptions = [
  '我这边配合不够及时',
  '孩子课前准备不足',
  '其他'
]

// ---------- 共用：继续合作意愿（单选，对应后端解除绑定逻辑）----------
// 「愿意」→ 维持正式上课
// 「不愿意」→ 双方解除配对，移出正式上课区
export const dailyFeedbackContinueOptions = [
  '愿意',
  '不愿意'
]
