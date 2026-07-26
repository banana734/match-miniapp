<template>
  <view class="container">
    <view class="card">
      <!-- 页面主标题 -->
      <text class="title">填写信息</text>
      <!-- 页面提示副标题 -->
      <text class="subtitle">第一次进入匹配前，先把基础资料补全。</text>

      <!-- 1. 孩子姓名输入框 -->
      <text class="question-label">1. 孩子姓名</text>
      <input v-model="form.name" class="input" placeholder="姓名或称呼" />

      <!-- 2. 孩子性别单选组 -->
      <text class="question-label">2. 孩子性别</text>
      <radio-group class="option-group" @change="handleGenderChange">
        <label class="option-item">
          <radio value="男" :checked="form.gender === '男'" />
          <text>男</text>
        </label>
        <label class="option-item">
          <radio value="女" :checked="form.gender === '女'" />
          <text>女</text>
        </label>
      </radio-group>

      <!-- 3. 孩子年级单选组 -->
      <text class="question-label">3. 孩子的年级是？</text>
      <radio-group class="option-group" @change="handleGradeChange">
        <label class="option-item">
          <radio value="小学一年级" :checked="form.grade === '小学一年级'" />
          <text>小学一年级</text>
        </label>
        <label class="option-item">
          <radio value="小学二年级" :checked="form.grade === '小学二年级'" />
          <text>小学二年级</text>
        </label>
        <label class="option-item">
          <radio value="小学三年级" :checked="form.grade === '小学三年级'" />
          <text>小学三年级</text>
        </label>
        <label class="option-item">
          <radio value="小学四年级" :checked="form.grade === '小学四年级'" />
          <text>小学四年级</text>
        </label>
        <label class="option-item">
          <radio value="小学五年级" :checked="form.grade === '小学五年级'" />
          <text>小学五年级</text>
        </label>
        <label class="option-item">
          <radio value="小学六年级" :checked="form.grade === '小学六年级'" />
          <text>小学六年级</text>
        </label>
        <label class="option-item">
          <radio value="初一" :checked="form.grade === '初一'" />
          <text>初一</text>
        </label>
        <label class="option-item">
          <radio value="初二" :checked="form.grade === '初二'" />
          <text>初二</text>
        </label>
        <label class="option-item">
          <radio value="初三" :checked="form.grade === '初三'" />
          <text>初三</text>
        </label>
        <label class="option-item">
          <radio value="高一" :checked="form.grade === '高一'" />
          <text>高一</text>
        </label>
        <label class="option-item">
          <radio value="高二" :checked="form.grade === '高二'" />
          <text>高二</text>
        </label>
        <label class="option-item">
          <radio value="高三" :checked="form.grade === '高三'" />
          <text>高三</text>
        </label>
      </radio-group>

      <!-- 4. 家长称呼输入框 -->
      <text class="question-label">4. 家长称呼</text>
      <input v-model="form.parentName" class="input" placeholder="请输入家长称呼" />

      <!-- 5. 家长手机号输入框 -->
      <text class="question-label">5. 家长电话号码</text>
      <input v-model="form.phone" class="input" placeholder="请输入电话号码" />

      <!-- 6. 微信号输入框 -->
      <text class="question-label">6. 微信号</text>
      <input v-model="form.wechat" class="input" placeholder="请输入微信号码" />

      <!-- 7. 家庭常住区域单选 -->
      <text class="question-label">7. 家庭常住区域</text>
      <radio-group class="option-group" @change="handleAreaChange">
        <label class="option-item">
          <radio value="四川省成都市高新区" :checked="form.area === '四川省成都市高新区'" />
          <text>四川省成都市高新区</text>
        </label>
        <label class="option-item">
          <radio value="四川省成都市金牛区" :checked="form.area === '四川省成都市金牛区'" />
          <text>四川省成都市金牛区</text>
        </label>
        <label class="option-item">
          <radio value="四川省成都市武侯区" :checked="form.area === '四川省成都市武侯区'" />
          <text>四川省成都市武侯区</text>
        </label>
        <label class="option-item">
          <radio value="四川省成都市锦江区" :checked="form.area === '四川省成都市锦江区'" />
          <text>四川省成都市锦江区</text>
        </label>
        <label class="option-item">
          <radio value="四川省成都市青羊区" :checked="form.area === '四川省成都市青羊区'" />
          <text>四川省成都市青羊区</text>
        </label>
        <label class="option-item">
          <radio value="四川省成都市其他区县" :checked="form.area === '四川省成都市其他区县'" />
          <text>四川省成都市其他区县</text>
        </label>
        <label class="option-item">
          <radio value="其他" :checked="form.area === '其他'" />
          <text>其他</text>
        </label>
      </radio-group>

      <!-- 选择其他区域时，展示自定义输入框 -->
      <input
        v-if="form.area === '其他'"
        v-model="form.areaOther"
        class="input"
        placeholder="请输入其他区域"
      />

      <!-- 8. 需要辅导科目多选标签（按点击顺序排序） -->
      <text class="question-label">8. 孩子目前最需要辅导的科目是（按点击顺序排序）</text>
      <view class="subject-list">
        <!-- 已选中科目，展示排序数字 -->
        <view
          v-for="subject in selectedSubjects"
          :key="subject"
          class="subject-tag"
          :class="{ active: true }"
          @tap="toggleSubject(subject)"
        >
          <text>{{ getSubjectOrder(subject) }}{{ subject }}</text>
        </view>
        <!-- 未选中科目 -->
        <view
          v-for="subject in unselectedSubjects"
          :key="`unselected-${subject}`"
          class="subject-tag"
          @tap="toggleSubject(subject)"
        >
          <text>{{ subject }}</text>
        </view>
      </view>

      <!-- 科目选其他时，自定义输入框 -->
      <input
        v-if="form.subjects.includes('其他')"
        v-model="form.subjectOther"
        class="input"
        placeholder="请输入其他科目"
      />

      <!-- 9. 学习困难多选标签 -->
      <text class="question-label">9. 在这些科目上，您认为孩子最主要的困难类型是（按点击顺序排序）</text>
      <view class="subject-list">
        <view
          v-for="difficulty in selectedDifficulties"
          :key="difficulty"
          class="subject-tag"
          :class="{ active: true }"
          @tap="toggleDifficulty(difficulty)"
        >
          <text>{{ getDifficultyOrder(difficulty) }}{{ difficulty }}</text>
        </view>
        <view
          v-for="difficulty in unselectedDifficulties"
          :key="`unselected-${difficulty}`"
          class="subject-tag"
          @tap="toggleDifficulty(difficulty)"
        >
          <text>{{ difficulty }}</text>
        </view>
      </view>

      <!-- 困难选其他，自定义输入框 -->
      <input
        v-if="form.difficulties.includes('其他')"
        v-model="form.difficultyOther"
        class="input"
        placeholder="请输入其他困难"
      />

      <!-- 10. 过往辅导经历多行输入 -->
      <text class="question-label">10. 孩子以前是否参加过课外辅导或请过家教？效果如何？</text>
      <textarea v-model="form.intro" class="textarea" placeholder="请简单描述情况"></textarea>

      <!-- 11. 老师特质多选标签 -->
      <text class="question-label">11. 您认为一位优秀的家教老师，最重要的特质是什么？请选择并排序</text>
      <view class="subject-list">
        <view
          v-for="trait in selectedTeacherTraits"
          :key="trait"
          class="subject-tag"
          :class="{ active: true }"
          @tap="toggleTeacherTrait(trait)"
        >
          <text>{{ getTeacherTraitOrder(trait) }}{{ trait }}</text>
        </view>
        <view
          v-for="trait in unselectedTeacherTraits"
          :key="`unselected-trait-${trait}`"
          class="subject-tag"
          @tap="toggleTeacherTrait(trait)"
        >
          <text>{{ trait }}</text>
        </view>
      </view>

      <!-- 12. 偏好教学风格多选标签 -->
      <text class="question-label">12. 在辅导过程中，您更看重哪种教学风格或方式？请按认同程度排序</text>
      <view class="subject-list">
        <view
          v-for="style in selectedTeachingStyles"
          :key="style"
          class="subject-tag"
          :class="{ active: true }"
          @tap="toggleTeachingStyle(style)"
        >
          <text>{{ getTeachingStyleOrder(style) }}{{ style }}</text>
        </view>
        <view
          v-for="style in unselectedTeachingStyles"
          :key="`unselected-style-${style}`"
          class="subject-tag"
          @tap="toggleTeachingStyle(style)"
        >
          <text>{{ style }}</text>
        </view>
      </view>

      <!-- 13. 辅导侧重点单选 -->
      <text class="question-label">13. 您希望家教老师在每次辅导时，主要侧重以下哪方面？</text>
      <radio-group class="option-group" @change="handleMainFocusChange">
        <label class="option-item">
          <radio value="紧跟学校进度，预习复习，解答作业疑问" :checked="form.mainFocus === '紧跟学校进度，预习复习，解答作业疑问'" />
          <text>紧跟学校进度，预习复习，解答作业疑问</text>
        </label>
        <label class="option-item">
          <radio value="查缺补漏，专项攻克孩子的薄弱环节" :checked="form.mainFocus === '查缺补漏，专项攻克孩子的薄弱环节'" />
          <text>查缺补漏，专项攻克孩子的薄弱环节</text>
        </label>
        <label class="option-item">
          <radio value="能力拓展，进行拔高训练，提升思维深度" :checked="form.mainFocus === '能力拓展，进行拔高训练，提升思维深度'" />
          <text>能力拓展，进行拔高训练，提升思维深度</text>
        </label>
        <label class="option-item">
          <radio value="其他" :checked="form.mainFocus === '其他'" />
          <text>其他</text>
        </label>
      </radio-group>

      <!-- 侧重点选其他，自定义输入 -->
      <input
        v-if="form.mainFocus === '其他'"
        v-model="form.mainFocusOther"
        class="input"
        placeholder="请输入其他侧重点"
      />

      <!-- 14. 是否关注学习状态单选 -->
      <text class="question-label">14. 除了辅导功课，您是否希望家教老师能在一定程度上关注孩子的学习状态并给予适当的引导？</text>
      <radio-group class="option-group" @change="handleLearningStateChange">
        <label class="option-item">
          <radio value="非常希望，这有助于提高学习效率。" :checked="form.learningState === '非常希望，这有助于提高学习效率。'" />
          <text>非常希望，这有助于提高学习效率。</text>
        </label>
        <label class="option-item">
          <radio value="可以接受，顺其自然。" :checked="form.learningState === '可以接受，顺其自然。'" />
          <text>可以接受，顺其自然。</text>
        </label>
        <label class="option-item">
          <radio value="不太需要，主要辅导好知识点即可" :checked="form.learningState === '不太需要，主要辅导好知识点即可'" />
          <text>不太需要，主要辅导好知识点即可</text>
        </label>
      </radio-group>

      <!-- 15. 沟通期待单选 -->
      <text class="question-label">15. 对于家教老师的沟通，您的期待是？</text>
      <radio-group class="option-group" @change="handleCommunicationChange">
        <label class="option-item">
          <radio value="课后能与我简单沟通本次辅导内容和孩子表现。" :checked="form.communicationExpectation === '课后能与我简单沟通本次辅导内容和孩子表现。'" />
          <text>课后能与我简单沟通本次辅导内容和孩子表现。</text>
        </label>
        <label class="option-item">
          <radio value="定期（如每周/每月）有一次详细沟通。" :checked="form.communicationExpectation === '定期（如每周/每月）有一次详细沟通。'" />
          <text>定期（如每周/每月）有一次详细沟通。</text>
        </label>
        <label class="option-item">
          <radio value="除非有特殊情况，否则不需要额外沟通。" :checked="form.communicationExpectation === '除非有特殊情况，否则不需要额外沟通。'" />
          <text>除非有特殊情况，否则不需要额外沟通。</text>
        </label>
        <label class="option-item">
          <radio value="其他" :checked="form.communicationExpectation === '其他'" />
          <text>其他</text>
        </label>
      </radio-group>

      <!-- 沟通选其他，自定义输入框 -->
      <input
        v-if="form.communicationExpectation === '其他'"
        v-model="form.communicationExpectationOther"
        class="input"
        placeholder="请输入其他沟通期待"
      />

      <!-- 16. 项目认知理解单选 -->
      <text class="question-label">16. 您是否理解并认可，我们项目的“友导师”是经过选拔和培训的川大学生，他们将在专业指导下提供学业支持和情感支持？</text>
      <radio-group class="option-group" @change="handleUnderstandingChange">
        <label class="option-item">
          <radio value="完全理解并认同，相信其专业性。" :checked="form.understanding === '完全理解并认同，相信其专业性。'" />
          <text>完全理解并认同，相信其专业性。</text>
        </label>
        <label class="option-item">
          <radio value="希望了解更多细节。" :checked="form.understanding === '希望了解更多细节。'" />
          <text>希望了解更多细节。</text>
        </label>
        <label class="option-item">
          <radio value="基本了解，愿意尝试。" :checked="form.understanding === '基本了解，愿意尝试。'" />
          <text>基本了解，愿意尝试。</text>
        </label>
      </radio-group>

      <!-- 17. 是否愿意提供反馈单选 -->
      <text class="question-label">17. 为持续优化项目，我们需要参与家庭定期提供简短反馈。您是否愿意配合？</text>
      <radio-group class="option-group" @change="handleFeedbackChange">
        <label class="option-item">
          <radio value="需了解具体内容和频率后再决定。" :checked="form.feedbackWillingness === '需了解具体内容和频率后再决定。'" />
          <text>需了解具体内容和频率后再决定。</text>
        </label>
        <label class="option-item">
          <radio value="愿意积极配合。" :checked="form.feedbackWillingness === '愿意积极配合。'" />
          <text>愿意积极配合。</text>
        </label>
        <label class="option-item">
          <radio value="可能比较困难。" :checked="form.feedbackWillingness === '可能比较困难。'" />
          <text>可能比较困难。</text>
        </label>
      </radio-group>

      <!-- 18. 额外备注多行输入 -->
      <text class="question-label">18. 您还有什么想特别说明的情况，或对项目的具体问题与期待？</text>
      <textarea
        v-model="form.extraNote"
        class="textarea"
        placeholder="如有补充说明、问题或期待，可以写在这里"
      ></textarea>

      <!-- 19. 意向上课方式多选标签 -->
      <text class="question-label">19. 意向上课方式</text>
      <view class="subject-list">
        <view
          v-for="mode in selectedClassModes"
          :key="mode"
          class="subject-tag"
          :class="{ active: true }"
          @tap="toggleClassMode(mode)"
        >
          <text>{{ mode }}</text>
        </view>
        <view
          v-for="mode in unselectedClassModes"
          :key="`unselected-mode-${mode}`"
          class="subject-tag"
          @tap="toggleClassMode(mode)"
        >
          <text>{{ mode }}</text>
        </view>
      </view>

      <!-- 20. 上课频率输入框 -->
      <text class="question-label">20. 上课频率</text>
      <input
        v-model="form.classFrequency"
        class="input"
        placeholder="例如：一周2-3次 / 每周一次 / 工作日每天"
      />

      <!-- 表单保存提交按钮 -->
      <view class="primary-btn submit-btn" @tap="submitProfile">保存</view>
    </view>
  </view>
