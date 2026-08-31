/**
 * 底部 TabBar 切换的安全封装。
 *
 * 为什么需要它：uni.switchTab 在以下两种情况会报错 / 卡顿——
 *   1. 快速连续点击，重复切换同一个 tab → 触发 timeout 错误；
 *   2. 目标 tab 就是当前页面 → 重复切换同样报错。
 * 这里用「当前已在目标页 → 直接返回」+「切换中 300ms 内锁」双重防护。
 */

// 切换锁：true 表示一次 switchTab 还在进行中，期间忽略新的切换请求
let tabSwitching = false

/**
 * 安全地切换底部 Tab。
 * @param {string} url - 目标 tab 路径，如 '/pages/message/message'
 * @returns {boolean} true = 已发起切换；false = 请求被拦截（重复点击或正在切换）
 */
export const safeSwitchTab = (url) => {
  // 取当前页面栈最顶层的路由（去掉开头的 / 后与 tab 路径比较）
  const currentRoute = getCurrentPages().slice(-1)[0]?.route
  const targetRoute = url.replace(/^\//, '')

  // 已在目标页，或上一次切换还没完成（300ms 锁未释放）→ 拦截
  if (currentRoute === targetRoute || tabSwitching) {
    return false
  }

  // 上锁，开始切换
  tabSwitching = true

  uni.switchTab({
    url,
    fail: () => {
      // 这里主要拦截重复切页导致的 timeout，失败时保持静默即可。
    },
    complete: () => {
      // 无论成功失败，300ms 后解锁，允许下一次切换
      setTimeout(() => {
        tabSwitching = false
      }, 300)
    }
  })

  return true
}
