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
const PROFILE_API_BASE_URL = API_BASE_URL
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
    url: `${PROFILE_API_BASE_URL}/profile/bind-role`,
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
      userStore.setRole(res.data.boundRole || role)
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

<style scoped lang="scss">
.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  background: #f7f9fc;
  border: 2rpx solid #e7ebf3;
}

.title {
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2937;
}

.subtitle {
  text-align: center;
  font-size: 26rpx;
  line-height: 1.7;
  color: #6b7280;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
  padding: 36rpx 28rpx;
  border-radius: 28rpx;
  border: 2rpx solid transparent;
  box-shadow: 0 14rpx 30rpx rgba(31, 41, 55, 0.08);
}

.role-card-hover {
  transform: scale(0.98);
  opacity: 0.92;
}

.mentor-card {
  background: linear-gradient(180deg, #f7fbff 0%, #edf5ff 100%);
  border-color: #bfd7ff;
}

.family-card {
  background: linear-gradient(180deg, #f7fff9 0%, #edf9f0 100%);
  border-color: #bde6ca;
}

.role-badge {
  width: fit-content;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}

.role-desc {
  text-align: center;
  font-size: 26rpx;
  line-height: 1.7;
  color: #4b5563;
}

.mentor {
  background: #dcecff;
  color: #2d6cdf;
}

.family {
  background: #dff5e6;
  color: #208a54;
}
</style>
