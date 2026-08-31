/**
 * 前端通用展示工具：被 match.vue 与 message.vue 共用的纯函数。
 * 抽到这里是为了去掉两处页面的复制粘贴（原先各抄了一份）。
 */

// 清洗数组：过滤空值，非数组一律返回空数组（容错）
export const list = (items = []) => {
  return Array.isArray(items) ? items.filter(Boolean) : []
}

// 截断预览列表：超过 limit 项时只保留前 limit 项并追加 '...' 省略号
export const previewList = (items = [], limit = 3) => {
  const values = list(items)
  if (values.length <= limit) {
    return values
  }
  return [...values.slice(0, limit), '...']
}

// 把资料行两两分组，让信息条在卡片里按两列排版
export const pairLines = (items = []) => {
  const values = list(items)
  const rows = []
  for (let index = 0; index < values.length; index += 2) {
    rows.push(values.slice(index, index + 2))
  }
  return rows
}

// 返回首页（资料填写被放弃等场景）的 tab 切换
export const goHome = () => {
  uni.switchTab({ url: '/pages/home/home' })
}
