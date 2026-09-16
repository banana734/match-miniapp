<template>
  <view class="container">
    <view class="card card-gap-20 card-mb-24">
      <text class="title title-sm">主页面</text>
      <text class="subtitle subtitle-sm">这里是首页，后面可以继续放登录入口或功能入口。</text>
    </view>
    <view class="card card-gap-20 card-mb-24">
      <text class="title title-sm">项目简介</text>
      <text class="content text-block">本项目是由四川大学华西临床医学院与计算机学院联合发起的大学生创新训练计划项目，依托华西心理卫生中心专业支持，为青少年提供“学业辅导+情绪陪伴”双轨支持。
已填写报名问卷的同学，后续所有相关通知均将通过本群发布，请大家留意群公告及消息。</text>
    </view>
    <view class="card card-gap-20 card-mb-24">
      <text class="title title-sm">匹配指南</text>
      <text class="content text-block">消息主体</text>
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

// 每次进入首页时：已登录但还没选身份的用户，强制回身份选择页，
// 不允许在未选身份的情况下停留在首页或去填资料。
onShow(() => {
  if (userStore.isLoggedIn && !userStore.boundRole) {
    // 延后一帧再跳转，避开和页面加载/切换生命周期的竞态，避免 reLaunch:fail timeout
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/role-first/role-first' })
    }, 60)
  }
})
</script>
