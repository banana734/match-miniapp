<template>
  <view class="container">
    <view class="page-bg">
      <image class="page-bg-img" src="/static/home-bg.jpg" mode="aspectFill" />
    </view>
    <view class="card card-gap-20 card-mb-24">
      <text class="title title-sm">项目简介</text>
      <text class="card-text">本项目是由四川大学华西临床医学院与计算机学院联合发起的大学生创新训练计划项目，依托华西心理卫生中心专业支持，为青少年提供“学业辅导+情绪陪伴”双轨支持。已填写报名问卷的同学，后续所有相关通知均将通过本群发布，请大家留意群公告及消息。</text>
    </view>
    <view class="card card-gap-20 card-mb-24">
      <text class="title title-sm">匹配指南</text>

      <view class="guide-section">
        <text class="guide-heading">一、使用流程</text>
        <text class="card-text">微信登录 → 选择身份（家长 / 导师）→ 填写个人资料 → 到「匹配」查看推荐对象 → 申请试课 → 试课后提交反馈 → 转入正式上课后提交日常反馈。</text>
      </view>

      <view class="guide-section">
        <text class="guide-heading">二、试课反馈决定去向</text>
        <text class="card-text">愿意：视为正常上课，双方卡片转入「正式上课」。</text>
        <text class="card-text">需要调整后再试一次：退回「待试课」，可再约一次。</text>
        <text class="card-text">不愿意：双方解除联系，卡片从列表中移除。</text>
      </view>

      <view class="guide-section">
        <text class="guide-heading">三、转为正式上课后</text>
        <text class="card-text">每节课可提交一次日常反馈。愿意则继续维持配对；不愿意则双方解除配对，移出「正式上课」。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
// 引入 uni-app 生命周期钩子（onShow 用于每次进入首页时检查身份）
import { onShow } from '@dcloudio/uni-app'
// 引入全局用户状态仓库
import { useUserStore } from '@/store/user'

// 获取全局仓库实例
const userStore = useUserStore()

// 每次进入首页时：
// 首页内容（项目简介 / 匹配指南）是静态介绍，不依赖身份，所以不再强制把
// 未选身份的用户弹走 —— 开发调试重置后希望能直接停在首页。
// 真正需要身份的地方（填资料、匹配等）自会在各自页面再引导选身份。
onShow(() => {
  // 静默刷新联系页的试课列表：如果联系页有新变化（对方发来试课、卡片转正式等），
  // 底部「联系」tab 会自动挂上数字徽标
  if (userStore.isLoggedIn && userStore.boundRole && userStore.profileCompleted) {
    userStore.refreshTrialLists()
  }
})
</script>

<style scoped>
/* 首页卡片里的正文文字：项目简介和匹配指南共用这一套排版，保证两处的字号、颜色一致。
   注意：这里必须显式写 font-size。不给的话 <text> 会用小程序默认字号（32rpx），
   和别处对不上，看起来就像换了字体。 */
.card-text {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #4b5563;
  line-height: 1.7;
}

/* 匹配指南的每一段：小标题 + 正文。段间距由 .card 的 gap 统一控制，这里不用再加 margin */
.guide-section {
  display: flex;
  flex-direction: column;
}

.guide-heading {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}
</style>
