<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
  description?: string;
  tone?: "empty" | "error" | "success";
  actionLabel?: string;
}>(), {
  description: "",
  tone: "empty",
  actionLabel: "",
});

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <view class="state-panel" :class="`state-panel--${tone}`">
    <view class="state-panel__mark">
      <view class="state-panel__dot" />
      <view class="state-panel__line" />
    </view>
    <view class="state-panel__title">{{ title }}</view>
    <view v-if="description" class="state-panel__description">{{ description }}</view>
    <button v-if="actionLabel" class="secondary-button state-panel__action" @click="emit('action')">
      {{ actionLabel }}
    </button>
  </view>
</template>

<style scoped>
.state-panel {
  padding: 70rpx 34rpx;
  border: 1rpx solid rgba(21, 63, 50, 0.07);
  border-radius: var(--alumni-radius-lg);
  background: var(--alumni-paper);
  text-align: center;
}

.state-panel__mark {
  position: relative;
  width: 98rpx;
  height: 42rpx;
  margin: 0 auto 24rpx;
}

.state-panel__line {
  position: absolute;
  top: 20rpx;
  left: 0;
  width: 100%;
  height: 1rpx;
  background: var(--alumni-border);
}

.state-panel__dot {
  position: absolute;
  z-index: 1;
  top: 14rpx;
  left: 42rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--alumni-accent);
  box-shadow: 0 0 0 8rpx rgba(148, 197, 47, 0.12);
}

.state-panel--error .state-panel__dot {
  background: var(--alumni-danger);
  box-shadow: 0 0 0 8rpx rgba(199, 75, 66, 0.1);
}

.state-panel__title {
  color: var(--alumni-text);
  font-family: "Songti SC", "STSong", serif;
  font-size: 32rpx;
  font-weight: 600;
}

.state-panel__description {
  max-width: 520rpx;
  margin: 12rpx auto 0;
  color: var(--alumni-muted);
  font-size: 24rpx;
  line-height: 1.6;
}

.state-panel__action {
  width: fit-content;
  min-width: 180rpx;
  margin: 28rpx auto 0;
}
</style>