</template>

<script setup>
// 导入vue核心API
import { computed, reactive, ref } from 'vue'
// uni-app页面生命周期钩子
import { onBackPress, onShow, onUnload } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
import { API_BASE_URL } from '@/utils/api'

// 获取全局仓库实例
const userStore = useUserStore()
const PROFILE_API_BASE_URL = API_BASE_URL
// 标记表单是否执行提交操作
const submitted = ref(false)

const isEditMode = () => {
  const currentPage = getCurrentPages().slice(-1)[0]
  return currentPage?.options?.mode === 'edit'
}

// 问卷固定选项集合：需要辅导的科目
const subjectOptions = ['语文', '数学', '英语', '化学', '生物', '政治', '历史', '体育', '绘画', '音乐', '地理', '其他']
// 问卷固定选项：学习困难类型
const difficultyOptions = ['基础知识不牢固', '解题思路不清晰，方法欠缺', '学习效率低，容易拖延', '对科目缺乏兴趣，动力不足', '考试时容易紧张，发挥失常', '其他']
// 问卷固定选项：老师特质
const teacherTraitOptions = [
  '学科知识扎实，讲题能力强',
  '讲解清晰有条理，能化繁为简',
  '有耐心，善于鼓励，不轻易发脾气',
  '能帮助孩子建立良好的学习习惯',
  '性格开朗，有亲和力，能调动孩子积极性',
  '认真负责，守时，沟通及时',
  '能洞察孩子学习中的困难点，针对性解决'
]
// 问卷固定选项：偏好教学风格
const teachingStyleOptions = ['启发引导型', '问题向导型', '鼓励陪伴型', '系统讲解型', '严格督促型']
// 问卷固定选项：上课方式
const classModeOptions = ['线上', '线下']

