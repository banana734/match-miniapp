import App from './App'
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  return {
    app
  }
}
