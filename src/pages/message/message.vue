<template>
  <view class="container">
   

    <view v-if="userStore.profileCompleted" class="card summary-card">
      <view class="summary-top">
        <text class="section-title">待试课</text>
        <text class="count-badge">{{ trialLessonCount }}</text>
      </view>
      <text class="summary-text">当前待试课卡片数量：{{ trialLessonCount }}</text>
    </view>

    <view v-if="userStore.profileCompleted && trialLessonCount === 0" class="card empty-card">
      <text class="empty-title">还没有待试课</text>
     
    </view>

    <view v-if="userStore.profileCompleted && trialLessonCount > 0" class="trial-list">
      <view v-for="item in trialLessonList" :key="item.id" class="match-card">
        <view class="match-top">
          <view class="match-top-left">
            <text class="match-name">{{ item.title }}</text>
            <text class="match-subtitle">{{ item.subtitle }}</text>
          </view>
          <view class="match-top-right">
            <text class="match-badge">待试课</text>
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

    <view v-if="userStore.profileCompleted" class="card summary-card formal-summary-card">
      <view class="summary-top">
        <text class="section-title">正式上课</text>
        <text class="count-badge">{{ formalClassCount }}</text>
      </view>
      <text class="summary-text">当前正式上课卡片数量：{{ formalClassCount }}</text>
    </view>

    <view v-if="userStore.profileCompleted && formalClassCount === 0" class="card empty-card">
      <text class="empty-title">还没有正式上课</text>
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
const MATCH_API_BASE_URL = API_BASE_URL

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
    url: `${MATCH_API_BASE_URL}/trial/remove`,
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
    url: `${MATCH_API_BASE_URL}/trial/list?openid=${encodeURIComponent(userStore.openid)}&role=${currentRole}`,
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

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 18rpx;
}

.title,
.subtitle {
  display: block;
  text-align: center;
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}

.subtitle {
  font-size: 24rpx;
  line-height: 1.6;
  color: #6b7280;
}

.summary-card {
  gap: 14rpx;
}

.formal-summary-card {
  margin-top: 8rpx;
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
}

.count-badge {
  min-width: 48rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #2f80ed;
  font-size: 24rpx;
  text-align: center;
}

.summary-text,
.empty-title,
.empty-text {
  display: block;
}

.summary-text,
.empty-text {
  font-size: 24rpx;
  line-height: 1.6;
  color: #6b7280;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
}

.trial-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.match-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 18rpx rgba(40, 61, 44, 0.07);
  border: 1rpx solid #edf0f5;
  height: 400rpx;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.match-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.match-top-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.match-top-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.match-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.match-subtitle {
  font-size: 22rpx;
  color: #6b7280;
}

.match-badge {
  flex-shrink: 0;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #fff1f2;
  color: #e11d48;
  font-size: 20rpx;
}

.formal-badge {
  background: #edf7ee;
  color: #208a54;
}

.remove-btn {
  display: inline-flex;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex: 1;
  overflow: hidden;
}

.info-row {
  display: flex;
  gap: 12rpx;
  align-items: stretch;
}

.line-block {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 14rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  border: 1rpx solid #edf2f7;
}

.line-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #111827;
}

.field-text {
  font-size: 22rpx;
  line-height: 1.45;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capsule-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  width: 100%;
}

.capsule-column {
  flex-direction: column;
  width: 100%;
}

.capsule {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  width: fit-content;
  max-width: 100%;
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capsule-single {
  background: #e8f1ff;
  color: #2d6cdf;
  box-sizing: border-box;
  justify-content: center;
}

.capsule-multi {
  background: #eef9f1;
  color: #208a54;
}

.capsule-sort {
  background: #fff4e8;
  color: #d97706;
  box-sizing: border-box;
}

.sort-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24rpx;
  height: 24rpx;
  padding: 0 4rpx;
  border-radius: 999rpx;
  background: rgba(217, 119, 6, 0.16);
  font-size: 18rpx;
  font-weight: 700;
  color: #d97706;
}

.sort-text {
  flex: 1;
  min-width: 0;
  font-size: 20rpx;
  color: #c76b05;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 14rpx;
}

.action-btn {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  border-radius: 14rpx;
  font-size: 24rpx;
}

.action-btn.primary {
  background: #2f80ed;
  color: #ffffff;
}

.action-btn.secondary {
  background: #eef4ff;
  color: #2f80ed;
}

.popup-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  background: rgba(15, 23, 42, 0.45);
  z-index: 999;
}

.popup-panel {
  width: 100%;
  max-height: 75vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 22rpx 20rpx;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 14rpx;
}

.popup-header-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.popup-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.popup-subtitle {
  font-size: 22rpx;
  color: #6b7280;
}

.popup-close {
  flex-shrink: 0;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #2f80ed;
  font-size: 22rpx;
}

.popup-content {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.detail-block {
  background: #ffffff;
  width: 100%;
}
</style>
