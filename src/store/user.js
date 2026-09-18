/**
 * 全局用户状态仓库（Pinia）。
 *
 * 职责：集中管理登录态、身份角色、资料表单、试课卡片这四块状态，
 * 并负责把它们持久化到本地缓存（uni.setStorageSync），下次打开小程序时自动恢复。
 *
 * 快速导览：
 *   - 登录态：token / openid / isLoggedIn / setLoginInfo
 *   - 身份：role（当前使用的身份）、boundRole（后端绑定的锁定身份，一个微信只能绑一种）
 *   - 资料：profile（家长端 / 导师端共用的字段池）、updateProfile、completeProfile
 *   - 试课：pendingTrialCards（待试课）、
 *           formalClassCards（正式上课）、
 *           「联系」tab 数字徽标 unreadMessageCount + syncMessageBadge + markMessageViewed
 *   - 持久化：persistUserState（写缓存）/ restoreUserState（store 创建时读缓存）
 *
 * 注意：试课卡片列表（pendingTrialCards 等）不持久化，
 * 每次进入联系页后通过 setTrialLists 用后端返回的最新数据整体覆盖。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_BASE_URL } from '../utils/api'

export const useUserStore = defineStore('user', () => {
  const role = ref('')  // 用户身份角色（家长/友导师）
  const boundRole = ref('') // 当前微信账号在后端已经绑定的唯一身份
  const token = ref('') // 当前登录凭证
  const openid = ref('') // 微信登录后的唯一身份标识
  const isLoggedIn = ref(false) // 当前是否已登录
  const profileCompleted = ref(false) // 标记资料表单是否完整填写并提交
  const profileCancelled = ref(false) // 标记用户中途退出、放弃填写表单
  const pendingTrialCards = ref([]) // 点击“进行试课”后，进入联系页待试课列表的卡片
  const formalClassCards = ref([]) // 进入正式上课阶段后的卡片，先预留给联系页正式上课区域
  const unreadMessageCount = computed(() => countUnseen()) // 联系页有几张「没看过」的卡片，显示在底部「联系」tab 的数字徽标上
  // 已读记录：按账号(openid)分别保存看过的卡片。值是 { 卡片id:所在区: true }。
  // 卡片键形如 `卡片id:pending`（待试课）或 `卡片id:formal`（正式上课），
  // 这样「待试课转正式上课」这种状态变化也会当作一条没看过的新消息再提示一次。
  const seenCardsByOpenid = ref({})

  // 统一共用资料对象，同时兼容家长端、友导师端两套表单数据。
  // 字段按「导师端 / 家庭端」两大类混排，注释里标注了各自属于哪一端。
  // 抽成函数：store 初始化和「重置开发身份」都要用，保证拿到的是全新的空资料。
  const createEmptyProfile = () => ({
    name: '',//名字（两端通用）
    phone: '',//手机号（两端通用）
    parentName: '',//家长称呼（两端通用）
    wechat: '',//微信号（两端通用）
    major: '',//专业（导师端）
    mentorProject: '',//导师所属项目，如大创/志愿项目（导师端）
    coreMember: '',//是否核心成员（导师端）
    school: '',//学校（导师端）
    college: '',//学院（导师端）
    area: '',//所在区域，下拉选项值（两端通用）
    areaOther: '',//区域选「其他」时手填的具体内容（两端通用）
    city: '',//所在城市（导师端）
    age: '',//年龄（导师端）
    gender: '',//性别（两端通用）
    grade: '',//孩子年级，下拉选项值（家庭端）
    gradeOther: '',//年级选「其他」时手填的具体内容（家庭端）
    mentorSubjects: [],//可辅导科目（有序多选，点击顺序=熟练度排序）（导师端）
    mentorSubjectOther: '',//科目选「其他」时手填（导师端）
    mentorTeachingGradeRange: [],//意向教学年级段：小学/初中/高中（多选、无序）（导师端）
    mentorStyleTypes: [],//辅导风格类型（多选）（导师端）
    mentorTeachingModes: [],//辅导形式：线上/线下（多选）（导师端）
    mentorSummerLocation: '',//暑假期间所在地（导师端）
    mentorSchoolLocation: '',//开学期间所在地（导师端）
    mentorClassFrequency: '',//可接受的上课频率（导师端）
    subjects: [],//需要辅导的科目（有序多选，点击顺序=需求优先级）（家庭端）
    subjectOther: '',//科目选「其他」时手填（家庭端）
    difficulties: [],//孩子学习困难点（多选）（家庭端）
    difficultyOther: '',//困难点选「其他」时手填（家庭端）
    teacherTraits: [],//期望的老师特质（多选）（家庭端）
    teachingStyles: [],//期望的教学风格（多选）（家庭端）
    mainFocus: '',//最希望改善的方面（家庭端）
    mainFocusOther: '',//主诉选「其他」时手填（家庭端）
    learningState: '',//当前学习状态描述（家庭端）
    communicationExpectation: '',//期望的沟通频率（家庭端）
    communicationExpectationOther: '',//沟通频率选「其他」时手填（家庭端）
    understanding: '',//家长对辅导的理解程度（家庭端）
    feedbackWillingness: '',//配合反馈的意愿（家庭端）
    extraNote: '',//额外备注（家庭端）
    classModes: [],//希望的上课形式：线上/线下（多选）（家庭端）
    classFrequency: '',//希望的上课频率（家庭端）
    intro: ''//自我介绍 / 补充说明（家庭端）
  })

  const profile = ref(createEmptyProfile())

  // 当前身份对应的「后端角色值」：导师 → 'mentor'，家庭 → 'family'。
  // ⚠️ 还没选身份时必须返回空串，绝不能兜底成 'family' ——
  // 否则新账号会被当成家庭去查试课 / 匹配数据，看起来就是「默认家庭身份」。
  const currentRole = computed(() => {
    if (role.value === 'mentor' || role.value === 'family') {
      return role.value
    }

    return ''
  })

  const persistUserState = () => {// 将当前用户状态持久化到本地缓存。
                                  // 这样即使关闭小程序，重新进入时也能恢复登录态、身份和资料信息。
    if (typeof uni === 'undefined') {
      return
    }

    uni.setStorageSync('match-user-state', {
      role: role.value,
      boundRole: boundRole.value,
      token: token.value,
      openid: openid.value,
      isLoggedIn: isLoggedIn.value,
      profileCompleted: profileCompleted.value,
      profile: profile.value
    })
  }

  const restoreUserState = () => {// 从本地缓存恢复用户状态。
                                  // 如果之前已经保存过登录信息、身份或资料，这里会在 store 初始化时读回来。
    if (typeof uni === 'undefined') {
      return
    }

    const savedState = uni.getStorageSync('match-user-state')

    if (!savedState || typeof savedState !== 'object') {
      return
    }
  // 依次恢复基础登录状态和身份信息；
  // 如果某个字段不存在，就回退到默认值。
    role.value = savedState.role || ''
    boundRole.value = savedState.boundRole || ''
    token.value = savedState.token || ''
    openid.value = savedState.openid || ''
    isLoggedIn.value = Boolean(savedState.isLoggedIn && savedState.token)
    profileCompleted.value = savedState.profileCompleted ?? profileCompleted.value
  // 如果缓存里有资料对象，就把它合并回当前 profile，
  // 保留原始字段结构，同时用缓存值覆盖对应字段。
    if (savedState.profile && typeof savedState.profile === 'object') {
      profile.value = {
        ...profile.value,
        ...savedState.profile
      }
    }
  }

  // store 创建时立即执行：尝试从本地缓存恢复上次的登录态和资料
  restoreUserState()

  // 恢复每个账号的「联系页已读记录」，杀掉小程序重开后也不丢。
  // 按 openid 分别保存，切账号时互不干扰。
  if (typeof uni !== 'undefined') {
    const savedSeen = uni.getStorageSync('match-message-seen')
    if (savedSeen && typeof savedSeen === 'object') {
      seenCardsByOpenid.value = savedSeen
    }
  }

  // 设置用户身份角色
  const setRole = (value) => {
    role.value = value
    persistUserState()
  }

  // 同步后端绑定身份。后端返回绑定身份时顺便把它设为当前角色，
  // 处理「已绑定过身份的老用户重新进入小程序」的场景。
  const setBoundRole = (value) => {
    boundRole.value = value || ''
    if (!role.value && boundRole.value) {
      role.value = boundRole.value
    }
    persistUserState()
  }

  // 保存微信登录后的最小身份信息
  const setLoginInfo = (payload) => {
    token.value = payload.token || ''
    openid.value = payload.openid || ''
    isLoggedIn.value = Boolean(token.value)
    // 每次重新登录时，都以后端返回的最新绑定身份为准，
    // 避免本地旧缓存导致已经重置过的账号仍然跳过选身份页面。
    boundRole.value = payload.boundRole || ''
    role.value = payload.boundRole || ''

    // 注意：这里不清空「已读记录」——已读是按 openid 分别存的，
    // 新账号自然读取自己那份，不会把上一个人的已读状态带过来，也不会误报红点。

    persistUserState()
  }

  // 开发调试用：一键清空登录态与本地缓存，回到全新账号。
  // 这样开发者无需手动清小程序缓存，就能重新走「登录 → 选身份 → 匹配 → 反馈」完整流程。
  const resetLoginState = () => {
    role.value = ''
    boundRole.value = ''
    token.value = ''
    openid.value = ''
    isLoggedIn.value = false
    profileCompleted.value = false
    profileCancelled.value = false
    // 资料也一并清空：否则重置后进资料表单，还会看到上一个人填的内容
    profile.value = createEmptyProfile()

    if (typeof uni !== 'undefined') {
      // 清掉 persistUserState 写入的登录态缓存
      uni.removeStorageSync('match-user-state')
      // 清掉 login.vue 持久化的开发客户端 ID，下次登录会生成全新 openid（全新账号）
      uni.removeStorageSync('match-dev-client-id')
      // 重置开发身份：已读记录整份清空（全新账号，没有可继承的已读状态）
      uni.removeStorageSync('match-message-seen')
    }

    seenCardsByOpenid.value = {}
  }

  // 清空本地资料并标记未完成（切换账号时用，避免看到上一个人填的内容）
  const clearProfile = () => {
    profile.value = createEmptyProfile()
    profileCompleted.value = false
  }

  // 更新表单：合并传入的表单数据，保留原有字段不覆盖
  const updateProfile = (payload) => {
    profile.value = {
      ...profile.value,
      ...payload
    }
    persistUserState()
  }

  // 一张卡片在当前列表里的「键」，pending=待试课，formal=正式上课
  const cardKey = (item, area) => `${item.id}:${area}`

  // 当前账号看过的卡片集合（按 openid 取，没有就返回空对象，不擅自创建）
  const currentSeenMap = () => seenCardsByOpenid.value[openid.value] || {}

  // 算出当前账号有几张「没看过」的卡片：
  // 列表里有、但不在已读集合里的，都算 1 张。看过的、被移除的都不再计数。
  const countUnseen = () => {
    if (!openid.value) {
      return 0
    }

    const seen = currentSeenMap()
    let count = 0

    pendingTrialCards.value.forEach((item) => {
      if (!seen[cardKey(item, 'pending')]) {
        count += 1
      }
    })
    formalClassCards.value.forEach((item) => {
      if (!seen[cardKey(item, 'formal')]) {
        count += 1
      }
    })

    return count
  }

  // 把当前账号的「已读记录」写入本地缓存，重开小程序也不丢
  const persistSeen = () => {
    if (typeof uni === 'undefined') {
      return
    }

    uni.setStorageSync('match-message-seen', seenCardsByOpenid.value)
  }

  // 同步底部「联系」tab 的数字徽标。
  // 徽标 API 只能在底部菜单页面调用；如果用户正看着联系页，当下内容直接算已读。
  const syncMessageBadge = () => {
    if (typeof uni === 'undefined') {
      return
    }

    const currentPage = getCurrentPages().slice(-1)[0]
    // 所有底部 tab 页（新增 tab 时要同步加进来），「联系」在下标 2
    const tabBarPages = [
      'pages/home/home',
      'pages/match/match',
      'pages/message/message',
      'pages/feedback/feedback',
      'pages/My/My'
    ]

    if (!tabBarPages.includes(currentPage?.route)) {
      return
    }

    if (currentPage.route === 'pages/message/message') {
      // 用户正看着联系页：把当前列表每张卡片都标记为已读
      markMessageViewed()
      return
    }

    const changes = unreadMessageCount.value

    if (changes > 0) {
      uni.setTabBarBadge({ index: 2, text: String(changes) })
    } else {
      uni.removeTabBarBadge({ index: 2 })
    }
  }

  // 点击“进行试课”后，把当前卡片加入待试课列表
  const addPendingTrialCard = (item) => {
    const existed = pendingTrialCards.value.some((card) => String(card.id) === String(item.id))

    if (existed) {
      syncMessageBadge()
      return 'exists'
    }

    pendingTrialCards.value = [
      {
        ...item
      },
      ...pendingTrialCards.value
    ]

    syncMessageBadge()
    return 'added'
  }

  // 用后端返回的最新列表整体覆盖本地试课状态，并顺手刷新「联系」tab 徽标
  const setTrialLists = (pendingList = [], formalList = []) => {
    pendingTrialCards.value = Array.isArray(pendingList) ? pendingList : []
    formalClassCards.value = Array.isArray(formalList) ? formalList : []
    syncMessageBadge()
  }

  // 从后端拉当前用户最新的待试课 / 正式上课列表（静默，不弹提示）。
  // 首页、匹配页等地方调用它，用户不在联系页也能发现联系页的新变化。
  const refreshTrialLists = () => {
    if (!openid.value || !isLoggedIn.value) {
      return
    }

    uni.request({
      url: `${API_BASE_URL}/trial/list?openid=${encodeURIComponent(openid.value)}&role=${currentRole.value}`,
      method: 'GET',
      success: (res) => {
        setTrialLists(res.data?.pending || [], res.data?.formal || [])
      }
    })
  }

  // 进入联系页后调用：把当前列表里每张卡片都标记为「已读」，并清掉底部「联系」上的数字徽标。
  // 已读记录按 openid 分开存，切账号不会把别人的已读带过来。
  const markMessageViewed = () => {
    if (!openid.value) {
      return
    }

    const seen = { ...currentSeenMap() }

    pendingTrialCards.value.forEach((item) => {
      seen[cardKey(item, 'pending')] = true
    })
    formalClassCards.value.forEach((item) => {
      seen[cardKey(item, 'formal')] = true
    })

    seenCardsByOpenid.value = {
      ...seenCardsByOpenid.value,
      [openid.value]: seen
    }
    persistSeen()

    if (typeof uni !== 'undefined') {
      uni.removeTabBarBadge({ index: 2 })
    }
  }

  // 从待试课列表移除卡片，移除后该卡片会重新回到匹配页
  const removePendingTrialCard = (cardId) => {
    pendingTrialCards.value = pendingTrialCards.value.filter((item) => String(item.id) !== String(cardId))
    syncMessageBadge()
  }

  // 试课反馈选择“愿意”后，把卡片从待试课移动到正式上课
  const movePendingTrialCardToFormal = (cardId) => {
    const targetCard = pendingTrialCards.value.find((item) => String(item.id) === String(cardId))

    if (!targetCard) {
      return
    }

    const existed = formalClassCards.value.some((item) => String(item.id) === String(cardId))

    if (!existed) {
      formalClassCards.value = [
        {
          ...targetCard
        },
        ...formalClassCards.value
      ]
    }

    pendingTrialCards.value = pendingTrialCards.value.filter((item) => String(item.id) !== String(cardId))
    syncMessageBadge()
  }

  // 标记表单填写完成，允许进入匹配、联系页面
  const completeProfile = () => {
    profileCompleted.value = true
    profileCancelled.value = false
    persistUserState()
  }

  // 用户中途退出表单时调用，标记放弃填写
  const cancelProfile = () => {
    profileCancelled.value = true
    persistUserState()
  }

  // 消费取消标记，读取后重置为false（只生效一次）
  const consumeProfileCancelled = () => {
    if (profileCancelled.value) {
      profileCancelled.value = false
      return true
    }
    return false
  }

  // 对外导出所有状态与修改方法
  return {
    role,
    currentRole,
    boundRole,
    token,
    openid,
    isLoggedIn,
    profile,
    profileCompleted,
    profileCancelled,
    pendingTrialCards,
    formalClassCards,
    unreadMessageCount,
    setRole,
    setBoundRole,
    setLoginInfo,
    resetLoginState,
    clearProfile,
    updateProfile,
    syncMessageBadge,
    addPendingTrialCard,
    setTrialLists,
    refreshTrialLists,
    markMessageViewed,
    removePendingTrialCard,
    movePendingTrialCardToFormal,
    completeProfile,
    cancelProfile,
    consumeProfileCancelled
  }
})
