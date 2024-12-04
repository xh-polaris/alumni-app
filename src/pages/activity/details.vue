<script setup lang="ts">
import Layout from "@/components/Layout.vue";
import type { Activity } from "@/api/activity/activity-interface";
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";

const activityDetails = ref<Activity | null>(null);

onLoad(() => {
  const storedActivity = uni.getStorageSync('activity');
  console.log(storedActivity);

  // 确保从 localStorage 获取的数据是有效的
  if (storedActivity) {
    activityDetails.value = storedActivity;
    console.log(activityDetails.value); // 这里可以打印出实际数据，确认是否正确赋值
  }
});
</script>

<template>
  <layout>
    <view class ="activity-details">
      <view class="activity-item">{{ activityDetails?.name }}</view>
      <view class="activity-item">{{ activityDetails?.start }}</view>
      <view class="activity-item">{{ activityDetails?.location }}</view>
      <view class="activity-item">{{ activityDetails?.sponsor }}</view>
      <view class="activity-item">{{ activityDetails?.contact }}</view>
      <view class="activity-item">{{ activityDetails?.description }}</view>
      <view class="activity-register">
        <button class="register-button" @click="">报名</button>
      </view>
    </view>
  </layout>
</template>

<style scoped>
.activity-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  width: 80%;
  padding: 20px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  overflow-x: hidden ;
  z-index: 1;
  opacity: 0.8;
  margin-top: 100rpx;
}
.activity-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 10px;
  padding: 10px;
  border-radius: 10px;
  background: #f5f5f5;
  width: 80%;
  height: 40px;
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  text-align: center;
}
</style>
