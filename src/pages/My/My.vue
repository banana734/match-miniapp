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

    <!-- 开发调试区块：仅开发态（非生产包）可见，正式上线不会包含 -->
    <view v-if="isDev" class="card card-gap-20 card-mb-20 dev-card">
      <text class="section-title section-title-sm">开发调试</text>
      <view class="reset-link" @tap="openSwitchModal">切换测试账号（开发调试）</view>
      <view class="reset-link" @tap="goToDevData">查看双方用户数据（开发调试）</view>
      <view class="reset-link" @tap="resetDevIdentity">重置开发身份（开发调试）</view>
    </view>

    <!-- 切换测试账号的弹层：列出两端已有的测试账号，点哪个就以哪个身份进入 -->
    <view v-if="showSwitchModal" class="modal-mask" @tap="closeSwitchModal">
      <view class="modal" @tap.stop>
        <view class="modal-head">
          <text class="modal-title">切换测试账号（开发调试）</text>
          <text class="modal-close" @tap="closeSwitchModal">✕</text>
        </view>
        <scroll-view scroll-y class="modal-list">
          <!-- 友导师分组 -->
          <view class="switch-group">
            <text class="group-title">友导师（{{ mentorItems.length }}）</text>
            <view
              v-for="(item, idx) in mentorItems"
              :key="item.openid + '-' + idx"
              class="switch-item"
              @tap="switchToAccount(item)"
            >
              <view class="switch-main">
                <text class="switch-name">{{ item.name }}</text>
                <text class="switch-sub">{{ item.sub }}</text>
              </view>
              <view class="switch-meta">
                <text class="switch-role role-mentor">友导师</text>
                <text class="switch-id">{{ item.shortId }}</text>
              </view>
            </view>
            <view v-if="mentorItems.length === 0" class="empty">暂无友导师账号</view>
          </view>

          <!-- 家庭分组 -->
          <view class="switch-group">
            <text class="group-title">家庭（{{ familyItems.length }}）</text>
            <view
              v-for="(item, idx) in familyItems"
              :key="item.openid + '-' + idx"
              class="switch-item"
              @tap="switchToAccount(item)"
            >
              <view class="switch-main">
                <text class="switch-name">{{ item.name }}</text>
                <text class="switch-sub">{{ item.sub }}</text>
              </view>
              <view class="switch-meta">
                <text class="switch-role role-family">家庭</text>
                <text class="switch-id">{{ item.shortId }}</text>
              </view>
            </view>
            <view v-if="familyItems.length === 0" class="empty">暂无家庭账号</view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
// 导入 vue 计算属性 / ref API
import { ref, computed } from 'vue'
// 引入 uni-app 生命周期钩子（onShow 用于每次进入页面时检查登录态）
import { onShow } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
// 引入后端接口基地址常量
import { API_BASE_URL } from '@/utils/api'

// 是否开发态：生产包（NODE_ENV=production）下为 false，入口与逻辑都会被摇树剔除
const isDev = process.env.NODE_ENV !== 'production'

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

// 开发调试：一键重置登录态与本地缓存，回到全新账号，重新走完整流程。
const resetDevIdentity = () => {
  uni.showModal({
    title: '重置开发身份',
    content: '这会清除当前登录态并生成一个全新账号，确定吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (!res.confirm) {
        return
      }

      userStore.resetLoginState()
      uni.showToast({
        title: '已重置，请重新登录',
        icon: 'success',
        complete: () => {
          uni.reLaunch({ url: '/pages/login/login' })
        }
      })
    }
  })
}

// 跳转到开发调试用的「双方用户数据」页面，查看数据库里友导师/家庭两端的用户资料
const goToDevData = () => {
  uni.navigateTo({
    url: '/pages/dev-data/dev-data'
  })
}

// ===== 切换测试账号（开发调试） =====
// 弹层是否显示
const showSwitchModal = ref(false)
// 两端账号分开存，弹层里按「友导师 / 家庭」两组展示
const mentorItems = ref([])
const familyItems = ref([])

// openid 太长，弹层里只显示末尾 6 位
const shortId = (openid) => {
  return openid ? '…' + String(openid).slice(-6) : ''
}

// 拉一个列表接口，统一返回 list 数组（失败返回空数组）
const fetchList = (url) => {
  return new Promise((resolve) => {
    uni.request({
      url,
      method: 'GET',
      success: (res) => {
        const data = res.data || {}
        resolve(data.list || [])
      },
      fail: () => {
        resolve([])
      }
    })
  })
}

