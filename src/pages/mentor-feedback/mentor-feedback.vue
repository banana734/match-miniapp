<template>
  <view class="container">
    <view class="card">
      <text class="title">{{ pageTitle }}</text>
      <text class="subtitle">{{ textMap.subtitle }}</text>

      <text class="question-label">{{ textMap.questionTrialDate }}</text>
      <picker mode="date" :value="form.trialDate" @change="handleTrialDateChange">
        <view class="input picker-value" :class="{ 'placeholder-text': !form.trialDate }">
          {{ form.trialDate || textMap.trialDatePlaceholder }}
        </view>
      </picker>

      <text class="question-label">{{ textMap.questionTrialDuration }}</text>
      <input
        v-model="form.trialDuration"
        class="input"
        :placeholder="textMap.trialDurationPlaceholder"
      />

      <text class="question-label">{{ textMap.questionSatisfactionPoints }}</text>
      <text class="question-note">{{ textMap.questionSatisfactionPointsNote }}</text>
      <checkbox-group class="option-group" @change="handleSatisfactionPointsChange">
        <label v-for="item in satisfactionOptions" :key="item" class="option-item">
          <checkbox :value="item" :checked="form.satisfactionPoints.includes(item)" />
          <text>{{ item }}</text>
        </label>
      </checkbox-group>
      <input
        v-if="form.satisfactionPoints.includes('其他')"
        v-model="form.satisfactionPointOther"
        class="input"
        placeholder="请输入其他满意点"
      />

      <text class="question-label">{{ textMap.questionObjectiveUnsatisfied }}</text>
      <text class="question-note">{{ textMap.questionObjectiveUnsatisfiedNote }}</text>
      <checkbox-group class="option-group" @change="handleObjectiveUnsatisfiedChange">
        <label v-for="item in objectiveUnsatisfiedOptions" :key="item" class="option-item">
          <checkbox :value="item" :checked="form.objectiveUnsatisfied.includes(item)" />
          <text>{{ item }}</text>
        </label>
      </checkbox-group>
      <input
        v-if="form.objectiveUnsatisfied.includes('其他')"
        v-model="form.objectiveUnsatisfiedOther"
        class="input"
        placeholder="请输入其他客观原因"
      />

      <text class="question-label">{{ textMap.questionSubjectiveUnsatisfied }}</text>
      <text class="question-note">{{ textMap.questionSubjectiveUnsatisfiedNote }}</text>
      <checkbox-group class="option-group" @change="handleSubjectiveUnsatisfiedChange">
        <label v-for="item in subjectiveUnsatisfiedOptions" :key="item" class="option-item">
          <checkbox :value="item" :checked="form.subjectiveUnsatisfied.includes(item)" />
          <text>{{ item }}</text>
        </label>
      </checkbox-group>
      <input
        v-if="form.subjectiveUnsatisfied.includes('其他')"
        v-model="form.subjectiveUnsatisfiedOther"
        class="input"
        placeholder="请输入其他主观原因"
      />

      <text class="question-label">{{ textMap.questionContinueChoice }}</text>
      <radio-group class="option-group" @change="handleContinueChoiceChange">
        <label v-for="item in continueChoiceOptions" :key="item" class="option-item">
          <radio :value="item" :checked="form.continueChoice === item" />
          <text>{{ item }}</text>
        </label>
      </radio-group>
      <input
        v-if="form.continueChoice === '其他'"
        v-model="form.continueChoiceOther"
        class="input"
        placeholder="请输入其他合作意向"
      />

      <view class="primary-btn submit-btn" @tap="submitFeedback">{{ textMap.submitButton }}</view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { API_BASE_URL } from '@/utils/api'

const userStore = useUserStore()
const MATCH_API_BASE_URL = API_BASE_URL

const textMap = {
  subtitle: '先记录本次试课的基础信息，后面我们再继续补充更详细的反馈。',
  questionTrialDate: '1. 试课日期',
  trialDatePlaceholder: '年/月/日',
  questionTrialDuration: '2. 试课时长',
  trialDurationPlaceholder: '请输入',
  questionSatisfactionPoints: '3. [多选] 满意点（学生表现好的地方）',
  questionSatisfactionPointsNote: '请根据实际情况勾选或补充',
  questionObjectiveUnsatisfied: '4. [多选] 不满意点',
  questionObjectiveUnsatisfiedNote: '（一）客观原因（与学生自身能力、状态等关系较大）',
  questionSubjectiveUnsatisfied: '5. [多选] 不满意点',
  questionSubjectiveUnsatisfiedNote: '（二）主观原因（与我的教学或互动方式有关）',
  questionContinueChoice: '6. 是否愿意继续与该学生合作',
  submitButton: '保存反馈',
  incompleteToast: '请先补全反馈内容',
  successToast: '反馈已保存',
  defaultName: '该对象',
  titleSuffix: '的试课反馈'
}

const satisfactionOptions = [
  '态度积极，愿意配合',
  '能主动提问或回应',
  '理解能力较好，能跟上讲解',
  '情绪稳定，无明显抵触',
  '其他'
]

const objectiveUnsatisfiedOptions = [
  '基础较弱，理解较慢',
  '注意力不集中，容易走神',
  '情绪较紧张或抗拒学习',
  '未提前准备上课所需材料',
  '其他'
]