// 本地表单数据，初始化从全局store读取缓存数据
const form = reactive({
  name: userStore.profile.name,
  area: userStore.profile.area || '',
  areaOther: userStore.profile.areaOther || '',
  parentName: userStore.profile.parentName || '',
  phone: userStore.profile.phone || '',
  wechat: userStore.profile.wechat || '',
  age: userStore.profile.age || '',
  gender: userStore.profile.gender || '',
  grade: userStore.profile.grade || '',
  subjects: [...(userStore.profile.subjects || [])],
  subjectOther: userStore.profile.subjectOther || '',
  difficulties: [...(userStore.profile.difficulties || [])],
  difficultyOther: userStore.profile.difficultyOther || '',
  teacherTraits: [...(userStore.profile.teacherTraits || [])],
  teachingStyles: [...(userStore.profile.teachingStyles || [])],
  mainFocus: userStore.profile.mainFocus || '',
  mainFocusOther: userStore.profile.mainFocusOther || '',
  learningState: userStore.profile.learningState || '',
  communicationExpectation: userStore.profile.communicationExpectation || '',
  communicationExpectationOther: userStore.profile.communicationExpectationOther || '',
  understanding: userStore.profile.understanding || '',
  feedbackWillingness: userStore.profile.feedbackWillingness || '',
  extraNote: userStore.profile.extraNote || '',
  classModes: [...(userStore.profile.classModes || [])],
  classFrequency: userStore.profile.classFrequency || '',
  intro: userStore.profile.intro
})

