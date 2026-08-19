import { reactive, ref } from 'vue'

export const useTrialFeedbackPage = (defaultObjectName = '该对象', titleSuffix = '的试课反馈') => {
  const objectName = ref(defaultObjectName)
  const cardId = ref('')
  const pageTitle = ref(`${defaultObjectName}${titleSuffix}`)

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

  const updatePageTitle = () => {
    pageTitle.value = `${objectName.value}${titleSuffix}`

    uni.setNavigationBarTitle({
      title: pageTitle.value
    })
  }

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

  const handleDateChange = (field, event) => {
    form[field] = event.detail.value
  }

  const handleChoiceGroupChange = (field, otherField, event, otherValue = '其他') => {
    form[field] = event.detail.value

    const currentValue = form[field]
    const hasOther = Array.isArray(currentValue)
      ? currentValue.includes(otherValue)
      : currentValue === otherValue

    if (!hasOther) {
      form[otherField] = ''
    }
  }

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
