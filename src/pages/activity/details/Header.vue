<template>
  <view class="header" v-if="activity">
    <view class="title">{{ activity.name.split("\n")[0] }}</view>
    <view class="title">{{ activity.name.split("\n")[1] }}</view>
  </view>
</template>

<script setup lang="ts">
import type { Activity } from "@/api/activity/activity-interface";

const props = defineProps<{
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
