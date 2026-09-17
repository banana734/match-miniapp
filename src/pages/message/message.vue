<template>
  <view class="container">
    <view class="page-bg">
      <image class="page-bg-img" src="/static/home-bg.jpg" mode="aspectFill" />
    </view>

    <view v-if="userStore.profileCompleted" class="card card-gap-20 card-mb-18 section-panel">
      <view class="summary-top">
        <text class="section-title section-title-sm">待试课</text>
        <text class="count-badge">{{ trialLessonCount }}</text>
      </view>

      <view v-if="trialLessonCount === 0" class="section-empty">
        <text class="empty-title text-block">还没有待试课</text>
      </view>

      <view v-else class="trial-list">
        <view v-for="(item, cardIndex) in trialLessonList" :key="item.id" class="match-card">
        <view class="match-top">
          <view class="match-top-left">
            <view class="card-index">{{ cardIndex + 1 }}</view>
            <view class="match-heading">
              <text class="match-name">{{ item.title }}</text>
              <text class="match-subtitle">{{ item.subtitle }}</text>
            </view>
          </view>
          <view class="match-top-right">
            <text class="match-badge match-badge-danger">待试课</text>
            <view class="popup-close remove-btn" @tap="removeTrialCard(item.id)">移除</view>
          </view>
        </view>

        <view class="match-info">
          <view v-for="(row, rowIndex) in pairLines(item.preview)" :key="`${item.id}-row-${rowIndex}`" class="info-row">
            <view v-for="line in row" :key="line.label" class="line-block">
              <text class="line-label">{{ line.label }}</text>

              <view v-if="line.kind === 'single'" class="capsule-row">
                <text class="capsule capsule-single">{{ line.value }}</text>
              </view>

              <view v-else-if="line.kind === 'multi'" class="capsule-row">
                <text
                  v-for="(choice, index) in previewList(line.items)"
                  :key="`${line.label}-${index}`"
                  class="capsule capsule-multi"
                >
                  {{ choice }}
                </text>
              </view>

              <view v-else-if="line.kind === 'sort'" class="capsule-row capsule-column">
                <view
                  v-for="(choice, index) in previewList(line.items, 2)"
                  :key="`${line.label}-${index}`"
                  class="capsule capsule-sort"
                >
                  <text v-if="choice !== '...'" class="sort-index">{{ index + 1 }}</text>
                  <text class="sort-text">{{ choice }}</text>
                </view>
              </view>

              <text v-else class="field-text">{{ line.value }}</text>
            </view>
          </view>
        </view>

        <view class="match-actions">
          <view class="action-btn primary" @tap="openDetail(item)">查看详细</view>
          <view class="action-btn secondary" @tap="goToTrialFeedback(item)">试课反馈</view>
        </view>
      </view>
    </view>
    </view>

    <!-- 待对方反馈：我已提交试课反馈「愿意」，等对方提交。
         双方都愿意才会转进下面的「正式上课」，所以这个框只在有卡片时才出现 -->
    <view v-if="userStore.profileCompleted && waitingCount > 0" class="card card-gap-20 card-mb-18 section-panel">
      <view class="summary-top">
        <text class="section-title section-title-sm">待对方反馈</text>
        <text class="count-badge">{{ waitingCount }}</text>
      </view>

      <view class="trial-list">
        <view v-for="(item, cardIndex) in waitingList" :key="`waiting-${item.id}`" class="match-card">
        <view class="match-top">
          <view class="match-top-left">
            <view class="card-index">{{ cardIndex + 1 }}</view>
            <view class="match-heading">
              <text class="match-name">{{ item.title }}</text>
              <text class="match-subtitle">{{ item.subtitle }}</text>
            </view>
          </view>
          <view class="match-top-right">
            <text class="match-badge waiting-badge">待对方反馈</text>
            <view class="popup-close remove-btn" @tap="removeTrialCard(item.id)">移除</view>
          </view>
        </view>

        <view class="match-info">
          <view v-for="(row, rowIndex) in pairLines(item.preview)" :key="`waiting-${item.id}-row-${rowIndex}`" class="info-row">
            <view v-for="line in row" :key="line.label" class="line-block">
              <text class="line-label">{{ line.label }}</text>

              <view v-if="line.kind === 'single'" class="capsule-row">
                <text class="capsule capsule-single">{{ line.value }}</text>
              </view>

              <view v-else-if="line.kind === 'multi'" class="capsule-row">
                <text
                  v-for="(choice, index) in previewList(line.items)"
                  :key="`${line.label}-waiting-${index}`"
                  class="capsule capsule-multi"
                >
                  {{ choice }}
                </text>
              </view>

              <view v-else-if="line.kind === 'sort'" class="capsule-row capsule-column">
                <view
                  v-for="(choice, index) in previewList(line.items, 2)"
                  :key="`${line.label}-waiting-${index}`"
                  class="capsule capsule-sort"
                >
                  <text v-if="choice !== '...'" class="sort-index">{{ index + 1 }}</text>
                  <text class="sort-text">{{ choice }}</text>
                </view>
              </view>

              <text v-else class="field-text">{{ line.value }}</text>
            </view>
          </view>
        </view>

        <!-- 等对方反馈期间不能再提交试课反馈，只剩查看详情 -->
        <view class="match-actions">
          <view class="action-btn primary" @tap="openDetail(item)">查看详细</view>
        </view>
      </view>
    </view>
    </view>

    <view v-if="userStore.profileCompleted" class="card card-gap-20 card-mb-18 section-panel">
      <view class="summary-top">
        <text class="section-title section-title-sm">正式上课</text>
        <text class="count-badge">{{ formalClassCount }}</text>
      </view>

      <view v-if="formalClassCount === 0" class="section-empty">
        <text class="empty-title text-block">还没有正式上课</text>
      </view>

      <view v-else class="trial-list">
        <view v-for="(item, cardIndex) in formalClassList" :key="`formal-${item.id}`" class="match-card">
        <view class="match-top">
          <view class="match-top-left">
            <view class="card-index">{{ cardIndex + 1 }}</view>
            <view class="match-heading">
              <text class="match-name">{{ item.title }}</text>
              <text class="match-subtitle">{{ item.subtitle }}</text>
            </view>
          </view>
          <view class="match-top-right">
            <text class="match-badge formal-badge">正式上课</text>
          </view>
        </view>

        <view class="match-info">
          <view v-for="(row, rowIndex) in pairLines(item.preview)" :key="`formal-${item.id}-row-${rowIndex}`" class="info-row">
            <view v-for="line in row" :key="line.label" class="line-block">
              <text class="line-label">{{ line.label }}</text>

              <view v-if="line.kind === 'single'" class="capsule-row">
                <text class="capsule capsule-single">{{ line.value }}</text>
              </view>

              <view v-else-if="line.kind === 'multi'" class="capsule-row">
                <text
                  v-for="(choice, index) in previewList(line.items)"
                  :key="`${line.label}-formal-${index}`"
                  class="capsule capsule-multi"
                >
                  {{ choice }}
                </text>
              </view>

              <view v-else-if="line.kind === 'sort'" class="capsule-row capsule-column">
                <view
                  v-for="(choice, index) in previewList(line.items, 2)"
                  :key="`${line.label}-formal-${index}`"
                  class="capsule capsule-sort"
                >
                  <text v-if="choice !== '...'" class="sort-index">{{ index + 1 }}</text>
                  <text class="sort-text">{{ choice }}</text>
                </view>
              </view>

              <text v-else class="field-text">{{ line.value }}</text>
            </view>
          </view>
        </view>

        <view class="match-actions">
          <view class="action-btn primary" @tap="openDetail(item)">查看详细</view>
          <view class="action-btn secondary" @tap="goToDailyFeedback(item)">日常反馈</view>
        </view>
      </view>
    </view>
    </view>

    <view v-if="showDetailPopup && activeItem" class="popup-mask" @tap="closeDetail">
      <view class="popup-panel detail-panel" @tap.stop>
        <view class="popup-header">
          <view class="popup-header-left">
            <text class="popup-title">{{ activeItem.title }}</text>
            <text class="popup-subtitle">{{ activeItem.subtitle }}</text>
          </view>
          <text class="popup-close" @tap="closeDetail">关闭</text>
        </view>

        <view class="popup-content">
          <view v-for="line in activeItem.details" :key="line.label" class="line-block detail-block">
            <text class="line-label">{{ line.label }}</text>

            <view v-if="line.kind === 'single'" class="capsule-row">
              <text class="capsule capsule-single">{{ line.value }}</text>
            </view>

            <view v-else-if="line.kind === 'multi'" class="capsule-row">
              <text
                v-for="(choice, index) in line.items"
                :key="`${line.label}-detail-${index}`"
                class="capsule capsule-multi"
              >
                {{ choice }}
              </text>
            </view>

            <view v-else-if="line.kind === 'sort'" class="capsule-row capsule-column">
              <view
                v-for="(choice, index) in line.items"
                :key="`${line.label}-detail-${index}`"
                class="capsule capsule-sort"
              >
                <text class="sort-index">{{ index + 1 }}</text>
                <text class="sort-text">{{ choice }}</text>
              </view>
            </view>

            <text v-else class="field-text">{{ line.value }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
// 导入 vue 核心 API（computed 计算属性、ref 响应式引用）
import { computed, ref } from 'vue'
// uni-app 页面生命周期钩子（页面每次显示时触发）
import { onShow } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
// 引入后端接口基地址常量
import { API_BASE_URL } from '@/utils/api'
// 引入共用展示工具（previewList / pairLines 为纯展示函数；goHome 已移回本页本地定义）
import { previewList, pairLines } from '@/utils/display'

// 获取全局仓库实例
const userStore = useUserStore()
// 详情弹层是否显示
const showDetailPopup = ref(false)
// 当前正在查看详情的卡片对象
const activeItem = ref(null)

// 返回首页（资料填写被放弃等场景）：本页本地定义，直白不绕弯
const goHome = () => {
  uni.switchTab({ url: '/pages/home/home' })
}

// 待试课列表与数量（直接读取全局仓库，由本页 loadTrialList 拉取后写入）。
// 后端返回的 pending 卡片带 iSubmitted 标记：true = 我已经填过试课反馈、在等对方，
// 这类卡不放进「待试课」，而是放进下面的「待对方反馈」。
const trialLessonList = computed(() => userStore.pendingTrialCards.filter((item) => !item.iSubmitted))
const trialLessonCount = computed(() => trialLessonList.value.length)
// 待对方反馈列表与数量：我已提交反馈、等对方提交；双方都交了卡片才会正式变动
const waitingList = computed(() => userStore.pendingTrialCards.filter((item) => item.iSubmitted))
const waitingCount = computed(() => waitingList.value.length)
// 正式上课列表与数量
const formalClassList = computed(() => userStore.formalClassCards)
const formalClassCount = computed(() => formalClassList.value.length)

// 打开卡片详情弹层
const openDetail = (item) => {
  activeItem.value = item
  showDetailPopup.value = true
}

// 关闭详情弹层并清空当前卡片
const closeDetail = () => {
  showDetailPopup.value = false
  activeItem.value = null
}

// 把一张卡片移出待试课列表（调用后端 /trial/remove）
const removeTrialCard = (cardId) => {
  uni.request({
    url: `${API_BASE_URL}/trial/remove`,
    method: 'POST',
    data: {
      openid: userStore.openid,
      role: userStore.currentRole,
      cardId
    },
    success: (res) => {
      if (!res.data?.success) {
        uni.showToast({
          title: res.data?.message || '移除失败',
          icon: 'none'
        })
        return
      }

      // 如果被移除的卡片正开着详情弹层，顺手关掉
      if (activeItem.value?.id === cardId) {
        closeDetail()
      }

      // 新版后端返回完整列表（pending / formal），全量刷新仓库
      if (Array.isArray(res.data?.pending) || Array.isArray(res.data?.formal)) {
        userStore.setTrialLists(res.data?.pending || [], res.data?.formal || [])
      } else {
        // 旧版后端无列表返回，走本地移除
        userStore.removePendingTrialCard(cardId)
      }

      uni.showToast({
        title: '已移出待试课',
        icon: 'none'
      })
    },
    fail: () => {
      uni.showToast({
        title: '后端未连接',
        icon: 'none'
      })
    }
  })
}

// 跳转到试课反馈页，携带卡片 id 和名称（导师/家庭反馈页共用此入口）
const goToTrialFeedback = (item) => {
  const pagePath = userStore.role === 'mentor'
    ? '/pages/mentor-feedback/mentor-feedback'
    : '/pages/family-feedback/family-feedback'

  uni.navigateTo({
    url: `${pagePath}?id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.title)}`
  })
}

// 跳转到日常反馈页，携带卡片 id 和名称（导师/家庭日常反馈页共用此入口）
const goToDailyFeedback = (item) => {
  const pagePath = userStore.role === 'mentor'
    ? '/pages/daily-feedback/mentor-daily-feedback'
    : '/pages/daily-feedback/family-daily-feedback'

  uni.navigateTo({
    url: `${pagePath}?id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.title)}`
  })
}

// 拉取当前用户的待试课 / 正式上课列表，写入全局仓库
const loadTrialList = () => {
  const currentRole = userStore.currentRole

  uni.request({
    url: `${API_BASE_URL}/trial/list?openid=${encodeURIComponent(userStore.openid)}&role=${currentRole}`,
    method: 'GET',
    success: (res) => {
      userStore.setTrialLists(res.data?.pending || [], res.data?.formal || [])
    },
    fail: () => {
      uni.showToast({
        title: '后端未连接',
        icon: 'none'
      })
    }
  })
}

// 页面每次显示时的进入守卫：
// 1. 资料已填好 → 刷新试课列表并标记“已看过待试课”（用于 tab 红点等状态）；
// 2. 用户刚放弃填写 → 消费掉“放弃”标记并送回首页；
// 3. 其他情况（资料未填）→ 跳去提示页要求先填资料。
onShow(() => {
  // 未登录时拦截：提示并跳转到登录页，已登录才继续走下面的逻辑
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    // 延后一帧再跳转，避开和页面加载/切换生命周期的竞态，避免 reLaunch:fail timeout
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/login' })
    }, 60)
    return
  }

  // 已登录但还没选身份：跳身份选择页，必须选完身份才能使用联系功能
  if (!userStore.boundRole) {
    uni.showToast({ title: '请先选择身份', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/role-first/role-first' })
    }, 60)
    return
  }

  if (userStore.profileCompleted) {
    loadTrialList()
    userStore.markMessageViewed()
    return
  }

  if (userStore.consumeProfileCancelled()) {
    goHome()
    return
  }

  // 资料未填：跳到提示页要求先填资料。
  // 用 setTimeout 延后一帧，避开 onShow 与 tab 切换的竞态（否则偶发 navigateTo:fail timeout）
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/notice/notice'
    })
  }, 60)
})
</script>

<style scoped>
/* 分区底卡：待试课 / 正式上课 的容器，覆盖 .card 的白底，让里面的白卡片有层次。
   用 rgba 做半透明（约 80% 不透明），让全屏背景图能透出来一点 */
.card.section-panel {
  background: rgba(233, 238, 247, 0.8);
  border: 2rpx solid #cdd8e8;
}

/* 底卡内空状态：居中显示 */
.section-empty {
  padding: 20rpx 0 8rpx;
  text-align: center;
}

/* 「待对方反馈」徽章：琥珀色，跟待试课的红、正式上课的绿区分开 */
.waiting-badge {
  background: #fff4e8;
  color: #d97706;
}
</style>