const subjectiveUnsatisfiedOptions = [
  '我的讲解方式学生不太适应',
  '我未能有效调动学生积极性',
  '我准备的内容难度不匹配',
  '其他'
]

const continueChoiceOptions = [
  '愿意',
  '需要调整后再试一次',
  '不愿意',
  '其他'
]

const objectName = ref(textMap.defaultName)
const cardId = ref('')
const pageTitle = ref('试课反馈')

// 当前先把反馈内容保存在页面本地，提交时只把试课流转结果发给后端。
const form = reactive({
  trialDate: '',
  trialDuration: '',
  satisfactionPoints: [],
  satisfactionPointOther: '',
  objectiveUnsatisfied: [],
  objectiveUnsatisfiedOther: '',
  subjectiveUnsatisfied: [],
  subjectiveUnsatisfiedOther: '',
  continueChoice: '',
  continueChoiceOther: ''
})

const updatePageTitle = () => {
  pageTitle.value = `${objectName.value}${textMap.titleSuffix}`
  uni.setNavigationBarTitle({
    title: pageTitle.value
  })
}

const handleTrialDateChange = (e) => {
  form.trialDate = e.detail.value
}

const handleSatisfactionPointsChange = (e) => {
  form.satisfactionPoints = e.detail.value
  if (!form.satisfactionPoints.includes('其他')) {
    form.satisfactionPointOther = ''
  }
}

const handleObjectiveUnsatisfiedChange = (e) => {
  form.objectiveUnsatisfied = e.detail.value
  if (!form.objectiveUnsatisfied.includes('其他')) {
    form.objectiveUnsatisfiedOther = ''
  }
}

const handleSubjectiveUnsatisfiedChange = (e) => {
  form.subjectiveUnsatisfied = e.detail.value
  if (!form.subjectiveUnsatisfied.includes('其他')) {
    form.subjectiveUnsatisfiedOther = ''
  }
}

const handleContinueChoiceChange = (e) => {
  form.continueChoice = e.detail.value
  if (form.continueChoice !== '其他') {
    form.continueChoiceOther = ''
  }
}

const submitFeedback = () => {
  if (!form.trialDate || !form.trialDuration || !form.continueChoice) {
    uni.showToast({
      title: textMap.incompleteToast,
      icon: 'none'
    })
    return
  }

  if (form.satisfactionPoints.includes('其他') && !form.satisfactionPointOther) {
    uni.showToast({
      title: textMap.incompleteToast,
      icon: 'none'
    })
    return
  }

  if (form.objectiveUnsatisfied.includes('其他') && !form.objectiveUnsatisfiedOther) {
    uni.showToast({
      title: textMap.incompleteToast,
      icon: 'none'
    })
    return
  }

  if (form.subjectiveUnsatisfied.includes('其他') && !form.subjectiveUnsatisfiedOther) {
    uni.showToast({
      title: textMap.incompleteToast,
      icon: 'none'
    })
    return
  }

  if (form.continueChoice === '其他' && !form.continueChoiceOther) {
    uni.showToast({
      title: textMap.incompleteToast,
      icon: 'none'
    })
    return
  }

  uni.request({
    url: `${MATCH_API_BASE_URL}/trial/feedback`,
    method: 'POST',
    data: {
      openid: userStore.openid,
      role: userStore.role === 'mentor' ? 'mentor' : 'family',
      cardId: cardId.value,
      continueChoice: form.continueChoice,
      feedback: {
        trialDate: form.trialDate,
        trialDuration: form.trialDuration,
        satisfactionPoints: form.satisfactionPoints,
        satisfactionPointOther: form.satisfactionPointOther,
        objectiveUnsatisfied: form.objectiveUnsatisfied,
        objectiveUnsatisfiedOther: form.objectiveUnsatisfiedOther,
        subjectiveUnsatisfied: form.subjectiveUnsatisfied,
        subjectiveUnsatisfiedOther: form.subjectiveUnsatisfiedOther,
        continueChoice: form.continueChoice,
        continueChoiceOther: form.continueChoiceOther
      }
    },
    success: (res) => {
      if (!res.data?.success) {
        uni.showToast({
          title: res.data?.message || '保存失败',
          icon: 'none'
        })
        return
      }

      uni.showToast({
        title: textMap.successToast,
        icon: 'success'
      })

      setTimeout(() => {
        uni.navigateBack()
      }, 500)
    },
    fail: () => {
      uni.showToast({
        title: '后端未连接',
        icon: 'none'
      })
    }
  })
}

onShow(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const currentOptions = currentPage?.options || {}

  if (currentOptions.name) {
    objectName.value = decodeURIComponent(currentOptions.name)
  }

  if (currentOptions.id) {
    cardId.value = decodeURIComponent(currentOptions.id)
  }

  updatePageTitle()
})
</script>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
}

.title {
  display: block;
  text-align: center;
}

.subtitle {
  display: block;
  text-align: center;
  margin-top: 12rpx;
}

.question-label {
  display: block;
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: #333333;
}

.question-note {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #666666;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #333333;
}

.picker-value {
  display: flex;
  align-items: center;
}

.placeholder-text {
  color: #999999;
}

.submit-btn {
  margin-top: 28rpx;
}
</style>
