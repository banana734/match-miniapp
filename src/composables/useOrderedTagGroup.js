/**
 * 有序标签组 composable：实现「按点击顺序排序」的多选标签。
 *
 * 和普通多选的区别：选中项的先后顺序有意义。
 * 例如科目选择，第一个点的是最想辅导的科目，会显示为「1. 数学」。
 * sourceList 由调用方持有（通常是表单里的数组字段），
 * 本 composable 只负责在其中增删并计算序号 / 已选未选列表。
 *
 * 「其他」联动：取消选中「其他」标签时回调 onRemoveOther()，
 * 调用方可以借机清空对应的补充输入框。
 *
 * 用法（见 family-data.vue）：
 *   const { toggle, order, selected, unselected } =
 *     useOrderedTagGroup(form.subjects, familySubjectOptions, () => { form.subjectOther = '' })
 */
import { computed } from 'vue'

/**
 * @param {Array} sourceList - 存放选中值的数组（调用方持有，会被就地修改）
 * @param {Array} options - 该组全部可选项（用于计算已选 / 未选列表）
 * @param {Function} onRemoveOther - 取消「其他」时的回调，如清空 *Other 输入框
 * @param {string} otherValue - 代表「其他」的选项文案，默认 '其他'
 */
export const useOrderedTagGroup = (sourceList, options, onRemoveOther = () => {}, otherValue = '其他') => {
  /**
   * 点击一个标签：已选中 → 取消选中；未选中 → 追加到末尾（排在最后 = 优先级最低）。
   * 取消的恰好是「其他」时，触发 onRemoveOther 联动回调。
   */
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

  // 计算某标签的序号文案：已选中返回 '1. ' 样式的前缀，未选中返回空串
  const order = (value) => {
    const index = sourceList.indexOf(value)
    return index > -1 ? `${index + 1}. ` : ''
  }

  // 已选标签（保留点击顺序，且必须是合法选项）
  const selected = computed(() => {
    return sourceList.filter((item) => options.includes(item))
  })

  // 未选标签（按选项表原顺序排列）
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
