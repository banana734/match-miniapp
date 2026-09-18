<template>
  <view class="container">
    <view class="page-bg">
      <image class="page-bg-img" src="/static/home-bg.jpg" mode="aspectFill" />
    </view>
    <!-- 匹配面板：和「联系」页一样，用一张大底卡把搜索框和所有匹配卡片都包在里面 -->
    <view v-if="userStore.profileCompleted" class="card card-gap-20 card-mb-18 section-panel">
      <view class="summary-top">
        <text class="section-title section-title-sm">匹配</text>
        <text class="count-badge">{{ filteredPool.length }}</text>
      </view>

      <view class="search-bar">
        <input
          :value="searchKeyword"
          @input="onSearchInput"
          class="search-input"
          placeholder="搜索姓名 / 科目 / 信息…"
          confirm-type="search"
        />
        <view v-if="searchKeyword" class="search-clear" @tap="clearSearch">✕</view>
      </view>

      <view class="primary-btn" @tap="openRecommend">推荐匹配</view>

      <view v-if="filteredPool.length === 0" class="section-empty">
        <text class="empty-title text-block" v-if="searchKeyword.trim()">未找到与「{{ searchKeyword }}」相关的匹配</text>
        <text class="empty-title text-block" v-else>暂时没有可匹配的卡片</text>
      </view>

      <view v-else class="match-list">
        <view v-for="(item, cardIndex) in filteredPool" :key="item.id" class="match-card">
          <view class="match-top">
            <view class="match-top-left">
              <view class="card-index">{{ cardIndex + 1 }}</view>
              <view class="match-heading">
                <text class="match-name">{{ item.title }}</text>
                <text class="match-subtitle">{{ item.subtitle }}</text>
              </view>
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
    </view>

    <view v-if="showDetailPopup && activeItem" class="popup-mask detail-mask" @tap="closeDetail">
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

    <!-- 推荐匹配弹层：按匹配分从高到低取前 5 张，卡片样式和上面的匹配卡片一致，
         只是底端多一行匹配度百分比 -->
    <view v-if="showRecommendPopup" class="popup-mask" @tap="closeRecommend">
      <view class="popup-panel recommend-panel" @tap.stop>
        <view class="popup-header">
          <view class="popup-header-left">
            <text class="popup-title">推荐匹配</text>
            <text class="popup-subtitle">按匹配度从高到低，取前 5 名</text>
          </view>
          <text class="popup-close" @tap="closeRecommend">关闭</text>
        </view>

        <!-- 标题固定在上面，只有下面的列表滚动 -->
        <scroll-view scroll-y class="recommend-scroll">
        <view class="popup-content">
          <view v-if="recommendList.length === 0" class="section-empty">
            <text class="empty-title text-block">暂时没有可推荐的匹配</text>
          </view>

          <view v-else class="match-list">
            <view
              v-for="(item, cardIndex) in recommendList"
              :key="`recommend-${item.id}`"
              class="match-card recommend-card"
            >
              <view class="match-top">
                <view class="match-top-left">
                  <view class="card-index">{{ cardIndex + 1 }}</view>
                  <view class="match-heading">
                    <text class="match-name">{{ item.title }}</text>
                    <text class="match-subtitle">{{ item.subtitle }}</text>
                  </view>
                </view>
                <text class="match-badge match-badge-positive">{{ item.badge }}</text>
              </view>

              <view class="match-info">
                <view
                  v-for="(row, rowIndex) in pairLines(item.preview)"
                  :key="`recommend-${item.id}-row-${rowIndex}`"
                  class="info-row"
                >
                  <view v-for="line in row" :key="line.label" class="line-block">
                    <text class="line-label">{{ line.label }}</text>

                    <view v-if="line.kind === 'single'" class="capsule-row">
                      <text class="capsule capsule-single">{{ line.value }}</text>
                    </view>

                    <view v-else-if="line.kind === 'multi'" class="capsule-row">
                      <text
                        v-for="(choice, index) in previewList(line.items)"
                        :key="`${line.label}-recommend-${index}`"
                        class="capsule capsule-multi"
                      >
                        {{ choice }}
                      </text>
                    </view>

                    <view v-else-if="line.kind === 'sort'" class="capsule-row capsule-column">
                      <view
                        v-for="(choice, index) in previewList(line.items, 2)"
                        :key="`${line.label}-recommend-${index}`"
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

              <view class="match-score">
                <text class="match-score-value">匹配度 {{ toPercent(item.matchScore) }}%</text>
              </view>
            </view>
          </view>
        </view>
        </scroll-view>
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
// 友导师匹配池（后端返回的家庭卡片，供导师浏览）
const familyPool = ref([])
// 家庭匹配池（后端返回的导师卡片，供家庭浏览）
const mentorPool = ref([])
// 加载失败标记：失败提示只弹一次，避免 onShow 反复触发时刷屏
const loadFailed = ref(false)

