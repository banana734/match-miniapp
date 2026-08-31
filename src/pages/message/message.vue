<template>
  <view class="container">
   

    <view v-if="userStore.profileCompleted" class="card card-gap-20 card-mb-18 summary-card">
      <view class="summary-top">
        <text class="section-title section-title-sm">待试课</text>
        <text class="count-badge">{{ trialLessonCount }}</text>
      </view>
      <text class="summary-text">当前待试课卡片数量：{{ trialLessonCount }}</text>
    </view>

    <view v-if="userStore.profileCompleted && trialLessonCount === 0" class="card card-gap-20 card-mb-18 empty-card">
      <text class="empty-title text-block">还没有待试课</text>
     
    </view>

    <view v-if="userStore.profileCompleted && trialLessonCount > 0" class="trial-list">
      <view v-for="item in trialLessonList" :key="item.id" class="match-card">
        <view class="match-top">
          <view class="match-top-left">
            <text class="match-name">{{ item.title }}</text>
            <text class="match-subtitle">{{ item.subtitle }}</text>
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

    <view v-if="userStore.profileCompleted" class="card card-gap-20 card-mb-18 summary-card formal-summary-card">
      <view class="summary-top">
        <text class="section-title section-title-sm">正式上课</text>
        <text class="count-badge">{{ formalClassCount }}</text>
      </view>
      <text class="summary-text">当前正式上课卡片数量：{{ formalClassCount }}</text>
    </view>

    <view v-if="userStore.profileCompleted && formalClassCount === 0" class="card card-gap-20 card-mb-18 empty-card">
      <text class="empty-title text-block">还没有正式上课</text>
    </view>

    <view v-if="userStore.profileCompleted && formalClassCount > 0" class="trial-list">
      <view v-for="item in formalClassList" :key="`formal-${item.id}`" class="match-card">
        <view class="match-top">
          <view class="match-top-left">
            <text class="match-name">{{ item.title }}</text>
            <text class="match-subtitle">{{ item.subtitle }}</text>
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
          <view class="action-btn secondary">日常反馈</view>
        </view>
      </view>
    </view>

    <view v-if="showDetailPopup && activeItem" class="popup-mask" @tap="closeDetail">
      <view class="popup-panel" @tap.stop>
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
// 引入安全的 tab 页切换工具
import { safeSwitchTab } from '@/utils/navigation'

// 获取全局仓库实例
const userStore = useUserStore()
// 详情弹层是否显示
const showDetailPopup = ref(false)
// 当前正在查看详情的卡片对象
const activeItem = ref(null)

// 待试课列表与数量（直接读取全局仓库，由本页 loadTrialList 拉取后写入）
const trialLessonList = computed(() => userStore.pendingTrialCards)
const trialLessonCount = computed(() => trialLessonList.value.length)
// 正式上课列表与数量
const formalClassList = computed(() => userStore.formalClassCards)
const formalClassCount = computed(() => formalClassList.value.length)

// 工具函数：清洗数组（容错处理，过滤掉空值，非数组返回空数组）
const list = (items = []) => {
  return Array.isArray(items) ? items.filter(Boolean) : []
}

// 工具函数：截断预览列表。超过 limit 项时只保留前 limit 项并追加 '...' 省略号
const previewList = (items = [], limit = 3) => {
  const values = list(items)
  if (values.length <= limit) {
    return values
  }
  return [...values.slice(0, limit), '...']
}

// 工具函数：把资料行两两分组，让信息条在卡片里按两列排版
const pairLines = (items = []) => {
  const values = list(items)
  const rows = []
  for (let index = 0; index < values.length; index += 2) {
    rows.push(values.slice(index, index + 2))
  }
  return rows
}

// 返回首页（资料填写被放弃等场景）
const goHome = () => {
  safeSwitchTab('/pages/home/home')
}

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
      role: userStore.role === 'mentor' ? 'mentor' : 'family',
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

// 拉取当前用户的待试课 / 正式上课列表，写入全局仓库
const loadTrialList = () => {
  const currentRole = userStore.role === 'mentor' ? 'mentor' : 'family'

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
  if (userStore.profileCompleted) {
    loadTrialList()
    userStore.markTrialLessonViewed()
    return
  }

  if (userStore.consumeProfileCancelled()) {
    goHome()
    return
  }

  uni.navigateTo({
    url: '/pages/notice/notice'
  })
})
</script>
