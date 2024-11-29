<template>
  <view class="sign">
  <view class="container">
    <image src="@/static/logo.png" class="logo" />
    <image src="/static/title.png" class="title" mode="aspectFill"></image>
    <view class="subtitle">活动签到</view>
    <input
        class="phone-input"
        type="string"
        v-model="name"
        placeholder="请输入姓名"
    />
    <button class="sign-button" @click="handleSignIn" :disabled="isSignedIn">{{ isSignedIn ? '已签到' : '点击签到' }}</button>
  </view>
    <button class="fixed-button" @click="navigateToDetails">查看签到详情</button>
  </view>
</template>

<script setup lang="ts">

import { ref } from "vue";
import { signIn } from "@/api/check-in";
import type {checkInData,checkInResponse} from "@/api/check-in";

const FIRST_ID = "67486c5422ded7a41d86aa7a";//id for test
//TODO : 获取活动id
const name = ref<string>("");
const responseMessage = ref<string>("");
const isSignedIn = ref<boolean>(false);
const data: checkInData = {
  activityId: FIRST_ID,
  name: name.value,
  phone: "-1",
}

const handleSignIn = async () => {
  if (!name.value) {
    await uni.showToast({title: "请输入姓名", icon: "none"});
    return;
  }
  try {
    data.name = name.value;
    console.log(data);
    const response: checkInResponse = await signIn(data);
    console.log(response);
    if (response.code === 0 ) {
      await uni.showToast({title: `${name.value}，签到成功！`, icon: "none"});
      responseMessage.value = `${name.value}，签到成功！`;
      isSignedIn.value = true;
    }
  } catch (error: any) {
    await uni.showToast({title: "签到失败，请重试", icon: "none"});
  }
};


const navigateToDetails = () => {
  uni.navigateTo({ url: '/pages/sign-in-details/sign-in-details' })// 跳转到 sign-in-details 页面
};
</script>

<style>
.sign {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo {
  margin-top: -20rpx;
  margin-bottom: 20rpx;
  width: 400rpx;
  height: 400rpx;
  transform: scale(1.3);
  transform-origin: center;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 80%;
  height:60%;
  padding: 40rpx;
  background: #ffffff;
  border-radius: 40rpx;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.1);
}
.title {
  height: 72rpx;
  width: 100%;
  margin-bottom: 20rpx;
}
.subtitle {
  font-size: 32rpx;
  text-align: center;
  margin-bottom: 20rpx;
}
.phone-input {
  width: 100%;
  padding: 20rpx;
  margin-bottom: 20rpx;
}
.sign-button {
  width: 100%;
  padding: 10rpx;
  background-color: #c7de97;
  color: white;
  border: none;
  border-radius: 20rpx;
}
.valid {
  background-color: #8fc31f;
}
.response {
  margin-top: 20rpx;
  text-align: center;
}

.fixed-button {
  position: fixed;
  bottom: 20rpx;
  right: 20rpx;
  padding: 10rpx 20rpx;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 20rpx;
  z-index: 1000;
}

.fixed-button:hover {
  background-color: #0056b3;
}
</style>
