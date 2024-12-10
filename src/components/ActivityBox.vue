<script setup lang="ts">
import type {Activity} from "@/api/activity/activity-interface";
import {timestampToTime} from "@/utils/time.ts";

const {activity} = defineProps<{activity:Activity}>()
const time = timestampToTime(activity.start)

const coverUrl = activity.cover == "" ? '/static/logo.png': activity.cover

const navigateToDetails = (id:string) => {
  uni.navigateTo({
    url: `/pages/activity/details?id=${id}`,
  })}
</script>

<template>
<view class="box" @click="navigateToDetails(activity.id)" >
  <view class="cover">
    <image :src="coverUrl" alt=""/>
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
  padding: 20rpx;
}
.activity-title{
  font-size: 34rpx;
  font-weight: 700;
}
.cover{
  width: calc(40% - 40rpx);
  height: 100%;
  border-radius: 40rpx;
  overflow: hidden;
  margin-right: 40rpx;
  z-index: 3;
}

.cover image{
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
</style>