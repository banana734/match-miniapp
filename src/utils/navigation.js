let tabSwitching = false

export const safeSwitchTab = (url) => {
  const currentRoute = getCurrentPages().slice(-1)[0]?.route
  const targetRoute = url.replace(/^\//, '')

  if (currentRoute === targetRoute || tabSwitching) {
    return false
  }

  tabSwitching = true

  uni.switchTab({
    url,
    fail: () => {
      // 这里主要拦截重复切页导致的 timeout，失败时保持静默即可。
    },
    complete: () => {
      setTimeout(() => {
        tabSwitching = false
      }, 300)
    }
  })

  return true
}
