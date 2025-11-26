<template>
  <view class="header" v-if="activity">
    <view class="pill">主办方 · {{ activity.sponsor }}</view>
    <view class="title">{{ activity.name }}</view>
    <view class="subtitle">{{ activity.exactLocation }}</view>
  </view>
</template>

<script setup lang="ts">
import type { Activity } from "@/api/activity/activity-interface";

defineProps<{
  activity: Activity | null;
}>();
</script>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--alumni-text);
}

.subtitle {
  font-size: 26rpx;
  color: var(--alumni-muted);
}
</style>
