/**
 * 匹配打分：把「家庭资料 + 导师资料」算成一个 0~1 的匹配分。
 *
 * 只算四个维度（两侧都有对应字段、且值是可枚举的选项）：
 *   1. 科目           —— 覆盖率（不是余弦，理由见 scoreSubjects 注释）
 *   2. 意向教学年级段 —— 覆盖率（家庭只有一个年级，折算成学段后看导师接不接）
 *   3. 教学风格       —— 余弦（两侧词表不同，靠 MENTOR_STYLE_TO_FAMILY 映射到同一套轴）
 *   4. 上课方式       —— 余弦（两侧同一套词表，不用映射）
 *
 * 总分 = 各维度得分按 DIMENSION_WEIGHTS 加权平均。
 * 某一侧没填某个维度时，该维度直接剔除、剩下的权重重新归一化
 * —— 「没填」不等于「不匹配」，不该因为没填就被扣分。
 *
 * 刻意没做的维度（两侧对不上，见项目记忆）：
 *   地域（导师侧仍是自由输入框）、上课频率（两侧都是输入框）、
 *   家庭「期望老师特质」（导师侧没有这道题）。
 */

// 保证结果是数组：丢掉空值，非数组返回空数组。
const list = (items = []) => {
  return Array.isArray(items) ? items.filter(Boolean) : []
}

// 有序多选的位置权重：家长/导师填的顺序本身就是优先级，越靠前越重要。
// 第 1 位 1.0、第 2 位 0.6、第 3 位及以后都 0.3。
const orderWeight = (index) => {
  if (index === 0) {
    return 1.0
  }
  if (index === 1) {
    return 0.6
  }
  return 0.3
}

// 导师「风格类型」→ 家庭「期望教学风格」的映射表。
// 统一的轴就是家庭侧那 5 个选项（家庭侧是恒等映射，不用查表）。
// 权重规则：只有「一个导师词独占一条轴」才是 1.0；
//   - 两个导师词抢同一条轴（情感支持型 / 耐心倾听型 → 鼓励陪伴型）
//   - 一个导师词落在两条轴（结构化引导型 → 系统讲解型 + 严格督促型）
// 这两种情况都按 0.5 给。
const MENTOR_STYLE_TO_FAMILY = {
  '鼓励启发型': { '启发引导型': 1.0 },
  '灵活应变型': { '问题向导型': 1.0 },
  '情感支持型': { '鼓励陪伴型': 0.5 },
  '耐心倾听型': { '鼓励陪伴型': 0.5 },
  '结构化引导型': { '系统讲解型': 0.5, '严格督促型': 0.5 }
}

// 四个维度的相对重要性。科目是硬门槛（对不上基本没戏），年级段次之，
// 风格是加分项，上课方式最轻。
const DIMENSION_WEIGHTS = {
  subjects: 0.5,
  grades: 0.25,
  styles: 0.15,
  modes: 0.1
}

// 把一串词转成「轴 → 权重」的稀疏向量（每个词权重都是 1，用于无序多选）。
const buildVector = (items = []) => {
  const vector = {}
  list(items).forEach((item) => {
    vector[item] = 1
  })
  return vector
}

// 余弦相似度：两个「轴 → 权重」的稀疏向量。
// 任意一边是空向量就返回 0，避免除零。
const cosine = (a = {}, b = {}) => {
  let dot = 0
  Object.keys(a).forEach((axis) => {
    if (b[axis]) {
      dot += a[axis] * b[axis]
    }
  })

  const norm = (vector) => {
    return Math.sqrt(Object.keys(vector).reduce((sum, axis) => sum + vector[axis] * vector[axis], 0))
  }

  const normA = norm(a)
  const normB = norm(b)

  if (!normA || !normB) {
    return 0
  }

  return dot / (normA * normB)
}

// 维度一：科目覆盖率。
// 分子分母都用「家庭侧」的权重，所以导师勾多勾少都不影响
// —— 家长只要数学时，「只会数学」和「数学+化学」得分一样，不会因为会得多反而吃亏。
// 这里不用余弦，就是因为余弦分母会把导师的科目数量算进去。
// 返回 null 表示这个维度没法算（有一侧没填），调用方会把它剔除。
const scoreSubjects = (familyProfile = {}, mentorProfile = {}) => {
  const needs = list(familyProfile.subjects)
  const canTeach = list(mentorProfile.mentorSubjects)

  if (!needs.length || !canTeach.length) {
    return null
  }

  let total = 0
  let hit = 0

  needs.forEach((subject, index) => {
    const weight = orderWeight(index)
    total += weight
    if (canTeach.includes(subject)) {
      hit += weight
    }
  })

  return total ? hit / total : null
}

