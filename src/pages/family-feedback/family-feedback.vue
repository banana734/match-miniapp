<template>
  <view class="container">
    <view class="card">
      <text class="title">{{ pageTitle }}</text>
      <text class="subtitle">先记录本次试课的基础信息，后面我们再继续补充更详细的反馈。</text>

      <text class="question-label">1. 试课日期</text>
      <picker mode="date" :value="form.trialDate" @change="handleTrialDateChange">
        <view class="input picker-value" :class="{ 'placeholder-text': !form.trialDate }">
          {{ form.trialDate || '请选择试课日期' }}
        </view>
      </picker>

      <text class="question-label">2. 试课时长</text>
      <input
        v-model="form.trialDuration"
        class="input"
        placeholder="请输入试课时长，如 60 分钟"
      />

      <text class="question-label">3. [多选] 满意点（友导师做得好的地方）</text>
      <text class="question-note">请根据实际情况勾选或补充</text>
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

      <text class="question-label">4. [多选] 不满意点</text>
      <text class="question-note">（一）客观原因（与友导师能力、风格、条件等关系较大）</text>
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

      <text class="question-label">5. [多选] 不满意点</text>
      <text class="question-note">（二）主观原因（与我家孩子或我的配合有关）</text>
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

      <text class="question-label">6. 是否愿意继续与该友导师合作</text>
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

      <view class="primary-btn submit-btn" @tap="submitFeedback">保存反馈</view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { API_BASE_URL } from '@/utils/api'
import {
  familyTrialObjectiveUnsatisfiedOptions,
  familyTrialSatisfactionOptions,
  familyTrialSubjectiveUnsatisfiedOptions,
  trialFeedbackContinueOptions,
  trialFeedbackDefaultObjectName,
  trialFeedbackIncompleteToast,
  trialFeedbackSuccessToast,
  trialFeedbackTitleSuffix
} from '@/constants/trial-feedback-options'
import { useTrialFeedbackPage } from '@/composables/useTrialFeedbackPage'

const userStore = useUserStore()
const {
  objectName,
  cardId,
  pageTitle,
  form,
  syncPageFromRoute,
  handleDateChange,
  handleChoiceGroupChange,
  validate
} = useTrialFeedbackPage(trialFeedbackDefaultObjectName, trialFeedbackTitleSuffix)

const satisfactionOptions = familyTrialSatisfactionOptions
const objectiveUnsatisfiedOptions = familyTrialObjectiveUnsatisfiedOptions
const subjectiveUnsatisfiedOptions = familyTrialSubjectiveUnsatisfiedOptions
const continueChoiceOptions = trialFeedbackContinueOptions

const handleTrialDateChange = (e) => {
  handleDateChange('trialDate', e)
}

const handleSatisfactionPointsChange = (e) => {
  handleChoiceGroupChange('satisfactionPoints', 'satisfactionPointOther', e)
}

const handleObjectiveUnsatisfiedChange = (e) => {
  handleChoiceGroupChange('objectiveUnsatisfied', 'objectiveUnsatisfiedOther', e)
}

const handleSubjectiveUnsatisfiedChange = (e) => {
  handleChoiceGroupChange('subjectiveUnsatisfied', 'subjectiveUnsatisfiedOther', e)
}

const handleContinueChoiceChange = (e) => {
  handleChoiceGroupChange('continueChoice', 'continueChoiceOther', e)
}

const submitFeedback = () => {
  if (!validate()) {
    uni.showToast({
      title: trialFeedbackIncompleteToast,
      icon: 'none'
    })
    return
  }

  uni.request({
    url: `${API_BASE_URL}/trial/feedback`,
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
        title: trialFeedbackSuccessToast,
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
  syncPageFromRoute()
})
</script>
