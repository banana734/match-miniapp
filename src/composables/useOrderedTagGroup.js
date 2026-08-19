import { computed } from 'vue'

export const useOrderedTagGroup = (sourceList, options, onRemoveOther = () => {}, otherValue = '其他') => {
  const toggle = (value) => {
    const index = sourceList.indexOf(value)

    if (index > -1) {
      sourceList.splice(index, 1)

      if (value === otherValue) {
        onRemoveOther()
      }

      return
    }

    sourceList.push(value)
  }

  const order = (value) => {
    const index = sourceList.indexOf(value)
    return index > -1 ? `${index + 1}. ` : ''
  }

  const selected = computed(() => {
    return sourceList.filter((item) => options.includes(item))
  })

  const unselected = computed(() => {
    return options.filter((item) => !sourceList.includes(item))
  })

  return {
    toggle,
    order,
    selected,
    unselected
  }
}
