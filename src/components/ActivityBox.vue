<script setup lang="ts">
import { computed, ref } from "vue";
import type { Activity } from "@/api/activity/activity-interface";
import { timestampToTime } from "@/utils/time";

const props = defineProps<{ activity: Activity }>();
const coverFailed = ref(false);

const coverUrl = computed(() =>
  !coverFailed.value && props.activity.cover ? props.activity.cover : "/static/logo.png",
);
const startTime = computed(() => timestampToTime(props.activity.start, "MM月DD日 HH:mm"));
const capacityText = computed(() => {
  if (props.activity.limit === -1) return "不限名额";
  const remaining = Math.max(props.activity.limit - props.activity.status, 0);
  return remaining > 0 ? `剩余 ${remaining} 席` : "名额已满";
});
const registrationState = computed(() => {
  const now = Math.floor(Date.now() / 1000);
  if (props.activity.limit !== -1 && props.activity.status >= props.activity.limit) return "full";
  if (now < props.activity.registerStart) return "upcoming";
  if (now > props.activity.registerEnd) return "closed";
  return "open";
});
const statusLabel = computed(() => ({
  open: "报名中",
  full: "已满",
  upcoming: "即将开始",
  closed: "已截止",
}[registrationState.value]));

const openDetails = () => {
  uni.navigateTo({ url: `/pages/activity/details?id=${props.activity.id}` });
};

const openRegisterEntry = () => {
  if (registrationState.value !== "open") return;
  openDetails();
};
</script>

<template>
  <view class="activity-card" hover-class="activity-card--pressed" hover-stay-time="90" @click="openDetails">
    <view class="activity-card__visual">
      <image class="activity-card__cover" :src="coverUrl" mode="aspectFill" @error="coverFailed = true" />
      <view class="activity-card__date">
        <text class="activity-card__day">{{ timestampToTime(activity.start, "DD") }}</text>
        <text class="activity-card__month">{{ timestampToTime(activity.start, "MM月") }}</text>
      </view>
    </view>
    <view class="activity-card__body">
      <view class="activity-card__status-row">
        <view class="pill" :class="`pill--${registrationState}`">{{ statusLabel }}</view>
        <text class="activity-card__capacity">{{ capacityText }}</text>
      </view>
      <view class="activity-card__title">{{ activity.name }}</view>
      <view class="activity-card__meta">
        <text>{{ startTime }}</text>
        <text>{{ activity.location || "地点待定" }}</text>
      </view>
      <view v-if="activity.sponsor" class="activity-card__sponsor">{{ activity.sponsor }}</view>
    </view>
  </view>
</template>

<style scoped>
.activity-card { margin-bottom: 26rpx; overflow: hidden; border: 1rpx solid rgba(21, 63, 50, 0.07); border-radius: var(--alumni-radius-lg); background: #fff; box-shadow: var(--alumni-shadow); transition: transform 180ms ease, box-shadow 180ms ease; }
.activity-card--pressed { transform: scale(0.985); box-shadow: 0 10rpx 28rpx rgba(21, 63, 50, 0.07); }
.activity-card__visual { position: relative; height: 320rpx; overflow: hidden; background: var(--alumni-primary-soft); }
.activity-card__cover { width: 100%; height: 100%; }
.activity-card__date { position: absolute; bottom: 18rpx; left: 18rpx; min-width: 78rpx; padding: 11rpx 14rpx; border-radius: 18rpx; background: rgba(242, 237, 226, 0.94); color: var(--alumni-primary); text-align: center; backdrop-filter: blur(10rpx); }
.activity-card__day { display: block; font-family: "Songti SC", serif; font-size: 34rpx; font-weight: 700; line-height: 1; }
.activity-card__month { display: block; margin-top: 6rpx; font-size: 19rpx; }
.activity-card__body { padding: 28rpx 30rpx 30rpx; }
.activity-card__status-row { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.activity-card__capacity { color: var(--alumni-muted); font-size: 22rpx; }
.pill--full, .pill--closed { background: rgba(199, 75, 66, 0.09); color: var(--alumni-danger); }
.pill--upcoming { background: var(--alumni-primary-soft); color: var(--alumni-primary); }
.activity-card__title { margin-top: 18rpx; color: var(--alumni-text); font-family: "Songti SC", serif; font-size: 34rpx; font-weight: 600; line-height: 1.4; white-space: pre-line; }
.activity-card__meta { display: flex; flex-direction: column; gap: 6rpx; margin-top: 16rpx; color: var(--alumni-muted); font-size: 23rpx; line-height: 1.5; }
.activity-card__sponsor { margin-top: 18rpx; padding-top: 16rpx; border-top: 1rpx solid var(--alumni-border); color: var(--alumni-muted); font-size: 22rpx; }
.activity-card__actions { display: flex; justify-content: flex-end; margin-top: 18rpx; padding-top: 16rpx; border-top: 1rpx solid var(--alumni-border); }
.activity-card__register { min-height: 58rpx; padding: 8rpx 0 8rpx 20rpx; color: var(--alumni-primary); font-size: 24rpx; }
@media (prefers-reduced-motion: reduce) { .activity-card { transition: none; } }
</style>
