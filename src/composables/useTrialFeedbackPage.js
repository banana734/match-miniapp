/**
 * 试课反馈页 composable：家长端 / 导师端反馈页共用的页面逻辑。
 *
 * 两个反馈页（family-feedback / mentor-feedback）结构完全相同，
 * 差异只在选项文案和标题。本 composable 承担四件事：
 *   1. 从页面路由参数（name / id）读取反馈对象和卡片 id；
 *   2. 维护响应式导航栏标题（「XX的试课反馈」）；
 *   3. 表单事件处理：日期选择、多选项联动（选了「其他」才显示补充输入框）；
 *   4. 提交前校验 validate()。
 *
 * 用法（见 family-feedback.vue）：
 *   const { form, cardId, syncPageFromRoute, handleChoiceGroupChange, validate } =
 *     useTrialFeedbackPage('学生', '的试课反馈')
 */
import { reactive, ref } from 'vue'

/**
 * @param {string} defaultObjectName - 默认反馈对象名（路由没传 name 时兜底），如「学生」「老师」
 * @param {string} titleSuffix - 标题后缀，默认「的试课反馈」
 */
export const useTrialFeedbackPage = (defaultObjectName = '该对象', titleSuffix = '的试课反馈') => {
  const objectName = ref(defaultObjectName) // 反馈对象名称（学生 / 老师名）
  const cardId = ref('') // 对应试课卡片的 id，提交反馈时用它定位后端记录
  const pageTitle = ref(`${defaultObjectName}${titleSuffix}`) // 导航栏标题

  // 反馈表单：数组字段为多选，*Other 为勾了「其他」后的手填补充
  const form = reactive({
    trialDate: '',//试课日期
    trialDuration: '',//试课时长
    satisfactionPoints: [],//满意的地方（多选）
    satisfactionPointOther: '',//满意点选「其他」时手填
    objectiveUnsatisfied: [],//客观不足（多选）
    objectiveUnsatisfiedOther: '',//客观不足选「其他」时手填
    subjectiveUnsatisfied: [],//主观不足（多选）
    subjectiveUnsatisfiedOther: '',//主观不足选「其他」时手填
    continueChoice: '',//是否继续：愿意 / 需要调整后再试一次 / 不愿意 / 其他
    continueChoiceOther: ''//继续意愿选「其他」时手填
  })

  // 根据反馈对象名刷新导航栏标题
  const updatePageTitle = () => {
    pageTitle.value = `${objectName.value}${titleSuffix}`

    uni.setNavigationBarTitle({
      title: pageTitle.value
    })
  }

  // 从路由参数读取反馈对象名和卡片 id（页面 onLoad / onShow 时调用）
  const syncPageFromRoute = () => {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentOptions = currentPage?.options || {}

    if (currentOptions.name) {
      objectName.value = decodeURIComponent(currentOptions.name)
    }

    if (currentOptions.id) {
      cardId.value = decodeURIComponent(currentOptions.id)
    }

    updatePageTitle()
  }

  // 日期 / 时长选择器变更事件：把 picker 的值写入对应字段
  const handleDateChange = (field, event) => {
    form[field] = event.detail.value
  }

  /**
   * 多选 / 单选组变更事件，带「其他」联动：
   * 勾选了「其他」→ 保留补充输入框的值；
   * 取消了「其他」→ 把补充输入框清空，避免提交隐藏的脏数据。
   * @param {string} field - 主字段名（选项值写入这里）
   * @param {string} otherField - 联动的补充输入字段名
   * @param {string} otherValue - 代表「其他」的选项文案，默认 '其他'
   */
  const handleChoiceGroupChange = (field, otherField, event, otherValue = '其他') => {
    form[field] = event.detail.value

    const currentValue = form[field]
    // 兼容多选（数组，看是否包含）和单选（字符串，看是否相等）两种情况
    const hasOther = Array.isArray(currentValue)
      ? currentValue.includes(otherValue)
      : currentValue === otherValue

    if (!hasOther) {
      form[otherField] = ''
    }
  }

  // 提交前校验：必填项齐全 + 所有勾了「其他」的地方都填了补充内容
  const validate = () => {
    if (!form.trialDate || !form.trialDuration || !form.continueChoice) {
      return false
    }

    if (form.satisfactionPoints.includes('其他') && !form.satisfactionPointOther) {
      return false
    }

    if (form.objectiveUnsatisfied.includes('其他') && !form.objectiveUnsatisfiedOther) {
      return false
    }

    if (form.subjectiveUnsatisfied.includes('其他') && !form.subjectiveUnsatisfiedOther) {
      return false
    }

    if (form.continueChoice === '其他' && !form.continueChoiceOther) {
      return false
    }

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
