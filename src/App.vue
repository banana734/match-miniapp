<template>
  <slot />
</template>

<script>
// 应用根组件：只负责启动日志与全局样式引入，不放业务逻辑
export default {
  // uni-app 应用生命周期：小程序首次启动时触发一次
  onLaunch() {
    console.log('Match miniapp launched')
  }
}
</script>

<style lang="scss">
@import './styles/common.scss';
</style>
