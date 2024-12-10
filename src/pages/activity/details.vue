<script setup lang="ts">
import Layout from "@/components/Layout.vue";
import MetaInfo from "@/pages/activity/details/MetaInfo.vue";
import Header from "@/pages/activity/details/Header.vue";
import {getActivityDetails} from "@/api/activity/activity";
import type { Activity } from "@/api/activity/activity-interface";
import {ref} from "vue";
import {onLoad} from "@dcloudio/uni-app";


const activityDetails = ref<Activity>;
const isLoading = ref(true);

onLoad((option) => {
  isLoading.value = true;
  console.log(option.id);

  const res = getActivityDetails({ id: option.id });
  res.then((res) => {
    activityDetails.value = res.activity;
    isLoading.value = false; // 数据加载完成
    console.log(activityDetails.value);
  });
});

</script>

<template>
  <layout>
    <view class="activity-details" v-if="!isLoading">
      <Header :activity="activityDetails.value"></Header>
      <MetaInfo :activity="activityDetails.value"></MetaInfo>
      <button @click="">报名</button>
    </view>
  </layout>
</template>

<style scoped>
.activity-details {
  display: flex;
  flex-direction: column;
  height: 70%;
  width: 100%;
  background: #ffffff;
  border-radius: 50rpx 50rpx 0 0 ;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  overflow-x: hidden ;
  z-index: 1;
  opacity: 0.85;
  margin-top: auto;
}
button {
  margin-top: 40rpx;
  margin-bottom: 40rpx;
  width: 250px;
  padding: 2px;
  background-color: #a2e494;
  color: white;
  border: none;
  border-radius: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

</style>
