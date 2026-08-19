<template>
  <view class="container">
    <view v-if="userStore.profileCompleted" class="card card-gap-14 card-mb-18">
      <text class="title title-sm">匹配</text>
      <text class="subtitle subtitle-sm">{{ poolSubtitle }}</text>
    </view>

    <view v-if="userStore.profileCompleted" class="match-list">
      <view v-for="item in visiblePool" :key="item.id" class="match-card">
        <view class="match-top">
          <view class="match-top-left">
            <text class="match-name">{{ item.title }}</text>
            <text class="match-subtitle">{{ item.subtitle }}</text>
          </view>
          <text class="match-badge match-badge-positive">{{ item.badge }}</text>
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
import { API_BASE_URL } from '@/utils/api'
import { safeSwitchTab } from '@/utils/navigation'

const userStore = useUserStore()
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
    url: `${API_BASE_URL}/trial/list?openid=${encodeURIComponent(userStore.openid)}&role=${currentRole}`,
    method: 'GET',
    success: (res) => {
      userStore.setTrialLists(res.data?.pending || [], res.data?.formal || [])
    }
  })
}

const handleTrialLesson = (item) => {
  uni.request({
    url: `${API_BASE_URL}/trial/apply`,
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
    url: `${API_BASE_URL}/match/list?role=${currentRole}`,
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