// 返回首页（资料填写被放弃等场景）：本页本地定义，直白不绕弯
const goHome = () => {
  uni.switchTab({ url: '/pages/home/home' })
}

// 当前身份应看的匹配池：导师看家庭池，家庭看导师池
// 同时把“待试课 + 正式上课”的卡片 id 收集成 Set，从池子里隐藏，避免重复申请
const visiblePool = computed(() => {
  // 以已绑定身份（boundRole）为准，不用 role：role 为空时不能兜底成家庭
  const sourcePool = userStore.boundRole === 'mentor' ? familyPool.value : mentorPool.value
  const hiddenIds = new Set([
    ...userStore.pendingTrialCards.map((item) => String(item.id)),
    ...userStore.formalClassCards.map((item) => String(item.id))
  ])

  return sourcePool.filter((item) => !hiddenIds.has(String(item.id)))
})

// 匹配页顶部搜索关键字（绑定到搜索框），用于在可见池里按关键字过滤卡片
const searchKeyword = ref('')
// 搜索框输入回调（受控输入，直接同步输入框的值）
const onSearchInput = (e) => {
  searchKeyword.value = e?.detail?.value || ''
}
// 清空搜索框
const clearSearch = () => {
  searchKeyword.value = ''
}

// ===== 推荐匹配弹层 =====
// 弹层是否显示
const showRecommendPopup = ref(false)
// 后端按匹配分排好序的前 5 张卡片（每张比普通卡片多一个 matchScore，取值 0~1）
const recommendList = ref([])

// 匹配分 → 整数百分比
const toPercent = (score) => Math.round((score || 0) * 100)

// 打开弹层并拉推荐。先清空列表，避免上一次的结果闪一下。
const openRecommend = () => {
  showRecommendPopup.value = true
  recommendList.value = []

  uni.request({
    url: `${API_BASE_URL}/match/recommend?openid=${encodeURIComponent(userStore.openid)}&role=${userStore.currentRole}&limit=5`,
    method: 'GET',
    success: (res) => {
      recommendList.value = Array.isArray(res.data?.list) ? res.data.list : []
    },
    fail: () => {
      recommendList.value = []
      uni.showToast({ title: '后端未连接', icon: 'none' })
    }
  })
}

// 关闭弹层
const closeRecommend = () => {
  showRecommendPopup.value = false
}

// 把一张卡片里「用户自己填的内容」拼成一个字符串，供关键字匹配。
// 收：标题（姓名）、副标题（地区 / 学校专业）、每道题的答案值。
// 刻意不收（以前收了，是 bug）：
//   - line.label：题目名，比如每张卡都有「孩子性别」，一搜题目名就全部命中；
//   - item.badge：系统标记（「家庭」「骨干成员」），也不是用户填的。
const getCardSearchText = (item = {}) => {
  const texts = []
  if (item.title) texts.push(String(item.title))
  if (item.subtitle) texts.push(String(item.subtitle))
  ;(item.preview || []).forEach((row) => {
    if (!Array.isArray(row)) return
    row.forEach((line) => {
      if (!line) return
      if (line.value) texts.push(String(line.value))
      if (Array.isArray(line.items)) {
        line.items.forEach((v) => texts.push(String(v)))
      }
    })
  })
  ;(item.details || []).forEach((line) => {
    if (!line) return
    if (line.value) texts.push(String(line.value))
    if (Array.isArray(line.items)) {
      line.items.forEach((v) => texts.push(String(v)))
    }
  })
  return texts.join(' ')
}

