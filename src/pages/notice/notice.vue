<template>
  <view class="container">
    <view class="card">
      <text class="title">请先填写匹配资料</text>
      <text class="subtitle">完成资料后，才能继续查看相关页面内容。</text>
      <view class="primary-btn action-btn" @tap="goToProfileForm">去填写资料</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onBackPress, onUnload } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { safeSwitchTab } from '@/utils/navigation'

const userStore = useUserStore()
const goingToProfile = ref(false)
const leavingToHome = ref(false)

const goHome = () => {
  leavingToHome.value = true
  safeSwitchTab('/pages/home/home')
}

const markCancelledAndGoHome = () => {
  if (!goingToProfile.value && !leavingToHome.value) {
    userStore.cancelProfile()
    goHome()
  }
}

const goToProfileForm = () => {
  const url = userStore.role === 'mentor'
    ? '/pages/mentor-data/mentor-data'
    : '/pages/family-data/family-data'

  goingToProfile.value = true
  uni.navigateTo({
    url
  })
}

onBackPress(() => {
  markCancelledAndGoHome()
  return true
})

onUnload(() => {
  if (!goingToProfile.value && !leavingToHome.value) {
    userStore.cancelProfile()
  }
})
</script>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.title,
.subtitle {
  display: block;
  text-align: center;
}

.action-btn {
  margin-top: 12rpx;
}
</style>
