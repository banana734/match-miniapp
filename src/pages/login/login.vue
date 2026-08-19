<template>
  <view class="container">
    <view class="card card-gap-24 align-center">
      <!-- 页面主标题 -->
      <text class="title">微信授权登录</text>
      <!-- 页面提示副标题 -->
      <text class="subtitle subtitle-relaxed">先完成微信登录，再进入身份选择和后续匹配流程。</text>

      

      <!-- 微信登录按钮 -->
      <view class="primary-btn login-btn" @tap="handleWechatLogin">
        {{ loading ? '登录中...' : '微信授权登录' }}
      </view>
    </view>
  </view>
</template>

<script setup>
// 导入 vue 核心 API
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
import { API_BASE_URL } from '@/utils/api'
import { safeSwitchTab } from '@/utils/navigation'

// 获取全局仓库实例
const userStore = useUserStore()
// 登录按钮加载状态
const loading = ref(false)
// 防止页面重复触发自动跳转
const redirecting = ref(false)

const getDevClientId = () => {
  const savedId = uni.getStorageSync('match-dev-client-id')

  if (savedId) {
    return savedId
  }

  const newId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  uni.setStorageSync('match-dev-client-id', newId)
  return newId
}

// 跳转到身份选择页
const goToRoleFirst = () => {
  if (redirecting.value) {
    return
  }

  redirecting.value = true
  uni.reLaunch({
    url: '/pages/role-first/role-first',
    complete: () => {
      setTimeout(() => {
        redirecting.value = false
      }, 300)
    }
  })
}

// 已经选过身份的用户，直接进入首页。
const goToHome = () => {
  if (redirecting.value) {
    return
  }

  redirecting.value = true
  safeSwitchTab('/pages/home/home')

  setTimeout(() => {
    redirecting.value = false
  }, 500)
}

// 根据本地保存的登录和身份状态恢复启动位置。
const restoreEntry = () => {
  if (!userStore.isLoggedIn || !userStore.openid) {
    return
  }

  // 这里只认后端已经绑定过的身份，不再使用本地旧 role 缓存兜底，
  // 否则数据库已删除绑定时，页面还是会被错误地带回首页。
  if (userStore.boundRole) {
    goToHome()
    return
  }

  goToRoleFirst()
}

// 每次打开登录页时，先检查本地是否已经登录过。
onShow(() => {
  restoreEntry()
})

// 微信授权登录按钮点击事件
const handleWechatLogin = () => {
  if (loading.value) {
    return
  }

  loading.value = true

  uni.login({
    provider: 'weixin',
    success: (loginRes) => {
      uni.request({
        url: `${API_BASE_URL}/auth/wechat`,
        method: 'POST',
        data: {
          code: loginRes.code,
          devClientId: getDevClientId()
        },
        success: (res) => {
          const result = res.data || {}

          if (!result.success) {
            uni.showToast({
              title: result.message || '登录失败',
              icon: 'none'
            })
            return
          }

          userStore.setLoginInfo({
            token: result.token,
            openid: result.openid,
            boundRole: result.boundRole
          })

          uni.showToast({
            title: result.loginMode === 'wechat' ? '微信登录成功' : '开发登录成功',
            icon: 'success'
          })

          setTimeout(() => {
            if (userStore.boundRole) {
              goToHome()
              return
            }

            goToRoleFirst()
          }, 400)
        },
        fail: () => {
          uni.showToast({
            title: '后端未连接',
            icon: 'none'
          })
        },
        complete: () => {
          loading.value = false
        }
      })
    },
    fail: () => {
      loading.value = false
      uni.showToast({
        title: '微信登录失败',
        icon: 'none'
      })
    }
  })
}
</script>
