<script setup lang="ts">
withDefaults(defineProps<{
  tone?: "default" | "warm";
}>(), {
  tone: "default",
});
</script>

<template>
  <view class="layout" :class="`layout--${tone}`">
    <view class="layout__orbit layout__orbit--one" />
    <view class="layout__orbit layout__orbit--two" />
    <view class="layout__content">
      <slot />
    </view>
  </view>
</template>

<style scoped>
.layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(155deg, #edf4f0 0%, #f6f8f6 52%, #f3f0e8 100%);
}

.layout--warm {
  background: linear-gradient(155deg, #f5f2e9 0%, #f6f8f6 58%, #edf4f0 100%);
}

.layout__content {
  position: relative;
  z-index: 2;
}

.layout__orbit {
  position: absolute;
  z-index: 1;
  border: 1rpx solid rgba(148, 197, 47, 0.2);
  border-radius: 50%;
  pointer-events: none;
  transform: rotate(-12deg);
}

.layout__orbit--one {
  top: -260rpx;
  right: -250rpx;
  width: 720rpx;
  height: 360rpx;
  box-shadow: 0 34rpx 0 rgba(148, 197, 47, 0.035);
}

.layout__orbit--two {
  right: -300rpx;
  bottom: 120rpx;
  width: 600rpx;
  height: 260rpx;
  opacity: 0.5;
}
</style>