// 把两端账号整理成弹层要展示的两组列表
const buildSwitchList = async () => {
  // API_BASE_URL 已含 /api，这里直接拼 /admin/xxx
  const [mentors, families] = await Promise.all([
    fetchList(`${API_BASE_URL}/admin/mentors`),
    fetchList(`${API_BASE_URL}/admin/families`)
  ])

  mentorItems.value = mentors.map((it) => ({
    openid: it.openid,
    role: 'mentor',
    name: it.name || '未命名导师',
    sub: [it.school, it.major].filter(Boolean).join(' · '),
    shortId: shortId(it.openid)
  }))

  familyItems.value = families.map((it) => ({
    openid: it.openid,
    role: 'family',
    name: it.child_name || '未命名家庭',
    sub: [it.parent_name, it.grade_text].filter(Boolean).join(' · '),
    shortId: shortId(it.openid)
  }))
}

// 打开弹层：先拉取账号列表
const openSwitchModal = async () => {
  showSwitchModal.value = true
  mentorItems.value = []
  familyItems.value = []
  await buildSwitchList()
}

// 关闭弹层
const closeSwitchModal = () => {
  showSwitchModal.value = false
}

// 选中某个账号：直接以该账号身份进入（不改后端，仅切换本地身份）
const switchToAccount = (item) => {
  const targetOpenid = item.openid
  const targetRole = item.role

  // devClientId 就是 openid 去掉 dev-openid- 前缀；
  // 同步写回，保证之后重新登录也落回同一账号
  const prefix = 'dev-openid-'
  const targetClientId = targetOpenid.startsWith(prefix)
    ? targetOpenid.slice(prefix.length)
    : targetOpenid
  uni.setStorageSync('match-dev-client-id', targetClientId)

  // 直接以目标账号身份进入：token 只用于维持 isLoggedIn，
  // 后端按 openid 区分身份，后续请求都会带上新的 openid
  userStore.setLoginInfo({
    token: 'dev-switch-token',
    openid: targetOpenid,
    boundRole: targetRole
  })

  // 同步目标账号的资料状态：后端有资料就回填并标记完成，
  // 没有就清空本地残留（否则表单里还会显示上一个人填的内容）
  uni.request({
    url: `${API_BASE_URL}/profile/detail?openid=${encodeURIComponent(targetOpenid)}&role=${targetRole}`,
    method: 'GET',
    success: (res) => {
      if (res.data?.success && res.data?.found && res.data?.profile) {
        userStore.updateProfile(res.data.profile)
        userStore.completeProfile()
      } else {
        userStore.clearProfile()
      }
    }
  })

  closeSwitchModal()
  uni.showToast({
    title: '已切换：' + (targetRole === 'mentor' ? '友导师' : '家庭'),
    icon: 'none',
    complete: () => {
      // 延后一帧再跳转，避开和页面生命周期的竞态
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/home/home' })
      }, 60)
    }
  })
}

// 每次进入「我的」页时检查登录态与身份：
// 未登录跳登录页；已登录但还没选身份跳身份选择页（不能进“我的”更不能填资料）
onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    // 延后一帧再跳转，避开和页面加载/切换生命周期的竞态，避免 reLaunch:fail timeout
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/login' })
    }, 60)
    return
  }

  if (!userStore.boundRole) {
    uni.showToast({ title: '请先选择身份', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/role-first/role-first' })
    }, 60)
  }
})
</script>

<style scoped>
.reset-link {
  /* 开发调试用的小字入口，方便一键切换/重置开发身份 */
  margin-top: 24rpx;
  text-align: center;
  font-size: 24rpx;
  color: #999999;
}

.dev-card .section-title-sm {
  /* 开发调试区块标题，和上方区分开 */
  margin-bottom: 8rpx;
}

/* 切换账号弹层 */
.modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.modal {
  width: 100%;
  max-height: 70vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2329;
}

.modal-close {
  font-size: 32rpx;
  color: #9aa0a6;
  padding: 0 12rpx;
}

.modal-list {
  /* 小程序 scroll-view 必须有固定高度才能滚动，用 flex/max-height 撑不出高度会被直接剪断 */
  height: 56vh;
  padding: 4rpx 0 32rpx;
}

/* 分组：横向内边距放在组上，避免 scroll-view 自身 padding 在真机上表现不一致 */
.switch-group {
  padding: 0 32rpx;
}

.group-title {
  display: block;
  font-size: 24rpx;
  color: #9aa0a6;
  padding: 20rpx 0 4rpx;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.switch-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.switch-name {
  font-size: 28rpx;
  color: #1f2329;
  font-weight: 500;
  /* 超长省略，防止把右侧身份标签挤出屏幕 */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.switch-sub {
  font-size: 22rpx;
  color: #86909c;
  margin-top: 4rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.switch-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  margin-left: 20rpx;
}

.switch-role {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
}

.role-mentor {
  color: #2f80ed;
  background: #eaf2fe;
}

.role-family {
  color: #f2994a;
  background: #fef3e8;
}

.switch-id {
  font-size: 20rpx;
  color: #c0c4cc;
  margin-top: 6rpx;
}

.empty {
  font-size: 26rpx;
  color: #9aa0a6;
  text-align: center;
  padding: 40rpx 0;
}
</style>
