/**
 * 资料表单的选项常量。
 *
 * 供家长端 / 导师端资料页（family-data / mentor-data）的多选标签组使用，
 * 数组同时充当「可选项列表」和「合法值白名单」。
 * 带「其他」结尾的选项需配合对应的 *Other 手填输入框使用。
 * 家长端与导师端共用科目 / 形式选项，其余按端各自维护。
 */

// 科目选项（家长端「需要辅导的科目」和导师端「可辅导科目」共用）
const subjectOptions = ['语文', '数学', '英语', '化学', '生物', '政治', '历史', '体育', '绘画', '音乐', '地理', '其他']
// 上课形式选项（家长端「希望的上课形式」和导师端「辅导形式」共用）
const modeOptions = ['线上', '线下']

// 导师端：可辅导科目
export const mentorSubjectOptions = subjectOptions
// 家长端：需要辅导的科目
export const familySubjectOptions = subjectOptions

// 导师端：辅导风格类型（多选）
export const mentorStyleTypeOptions = ['情感支持型', '鼓励启发型', '灵活应变型', '结构化引导型', '耐心倾听型']

// 导师端：辅导形式（线上/线下，多选）
export const mentorTeachingModeOptions = modeOptions

// 家长端：孩子学习困难点（多选，含「其他」）
export const familyDifficultyOptions = ['基础知识不牢固', '解题思路不清晰，方法欠缺', '学习效率低，容易拖延', '对科目缺乏兴趣，动力不足', '考试时容易紧张，发挥失常', '其他']

// 家长端：期望的老师特质（多选）
export const familyTeacherTraitOptions = [
  '学科知识扎实，讲题能力强',
  '讲解清晰有条理，能化繁为简',
  '有耐心，善于鼓励，不轻易发脾气',
  '能帮助孩子建立良好的学习习惯',
  '性格开朗，有亲和力，能调动孩子积极性',
  '认真负责，守时，沟通及时',
  '能洞察孩子学习中的困难点，针对性解决'
]

// 家长端：期望的教学风格（多选）
export const familyTeachingStyleOptions = ['启发引导型', '问题向导型', '鼓励陪伴型', '系统讲解型', '严格督促型']

// 家长端：希望的上课形式（线上/线下，多选）
export const familyClassModeOptions = modeOptions
