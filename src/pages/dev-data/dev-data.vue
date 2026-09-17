<template>
  <view class="container">
    <view class="page-bg">
      <image class="page-bg-img" src="/static/home-bg.jpg" mode="aspectFill" />
    </view>
    <view class="header">
      <text class="title">双方用户数据（开发调试）</text>
      <view class="refresh-btn" @tap="loadData">刷新</view>
    </view>

    <!-- 两端数据各一个区块，默认都是卡片折叠态 -->
    <view class="section" v-for="(sec, si) in sections" :key="si">
      <text class="section-title">{{ sec.title }}</text>
      <view v-if="sec.items.length === 0" class="empty">暂无数据</view>

      <view
        v-for="(item, idx) in sec.items"
        :key="sec.sideLabel + '-' + item.openid + '-' + idx"
        class="card"
        @tap="toggleExpand(item)"
      >
        <!-- 卡片头：姓名 + 身份/短 openid + 展开收起 -->
        <view class="card-head">
          <view class="card-head-main">
            <text class="card-name">{{ summaryRows(item)[0][1] || '未命名' }}</text>
            <text class="card-sub">{{ sec.sideLabel }} · {{ shortId(item.openid) }}</text>
          </view>
          <text class="card-toggle">{{ item.expanded ? '收起 ▴' : '展开 ▾' }}</text>
        </view>

        <!-- 折叠态摘要：几个关键字段，方便一眼扫过 -->
        <view class="card-summary">
          <text
            v-for="(row, i) in summaryRows(item).slice(1)"
            :key="i"
            class="summary-chip"
          >{{ row[0] }}：{{ formatVal(row[1]) }}</text>
        </view>

        <!-- 上课 / 试课对象：一眼看出这个人正在跟谁上课 / 试课（开发调试核心），试课与正式上课分开显示，没有就写「无」 -->
        <view class="pairing-block">
          <view class="pairing-group">
            <text class="pairing-label">试课对象</text>
            <view v-if="pairingChips(item).trial.length" class="pairing-chips">
              <text
                v-for="(chip, ci) in pairingChips(item).trial"
                :key="'t' + ci"
                class="pairing-chip"
              >{{ chip }}</text>
            </view>
            <text v-else class="pairing-none">无</text>
          </view>
          <view class="pairing-group">
            <text class="pairing-label">正式上课对象</text>
            <view v-if="pairingChips(item).formal.length" class="pairing-chips">
              <text
                v-for="(chip, ci) in pairingChips(item).formal"
                :key="'f' + ci"
                class="pairing-chip pairing-formal"
              >{{ chip }}</text>
            </view>
            <text v-else class="pairing-none">无</text>
          </view>
        </view>

        <!-- 展开态：该用户全部字段 -->
        <view v-if="item.expanded" class="card-detail">
          <view
            v-for="(val, key) in item"
            :key="key"
            v-show="key !== 'expanded'"
            class="detail-row"
          >
            <text class="label">{{ labelOf(key) }}</text>
            <text class="value">{{ formatVal(val) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
// 引入 Vue 的响应式 API（ref / computed 来自 vue，不是 uni-app）
import { ref, computed } from 'vue'
// 引入 uni-app 生命周期钩子（onShow 用于每次进入页面时自动加载数据）
import { onShow } from '@dcloudio/uni-app'
// 引入后端接口基地址常量
import { API_BASE_URL } from '@/utils/api'

// 友导师列表
const mentors = ref([])
// 家庭列表
const families = ref([])
// 配对关系列表（开发调试用，来自 /api/admin/pairings）
const pairings = ref([])
// 加载状态（目前仅用于避免重复触发，界面上用 Toast 反馈）
const loading = ref(false)

// 字段中文标签映射：视图返回的列名 → 页面上展示的中文名。
// 没在里面的字段会直接显示原列名，保证不丢数据。
const labelMap = {
  openid: '微信openid',
  role: '身份',
  child_name: '孩子姓名',
  parent_name: '家长称呼',
  phone: '电话',
  wechat: '微信号',
  area_text: '地区',
  gender: '性别',
  grade_text: '年级',
  subjects_json: '辅导科目',
  difficulties_json: '学习困难',
  teacher_traits_json: '期望导师特质',
  teaching_styles_json: '期望教学方式',
  main_focus_text: '主要关注点',
  learning_state: '学习状态',
  communication_expectation_text: '沟通期望',
  understanding: '理解程度',
  feedback_willingness: '反馈意愿',
  class_modes_json: '上课方式',
  class_frequency: '上课频率',
  intro: '自我介绍',
  extra_note: '备注',
  name: '姓名',
  mentor_project: '大创项目',
  core_member: '是否核心成员',
  school: '学校',
  major: '专业',
  college: '学院',
  mentor_subjects_json: '擅长科目',
  mentor_teaching_grade_range: '可教年级',
  mentor_style_types_json: '教学风格',
  mentor_teaching_modes_json: '教学方式',
  mentor_summer_location: '暑期地点',
  mentor_school_location: '校区地点',
  mentor_class_frequency: '上课频率',
  created_at: '创建时间',
  updated_at: '更新时间'
}

// 取字段的中文标签，没有就原样返回列名
const labelOf = (key) => {
  return labelMap[key] || key
}

// 把字段值转成可读文本：数组用顿号连接，对象转 JSON，空值显示占位符
const formatVal = (val) => {
  if (val === null || val === undefined || val === '') {
    return '—'
  }

  if (Array.isArray(val)) {
    return val.length ? val.join('、') : '—'
  }

  if (typeof val === 'object') {
    return JSON.stringify(val)
  }

  return String(val)
}

// 每张卡片折叠态展示的摘要字段：按身份挑几个最关键的
const summaryRows = (item) => {
  const rows = []
  if (item.role === 'mentor') {
    rows.push(['姓名', item.name])
    rows.push(['学校', item.school])
    rows.push(['专业', item.major])
    rows.push(['擅长科目', item.mentor_subjects_json])
  } else {
    rows.push(['孩子', item.child_name])
    rows.push(['家长', item.parent_name])
    rows.push(['年级', item.grade_text])
    rows.push(['辅导科目', item.subjects_json])
  }
  return rows
}

// 把试课状态（trial_records.status）翻译成中文标签
const statusLabel = (status) => {
  const map = {
    pending: '试课中',
    formal: '正式上课',
    rejected: '已拒绝',
    removed: '已移除',
    terminated: '已解除'
  }
  return map[status] || status || '未知'
}

// openid 太长，卡片上只显示末尾 6 位
const shortId = (openid) => {
  return openid ? '…' + String(openid).slice(-6) : ''
}

// 用 uni.request 拉一个列表接口，统一返回 list 数组（失败返回空数组）
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

// 同时拉取友导师和家庭两份数据，写入页面
const loadData = async () => {
  if (loading.value) {
    return
  }

  loading.value = true
  try {
    // API_BASE_URL 已含 /api，这里直接拼 /admin/xxx 即可
    const [m, f, p] = await Promise.all([
      fetchList(`${API_BASE_URL}/admin/mentors`),
      fetchList(`${API_BASE_URL}/admin/families`),
      fetchList(`${API_BASE_URL}/admin/pairings`)
    ])

    // 给每条数据加一个 expanded 标记，控制卡片展开/收起
    mentors.value = m.map((it) => ({ ...it, expanded: false }))
    families.value = f.map((it) => ({ ...it, expanded: false }))
    // 配对关系也一并拉回来（开发调试用）
    pairings.value = p || []
    uni.showToast({ title: '已刷新', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: '加载失败，后端是否启动？', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 点击卡片：展开 / 收起详情
const toggleExpand = (item) => {
  item.expanded = !item.expanded
}

// 把两端用户的 openid 映射成「名字」，配对里只存 openid，显示时要换成可读名字
const nameMap = computed(() => {
  const map = {}
  mentors.value.forEach((it) => {
    if (it.openid) {
      map[it.openid] = it.name || '未命名导师'
    }
  })
  families.value.forEach((it) => {
    if (it.openid) {
      map[it.openid] = it.child_name || '未命名家庭'
    }
  })
  return map
})

// card_id 带 family-/mentor- 前缀（如 family-dev-openid-client-xxx），
// 而 dev-data 卡片的 openid 不带前缀（dev-openid-client-xxx），去掉前缀才能对上名字。
const stripRolePrefix = (id = '') => String(id).replace(/^(family|mentor)-/, '')

// 把配对整理成「用户的 openid → 对方列表」的映射。
// trial_records 是单向记录（只有发起方一行），这里双向展开：
//   一条 {openid:A, role:mentor, card_id:family-B} 既让导师 A 看到家庭 B，也让家庭 B 看到导师 A。
// 这样「对方」也能从自己的卡片里看到这段配对关系。
const pairingMap = computed(() => {
  const map = {}
  const seen = {}
  const add = (ownerOpenid, counterpartOpenid, counterpartRole, status) => {
    const owner = stripRolePrefix(ownerOpenid)
    const counterpart = stripRolePrefix(counterpartOpenid)
    if (!owner || !counterpart) {
      return
    }
    const dedupe = owner + '|' + counterpart + '|' + status
    if (seen[dedupe]) {
      return
    }
    seen[dedupe] = true
    if (!map[owner]) {
      map[owner] = []
    }
    map[owner].push({
      counterpartOpenid: counterpart,
      counterpartRole,
      status
    })
  }

  pairings.value.forEach((p) => {
    // 发起方视角
    add(p.myOpenid, p.counterpartOpenid, p.counterpartRole, p.status)
    // 对方视角（对方角色取发起方角色的反面）
    add(p.counterpartOpenid, p.myOpenid, p.myRole, p.status)
  })
  return map
})

// 给某个用户算出「试课对象 / 正式上课对象」，两组分开返回（status: pending=试课, formal=正式）
const pairingChips = (item) => {
  const list = pairingMap.value[item.openid] || []
  const toLabel = (p) => {
    const name = nameMap.value[p.counterpartOpenid] || '未知用户'
    const role = p.counterpartRole === 'mentor' ? '友导师' : '家庭'
    return `${name}（${role}）`
  }
  return {
    trial: list.filter((p) => p.status === 'pending').map(toLabel),
    formal: list.filter((p) => p.status === 'formal').map(toLabel)
  }
}

// 把两端数据组织成两个区块，模板里只写一份卡片结构即可
const sections = computed(() => [
  {
    title: `友导师（共 ${mentors.value.length} 位）`,
    items: mentors.value,
    sideLabel: '友导师'
  },
  {
    title: `家庭（共 ${families.value.length} 位）`,
    items: families.value,
    sideLabel: '家庭'
  }
])

// 每次进入页面自动加载一次
onShow(() => {
  loadData()
})
</script>

<style scoped>
.container {
  padding: 24rpx;
  background: #f5f6f8;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2329;
}

.refresh-btn {
  font-size: 26rpx;
  color: #2f80ed;
  padding: 8rpx 20rpx;
  border: 1rpx solid #2f80ed;
  border-radius: 24rpx;
}

.section {
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2329;
  margin: 16rpx 0 12rpx;
}

.empty {
  font-size: 26rpx;
  color: #9aa0a6;
  padding: 24rpx;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16rpx;
}

/* 卡片（半透明，让背景图透出来） */
.card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2329;
}

.card-sub {
  display: block;
  font-size: 22rpx;
  color: #9aa0a6;
  margin-top: 4rpx;
}

.card-toggle {
  font-size: 24rpx;
  color: #2f80ed;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.card-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.summary-chip {
  font-size: 22rpx;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

/* 上课 / 试课对象区块（试课 / 正式上课两组纵向排列） */
.pairing-block {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 14rpx;
}

.pairing-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10rpx;
}

.pairing-label {
  font-size: 22rpx;
  color: #86909c;
}

.pairing-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.pairing-chip {
  font-size: 22rpx;
  color: #2f80ed;
  background: #eaf2fe;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

/* 正式上课用绿色高亮，和试课（蓝色）区分开 */
.pairing-formal {
  color: #1a9c5b;
  background: #e6f7ee;
}

.pairing-none {
  font-size: 22rpx;
  color: #c0c4cc;
}

.card-detail {
  margin-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
}

.detail-row {
  display: flex;
  padding: 8rpx 0;
  font-size: 24rpx;
  line-height: 1.5;
}

.detail-row .label {
  width: 200rpx;
  flex-shrink: 0;
  color: #86909c;
}

.detail-row .value {
  flex: 1;
  color: #1f2329;
  word-break: break-all;
}
</style>
