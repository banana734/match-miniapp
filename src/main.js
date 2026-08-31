/**
 * 小程序应用入口（uni-app + Vue 3 + Pinia）。
 *
 * uni-app 的 mp-weixin 平台约定：入口必须导出 createApp() 工厂函数
 * （而不是直接 app.mount()），由编译后的运行时在每页启动时调用。
 * createSSRApp 是跨端兼容要求的写法，小程序端等同 createApp。
 */
import App from './App'
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia()) // 注册全局状态管理（src/store/user.js 的 useUserStore 依赖它）
  return {
    app
  }
}