// 用一份资料对象覆盖当前表单，用于后端回填。
const syncFormFromProfile = (profile = {}) => {
  form.name = profile.name || ''
  form.area = profile.area || ''
  form.areaOther = profile.areaOther || ''
  form.parentName = profile.parentName || ''
  form.phone = profile.phone || ''
  form.wechat = profile.wechat || ''
  form.age = profile.age || ''
  form.gender = profile.gender || ''
  form.grade = profile.grade || ''
  form.subjects = [...(profile.subjects || [])]
  form.subjectOther = profile.subjectOther || ''
  form.difficulties = [...(profile.difficulties || [])]
  form.difficultyOther = profile.difficultyOther || ''
  form.teacherTraits = [...(profile.teacherTraits || [])]
  form.teachingStyles = [...(profile.teachingStyles || [])]
  form.mainFocus = profile.mainFocus || ''
  form.mainFocusOther = profile.mainFocusOther || ''
  form.learningState = profile.learningState || ''
  form.communicationExpectation = profile.communicationExpectation || ''
  form.communicationExpectationOther = profile.communicationExpectationOther || ''
  form.understanding = profile.understanding || ''
  form.feedbackWillingness = profile.feedbackWillingness || ''
  form.extraNote = profile.extraNote || ''
  form.classModes = [...(profile.classModes || [])]
  form.classFrequency = profile.classFrequency || ''
  form.intro = profile.intro || ''
}

