<template>
  <view class="container">
    <view class="card login-card">
      <!-- 页面主标题 -->
      <text class="title">微信授权登录</text>
      <!-- 页面提示副标题 -->
      <text class="subtitle">先完成微信登录，再进入身份选择和后续匹配流程。</text>

      <!-- 登录说明面板 -->
      <view class="login-tip-panel">
        <text class="tip-title">当前阶段说明</text>
        <text class="tip-text">现在会优先走真实微信登录；如果后端还没配置微信密钥，系统会临时回退到开发登录。</text>
      </view>

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
// 后端登录接口基础地址
const AUTH_API_BASE_URL = API_BASE_URL
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

  if (userStore.boundRole || userStore.role) {
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
        url: `${AUTH_API_BASE_URL}/auth/wechat`,
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
            if (userStore.boundRole || userStore.role) {
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

<style scoped lang="scss">
/* 登录卡片整体布局 */
.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

/* 页面主标题样式 */
.title {
  display: block;
  text-align: center;
}

/* 页面副标题样式 */
.subtitle {
  display: block;
  text-align: center;
  line-height: 1.7;
}

/* 登录说明面板 */
.login-tip-panel {
  width: 100%;
  padding: 24rpx;
  border-radius: 20rpx;
  background: #f7f9fc;
  border: 2rpx solid #e7ebf3;
  box-sizing: border-box;
}

/* 面板标题 */
.tip-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
}

/* 面板说明文字 */
.tip-text {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #4b5563;
}

/* 登录按钮样式 */
.login-btn {
  width: 100%;
  margin-top: 8rpx;
}
</style>
