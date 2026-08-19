<template>
  <view class="container">
    <view class="card card-gap-20 card-mb-20">
      <text class="title">我的</text>
      <text class="subtitle">当前登录信息和资料入口都放在这里。</text>
    </view>

    <view class="card card-gap-20 card-mb-20">
      <text class="section-title section-title-sm">当前身份</text>
      <text class="content text-block">{{ roleText }}</text>

      <text class="section-title section-title-sm">微信账号</text>
      <text class="content text-block break-all">{{ accountText }}</text>

      <text class="section-title section-title-sm">资料状态</text>
      <text class="content text-block">{{ profileStatusText }}</text>
      <view class="primary-btn action-top" @tap="goToProfileForm">查看或修改已填写资料</view>
    </view>

   
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const roleLabelMap = {
  mentor: '友导师',
  family: '家庭'
}

const roleText = computed(() => {
  return roleLabelMap[userStore.boundRole || userStore.role] || '未选择'
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
