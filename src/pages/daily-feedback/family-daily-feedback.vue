<template>
  <view class="container">
    <view class="card">
      <text class="title">{{ pageTitle }}</text>
      <text class="subtitle">记录本次正式上课的情况，方便我们持续优化匹配质量。</text>

      <text class="question-label">1. 上课日期</text>
      <picker mode="date" :value="form.classDate" @change="handleClassDateChange">
        <view class="input picker-value" :class="{ 'placeholder-text': !form.classDate }">
          {{ form.classDate || '请选择上课日期' }}
        </view>
      </picker>

      <text class="question-label">2. 本次课程时长</text>
      <input
        v-model="form.classDuration"
        class="input"
        placeholder="请输入本次课程时长，如 60 分钟"
      />

      <text class="question-label">3. [多选] 满意点（本次课程中，友导师做得好的地方）</text>
      <text class="question-note">请根据实际情况勾选或补充</text>
      <view class="subject-list">
        <view
          v-for="item in satisfactionOptions"
          :key="item"
          class="subject-tag"
          :class="{ active: form.satisfactionPoints.includes(item) }"
          @tap="toggleChoice('satisfactionPoints', 'satisfactionPointOther', item)"
        >
          <text>{{ item }}</text>
        </view>
      </view>
      <input
        v-if="form.satisfactionPoints.includes('其他')"
        v-model="form.satisfactionPointOther"
        class="input"
        placeholder="请输入其他满意点"
      />

      <text class="question-label">4. [多选] 遇到的困难</text>
      <text class="question-note">（一）客观原因（与友导师能力、风格、条件等关系较大）</text>
      <view class="subject-list">
        <view
          v-for="item in objectiveUnsatisfiedOptions"
          :key="item"
          class="subject-tag"
          :class="{ active: form.objectiveUnsatisfied.includes(item) }"
          @tap="toggleChoice('objectiveUnsatisfied', 'objectiveUnsatisfiedOther', item)"
        >
          <text>{{ item }}</text>
        </view>
      </view>
      <input
        v-if="form.objectiveUnsatisfied.includes('其他')"
        v-model="form.objectiveUnsatisfiedOther"
        class="input"
        placeholder="请输入其他客观原因"
      />

      <text class="question-label">5. [多选] 遇到的困难</text>
      <text class="question-note">（二）主观原因（与我家孩子或我的配合有关）</text>
      <view class="subject-list">
        <view
          v-for="item in subjectiveUnsatisfiedOptions"
          :key="item"
          class="subject-tag"
          :class="{ active: form.subjectiveUnsatisfied.includes(item) }"
          @tap="toggleChoice('subjectiveUnsatisfied', 'subjectiveUnsatisfiedOther', item)"
        >
          <text>{{ item }}</text>
        </view>
      </view>
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
// 引入家庭反馈页专属的选项常量（满意点/客观困难/主观困难）与通用文案常量
import {
  familyDailyObjectiveUnsatisfiedOptions,
  familyDailySatisfactionOptions,
  familyDailySubjectiveUnsatisfiedOptions,
  dailyFeedbackContinueOptions,
  dailyFeedbackDefaultObjectName,
  dailyFeedbackIncompleteToast,
  dailyFeedbackSuccessToast,
  dailyFeedbackTitleSuffix
} from '@/constants/daily-feedback-options'
// 引入日常反馈页通用逻辑组合式函数（表单、路由参数解析、校验等）
import { useDailyFeedbackPage } from '@/composables/useDailyFeedbackPage'

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
} = useDailyFeedbackPage(dailyFeedbackDefaultObjectName, dailyFeedbackTitleSuffix)

// 家庭视角的各题选项（导师反馈页对应另一套选项）
const satisfactionOptions = familyDailySatisfactionOptions
const objectiveUnsatisfiedOptions = familyDailyObjectiveUnsatisfiedOptions
const subjectiveUnsatisfiedOptions = familyDailySubjectiveUnsatisfiedOptions
const continueChoiceOptions = dailyFeedbackContinueOptions

// 上课日期选择事件（委托给通用 handleDateChange）
const handleClassDateChange = (e) => {
  handleDateChange('classDate', e)
}

// 多选标签点击切换：把选项加入或移出对应数组；
// 取消勾选“其他”时，顺带清空它的自定义输入框（与资料页逻辑保持一致）
const toggleChoice = (field, otherField, value) => {
  const list = form[field]
  const index = list.indexOf(value)
  if (index > -1) {
    list.splice(index, 1)
    if (value === '其他') {
      form[otherField] = ''
    }
    return
  }
  list.push(value)
}

// 继续合作意向单选事件
// 注意：该值会被后端用于维持或解除正式上课配对（愿意→维持 / 不愿意→双方解除）
const handleContinueChoiceChange = (e) => {
  handleChoiceGroupChange('continueChoice', 'continueChoiceOther', e)
}

// 保存反馈：先校验必填，再把整份表单提交到后端 /daily/feedback
const submitFeedback = () => {
  if (!validate()) {
    uni.showToast({
      title: dailyFeedbackIncompleteToast,
      icon: 'none'
    })
    return
  }

  uni.request({
    url: `${API_BASE_URL}/daily/feedback`,
    method: 'POST',
    data: {
      openid: userStore.openid,
      role: userStore.currentRole,
      cardId: cardId.value,
      // 顶层 continueChoice 供后端判定是否解除配对；feedback 为完整问卷内容
      continueChoice: form.continueChoice,
      feedback: {
        classDate: form.classDate,
        classDuration: form.classDuration,
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
        title: dailyFeedbackSuccessToast,
        icon: 'success'
      })

      // 提示展示完再返回上一页（正式上课列表页）
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
