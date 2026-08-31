/**
 * 试课反馈页的文案与选项常量。
 *
 * 供两个反馈页（family-feedback / mentor-feedback）使用：
 *   - 文案：默认对象名、标题后缀、Toast 提示；
 *   - 选项：满意度 / 客观不足 / 主观不足三组多选 + 继续意愿单选。
 * 选项文案是家长端和导师端唯一的实质差异（视角互换：家长评老师，导师评学生），
 * 「愿意 / 需要调整后再试一次 / 不愿意」三个值与后端状态机直接对应，不能随意改字。
 */

// ---------- 页面文案 ----------

// 路由没传反馈对象名时的兜底标题前缀
export const trialFeedbackDefaultObjectName = '该对象'
// 导航栏标题后缀，与对象名拼成「XX的试课反馈」
export const trialFeedbackTitleSuffix = '的试课反馈'
// 校验不通过时的 Toast 文案
export const trialFeedbackIncompleteToast = '请先补全反馈内容'
// 反馈提交成功后的 Toast 文案
export const trialFeedbackSuccessToast = '反馈已保存'

// ---------- 导师端（评价学生）选项 ----------

// 导师端：对学生的满意之处（多选）
export const mentorTrialSatisfactionOptions = [
  '态度积极，愿意配合',
  '能主动提问或回应',
  '理解能力较好，能跟上讲解',
  '情绪稳定，无明显抵触',
  '其他'
]

// 导师端：客观方面的不足（多选，归因于学生 / 环境等客观因素）
export const mentorTrialObjectiveUnsatisfiedOptions = [
  '基础较弱，理解较慢',
  '注意力不集中，容易走神',
  '情绪较紧张或抗拒学习',
  '未提前准备上课所需材料',
  '其他'
]

// 导师端：主观方面的不足（多选，归因于导师自身）
export const mentorTrialSubjectiveUnsatisfiedOptions = [
  '我的讲解方式学生不太适应',
  '我未能有效调动学生积极性',
  '我准备的内容难度不匹配',
  '其他'
]

// ---------- 家长端（评价老师）选项 ----------

// 家长端：对老师的满意之处（多选）
export const familyTrialSatisfactionOptions = [
  '耐心负责，沟通自然',
  '讲解清晰，容易理解',
  '能关注孩子情绪和状态',
  '互动感好，孩子愿意配合',
  '其他'
]

// 家长端：客观方面的不足（多选，归因于老师 / 安排等客观因素）
export const familyTrialObjectiveUnsatisfiedOptions = [
  '讲解节奏不太合适',
  '内容难度与孩子当前情况不匹配',
  '互动方式还需要调整',
  '时间安排或上课条件不太方便',
  '其他'
]

// 家长端：主观方面的不足（多选，归因于孩子 / 家庭自身）
export const familyTrialSubjectiveUnsatisfiedOptions = [
  '孩子当天状态一般，影响了试课效果',
  '我这边课前准备还不够充分',
  '家庭配合方式还需要调整',
  '其他'
]

// ---------- 共用：继续意愿（单选，对应后端试课状态机）----------
// 「愿意」→ formal（转正式）
// 「需要调整后再试一次」→ pending（回到待试课）
// 「不愿意」→ rejected（拒绝）
export const trialFeedbackContinueOptions = [
  '愿意',
  '需要调整后再试一次',
  '不愿意',
  '其他'
]
