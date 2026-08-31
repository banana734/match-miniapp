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
// uni-app 页面生命周期钩子（页面每次显示时触发）
import { onShow } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'
// 引入后端接口基地址常量
import { API_BASE_URL } from '@/utils/api'
// 引入家庭反馈页专属的选项常量（满意点/客观不满意/主观不满意）与通用文案常量
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
// 引入试课反馈页通用逻辑组合式函数（表单、路由参数解析、校验等）
import { useTrialFeedbackPage } from '@/composables/useTrialFeedbackPage'

// 获取全局仓库实例
const userStore = useUserStore()
// 解构出通用页面能力：
// objectName  反馈对象名称（来自路由参数 name）
// cardId      当前反馈对应的卡片 id
// pageTitle   页面标题（对象名 + 标题后缀拼成）
// form        反馈表单数据
// syncPageFromRoute 每次显示时从路由参数回填 name / id
// handleDateChange        日期选择器变更统一入口
// handleChoiceGroupChange 单选/多选组变更统一入口（自动处理“其他”自定义输入）
// validate    提交前的必填校验
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

// 家庭视角的各题选项（导师反馈页对应另一套选项）
const satisfactionOptions = familyTrialSatisfactionOptions
const objectiveUnsatisfiedOptions = familyTrialObjectiveUnsatisfiedOptions
const subjectiveUnsatisfiedOptions = familyTrialSubjectiveUnsatisfiedOptions
const continueChoiceOptions = trialFeedbackContinueOptions

// 试课日期选择事件（委托给通用 handleDateChange）
const handleTrialDateChange = (e) => {
  handleDateChange('trialDate', e)
}

// 满意点多选事件：多选写入 satisfactionPoints，取消“其他”时清空自定义输入
const handleSatisfactionPointsChange = (e) => {
  handleChoiceGroupChange('satisfactionPoints', 'satisfactionPointOther', e)
}

// 客观不满意点多选事件（与友导师能力、风格、条件等有关）
const handleObjectiveUnsatisfiedChange = (e) => {
  handleChoiceGroupChange('objectiveUnsatisfied', 'objectiveUnsatisfiedOther', e)
}

// 主观不满意点多选事件（与我家孩子或我的配合有关）
const handleSubjectiveUnsatisfiedChange = (e) => {
  handleChoiceGroupChange('subjectiveUnsatisfied', 'subjectiveUnsatisfiedOther', e)
}

// 继续合作意向单选事件
// 注意：该值会被后端映射为试课状态（愿意→formal / 需调整→pending / 不愿意→rejected）
const handleContinueChoiceChange = (e) => {
  handleChoiceGroupChange('continueChoice', 'continueChoiceOther', e)
}

// 保存反馈：先校验必填，再把整份表单提交到后端 /trial/feedback
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
      role: userStore.currentRole,
      cardId: cardId.value,
      // 顶层 continueChoice 供后端判定试课走向；feedback 为完整问卷内容
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

      // 提示展示完再返回上一页（试课列表页）
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

// 每次显示页面时，从路由参数同步反馈对象（id / name）
onShow(() => {
  syncPageFromRoute()
})
</script>
