<template>
  <view class="container">
    <view class="card hero-card">
      <text class="title">我的</text>
      <text class="subtitle">当前登录信息和资料入口都放在这里。</text>
    </view>

    <view class="card info-card">
      <text class="section-title">当前身份</text>
      <text class="content">{{ roleText }}</text>

      <text class="section-title">微信账号</text>
      <text class="content account-text">{{ accountText }}</text>

      <text class="section-title">资料状态</text>
      <text class="content">{{ profileStatusText }}</text>
    </view>

    <view class="card action-card">
      <view class="primary-btn action-btn" @tap="goToProfileForm">查看和修改已填写资料</view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const roleText = computed(() => {
  if (userStore.boundRole === 'mentor' || userStore.role === 'mentor') {
    return '友导师'
  }

  if (userStore.boundRole === 'family' || userStore.role === 'family') {
    return '家庭'
  }

  return '未选择'
})

const accountText = computed(() => {
  return userStore.openid || '当前未登录'
})

const profileStatusText = computed(() => {
  return userStore.profileCompleted ? '已填写完成' : '未填写完成'
})

const goToProfileForm = () => {
  const currentRole = userStore.boundRole || userStore.role
  const url = currentRole === 'mentor'
    ? '/pages/mentor-data/mentor-data?mode=edit'
    : '/pages/family-data/family-data?mode=edit'

  uni.navigateTo({
    url
  })
}
</script>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.hero-card,
.info-card,
.action-card {
  margin-bottom: 20rpx;
}

.title {
  display: block;
  text-align: center;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
}

.subtitle,
.content {
  display: block;
}

.account-text {
  word-break: break-all;
}

.action-btn {
  margin-top: 12rpx;
}
</style>
