<template>
  <slot />
</template>

<script>
export default {
  onLaunch() {
    console.log('Match miniapp launched')
  }
}
</script>

<style lang="scss">
@import './styles/common.scss';
</style>
