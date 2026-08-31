/**
 * 匹配池路由：把「对方」的用户资料组装成卡片，供小程序匹配页展示。
 *
 * 对应接口：
 *   GET /api/match/list?role=family|mentor
 *   —— family 看到的是导师卡片池，mentor 看到的是家庭卡片池（各取对侧）。
 *
 * 卡片结构（前端 match.vue / message.vue 直接消费）：
 *   { id, title, subtitle, badge, preview: 卡片正面摘要, details: 详情弹窗字段 }
 *   preview/details 里的每项用 4 个小工厂函数生成：
 *   single 单选 / plain 纯文本 / multi 多选 / sort 有序多选（按用户点的顺序）。
 */
const {
  readUnifiedDb,
  getUserRecords
} = require('../utils/unified-db')

// 保证结果是数组：过滤掉空值，非数组输入返回 []。
const list = (items = []) => {
  return Array.isArray(items) ? items.filter(Boolean) : []
}

// 单选字段：带 kind: 'single'，值为空时显示「未填写」。
const single = (label, value) => ({
  label,
  kind: 'single',
  value: value || '未填写'
})

// 纯文本字段：不带 kind，值为空时显示「未填写」。
const plain = (label, value) => ({
  label,
  value: value || '未填写'
})

// 多选字段：kind: 'multi'，空数组时显示 ['未填写']。
const multi = (label, items) => ({
  label,
  kind: 'multi',
  items: list(items).length ? list(items) : ['未填写']
})

// 有序多选字段：kind: 'sort'（前端按用户点选顺序渲染，体现偏好优先级）。
const sort = (label, items) => ({
  label,
  kind: 'sort',
  items: list(items).length ? list(items) : ['未填写']
})

// 取地区文案：选了「其他」就用 areaOther 自填内容，否则直接用 area。
const getAreaText = (profile = {}) => {
  if (profile.area === '其他') {
    return profile.areaOther || '未填写'
  }

  return profile.area || '未填写'
}

// 取年级文案：选了「其他」就用 gradeOther 自填内容，否则直接用 grade。
const getGradeText = (profile = {}) => {
  if (profile.grade === '其他') {
    return profile.gradeOther || '未填写'
  }

  return profile.grade || '未填写'
}

// 把多选数组里的「其他」替换成「其他：xxx」的形式（xxx 为用户自填内容）。
// 例如 ['数学','其他'] + otherValue='物理竞赛' → ['数学','其他：物理竞赛']。
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

// 把家庭资料转换成匹配页卡片结构（导师在匹配页看到的就是这种卡片）。
// preview 是卡片正面显示的 4 项摘要，details 是点开详情弹窗后的完整 20 项资料。
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

// 把导师资料转换成匹配页卡片结构（家庭在匹配页看到的就是这种卡片）。
// preview 4 项摘要 + details 16 项完整资料。
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

// 按浏览者身份返回对侧卡片池：
//   浏览者是 mentor → 给家庭卡片；浏览者是 family → 给导师卡片。
// 抽成纯函数，调用方可以复用自己已经读到的 users，避免重复读库。
const buildPoolFromUsers = (users = [], role) => {
  if (role === 'mentor') {
    return users
      .filter((item) => item.role === 'family' && item.profile)
      .map(buildFamilyCard)
  }

  return users
    .filter((item) => item.role === 'mentor' && item.profile)
    .map(buildMentorCard)
}

// 根据当前浏览者身份，决定要返回哪一侧的匹配池（自己读库 + 调 buildPoolFromUsers）。
const getPoolByViewerRole = async (role) => {
  const db = await readUnifiedDb()
  return buildPoolFromUsers(getUserRecords(db), role)
}

// 匹配页列表接口：GET /api/match/list?role=family|mentor
// 返回 { success, role, list: 对侧卡片数组 }。
const getMatchList = async (role) => {
  return {
    success: true,
    role: role || 'family',
    list: await getPoolByViewerRole(role)
  }
}

module.exports = {
  getMatchList,
  buildPoolFromUsers
}