// 性别单选切换事件
const handleGenderChange = (e) => {
  form.gender = e.detail.value
}

// 年级单选切换事件
const handleGradeChange = (e) => {
  form.grade = e.detail.value
}

// 常住区域单选切换，选其他则清空自定义输入
const handleAreaChange = (e) => {
  form.area = e.detail.value
  if (form.area !== '其他') {
    form.areaOther = ''
  }
}

// 科目标签点击切换：选中加入数组，取消则删除；取消其他同步清空输入
const toggleSubject = (subject) => {
  const index = form.subjects.indexOf(subject)
  if (index > -1) {
    form.subjects.splice(index, 1)
    if (subject === '其他') {
      form.subjectOther = ''
    }
    return
  }
  form.subjects.push(subject)
}

// 获取选中科目的排序序号，未选中返回空
const getSubjectOrder = (subject) => {
  const index = form.subjects.indexOf(subject)
  return index > -1 ? `${index + 1}. ` : ''
}

// 计算属性：已选中的科目列表
const selectedSubjects = computed(() => {
  return form.subjects.filter((subject) => subjectOptions.includes(subject))
})
// 计算属性：未选中的科目列表
const unselectedSubjects = computed(() => {
  return subjectOptions.filter((subject) => !form.subjects.includes(subject))
})

