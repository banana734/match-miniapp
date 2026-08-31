/**
 * 试课反馈页共用逻辑：家长端 / 导师端两个反馈页共用，页面结构完全一样，
 * 差别只在选项文案和标题。本文件负责四件事：
 *   1. 从页面路由参数（name / id）读出「反馈对象名」和「卡片 id」；
 *   2. 维护导航栏标题（「XX 的试课反馈」）；
 *   3. 表单的事件处理：选日期、多选联动（勾了「其他」才显示补充输入框）；
 *   4. 提交前校验 validate()。
 *
 * 用法（见 family-feedback.vue）：
 *   const { form, cardId, syncPageFromRoute, handleChoiceGroupChange, validate } =
 *     useTrialFeedbackPage('学生', '的试课反馈')
 */
import { reactive, ref } from 'vue'

/**
 * @param {string} defaultObjectName - 路由没传 name 时兜底的反馈对象名，如「学生」「老师」
 * @param {string} titleSuffix - 标题后缀，默认「的试课反馈」
 */
export const useTrialFeedbackPage = (defaultObjectName = '该对象', titleSuffix = '的试课反馈') => {
  const objectName = ref(defaultObjectName) // 反馈对象名称（学生 / 老师名），从路由参数读
  const cardId = ref('') // 对应试课卡片的 id，提交反馈时用它定位后端记录
  const pageTitle = ref(`${defaultObjectName}${titleSuffix}`) // 导航栏标题

  // 反馈表单。数组字段（[]）是多选；带 Other 的字段是勾了「其他」后手填的补充内容
  const form = reactive({
    trialDate: '',
    trialDuration: '',
    satisfactionPoints: [],
    satisfactionPointOther: '',
    objectiveUnsatisfied: [],
    objectiveUnsatisfiedOther: '',
    subjectiveUnsatisfied: [],
    subjectiveUnsatisfiedOther: '',
    continueChoice: '',
    continueChoiceOther: ''
  })

  // 刷新导航栏标题
  const updatePageTitle = () => {
    pageTitle.value = `${objectName.value}${titleSuffix}`
    uni.setNavigationBarTitle({ title: pageTitle.value })
  }

  // 页面显示时调用：从路由参数读出反馈对象名和卡片 id
  const syncPageFromRoute = () => {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = currentPage?.options || {}

    if (options.name) {
      objectName.value = decodeURIComponent(options.name)
    }
    if (options.id) {
      cardId.value = decodeURIComponent(options.id)
    }

    updatePageTitle()
  }

  // 日期 / 时长选择器变化时：把 picker 选中的值写进对应字段
  const handleDateChange = (field, event) => {
    form[field] = event.detail.value
  }

  /**
   * 多选 / 单选组变化时，处理「其他」联动：
   * 勾了「其他」→ 保留补充输入框；取消「其他」→ 把补充框清空，避免提交脏数据。
   * @param {string} field - 主字段（选项值写这里）
   * @param {string} otherField - 联动的补充输入字段
   */
  const handleChoiceGroupChange = (field, otherField, event) => {
    form[field] = event.detail.value

    const value = form[field]
    // 多选是数组（看是否包含「其他」），单选是字符串（看是否相等）
    const checkedOther = Array.isArray(value)
      ? value.includes('其他')
      : value === '其他'

    if (!checkedOther) {
      form[otherField] = ''
    }
  }

  // 提交前校验：必填项要填全，且所有勾了「其他」的地方都要补上说明
  const validate = () => {
    if (!form.trialDate || !form.trialDuration || !form.continueChoice) {
      return false
    }
    if (form.satisfactionPoints.includes('其他') && !form.satisfactionPointOther) return false
    if (form.objectiveUnsatisfied.includes('其他') && !form.objectiveUnsatisfiedOther) return false
    if (form.subjectiveUnsatisfied.includes('其他') && !form.subjectiveUnsatisfiedOther) return false
    if (form.continueChoice === '其他' && !form.continueChoiceOther) return false
    return true
  }

  return {
    objectName,
    cardId,
    pageTitle,
    form,
    updatePageTitle,
    syncPageFromRoute,
    handleDateChange,
    handleChoiceGroupChange,
    validate
  }
}
