const {
  readUnifiedDb,
  getUserRecords
} = require('../utils/unified-db')

const list = (items = []) => {
  return Array.isArray(items) ? items.filter(Boolean) : []
}

const single = (label, value) => ({
  label,
  kind: 'single',
  value: value || '未填写'
})

const plain = (label, value) => ({
  label,
  value: value || '未填写'
})

const multi = (label, items) => ({
  label,
  kind: 'multi',
  items: list(items).length ? list(items) : ['未填写']
})

const sort = (label, items) => ({
  label,
  kind: 'sort',
  items: list(items).length ? list(items) : ['未填写']
})

const getAreaText = (profile = {}) => {
  if (profile.area === '其他') {
    return profile.areaOther || '未填写'
  }

  return profile.area || '未填写'
}

const getGradeText = (profile = {}) => {
  if (profile.grade === '其他') {
    return profile.gradeOther || '未填写'
  }

  return profile.grade || '未填写'
}

const appendOtherItem = (items = [], otherValue = '') => {
  const values = list(items)

  if (!values.includes('其他') || !otherValue) {
    return values
  }

  return values.map((item) => {
    if (item !== '其他') {
      return item
    }

    return `其他：${otherValue}`
  })
}

// 把家庭资料转换成匹配页卡片结构。
const buildFamilyCard = (user = {}) => {
  const profile = user.profile || {}
  const subjectItems = appendOtherItem(profile.subjects, profile.subjectOther)
  const difficultyItems = appendOtherItem(profile.difficulties, profile.difficultyOther)
  const focusText = profile.mainFocus === '其他'
    ? (profile.mainFocusOther || '未填写')
    : (profile.mainFocus || '未填写')
  const communicationText = profile.communicationExpectation === '其他'
    ? (profile.communicationExpectationOther || '未填写')
    : (profile.communicationExpectation || '未填写')

  return {
    id: `family-${user.openid}`,
    title: profile.name || '未填写姓名',
    subtitle: getAreaText(profile),
    badge: '家庭',
    preview: [
      single('孩子性别', profile.gender),
      plain('家长称呼', profile.parentName),
      single('年级', getGradeText(profile)),
      sort('需要辅导科目', subjectItems)
    ],
    details: [
      plain('孩子姓名', profile.name),
      single('孩子性别', profile.gender),
      plain('家长称呼', profile.parentName),
      single('年级', getGradeText(profile)),
      plain('电话号码', profile.phone),
      plain('微信号', profile.wechat),
      plain('常住区域', getAreaText(profile)),
      sort('需要辅导科目', subjectItems),
      sort('学习困难', difficultyItems),
      sort('老师特质', profile.teacherTraits),
      sort('教学风格', profile.teachingStyles),
      single('辅导侧重点', focusText),
      single('关注学习状态', profile.learningState),
      single('沟通期望', communicationText),
      single('项目理解', profile.understanding),
      single('反馈意愿', profile.feedbackWillingness),
      multi('上课方式', profile.classModes),
      plain('上课频率', profile.classFrequency),
      plain('过往辅导经历', profile.intro),
      plain('额外备注', profile.extraNote)
    ]
  }
}

// 把导师资料转换成匹配页卡片结构。
const buildMentorCard = (user = {}) => {
  const profile = user.profile || {}
  const mentorSubjectItems = appendOtherItem(profile.mentorSubjects, profile.mentorSubjectOther)
  const gradeText = getGradeText(profile)
  const badgeText = profile.coreMember === '是' ? '骨干成员' : '普通成员'

  return {
    id: `mentor-${user.openid}`,
    title: profile.name || '未填写姓名',
    subtitle: `${profile.school || '未填写学校'} · ${profile.major || '未填写专业'}`,
    badge: badgeText,
    preview: [
      single('性别', profile.gender),
      single('项目参与', profile.mentorProject),
      sort('擅长科目', mentorSubjectItems),
      plain('意向教学年级', profile.mentorTeachingGradeRange)
    ],
    details: [
      plain('姓名', profile.name),
      single('性别', profile.gender),
      single('项目参与', profile.mentorProject),
      single('骨干成员', profile.coreMember),
      single('年级', gradeText),
      plain('学校', profile.school),
      plain('专业', profile.major),
      plain('学院', profile.college),
      plain('微信号', profile.wechat),
      sort('擅长科目', mentorSubjectItems),
      plain('意向教学年级', profile.mentorTeachingGradeRange),
      multi('风格类型', profile.mentorStyleTypes),
      multi('上课方式', profile.mentorTeachingModes),
      plain('暑假所在地', profile.mentorSummerLocation),
      plain('开学后所在地', profile.mentorSchoolLocation),
      plain('上课频率', profile.mentorClassFrequency)
    ]
  }
}

// 根据当前浏览者身份，决定要返回哪一侧的匹配池。
const getPoolByViewerRole = async (role) => {
  const db = await readUnifiedDb()
  const users = getUserRecords(db)

  if (role === 'mentor') {
    const familyUsers = users.filter((item) => item.role === 'family' && item.profile)
    if (familyUsers.length) {
      return familyUsers.map(buildFamilyCard)
    }

    return list(db.familyPool)
  }

  const mentorUsers = users.filter((item) => item.role === 'mentor' && item.profile)
  if (mentorUsers.length) {
    return mentorUsers.map(buildMentorCard)
  }

  return list(db.mentorPool)
}

// 获取匹配池列表。
const getMatchList = async (role) => {
  return {
    success: true,
    role: role || 'family',
    list: await getPoolByViewerRole(role)
  }
}

module.exports = {
  getMatchList,
  getPoolByViewerRole
}
