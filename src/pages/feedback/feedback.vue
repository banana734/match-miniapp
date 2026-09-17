<template>
  <view class="container">
    <view class="page-bg">
      <image class="page-bg-img" src="/static/home-bg.jpg" mode="aspectFill" />
    </view>
    <view
      v-for="section in sections"
      :key="section.key"
      class="card card-gap-20 card-mb-18 section-panel"
    >
      <text class="section-title section-title-sm">{{ section.title }}</text>

      <view v-if="!section.list.length" class="section-empty">
        <text class="empty-title text-block">{{ section.emptyText }}</text>
      </view>

      <view v-else class="feedback-list">
        <view
          v-for="(item, cardIndex) in section.list"
          :key="`${section.key}-${item.id}`"
          class="feedback-card"
        >
          <view class="feedback-head">
            <view class="card-index">{{ cardIndex + 1 }}</view>
            <view class="match-heading">
              <text class="match-name">{{ item.target_title || '未填写对象' }}</text>
              <text v-if="item.target_subtitle" class="match-subtitle">{{ item.target_subtitle }}</text>
            </view>
          </view>

          <view class="feedback-meta">
            <text class="meta-text">{{ section.dateLabel }}：{{ item.event_date || '未填写' }}</text>
            <text class="meta-text">时长：{{ item.event_duration || '未填写' }}</text>
          </view>

          <view class="feedback-body">
            <view v-for="line in feedbackLines(item)" :key="line.label" class="line-block">
              <text class="line-label">{{ line.label }}</text>

              <view v-if="line.kind === 'multi'" class="capsule-row">
                <text
                  v-for="(entry, index) in line.items"
                  :key="`${line.label}-${index}`"
                  class="capsule capsule-multi"
                >
                  {{ entry }}
                </text>
                <text v-if="!line.items.length" class="field-text">未填写</text>
              </view>

              <text v-else class="field-text">{{ line.value || '未填写' }}</text>

              <text v-if="line.note" class="field-text note-text">{{ line.note }}</text>
            </view>
          </view>

          <text class="feedback-time">提交于 {{ formatTime(item.updated_at) }}</text>
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
// 引入共用展示工具（list 把后端字段清洗成干净数组）
import { list } from '@/utils/display'

// 获取全局仓库实例
const userStore = useUserStore()

// 当前账号的试课反馈 / 日常反馈（由 loadFeedback 从后端拉取后写入）
const trialList = ref([])
const dailyList = ref([])

// 两段内容用同一套模板渲染，这里只描述「标题 / 日期列的叫法 / 空状态文案 / 数据」四处差异
const sections = computed(() => [
  {
    key: 'trial',
    title: '试课反馈',
    dateLabel: '试课日期',
    emptyText: '还没有提交过试课反馈',
    list: trialList.value
  },
  {
    key: 'daily',
    title: '日常反馈',
    dateLabel: '上课日期',
    emptyText: '还没有提交过日常反馈',
    list: dailyList.value
  }
])


// 把一条反馈拆成几行「标签 + 内容」，试课和日常共用同一套字段
const feedbackLines = (item) => [
  {
    label: '满意点',
    kind: 'multi',
    items: list(item.satisfaction_points_json),
    note: item.satisfaction_point_other
  },
  {
    label: '客观不满意点',
    kind: 'multi',
    items: list(item.objective_unsatisfied_json),
    note: item.objective_unsatisfied_other
  },
  {
    label: '主观不满意点',
    kind: 'multi',
    items: list(item.subjective_unsatisfied_json),
    note: item.subjective_unsatisfied_other
  },
  {
    label: '是否继续合作',
    kind: 'text',
    value: item.continue_choice,
    note: item.continue_choice_other
  }
]

// 把后端的时间戳格式化成「2026-09-16 23:30」；解析失败就退回截断原文
const formatTime = (value) => {
  if (!value) {
    return '未知时间'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16).replace('T', ' ')
  }

  const pad = (number) => String(number).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 拉当前账号的历史反馈（试课 + 日常）
const loadFeedback = () => {
  uni.request({
    url: `${API_BASE_URL}/feedback/list?openid=${encodeURIComponent(userStore.openid)}&role=${userStore.currentRole}`,
    method: 'GET',
    success: (res) => {
      trialList.value = Array.isArray(res.data?.trial) ? res.data.trial : []
      dailyList.value = Array.isArray(res.data?.daily) ? res.data.daily : []
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
// 未登录 → 登录页；没选身份 → 身份选择页；都满足才拉反馈列表。
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
    return
  }

  loadFeedback()
})
</script>

<style scoped>
/* 分区底卡：试课反馈 / 日常反馈 的容器，覆盖 .card 的白底，让里面的白卡片有层次。
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

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* 单条反馈卡片（半透明，让背景图透出来） */
.feedback-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20rpx;
  padding: 18rpx;
  border: 1rpx solid #edf0f5;
  box-shadow: 0 8rpx 18rpx rgba(40, 61, 44, 0.07);
}

/* 卡片头部：序号 + 「对象名 + 副标题」竖排（.match-heading 来自 common.scss） */
.feedback-head {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  min-width: 0;
}

.feedback-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.meta-text {
  font-size: 22rpx;
  color: #6b7280;
}

.feedback-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

/* 补充说明要换行显示，覆盖 .field-text 的单行省略 */
.note-text {
  white-space: normal;
  color: #6b7280;
}

.feedback-time {
  font-size: 20rpx;
  color: #9ca3af;
}
</style>
