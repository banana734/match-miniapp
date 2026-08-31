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
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
// 引入后端接口基地址常量
import { API_BASE_URL } from '@/utils/api'

// 获取全局仓库实例
const userStore = useUserStore()
// 防抖标记：避免短时间内重复点击两张身份卡导致重复请求
let choosing = false

// 选择参与身份（mentor 友导师 / family 家庭）并提交后端绑定
const chooseRole = (role) => {
  // 防抖：上一次请求尚未结束
  if (choosing) {
    return
  }

  // 后端已有绑定身份时，不允许切换成另一种身份（身份一经绑定不可改）
  if (userStore.boundRole && userStore.boundRole !== role) {
    uni.showToast({
      title: '当前微信账号已绑定其他身份',
      icon: 'none'
    })
    return
  }

  choosing = true

  // 调用后端绑定接口，把 openid 和所选身份落库
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

      // 绑定成功：写入仓库并进入首页
      userStore.setBoundRole(res.data.boundRole || role)
      uni.switchTab({ url: '/pages/home/home' })
    },
    fail: () => {
      uni.showToast({
        title: '后端未连接',
        icon: 'none'
      })
    },
    complete: () => {
      // 请求结束后延时释放防抖锁，避免 success 跳转期间被再次触发
      setTimeout(() => {
        choosing = false
      }, 500)
    }
  })
}
</script>