// 学习困难标签切换
const toggleDifficulty = (difficulty) => {
  const index = form.difficulties.indexOf(difficulty)
  if (index > -1) {
    form.difficulties.splice(index, 1)
    if (difficulty === '其他') {
      form.difficultyOther = ''
    }
    return
  }
  form.difficulties.push(difficulty)
}

// 获取困难排序序号
const getDifficultyOrder = (difficulty) => {
  const index = form.difficulties.indexOf(difficulty)
  return index > -1 ? `${index + 1}. ` : ''
}
// 已选中困难
const selectedDifficulties = computed(() => {
  return form.difficulties.filter((difficulty) => difficultyOptions.includes(difficulty))
})
// 未选中困难
const unselectedDifficulties = computed(() => {
  return difficultyOptions.filter((difficulty) => !form.difficulties.includes(difficulty))
})

// 老师特质点击切换
const toggleTeacherTrait = (trait) => {
  const index = form.teacherTraits.indexOf(trait)
  if (index > -1) {
    form.teacherTraits.splice(index, 1)
    return
  }
  form.teacherTraits.push(trait)
}
// 获取特质排序
const getTeacherTraitOrder = (trait) => {
  const index = form.teacherTraits.indexOf(trait)
  return index > -1 ? `${index + 1}. ` : ''
}
const selectedTeacherTraits = computed(() => {
  return form.teacherTraits.filter((trait) => teacherTraitOptions.includes(trait))
})
const unselectedTeacherTraits = computed(() => {
  return teacherTraitOptions.filter((trait) => !form.teacherTraits.includes(trait))
})

// 教学风格切换
const toggleTeachingStyle = (style) => {
  const index = form.teachingStyles.indexOf(style)
  if (index > -1) {
    form.teachingStyles.splice(index, 1)
    return
  }
  form.teachingStyles.push(style)
}
const getTeachingStyleOrder = (style) => {
  const index = form.teachingStyles.indexOf(style)
  return index > -1 ? `${index + 1}. ` : ''
}
const selectedTeachingStyles = computed(() => {
  return form.teachingStyles.filter((style) => teachingStyleOptions.includes(style))
})
const unselectedTeachingStyles = computed(() => {
  return teachingStyleOptions.filter((style) => !form.teachingStyles.includes(style))
})

// 上课方式标签切换
const toggleClassMode = (mode) => {
  const index = form.classModes.indexOf(mode)
  if (index > -1) {
    form.classModes.splice(index, 1)
    return
  }
  form.classModes.push(mode)
}
const selectedClassModes = computed(() => {
  return form.classModes.filter((mode) => classModeOptions.includes(mode))
})
const unselectedClassModes = computed(() => {
  return classModeOptions.filter((mode) => !form.classModes.includes(mode))
})

// 辅导侧重点单选切换，清空其他输入
const handleMainFocusChange = (e) => {
  form.mainFocus = e.detail.value
  if (form.mainFocus !== '其他') {
    form.mainFocusOther = ''
  }
}

// 学习状态单选
const handleLearningStateChange = (e) => {
  form.learningState = e.detail.value
}

// 沟通期待单选，清空自定义输入
const handleCommunicationChange = (e) => {
  form.communicationExpectation = e.detail.value
  if (form.communicationExpectation !== '其他') {
    form.communicationExpectationOther = ''
  }
}

// 项目理解单选
const handleUnderstandingChange = (e) => {
  form.understanding = e.detail.value
}

// 反馈意愿单选
const handleFeedbackChange = (e) => {
  form.feedbackWillingness = e.detail.value
}

