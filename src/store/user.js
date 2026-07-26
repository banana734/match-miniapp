import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  const hasUnreadTrialNotice = ref(false) // 联系菜单红点是否显示，表示是否有未查看的新试课消息

  // 统一共用资料对象，同时兼容家长端、友导师端两套表单数据
  const profile = ref({
    name: '',
    phone: '',
    parentName: '',
    wechat: '',
    major: '',
    mentorProject: '',
    coreMember: '',
    school: '',
    college: '',
    area: '',
    areaOther: '',
    city: '',
    age: '',
    gender: '',
    grade: '',
    gradeOther: '',
    mentorSubjects: [],
    mentorSubjectOther: '',
    mentorTeachingGradeRange: '',
    mentorStyleTypes: [],
    mentorTeachingModes: [],
    mentorSummerLocation: '',
    mentorSchoolLocation: '',
    mentorClassFrequency: '',
    subjects: [],
    subjectOther: '',
    difficulties: [],
    difficultyOther: '',
    teacherTraits: [],
    teachingStyles: [],
    mainFocus: '',
    mainFocusOther: '',
    learningState: '',
    communicationExpectation: '',
    communicationExpectationOther: '',
    understanding: '',
    feedbackWillingness: '',
    extraNote: '',
    classModes: [],
    classFrequency: '',
    intro: ''
  })

  const persistUserState = () => {
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

  const restoreUserState = () => {
    if (typeof uni === 'undefined') {
      return
    }

    const savedState = uni.getStorageSync('match-user-state')

    if (!savedState || typeof savedState !== 'object') {
      return
    }

    role.value = savedState.role || ''
    boundRole.value = savedState.boundRole || ''
    token.value = savedState.token || ''
    openid.value = savedState.openid || ''
    isLoggedIn.value = Boolean(savedState.isLoggedIn && savedState.token)
    profileCompleted.value = savedState.profileCompleted ?? profileCompleted.value

    if (savedState.profile && typeof savedState.profile === 'object') {
      profile.value = {
        ...profile.value,
        ...savedState.profile
      }
    }
  }

  restoreUserState()

  // 设置用户身份角色
  const setRole = (value) => {
    role.value = value
    persistUserState()
  }

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

    if (payload.boundRole) {
      boundRole.value = payload.boundRole
      role.value = payload.boundRole
    }

    persistUserState()
  }

  // 更新表单：合并传入的表单数据，保留原有字段不覆盖
  const updateProfile = (payload) => {
    profile.value = {
      ...profile.value,
      ...payload
    }
    persistUserState()
  }

  // 同步联系菜单上的红点状态
  const syncTrialLessonBadge = () => {
    if (typeof uni === 'undefined') {
      return
    }

    // 红点 API 只能在底部菜单页面调用
    const currentPage = getCurrentPages().slice(-1)[0]
    const tabBarPages = [
      'pages/home/home',
      'pages/match/match',
      'pages/message/message',
      'pages/My/My'
    ]

    if (!tabBarPages.includes(currentPage?.route)) {
      return
    }

    if (hasUnreadTrialNotice.value) {
      uni.showTabBarRedDot({
        index: 2
      })
      return
    }

    uni.hideTabBarRedDot({
      index: 2
    })
  }

  // 点击“进行试课”后，把当前卡片加入待试课列表
  const addPendingTrialCard = (item) => {
    const existed = pendingTrialCards.value.some((card) => String(card.id) === String(item.id))

    if (existed) {
      hasUnreadTrialNotice.value = true
      syncTrialLessonBadge()
      return 'exists'
    }

    pendingTrialCards.value = [
      {
        ...item
      },
      ...pendingTrialCards.value
    ]

    hasUnreadTrialNotice.value = true
    syncTrialLessonBadge()
    return 'added'
  }

  // 用后端返回的最新列表整体覆盖本地试课状态。
  const setTrialLists = (pendingList = [], formalList = []) => {
    pendingTrialCards.value = Array.isArray(pendingList) ? pendingList : []
    formalClassCards.value = Array.isArray(formalList) ? formalList : []
  }

  // 进入联系页后，标记试课消息已查看，并隐藏菜单红点
  const markTrialLessonViewed = () => {
    hasUnreadTrialNotice.value = false
    syncTrialLessonBadge()
  }

  // 从待试课列表移除卡片，移除后该卡片会重新回到匹配页
  const removePendingTrialCard = (cardId) => {
    pendingTrialCards.value = pendingTrialCards.value.filter((item) => String(item.id) !== String(cardId))
    syncTrialLessonBadge()
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
    syncTrialLessonBadge()
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
    boundRole,
    token,
    openid,
    isLoggedIn,
    profile,
    profileCompleted,
    profileCancelled,
    pendingTrialCards,
    formalClassCards,
    hasUnreadTrialNotice,
    setRole,
    setBoundRole,
    setLoginInfo,
    updateProfile,
    syncTrialLessonBadge,
    addPendingTrialCard,
    setTrialLists,
    markTrialLessonViewed,
    removePendingTrialCard,
    movePendingTrialCardToFormal,
    completeProfile,
    cancelProfile,
    consumeProfileCancelled
  }
})
