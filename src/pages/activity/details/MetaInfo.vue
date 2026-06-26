<script setup lang="ts">
import { computed } from "vue";
import type { Activity } from "@/api/activity/activity-interface";
import { timestampToTime } from "@/utils/time";
import { getLocationLabel } from "@/utils/location";

const props = withDefaults(defineProps<{
  activity: Activity;
  numbers?: number;
}>(), { numbers: 0 });

const locationLabel = computed(() => getLocationLabel(props.activity.location, props.activity.exactLocation));
const startTime = computed(() => timestampToTime(props.activity.start, "yyyy年MM月DD日 HH:mm"));
const registerWindow = computed(() =>
  `${timestampToTime(props.activity.registerStart, "MM月DD日 HH:mm")} 至 ${timestampToTime(props.activity.registerEnd, "MM月DD日 HH:mm")}`,
);
const capacity = computed(() => {
  if (props.activity.limit === -1) return `${props.numbers} 人已报名 · 不限名额`;
  return `${props.numbers} / ${props.activity.limit} 人`;
});
</script>

<template>
  <view class="activity-info surface-card">
    <view class="activity-info__grid">
      <view class="activity-info__item">
        <text class="activity-info__label">活动时间</text>
        <text class="activity-info__value">{{ startTime }}</text>
      </view>
      <view class="activity-info__item">
        <text class="activity-info__label">活动地点</text>
        <text class="activity-info__value">{{ locationLabel }}</text>
      </view>
      <view class="activity-info__item">
        <text class="activity-info__label">主办方</text>
        <text class="activity-info__value">{{ activity.sponsor || "未填写" }}</text>
      </view>
      <view class="activity-info__item">
        <text class="activity-info__label">报名情况</text>
        <text class="activity-info__value">{{ capacity }}</text>
      </view>
    </view>
    <view class="activity-info__section">
      <view class="activity-info__section-title">报名时间</view>
      <view class="activity-info__section-text">{{ registerWindow }}</view>
    </view>
    <view class="activity-info__section">
      <view class="activity-info__section-title">活动介绍</view>
      <view class="activity-info__section-text activity-info__description">{{ activity.description || "暂无活动介绍" }}</view>
    </view>
    <view v-if="activity.contact" class="activity-info__section">
      <view class="activity-info__section-title">联系方式</view>
      <view class="activity-info__section-text">{{ activity.contact }}</view>
    </view>
  </view>
</template>

<style scoped>
.activity-info { padding: 32rpx; }
.activity-info__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.activity-info__item { min-width: 0; padding: 22rpx; border-radius: var(--alumni-radius-md); background: var(--alumni-surface-muted); }
.activity-info__label { display: block; color: var(--alumni-muted); font-size: 21rpx; }
.activity-info__value { display: block; margin-top: 9rpx; color: var(--alumni-text); font-size: 25rpx; font-weight: 600; line-height: 1.5; word-break: break-all; }
.activity-info__section { margin-top: 30rpx; padding-top: 26rpx; border-top: 1rpx solid var(--alumni-border); }
.activity-info__section-title { font-family: "Songti SC", serif; font-size: 29rpx; font-weight: 600; }
.activity-info__section-text { margin-top: 12rpx; color: var(--alumni-muted); font-size: 25rpx; line-height: 1.75; }
.activity-info__description { color: var(--alumni-text); white-space: pre-wrap; }
</style>
