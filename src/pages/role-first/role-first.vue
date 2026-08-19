<template>
  <view class="container">
    <view class="card hero-card">
      <text class="title">项目参与身份</text>
      <text class="subtitle">先选择身份哦~</text>
    </view>

    <view class="role-list">
      <view class="card role-card mentor-card" hover-class="role-card-hover" hover-stay-time="120" @tap="chooseRole('mentor')">
        <text class="role-badge mentor">友导师</text>
        <text class="section-title">我是友导师</text>
        <text class="role-desc">后续可以进入家庭匹配池，选择适合长期跟进的家庭。</text>
      </view>

      <view class="card role-card family-card" hover-class="role-card-hover" hover-stay-time="120" @tap="chooseRole('family')">
        <text class="role-badge family">家庭</text>
        <text class="section-title">我是家庭</text>
        <text class="role-desc">后续可以进入友导师匹配池，选择合适的友导师。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/store/user'
import { API_BASE_URL } from '@/utils/api'
import { safeSwitchTab } from '@/utils/navigation'

const userStore = useUserStore()
let choosing = false

const chooseRole = (role) => {
  if (choosing) {
    return
  }

  if (userStore.boundRole && userStore.boundRole !== role) {
    uni.showToast({
      title: '当前微信账号已绑定其他身份',
      icon: 'none'
    })
    return
  }

  choosing = true

  uni.request({
    url: `${API_BASE_URL}/profile/bind-role`,
    method: 'POST',
    data: {
      openid: userStore.openid,
      role
    },
    success: (res) => {
      if (!res.data?.success) {
        uni.showToast({
          title: res.data?.message || '身份绑定失败',
          icon: 'none'
        })
        return
      }

      userStore.setBoundRole(res.data.boundRole || role)
      safeSwitchTab('/pages/home/home')
    },
    fail: () => {
      uni.showToast({
        title: '后端未连接',
        icon: 'none'
      })
    },
    complete: () => {
      setTimeout(() => {
        choosing = false
      }, 500)
    }
  })
}
</script>
