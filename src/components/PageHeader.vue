<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <view class="page-header">
    <text v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</text>
    <view class="page-header__row">
      <view class="page-header__copy">
        <view class="page-header__title">{{ title }}</view>
        <view v-if="description" class="page-header__description">{{ description }}</view>
      </view>
      <view v-if="$slots.action" class="page-header__action">
        <slot name="action" />
      </view>
    </view>
  </view>
</template>

<style scoped>
.page-header {
  padding: 28rpx 4rpx 30rpx;
}

.page-header__eyebrow {
  display: block;
  margin-bottom: 10rpx;
  color: var(--alumni-muted);
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
  text-transform: uppercase;
}

.page-header__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
}

.page-header__copy {
  min-width: 0;
  flex: 1;
}

.page-header__title {
  color: var(--alumni-text);
  font-family: "Songti SC", "STSong", serif;
  font-size: 46rpx;
  font-weight: 600;
  line-height: 1.25;
}

.page-header__description {
  margin-top: 10rpx;
  color: var(--alumni-muted);
  font-size: 24rpx;
  line-height: 1.55;
}

.page-header__action {
  flex: none;
}
</style>
