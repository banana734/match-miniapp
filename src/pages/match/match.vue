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
// 导入 vue 核心 API（computed 计算属性、ref 响应式引用）
import { computed, ref } from 'vue'
// uni-app 页面生命周期钩子（页面每次显示时触发）
import { onShow } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
// 引入后端接口基地址常量
import { API_BASE_URL } from '@/utils/api'

// 获取全局仓库实例
const userStore = useUserStore()
// 详情弹层是否显示
const showDetailPopup = ref(false)
// 当前正在查看详情的卡片对象
const activeItem = ref(null)
// 友导师匹配池（后端返回的家庭卡片，供导师浏览）
const familyPool = ref([])
// 家庭匹配池（后端返回的导师卡片，供家庭浏览）
const mentorPool = ref([])
// 加载失败标记：失败提示只弹一次，避免 onShow 反复触发时刷屏
const loadFailed = ref(false)

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

// 当前身份应看的匹配池：导师看家庭池，家庭看导师池
// 同时把“待试课 + 正式上课”的卡片 id 收集成 Set，从池子里隐藏，避免重复申请
const visiblePool = computed(() => {
  const sourcePool = userStore.role === 'mentor' ? familyPool.value : mentorPool.value
  const hiddenIds = new Set([
    ...userStore.pendingTrialCards.map((item) => String(item.id)),
    ...userStore.formalClassCards.map((item) => String(item.id))
  ])

  return sourcePool.filter((item) => !hiddenIds.has(String(item.id)))
})

// 池子副标题：按当前身份提示用户看到的是哪一方的列表
const poolSubtitle = computed(() => {
  if (userStore.role === 'mentor') {
    return '你现在是友导师身份，下面先展示家庭假数据。'
  }
  return '你现在是家长身份，下面先展示友导师假数据。'
})

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

// 拉取当前用户的试课状态（待试课 pending / 正式上课 formal），写入全局仓库
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

// 点击“进行试课”：把该卡片加入当前用户的待试课列表
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

      // 默认假设这张卡已存在（后端返回“已加入”的场景）
      let added = 'exists'

      // 新版后端直接返回完整列表（pending / formal），全量刷新仓库
      if (Array.isArray(res.data?.pending) || Array.isArray(res.data?.formal)) {
        // 对比刷新前本地是否已有这张卡，决定提示“添加成功”还是“已加入待试课”
        const existed = userStore.pendingTrialCards.some((card) => String(card.id) === String(item.id))
        userStore.setTrialLists(res.data?.pending || [], res.data?.formal || [])
        added = existed ? 'exists' : 'added'
      } else {
        // 旧版后端只返回单张卡片，走本地追加
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

// 返回首页（资料填写被放弃等场景）
const goHome = () => {
  uni.switchTab({ url: '/pages/home/home' })
}

// 拉取匹配池列表：导师拉家庭池，家庭拉导师池
const loadMatchPool = () => {
  const currentRole = userStore.role === 'mentor' ? 'mentor' : 'family'

  uni.request({
    url: `${API_BASE_URL}/match/list?role=${currentRole}`,
    method: 'GET',
    success: (res) => {
      const dataList = Array.isArray(res.data?.list) ? res.data.list : []

      // 按身份把列表放进对应的池子
      if (currentRole === 'mentor') {
        familyPool.value = dataList
        return
      }

      mentorPool.value = dataList
    },
    fail: () => {
      // 失败提示只弹一次（loadFailed 去重）
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

// 页面每次显示时的进入守卫：
// 1. 资料已填好 → 刷新试课状态和匹配池；
// 2. 用户刚放弃填写 → 消费掉“放弃”标记并送回首页；
// 3. 其他情况（资料未填）→ 跳去提示页要求先填资料。
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
