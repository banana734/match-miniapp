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
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { API_BASE_URL } from '@/utils/api'
import { safeSwitchTab } from '@/utils/navigation'

const userStore = useUserStore()
const showDetailPopup = ref(false)
const activeItem = ref(null)

const trialLessonList = computed(() => userStore.pendingTrialCards)
const trialLessonCount = computed(() => trialLessonList.value.length)
const formalClassList = computed(() => userStore.formalClassCards)
const formalClassCount = computed(() => formalClassList.value.length)

const list = (items = []) => {
  return Array.isArray(items) ? items.filter(Boolean) : []
}

const previewList = (items = [], limit = 3) => {
  const values = list(items)
  if (values.length <= limit) {
    return values
  }
  return [...values.slice(0, limit), '...']
}

const pairLines = (items = []) => {
  const values = list(items)
  const rows = []
  for (let index = 0; index < values.length; index += 2) {
    rows.push(values.slice(index, index + 2))
  }
  return rows
}

const goHome = () => {
  safeSwitchTab('/pages/home/home')
}

const openDetail = (item) => {
  activeItem.value = item
  showDetailPopup.value = true
}

const closeDetail = () => {
  showDetailPopup.value = false
  activeItem.value = null
}

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

      if (activeItem.value?.id === cardId) {
        closeDetail()
      }

      if (Array.isArray(res.data?.pending) || Array.isArray(res.data?.formal)) {
        userStore.setTrialLists(res.data?.pending || [], res.data?.formal || [])
      } else {
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

const goToTrialFeedback = (item) => {
  const pagePath = userStore.role === 'mentor'
    ? '/pages/mentor-feedback/mentor-feedback'
    : '/pages/family-feedback/family-feedback'

  uni.navigateTo({
    url: `${pagePath}?id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.title)}`
  })
}

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
