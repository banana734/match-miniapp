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
import { ref } from 'vue'
import { onBackPress, onUnload } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { safeSwitchTab } from '@/utils/navigation'

const userStore = useUserStore()
const skipCancelOnUnload = ref(false)

const goHome = () => {
  skipCancelOnUnload.value = true
  safeSwitchTab('/pages/home/home')
}

const markCancelledAndGoHome = () => {
  if (skipCancelOnUnload.value) {
    return
  }

  userStore.cancelProfile()
  goHome()
}

const goToProfileForm = () => {
  const url = userStore.role === 'mentor'
    ? '/pages/mentor-data/mentor-data'
    : '/pages/family-data/family-data'

  skipCancelOnUnload.value = true
  uni.navigateTo({
    url
  })
}

onBackPress(() => {
  markCancelledAndGoHome()
  return true
})

onUnload(() => {
  if (!skipCancelOnUnload.value) {
    userStore.cancelProfile()
  }
})
</script>
