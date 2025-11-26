<template>
  <view class="meta-grid" v-if="activity">
    <view class="meta-card">
      <text class="meta-label">活动地点</text>
      <text class="meta-value">{{ activity.location }}</text>
    </view>
    <view class="meta-card">
      <text class="meta-label">报名情况</text>
      <text class="meta-value">{{ activity.status }}/{{ activity.limit }}</text>
      <text class="meta-foot">已确认 {{ confirmedCount }} 人</text>
    </view>
    <view class="meta-card">
      <text class="meta-label">联系方式</text>
      <text class="meta-value">{{ activity.contact }}</text>
    </view>
    <view class="meta-card">
      <text class="meta-label">活动时间</text>
      <text class="meta-value">{{ startTime }}</text>
    </view>
    <view class="meta-card span-2">
      <text class="meta-label">报名时间</text>
      <text class="meta-value">{{ registerWindow }}</text>
    </view>
    <view class="meta-card span-2">
      <text class="meta-label">活动介绍</text>
      <text class="meta-value">{{ activity.description }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { timestampToTime } from "@/utils/time";
import type { Activity } from "@/api/activity/activity-interface";

const props = defineProps<{
  activity: Activity | null;
  numbers?: number;
}>();

const startTime = computed(() => {
  if (!props.activity) return "--";
  return timestampToTime(props.activity.start);
});

const registerWindow = computed(() => {
  if (!props.activity) return "--";
  const start = timestampToTime(props.activity.registerStart);
  const end = timestampToTime(props.activity.registerEnd);
  return `${start} - ${end}`;
});

const confirmedCount = computed(() => {
  if (props.numbers !== undefined) return props.numbers;
  return props.activity?.status ?? 0;
});
</script>

<style scoped>
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.meta-card {
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--alumni-surface-muted);
  min-height: 120rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.span-2 {
  grid-column: span 2;
}

.meta-label {
  font-size: 24rpx;
  color: var(--alumni-muted);
}

.meta-value {
  font-size: 30rpx;
  color: var(--alumni-text);
  line-height: 1.4;
}

.meta-foot {
  font-size: 22rpx;
  color: var(--alumni-muted);
}
</style>