// 关键字是否命中某张卡片：大小写不敏感；关键字为空时视为全部命中（不过滤）
const cardMatchesKeyword = (item, keyword) => {
  const kw = (keyword || '').trim().toLowerCase()
  if (!kw) return true
  return getCardSearchText(item).toLowerCase().includes(kw)
}

// 在「已隐藏试课卡片」的可见池基础上，再叠加关键字过滤
const filteredPool = computed(() =>
  visiblePool.value.filter((item) => cardMatchesKeyword(item, searchKeyword.value))
)

// 打开卡片详情弹层。
// 推荐弹层**不关**：详情层用更高的 z-index 盖在它上面，关掉详情就回到推荐层，
// 而且推荐层的滚动位置也不会丢（见样式里的 .detail-mask）
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
  const currentRole = userStore.currentRole

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
      role: userStore.currentRole,
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

// 拉取匹配池列表：导师拉家庭池，家庭拉导师池
const loadMatchPool = () => {
  const currentRole = userStore.currentRole

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
  // 未登录时拦截：提示并跳转到登录页，已登录才继续走下面的逻辑
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    // 延后一帧再跳转，避开和页面加载/切换生命周期的竞态，避免 reLaunch:fail timeout
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/login' })
    }, 60)
    return
  }

  // 已登录但还没选身份：跳身份选择页，必须选完身份才能使用匹配功能
  if (!userStore.boundRole) {
    uni.showToast({ title: '请先选择身份', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/role-first/role-first' })
    }, 60)
    return
  }

  if (userStore.profileCompleted) {
    loadTrialState()
    loadMatchPool()
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
/* 匹配底卡：和「联系」页的 .card.section-panel 同款，让里面的白卡片有层次。
   （半透明，让背景图透出来） */
.card.section-panel {
  background: rgba(233, 238, 247, 0.8);
  border: 2rpx solid #cdd8e8;
}

/* 搜索框：白底小卡片，嵌在匹配底卡里面 */
.search-bar {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  border: 2rpx solid #e7ebf3;
}
.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1f2a3d;
  background: transparent;
}
.search-clear {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #97a2b5;
  padding: 4rpx 12rpx;
}

/* 空状态：居中显示 */
.section-empty {
  padding: 20rpx 0 8rpx;
  text-align: center;
}

/* 详情层要盖在推荐层上面。
   两层都用 .popup-mask（z-index 999），DOM 里推荐层在后面 → 默认会盖住详情层，
   所以给详情层抬到 1000。这样从推荐里点「查看详情」，关掉后能回到推荐层。 */
.detail-mask {
  z-index: 1000;
}

/* 推荐弹层：标题固定在顶部，只有下面的列表滚动。
   这样不管列表多长，弹层高度都是确定的，不会出现「顶部卡片被切一半、标题看不见」。 */
.recommend-panel {
  /* 滚动交给里面的 scroll-view，弹层自己不滚 */
  overflow: hidden;
}

/* ⚠️ 小程序 scroll-view 必须有「确定高度」才能滚动 ——
   用 flex / max-height 撑不出高度，内容会被直接剪断、滚不动。
   和 My.vue 弹层里的 .modal-list 是同一个坑，所以这里写死一个 vh 值。 */
.recommend-scroll {
  height: 58vh;
}

/* 列表底部留一点空隙，免得最后一张卡片贴着弹层底边 */
.recommend-scroll .popup-content {
  padding-bottom: 16rpx;
}

/* 推荐弹层里的卡片：主列表那张是固定 400rpx 高（为了让列表整齐），
   弹层里底端还要多一行匹配度，所以改成按内容自适应，否则会被裁掉 */
.recommend-card {
  height: auto;
}

/* 卡片底端的匹配度 */
.match-score {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid #edf0f5;
  text-align: center;
}

.match-score-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #2f80ed;
}
</style>
