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
// 导入 vue 计算属性 API
import { computed } from 'vue'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'

// 获取全局仓库实例
const userStore = useUserStore()
// 身份文案映射：角色值 → 页面展示名称
const roleLabelMap = {
  mentor: '友导师',
  family: '家庭'
}

// 当前身份文案：优先展示后端绑定的身份，其次本地缓存，都没有则显示“未选择”
const roleText = computed(() => {
  return roleLabelMap[userStore.boundRole || userStore.role] || '未选择'
})

// 微信账号展示：直接显示 openid（未登录时给出占位文案）
const accountText = computed(() => {
  return userStore.openid || '当前未登录'
})

// 资料填写状态文案
const profileStatusText = computed(() => {
  return userStore.profileCompleted ? '已填写完成' : '未填写完成'
})

// 跳转到对应身份的资料页，携带 mode=edit 表示进入“修改资料”模式
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
