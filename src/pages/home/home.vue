<template>
  <view class="container">
    <view class="card">
      <text class="title">主页面</text>
      <text class="subtitle">这里是首页，后面可以继续放登录入口或功能入口。</text>
    </view>
    <view class="card">
      <text class="title">项目简介</text>
      <text class="content">本项目是由四川大学华西临床医学院与计算机学院联合发起的大学生创新训练计划项目，依托华西心理卫生中心专业支持，为青少年提供“学业辅导+情绪陪伴”双轨支持。
已填写报名问卷的同学，后续所有相关通知均将通过本群发布，请大家留意群公告及消息。</text>
    </view>
    <view class="card">
      <text class="title">匹配指南</text>
      <text class="content">消息主体</text>
    </view>
  </view>
</template>

<script setup>
</script>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
   margin-bottom: 24rpx;
}

.title {
  display: block;
  text-align: center;
}

.subtitle {
  display: block;
  text-align: center;
}
</style>