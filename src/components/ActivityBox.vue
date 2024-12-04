<script setup lang="ts">
import type {Activity} from "@/api/activity/activity-interface";
import {timestampToTime} from "@/utils/time"

const {activity} = defineProps<{activity:Activity}>()
const time = timestampToTime(activity.start)

const navigateToDetails = () => {
  uni.setStorageSync('activity',activity);
  uni.navigateTo({
    url: `/pages/activity/details`
  })
}
</script>

<template>
<view class="box" @click="navigateToDetails">
  <view class="cover">
    <image :src="activity.cover" alt=""/>
  </view>
  <view class="activity-information">
    <view class="activity-title">
      <text>{{activity.name}}</text>
    </view>
    <view class="activity-time">
      <text>{{time}}</text>
    </view>
    <view class="register-status">
      <text>已报名</text>
      <text>{{activity.status}}/{{activity.limit}}</text>
    </view>
  </view>
</view>
</template>

<style scoped>
.box{
  position: relative;
  width: 600rpx;
  height: 200rpx;
  border-radius: 40rpx;
  background-color: #fff;
  padding: 40rpx;
  box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.2);
  z-index: 1;
  opacity: 0.8;
  margin-top: 40rpx;
  display: flex;
}
.activity-information{
  width: calc(60% - 40rpx);
  height: calc(100% - 80rpx);
  position: absolute;
  bottom: 20rpx;
  right: 2.5%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 40rpx;
  z-index: 2;
  opacity: 0.95;
  background-color: #d3ede8;
  box-shadow: 0 5rpx 10rpx rgba(0, 0, 0, 0.2);
  padding: 20rpx;
}
.activity-title{
  font-size: 40rpx;
}
</style>