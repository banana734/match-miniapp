<template>
  <view class="container">
    <view class="card card-gap-20">
      <text class="title">请先填写匹配资料</text>
      <text class="subtitle">完成资料后，才能继续查看相关页面内容。</text>
      <view class="primary-btn action-btn action-top" @tap="goToProfileForm">去填写资料</view>
    </view>
  </view>
</template>

<script setup>
// 导入 vue 核心 API
import { ref } from 'vue'
// uni-app 页面生命周期钩子（物理返回键、页面卸载）
import { onBackPress, onUnload } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
// 引入安全的 tab 页切换工具（失败时自动降级为 reLaunch）
import { safeSwitchTab } from '@/utils/navigation'

// 获取全局仓库实例
const userStore = useUserStore()
// 标记“主动跳转”：为 true 时 onUnload 不再视为放弃填写
// （用于区分“用户自己放弃”和“代码引导跳走”两种离开方式）
const skipCancelOnUnload = ref(false)

// 切回首页，并声明这是主动跳转（不算放弃）
const goHome = () => {
  skipCancelOnUnload.value = true
  safeSwitchTab('/pages/home/home')
}

// 标记用户放弃资料填写并返回首页（用于 match 页消费一次后跳首页）
const markCancelledAndGoHome = () => {
  if (skipCancelOnUnload.value) {
    return
  }

  // 在仓库里打上“本次放弃填写”标记
  userStore.cancelProfile()
  goHome()
}

// 跳转到对应身份的资料填写页（导师→mentor-data，家庭→family-data）
const goToProfileForm = () => {
  const url = userStore.role === 'mentor'
    ? '/pages/mentor-data/mentor-data'
    : '/pages/family-data/family-data'

  // 主动跳转，onUnload 不当作放弃处理
  skipCancelOnUnload.value = true
  uni.navigateTo({
    url
  })
}

// 拦截物理/手势返回键：视为放弃填写并回首页
// 返回 true 表示已接管返回行为，不再执行默认后退
onBackPress(() => {
  markCancelledAndGoHome()
  return true
})

// 页面卸载时兜底：若不是主动跳转，同样标记为放弃填写
onUnload(() => {
  if (!skipCancelOnUnload.value) {
    userStore.cancelProfile()
  }
})
</script>
