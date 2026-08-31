<template>
  <view class="container">
    <view class="card">
      <text class="title">填写信息</text>
      <text class="subtitle">第一次进入匹配前，先把友导师基础资料补全。</text>

      <text class="question-label">1. 姓名</text>
      <input v-model="form.name" class="input" placeholder="请输入姓名或称呼" />

      <text class="question-label">2. 性别</text>
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

      <text class="question-label">3. 是否参加友导师项目</text>
      <radio-group class="option-group" @change="handleMentorProjectChange">
        <label class="option-item">
          <radio value="是" :checked="form.mentorProject === '是'" />
          <text>是</text>
        </label>
        <label class="option-item">
          <radio value="否" :checked="form.mentorProject === '否'" />
          <text>否</text>
        </label>
      </radio-group>

      <text class="question-label">4. 骨干成员</text>
      <radio-group class="option-group" @change="handleCoreMemberChange">
        <label class="option-item">
          <radio value="是" :checked="form.coreMember === '是'" />
          <text>是</text>
        </label>
        <label class="option-item">
          <radio value="否" :checked="form.coreMember === '否'" />
          <text>否</text>
        </label>
      </radio-group>

      <text class="question-label">5. 年级</text>
      <radio-group class="option-group" @change="handleGradeChange">
        <label class="option-item">
          <radio value="大一" :checked="form.grade === '大一'" />
          <text>大一</text>
        </label>
        <label class="option-item">
          <radio value="大二" :checked="form.grade === '大二'" />
          <text>大二</text>
        </label>
        <label class="option-item">
          <radio value="大三" :checked="form.grade === '大三'" />
          <text>大三</text>
        </label>
        <label class="option-item">
          <radio value="大四" :checked="form.grade === '大四'" />
          <text>大四</text>
        </label>
        <label class="option-item">
          <radio value="大五" :checked="form.grade === '大五'" />
          <text>大五</text>
        </label>
        <label class="option-item">
          <radio value="研一" :checked="form.grade === '研一'" />
          <text>研一</text>
        </label>
        <label class="option-item">
          <radio value="研二" :checked="form.grade === '研二'" />
          <text>研二</text>
        </label>
        <label class="option-item">
          <radio value="研三" :checked="form.grade === '研三'" />
          <text>研三</text>
        </label>
        <label class="option-item">
          <radio value="其他" :checked="form.grade === '其他'" />
          <text>其他</text>
        </label>
      </radio-group>

      <input
        v-if="form.grade === '其他'"
        v-model="form.gradeOther"
        class="input"
        placeholder="请输入你的年级"
      />

      <text class="question-label">6. 学校</text>
      <input v-model="form.school" class="input" placeholder="请输入学校名称" />

      <text class="question-label">7. 专业</text>
      <input v-model="form.major" class="input" placeholder="请输入专业名称" />

      <text class="question-label">8. 学院</text>
      <input v-model="form.college" class="input" placeholder="请输入学院名称" />

      <text class="question-label">9. 微信号</text>
      <input v-model="form.wechat" class="input" placeholder="请输入微信号" />

      <text class="question-label">10. 擅长科目（按点击顺序排序）</text>
      <view class="subject-list">
        <view
          v-for="subject in selectedMentorSubjects"
          :key="subject"
          class="subject-tag"
          :class="{ active: true }"
          @tap="toggleMentorSubject(subject)"
        >
          <text>{{ getMentorSubjectOrder(subject) }}{{ subject }}</text>
        </view>
        <view
          v-for="subject in unselectedMentorSubjects"
          :key="`unselected-${subject}`"
          class="subject-tag"
          @tap="toggleMentorSubject(subject)"
        >
          <text>{{ subject }}</text>
        </view>
      </view>

      <input
        v-if="form.mentorSubjects.includes('其他')"
        v-model="form.mentorSubjectOther"
        class="input"
        placeholder="请输入其他擅长科目"
      />

      <text class="question-label">11. 意向教学年级段</text>
      <input
        v-model="form.mentorTeachingGradeRange"
        class="input"
        placeholder="例如：小学 / 初一-初二 / 高一-高三"
      />

      <text class="question-label">12. 风格类型</text>
      <view class="subject-list">
        <view
          v-for="style in selectedMentorStyleTypes"
          :key="style"
          class="subject-tag"
          :class="{ active: true }"
          @tap="toggleMentorStyleType(style)"
        >
          <text>{{ style }}</text>
        </view>
        <view
          v-for="style in unselectedMentorStyleTypes"
          :key="`unselected-style-${style}`"
          class="subject-tag"
          @tap="toggleMentorStyleType(style)"
        >
          <text>{{ style }}</text>
        </view>
      </view>

      <text class="question-label">13. 意向上课方式</text>
      <view class="subject-list">
        <view
          v-for="mode in selectedMentorTeachingModes"
          :key="mode"
          class="subject-tag"
          :class="{ active: true }"
          @tap="toggleMentorTeachingMode(mode)"
        >
          <text>{{ mode }}</text>
        </view>
        <view
          v-for="mode in unselectedMentorTeachingModes"
          :key="`unselected-mode-${mode}`"
          class="subject-tag"
          @tap="toggleMentorTeachingMode(mode)"
        >
          <text>{{ mode }}</text>
        </view>
      </view>

      <text class="question-label">14. 暑假所在地</text>
      <input
        v-model="form.mentorSummerLocation"
        class="input"
        placeholder="请输入暑假所在地"
      />

      <text class="question-label">15. 开学后所在地</text>
      <input
        v-model="form.mentorSchoolLocation"
        class="input"
        placeholder="请输入开学后所在地"
      />

      <text class="question-label">16. 上课频率</text>
      <input
        v-model="form.mentorClassFrequency"
        class="input"
        placeholder="请输入上课频率"
      />

      <view class="primary-btn submit-btn" @tap="submitProfile">保存</view>
    </view>
  </view>