// 页面返回/卸载时，未提交则标记放弃填写
const markCancelledWhenUnfinished = () => {
  if (!submitted.value && !userStore.profileCompleted) {
    userStore.cancelProfile()
  }
}

// 监听手机物理返回按键
onBackPress(() => {
  markCancelledWhenUnfinished()
  return false
})

// 页面销毁生命周期钩子
onUnload(() => {
  markCancelledWhenUnfinished()
})

// 进入页面时尝试从后端读取当前用户已保存的家庭资料。
onShow(() => {
  if (!userStore.openid) {
    return
  }

  uni.request({
    url: `${PROFILE_API_BASE_URL}/profile/detail?openid=${encodeURIComponent(userStore.openid)}&role=family`,
    method: 'GET',
    success: (res) => {
      if (!res.data?.success || !res.data?.found || !res.data?.profile) {
        return
      }

      syncFormFromProfile(res.data.profile)
      userStore.updateProfile(res.data.profile)
      userStore.completeProfile()
    }
  })
})

// 表单提交校验与保存逻辑
const submitProfile = () => {
  // 基础必填项校验
  if (!form.name || !form.gender || !form.grade || !form.area || !form.subjects.length || !form.difficulties.length || !form.teacherTraits.length || !form.teachingStyles.length || !form.mainFocus || !form.learningState || !form.communicationExpectation || !form.understanding || !form.feedbackWillingness || !form.intro) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }
  // 区域选其他，必须填写自定义区域
  if (form.area === '其他' && !form.areaOther) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }
  // 科目选其他，必填自定义科目
  if (form.subjects.includes('其他') && !form.subjectOther) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }
  // 困难选其他，必填自定义困难
  if (form.difficulties.includes('其他') && !form.difficultyOther) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }
  // 侧重点选其他，必填内容
  if (form.mainFocus === '其他' && !form.mainFocusOther) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }
  // 沟通选其他，必填内容
  if (form.communicationExpectation === '其他' && !form.communicationExpectationOther) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }

  if (!userStore.openid) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  const payload = {
    ...form,
    subjects: [...form.subjects],
    difficulties: [...form.difficulties],
    teacherTraits: [...form.teacherTraits],
    teachingStyles: [...form.teachingStyles],
    classModes: [...form.classModes]
  }

  uni.request({
    url: `${PROFILE_API_BASE_URL}/profile/save`,
    method: 'POST',
    data: {
      openid: userStore.openid,
      role: 'family',
      profile: payload
    },
    success: (res) => {
      if (!res.data?.success) {
        uni.showToast({ title: res.data?.message || '保存失败', icon: 'none' })
        return
      }

      submitted.value = true
      // 将表单数据同步到全局仓库
      userStore.updateProfile(payload)
      // 标记资料填写完成
      userStore.completeProfile()

      uni.showToast({
        title: res.data?.message || '资料已保存',
        icon: 'success'
      })

      setTimeout(() => {
        if (isEditMode()) {
          uni.navigateBack()
          return
        }

        uni.switchTab({
          url: '/pages/match/match'
        })
      }, 500)
    },
    fail: () => {
      uni.showToast({ title: '后端未连接', icon: 'none' })
    }
  })
}
</script>

<style scoped lang="scss">
/* 外层卡片布局 */
.card {
  display: flex;
  flex-direction: column;
}

/* 页面主标题样式 */
.title {
  display: block;
  text-align: center;
}

/* 副标题提示文字 */
.subtitle {
  display: block;
  text-align: center;
  margin-top: 12rpx;
}

/* 问题标题通用样式 */
.question-label {
  display: block;
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: #333333;
}

/* 单选选项容器 */
.option-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* 单个单选条目 */
.option-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #333333;
}

/* 多选标签外层容器 */
.subject-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: flex-start;
}

/* 普通标签样式 */
.subject-tag {
  width: fit-content;
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  background: #f1f3f7;
  color: #333333;
  font-size: 28rpx;
}

/* 标签选中激活样式 */
.subject-tag.active {
  background: #dbe9ff;
  color: #2d6cdf;
}

/* 提交按钮上边距 */
.submit-btn {
  margin-top: 28rpx;
}
</style>