// 家庭「孩子年级」→ 学段。
// 家庭侧填的是一个具体年级（小学一年级…高三），导师侧填的是「小学 / 初中 / 高中」，
// 所以先折算成学段才能比。
const familyStageOf = (grade = '') => {
  if (grade.includes('小学')) {
    return '小学'
  }
  if (grade.startsWith('初')) {
    return '初中'
  }
  if (grade.startsWith('高')) {
    return '高中'
  }
  return ''
}

// 维度二：意向教学年级段覆盖率。
// 家庭只有一个学段，所以结果就是「导师接不接这一段」：接 = 1，不接 = 0。
// 这里不用余弦 —— 余弦会让「三个学段都接」的导师反而拿低分（分母变大），
// 和实际想要的正好相反：愿意接更多学段，对家庭来说只会更好。
const scoreGrades = (familyProfile = {}, mentorProfile = {}) => {
  const stage = familyStageOf(familyProfile.grade || '')
  const accepted = list(mentorProfile.mentorTeachingGradeRange)

  if (!stage || !accepted.length) {
    return null
  }

  return accepted.includes(stage) ? 1 : 0
}

// 维度三：教学风格余弦。
// 家庭侧直接用自己的选项作为轴；导师侧按映射表展开到这些轴上。
const scoreStyles = (familyProfile = {}, mentorProfile = {}) => {
  const familyStyles = list(familyProfile.teachingStyles)
  const mentorStyles = list(mentorProfile.mentorStyleTypes)

  if (!familyStyles.length || !mentorStyles.length) {
    return null
  }

  const familyVector = {}
  familyStyles.forEach((style, index) => {
    familyVector[style] = (familyVector[style] || 0) + orderWeight(index)
  })

  const mentorVector = {}
  mentorStyles.forEach((style) => {
    const mapped = MENTOR_STYLE_TO_FAMILY[style]
    if (!mapped) {
      return
    }
    Object.keys(mapped).forEach((axis) => {
      mentorVector[axis] = (mentorVector[axis] || 0) + mapped[axis]
    })
  })

  return cosine(familyVector, mentorVector)
}

// 维度四：上课方式余弦。两侧都是无序多选、词表一样，直接算。
const scoreModes = (familyProfile = {}, mentorProfile = {}) => {
  const familyModes = buildVector(familyProfile.classModes)
  const mentorModes = buildVector(mentorProfile.mentorTeachingModes)

  if (!Object.keys(familyModes).length || !Object.keys(mentorModes).length) {
    return null
  }

  return cosine(familyModes, mentorModes)
}

// 按固定顺序传「家庭资料 + 导师资料」，算出总分（0~1）。
const scorePair = (familyProfile = {}, mentorProfile = {}) => {
  const parts = [
    { weight: DIMENSION_WEIGHTS.subjects, value: scoreSubjects(familyProfile, mentorProfile) },
    { weight: DIMENSION_WEIGHTS.grades, value: scoreGrades(familyProfile, mentorProfile) },
    { weight: DIMENSION_WEIGHTS.styles, value: scoreStyles(familyProfile, mentorProfile) },
    { weight: DIMENSION_WEIGHTS.modes, value: scoreModes(familyProfile, mentorProfile) }
  ]

  // 剔掉算不出来的维度（有一侧没填），剩下的权重重新归一化
  const usable = parts.filter((part) => part.value !== null)

  if (!usable.length) {
    return 0
  }

  const totalWeight = usable.reduce((sum, part) => sum + part.weight, 0)
  const totalScore = usable.reduce((sum, part) => sum + part.weight * part.value, 0)

  return totalScore / totalWeight
}

// 对外的入口：调用方只需要说清「我是谁、对方资料是什么」，不用关心上面谁在前谁在后。
// viewerRole 是当前浏览者的身份，viewerProfile 是自己的资料，otherProfile 是对侧资料。
const scoreProfiles = (viewerRole, viewerProfile = {}, otherProfile = {}) => {
  if (viewerRole === 'mentor') {
    return scorePair(otherProfile, viewerProfile)
  }

  return scorePair(viewerProfile, otherProfile)
}

module.exports = {
  scoreProfiles,
  MENTOR_STYLE_TO_FAMILY,
  DIMENSION_WEIGHTS
}
