<script setup lang="ts">
import { computed } from "vue";
import type { Activity } from "@/api/activity/activity-interface";
import { timestampToTime } from "@/utils/time";

const { activity } = defineProps<{ activity: Activity }>();

const coverUrl = computed(() => (activity.cover ? activity.cover : "/static/logo.png"));
const time = computed(() => timestampToTime(activity.start, "MM月DD日 HH:mm"));
const isFull = computed(() => activity.status >= activity.limit);

const navigateToDetails = (id: string) => {
  uni.navigateTo({
    url: `/pages/activity/details?id=${id}`,
  });
};
</script>

<template>
  <view class="activity-card surface-card" @click="navigateToDetails(activity.id)">
    <image class="activity-card__cover" :src="coverUrl" mode="aspectFill" />
    <view class="activity-card__body">
      <view class="activity-card__title">{{ activity.name }}</view>
      <view class="activity-card__meta">
        <text>{{ time }}</text>
        <text>·</text>
        <text>{{ activity.location }}</text>
      </view>
      <view class="activity-card__footer">
        <view class="pill" :class="{ 'pill--danger': isFull }">
          {{ isFull ? "报名已满" : "报名中" }} · {{ activity.status }}/{{ activity.limit }}
        </view>
        <text class="activity-card__hint">主办方：{{ activity.sponsor }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.activity-card {
  display: flex;
  gap: 28rpx;
  align-items: center;
  margin-bottom: 28rpx;
  padding: 32rpx 28rpx;
}

.activity-card__cover {
  width: 170rpx;
  height: 170rpx;
  border-radius: 28rpx;
}

.activity-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.activity-card__title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--alumni-text);
}

.activity-card__meta {
  display: flex;
  gap: 12rpx;
  align-items: center;
  color: var(--alumni-muted);
  font-size: 24rpx;
}

.activity-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
}

.activity-card__hint {
  font-size: 24rpx;
  color: var(--alumni-muted);
}

.pill--danger {
  background: rgba(255, 99, 71, 0.12);
  color: #ff6347;
}
</style>