</template>

<script setup>
// 导入 vue 核心 API（computed 计算属性、reactive 响应式对象、ref 引用）
import { computed, reactive, ref } from 'vue'
// uni-app 页面生命周期钩子（物理返回键、页面每次显示、页面卸载）
import { onBackPress, onShow, onUnload } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
// 引入后端接口基地址常量
import { API_BASE_URL } from '@/utils/api'

// 获取全局仓库实例
const userStore = useUserStore()
// 资料接口基地址（此处直接复用通用基地址）
const PROFILE_API_BASE_URL = API_BASE_URL
// 标记表单是否已提交，用于区分“提交后返回”和“中途放弃”
const submitted = ref(false)

// 判断当前是否处于“修改资料”模式（路由参数 mode=edit，由“我的”页跳转带入）
const isEditMode = () => {
  const currentPage = getCurrentPages().slice(-1)[0]
  return currentPage?.options?.mode === 'edit'
}

// 导师可辅导科目、教学风格类型、授课方式的可选项
const subjectOptions = ['语文', '数学', '英语', '化学', '生物', '政治', '历史', '体育', '绘画', '音乐', '地理', '其他']
const mentorStyleTypeOptions = ['情感支持型', '鼓励启发型', '灵活应变型', '结构化引导型', '耐心倾听型']
const mentorTeachingModeOptions = ['线上', '线下']

// 导师资料表单：从全局仓库里的 profile 取值（允许后端回填 / 上次填写内容）
// 数组字段必须复制一份（[...])，避免表单直接引用仓库里的数组导致双向污染
const form = reactive({
  name: userStore.profile.name || '',
  gender: userStore.profile.gender || '',
  mentorProject: userStore.profile.mentorProject || '',
  coreMember: userStore.profile.coreMember || '',
  grade: userStore.profile.grade || '',
  gradeOther: userStore.profile.gradeOther || '',
  school: userStore.profile.school || '',
  major: userStore.profile.major || '',
  college: userStore.profile.college || '',
  wechat: userStore.profile.wechat || '',
  mentorSubjects: [...(userStore.profile.mentorSubjects || [])],
  mentorSubjectOther: userStore.profile.mentorSubjectOther || '',
  mentorTeachingGradeRange: userStore.profile.mentorTeachingGradeRange || '',
  mentorStyleTypes: [...(userStore.profile.mentorStyleTypes || [])],
  mentorTeachingModes: [...(userStore.profile.mentorTeachingModes || [])],
  mentorSummerLocation: userStore.profile.mentorSummerLocation || '',
  mentorSchoolLocation: userStore.profile.mentorSchoolLocation || '',
  mentorClassFrequency: userStore.profile.mentorClassFrequency || ''
})

// 用后端返回的资料覆盖当前表单。
const syncFormFromProfile = (profile = {}) => {
  form.name = profile.name || ''
  form.gender = profile.gender || ''
  form.mentorProject = profile.mentorProject || ''
  form.coreMember = profile.coreMember || ''
  form.grade = profile.grade || ''
  form.gradeOther = profile.gradeOther || ''
  form.school = profile.school || ''
  form.major = profile.major || ''
  form.college = profile.college || ''
  form.wechat = profile.wechat || ''
  form.mentorSubjects = [...(profile.mentorSubjects || [])]
  form.mentorSubjectOther = profile.mentorSubjectOther || ''
  form.mentorTeachingGradeRange = profile.mentorTeachingGradeRange || ''
  form.mentorStyleTypes = [...(profile.mentorStyleTypes || [])]
  form.mentorTeachingModes = [...(profile.mentorTeachingModes || [])]
  form.mentorSummerLocation = profile.mentorSummerLocation || ''
  form.mentorSchoolLocation = profile.mentorSchoolLocation || ''
  form.mentorClassFrequency = profile.mentorClassFrequency || ''
}

// 性别单选切换事件
const handleGenderChange = (e) => {
  form.gender = e.detail.value
}

// 参与项目单选切换事件
const handleMentorProjectChange = (e) => {
  form.mentorProject = e.detail.value
}

