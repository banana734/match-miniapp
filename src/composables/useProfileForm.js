/**
 * 资料表单 composable：把「默认值定义」和「响应式表单」解耦。
 *
 * 解决的问题：资料表单字段多（家长端 / 导师端共用一套字段池），
 * 手写同步逻辑容易漏字段或漏拷贝。这里统一处理三件事：
 *   1. createSnapshot —— 只保留 defaults 里声明过的字段，数组字段拷贝新数组；
 *   2. syncFormFromProfile —— 回显：把 store 里的 profile 安全地灌进表单；
 *   3. createPayload —— 提交：把表单浅拷贝一份并保证数组字段是独立数组，
 *      避免提交后后端 / store 改动互相污染。
 *
 * 用法（见 family-data.vue）：
 *   const { form, syncFormFromProfile, createPayload } = useProfileForm(defaultProfile, arrayKeys)
 */
import { reactive } from 'vue'

// 判断某个字段是否属于数组型字段（需要按数组处理拷贝和回显）
const isArrayKey = (arrayKeys, key) => arrayKeys.includes(key)

/**
 * 克隆单个字段值。
 * @param {*} value - 字段当前值（可能来自 store 的 profile）
 * @param {*} defaultValue - defaults 里声明的默认值
 * @param {boolean} asArray - true 时强制返回数组（原值有效则拷贝，无效则用默认值拷贝）
 *                            ?? 只兜底 null/undefined，空字符串等假值原样保留
 */
const cloneValue = (value, defaultValue, asArray) => {
  if (asArray) {
    return Array.isArray(value) ? [...value] : [...defaultValue]
  }

  return value ?? defaultValue
}

/**
 * @param {Object} defaults - 表单默认值对象，同时充当「字段白名单」：
 *                            只有这里声明过的字段才会进入表单 / 载荷。
 * @param {string[]} arrayKeys - 数组型字段名列表，如 ['subjects', 'difficulties']
 */
export const useProfileForm = (defaults, arrayKeys = []) => {
  /**
   * 生成一份快照：只取 defaults 中声明的字段，
   * 值优先取传入 profile 的，缺省时回退默认值；数组字段一律拷贝新数组。
   */
  const createSnapshot = (profile = {}) => {
    const snapshot = {}

    for (const key of Object.keys(defaults)) {
      snapshot[key] = cloneValue(profile[key], defaults[key], isArrayKey(arrayKeys, key))
    }

    return snapshot
  }

  // 响应式表单对象，初始为全默认值的快照
  const form = reactive(createSnapshot())

  // 回显：用 store 里的 profile 生成快照后覆盖表单。
  // ⚠️ 数组字段不能走 Object.assign 换成新数组——页面上的有序标签组
  // （useOrderedTagGroup）持有的是原数组的引用，一旦被换成新数组，
  // 后续点标签都在改那个「脱离了 form 的旧数组」：UI 看着选中了，
  // form 里却永远是空的，保存校验会误报「请先补全」。
  // 所以数组字段用 splice 原地替换内容，保住引用不变。
  const syncFormFromProfile = (profile = {}) => {
    const snapshot = createSnapshot(profile)

    for (const key of Object.keys(snapshot)) {
      if (isArrayKey(arrayKeys, key)) {
        form[key].splice(0, form[key].length, ...snapshot[key])
      } else {
        form[key] = snapshot[key]
      }
    }
  }

  // 提交：浅拷贝表单，并把数组字段替换成独立副本，避免外部改动表单
  const createPayload = () => {
    const payload = { ...form }

    for (const key of arrayKeys) {
      payload[key] = Array.isArray(form[key]) ? [...form[key]] : []
    }

    return payload
  }

  return {
    form,
    syncFormFromProfile,
    createPayload
  }
}
