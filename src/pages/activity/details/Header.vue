<script setup lang="ts">
import { computed, ref } from "vue";
import type { Activity } from "@/api/activity/activity-interface";
import { timestampToTime } from "@/utils/time";

const props = defineProps<{ activity: Activity }>();
const coverFailed = ref(false);
const coverUrl = computed(() =>
  !coverFailed.value && props.activity.cover ? props.activity.cover : "/static/logo.png",
);
</script>

<template>
  <view class="activity-header">
    <view class="activity-header__visual">
      <image class="activity-header__cover" :src="coverUrl" mode="aspectFill" @error="coverFailed = true" />
      <view class="activity-header__date">
        <text class="activity-header__day">{{ timestampToTime(activity.start, "DD") }}</text>
        <text class="activity-header__month">{{ timestampToTime(activity.start, "MM月") }}</text>
      </view>
    </view>
    <view class="activity-header__copy">
      <view class="activity-header__eyebrow">EVENT DETAIL</view>
      <view class="activity-header__title">{{ activity.name }}</view>
    </view>
  </view>
</template>

<style scoped>
.activity-header { overflow: hidden; border-radius: var(--alumni-radius-lg); background: #fff; box-shadow: var(--alumni-shadow); }
.activity-header__visual { position: relative; height: 390rpx; overflow: hidden; background: var(--alumni-primary-soft); }
.activity-header__cover { width: 100%; height: 100%; }
.activity-header__date { position: absolute; bottom: 22rpx; left: 22rpx; min-width: 88rpx; padding: 13rpx 16rpx; border-radius: 20rpx; background: rgba(242, 237, 226, 0.94); color: var(--alumni-primary); text-align: center; }
.activity-header__day { display: block; font-family: "Songti SC", serif; font-size: 40rpx; font-weight: 700; line-height: 1; }
.activity-header__month { display: block; margin-top: 7rpx; font-size: 20rpx; }
.activity-header__copy { padding: 30rpx 32rpx 34rpx; }
.activity-header__eyebrow { margin-bottom: 12rpx; color: var(--alumni-muted); font-size: 19rpx; font-weight: 700; letter-spacing: 3rpx; }
.activity-header__title { color: var(--alumni-text); font-family: "Songti SC", serif; font-size: 40rpx; font-weight: 600; line-height: 1.4; white-space: pre-line; }
</style>
