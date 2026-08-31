/**
 * 有序标签组：实现「按点击顺序排序」的多选标签。
 *
 * 和普通多选的区别：在这里，你点选标签的先后顺序是有意义的。
 * 比如选科目，第一个点的是你最想辅导的，会显示为「1. 数学」。
 *
 * 用法（见 family-data.vue）：
 *   const subjectGroup = useOrderedTagGroup(form.subjects, familySubjectOptions, () => {
 *     form.subjectOther = ''   // 取消「其他」时，清空补充输入框
 *   })
 *   subjectGroup.toggle('数学')     // 点一下：选中 / 再点一下取消
 *   subjectGroup.selected.value    // 已选中的标签（按点击顺序）
 *   subjectGroup.unselected.value  // 还没选的标签
 *   subjectGroup.order('数学')      // 返回 '1. ' 这样的顺位前缀；没选则返回 ''
 */
import { computed } from 'vue'

/**
 * 创建一个有序标签组。
 * @param {Array} selectedList - 已选中的值数组（由页面持有，本函数会直接往里加 / 删）
 * @param {Array} allOptions - 这一组的全部可选项（用来区分已选 / 未选）
 * @param {Function} onRemoveOther - 取消选中「其他」时触发，用来清空对应的补充输入框
 */
export const useOrderedTagGroup = (selectedList, allOptions, onRemoveOther = () => {}) => {
  // 点击某个标签：已经选了就取消；没选就加到末尾（末尾 = 最后点 = 优先级最低）
  const toggle = (value) => {
    const index = selectedList.indexOf(value)

    if (index > -1) {
      selectedList.splice(index, 1) // 已选中 → 取消
      if (value === '其他') {
        onRemoveOther() // 取消的恰好是「其他」→ 顺手清空补充输入框
      }
      return
    }

    selectedList.push(value) // 没选中 → 追加到末尾
  }

  // 给已选标签算一个「第几顺位」的前缀：'1. ' '2. '，没选则返回空串
  const order = (value) => {
    const index = selectedList.indexOf(value)
    return index > -1 ? `${index + 1}. ` : ''
  }

  // 已选中的标签（按点击顺序，且只保留合法选项）
  const selected = computed(() => {
    return selectedList.filter((item) => allOptions.includes(item))
  })

  // 还没选的标签（按选项表原顺序排列）
  const unselected = computed(() => {
    return allOptions.filter((item) => !selectedList.includes(item))
  })

  return {
    toggle,
    order,
    selected,
    unselected
  }
}