// 是否核心成员单选切换事件
const handleCoreMemberChange = (e) => {
  form.coreMember = e.detail.value
}

// 年级单选切换事件：选“其他”以外时清空自定义年级输入
const handleGradeChange = (e) => {
  form.grade = e.detail.value
  if (form.grade !== '其他') {
    form.gradeOther = ''
  }
}

// 辅导科目标签切换：已选则移除（选“其他”时顺带清空自定义输入），未选则追加
const toggleMentorSubject = (subject) => {
  const index = form.mentorSubjects.indexOf(subject)
  if (index > -1) {
    form.mentorSubjects.splice(index, 1)
    if (subject === '其他') {
      form.mentorSubjectOther = ''
    }
    return
  }
  form.mentorSubjects.push(subject)
}

// 计算某科目在已选列表中的序号前缀（如 “1. ”“2. ”），用于模板展示排序
const getMentorSubjectOrder = (subject) => {
  const index = form.mentorSubjects.indexOf(subject)
  return index > -1 ? `${index + 1}. ` : ''
}

// 已选 / 未选辅导科目（供模板渲染高亮与剩余选项）
const selectedMentorSubjects = computed(() => {
  return form.mentorSubjects.filter((subject) => subjectOptions.includes(subject))
})

const unselectedMentorSubjects = computed(() => {
  return subjectOptions.filter((subject) => !form.mentorSubjects.includes(subject))
})

// 教学风格标签切换：已选则移除，未选则追加
const toggleMentorStyleType = (style) => {
  const index = form.mentorStyleTypes.indexOf(style)
  if (index > -1) {
    form.mentorStyleTypes.splice(index, 1)
    return
  }
  form.mentorStyleTypes.push(style)
}

// 已选 / 未选教学风格
const selectedMentorStyleTypes = computed(() => {
  return form.mentorStyleTypes.filter((style) => mentorStyleTypeOptions.includes(style))
})

const unselectedMentorStyleTypes = computed(() => {
  return mentorStyleTypeOptions.filter((style) => !form.mentorStyleTypes.includes(style))
})

// 授课方式标签切换：已选则移除，未选则追加
const toggleMentorTeachingMode = (mode) => {
  const index = form.mentorTeachingModes.indexOf(mode)
  if (index > -1) {
    form.mentorTeachingModes.splice(index, 1)
    return
  }
  form.mentorTeachingModes.push(mode)
}

// 已选 / 未选授课方式
const selectedMentorTeachingModes = computed(() => {
  return form.mentorTeachingModes.filter((mode) => mentorTeachingModeOptions.includes(mode))
})

const unselectedMentorTeachingModes = computed(() => {
  return mentorTeachingModeOptions.filter((mode) => !form.mentorTeachingModes.includes(mode))
})

// 页面返回 / 卸载时，若未提交且资料未完成，则标记放弃填写
const markCancelledWhenUnfinished = () => {
  if (!submitted.value && !userStore.profileCompleted) {
    userStore.cancelProfile()
  }
}

// 监听手机物理返回按键（返回 false 表示不拦截默认返回，仅做放弃记录）
onBackPress(() => {
  markCancelledWhenUnfinished()
  return false
})

// 页面销毁生命周期钩子
onUnload(() => {
  markCancelledWhenUnfinished()
})

// 每次打开页面时，如果后端里已经有导师资料，就自动回填。
onShow(() => {
  if (!userStore.openid) {
    return
  }

  uni.request({
    url: `${PROFILE_API_BASE_URL}/profile/detail?openid=${encodeURIComponent(userStore.openid)}&role=mentor`,
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

// 表单提交：先做必填校验，再提交到后端 /profile/save
const submitProfile = () => {
  if (!form.name || !form.gender || !form.mentorProject || !form.coreMember || !form.grade || !form.school || !form.major || !form.college || !form.wechat || !form.mentorSubjects.length || !form.mentorTeachingGradeRange || !form.mentorStyleTypes.length || !form.mentorTeachingModes.length || !form.mentorSummerLocation || !form.mentorSchoolLocation || !form.mentorClassFrequency) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }

  if (form.grade === '其他' && !form.gradeOther) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }

  if (form.mentorSubjects.includes('其他') && !form.mentorSubjectOther) {
    uni.showToast({ title: '请先补全资料', icon: 'none' })
    return
  }

  if (!userStore.openid) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  const payload = {
    ...form,
    mentorSubjects: [...form.mentorSubjects],
    mentorStyleTypes: [...form.mentorStyleTypes],
    mentorTeachingModes: [...form.mentorTeachingModes]
  }

  uni.request({
    url: `${PROFILE_API_BASE_URL}/profile/save`,
    method: 'POST',
    data: {
      openid: userStore.openid,
      role: 'mentor',
      profile: payload
    },
    success: (res) => {
      if (!res.data?.success) {
        uni.showToast({ title: res.data?.message || '保存失败', icon: 'none' })
        return
      }

      submitted.value = true
      userStore.updateProfile(payload)
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
