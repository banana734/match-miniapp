<template>
  <view class="container">
    <view v-if="userStore.profileCompleted" class="card">
      <text class="title">匹配</text>
      <text class="subtitle">{{ poolSubtitle }}</text>
    </view>

    <view v-if="userStore.profileCompleted" class="match-list">
      <view v-for="item in visiblePool" :key="item.id" class="match-card">
        <view class="match-top">
          <view class="match-top-left">
            <text class="match-name">{{ item.title }}</text>
            <text class="match-subtitle">{{ item.subtitle }}</text>
          </view>
          <text class="match-badge">{{ item.badge }}</text>
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
          <view class="action-btn primary" @tap="openDetail(item)">查看详情</view>
          <view class="action-btn secondary" @tap="handleTrialLesson(item)">进行试课</view>
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
import { safeSwitchTab } from '@/utils/navigation'

const userStore = useUserStore()
const MATCH_API_BASE_URL = 'http://127.0.0.1:3000/api'

const showDetailPopup = ref(false)
const activeItem = ref(null)
const mentorPool = ref([])
const familyPool = ref([])
const loadFailed = ref(false)

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

const visiblePool = computed(() => {
  const sourcePool = userStore.role === 'mentor' ? familyPool.value : mentorPool.value
  const hiddenIds = new Set([
    ...userStore.pendingTrialCards.map((item) => String(item.id)),
    ...userStore.formalClassCards.map((item) => String(item.id))
  ])

  return sourcePool.filter((item) => !hiddenIds.has(String(item.id)))
})

const poolSubtitle = computed(() => {
  if (userStore.role === 'mentor') {
    return '你现在是友导师身份，下面先展示家庭假数据。'
  }
  return '你现在是家长身份，下面先展示友导师假数据。'
})

const openDetail = (item) => {
  activeItem.value = item
  showDetailPopup.value = true
}

const closeDetail = () => {
  showDetailPopup.value = false
  activeItem.value = null
}

const loadTrialState = () => {
  const currentRole = userStore.role === 'mentor' ? 'mentor' : 'family'

  uni.request({
    url: `${MATCH_API_BASE_URL}/trial/list?openid=${encodeURIComponent(userStore.openid)}&role=${currentRole}`,
    method: 'GET',
    success: (res) => {
      userStore.setTrialLists(res.data?.pending || [], res.data?.formal || [])
    }
  })
}

const handleTrialLesson = (item) => {
  uni.request({
    url: `${MATCH_API_BASE_URL}/trial/apply`,
    method: 'POST',
    data: {
      openid: userStore.openid,
      role: userStore.role === 'mentor' ? 'mentor' : 'family',
      cardId: item.id
    },
    success: (res) => {
      if (!res.data?.success) {
        uni.showToast({
          title: res.data?.message || '添加失败',
          icon: 'none'
        })
        return
      }

      let added = 'exists'

      if (Array.isArray(res.data?.pending) || Array.isArray(res.data?.formal)) {
        const existed = userStore.pendingTrialCards.some((card) => String(card.id) === String(item.id))
        userStore.setTrialLists(res.data?.pending || [], res.data?.formal || [])
        added = existed ? 'exists' : 'added'
      } else {
        added = userStore.addPendingTrialCard(res.data.card || item)
      }

      uni.showToast({
        title: added === 'added' ? '添加成功' : '已加入待试课',
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

const goHome = () => {
  safeSwitchTab('/pages/home/home')
}

const loadMatchPool = () => {
  const currentRole = userStore.role === 'mentor' ? 'mentor' : 'family'

  uni.request({
    url: `${MATCH_API_BASE_URL}/match/list?role=${currentRole}`,
    method: 'GET',
    success: (res) => {
      const dataList = Array.isArray(res.data?.list) ? res.data.list : []

      if (currentRole === 'mentor') {
        familyPool.value = dataList
        return
      }

      mentorPool.value = dataList
    },
    fail: () => {
      if (!loadFailed.value) {
        uni.showToast({
          title: '后端未连接',
          icon: 'none'
        })
        loadFailed.value = true
      }
    }
  })
}

onShow(() => {
  if (userStore.profileCompleted) {
    loadTrialState()
    loadMatchPool()
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
  gap: 14rpx;
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

.match-list {
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
  background: #e8f5ee;
  color: #23824f;
  font-size: 20rpx;
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

