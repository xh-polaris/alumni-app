<template>
  <view class="sign">
    <view class="container">
      <image v-if="!isSignedIn && !showError" src="@/static/logo.png" class="logo" />
      <image v-if="isSignedIn && !showError" src="@/static/success-check.svg" class="success-check" />
      <image v-if="showError" src="@/static/warning-exclamation.svg" class="warning-exclamation" />
      <image src="/static/title.png" class="title" mode="aspectFill"></image>
      <view class="subtitle">活动签到</view>
      <input v-show="!isSignedIn"
        class="phone-input"
        type="string"
        v-model="name"
        placeholder="请输入姓名"
      />
      <button class="sign-button" @click="handleSignIn" :disabled="isSignedIn">{{ isSignedIn ? '已签到' : '点击签到' }}</button>
      <view v-if="responseMessage" class="response-message">{{ responseMessage }}</view>
    </view>
    <button class="fixed-button" @longpress="navigateToDetails">查看签到详情</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { signIn, getCheckInDetails } from "@/api/check-in";
import type { checkInData, checkInResponse, checkInDetails } from "@/api/check-in";

const FIRST_ID = "6749c844c9fc4f1f67c398dc"; // id for test
// TODO : 获取活动id
const name = ref<string>("");
const responseMessage = ref<string>("");
const isSignedIn = ref<boolean>(false);
const showError = ref<boolean>(false);
const isUserIn =ref<boolean>(true);

const data: checkInData = {
  activityId: FIRST_ID,
  name: name.value,
  phone: "-1",
};

const checkIfSignedIn = async (name: string): Promise<boolean> => {
  try {
    const details: checkInDetails = await getCheckInDetails(FIRST_ID);
    const user = details.registers.find(register => register.name === name);
    if (user) {
      return user.checkIn;
    } else {
      await uni.showToast({title: "您不在名单内", duration: 2000,icon:"error"})
      responseMessage.value = "您不在名单内，请联系工作人员";
      showError.value = true;
      isUserIn.value = false;
      return false;
    }
  } catch (error: any) {
    responseMessage.value = "查询失败，请重试";
    showError.value = true;
    return false;
  }
};

const handleSignIn = async () => {
  if (!name.value) {
    await uni.showToast({title: "请输入姓名", duration: 2000,icon:"error"})
    showError.value = true;
    return;
  }

  const isUserSignedIn = await checkIfSignedIn(name.value);
  if (isUserSignedIn) {
    responseMessage.value = "您已签过到，请勿重复签到";
    showError.value = true;
    return;
  }
  console.log(isUserIn)
  if(isUserIn){
  try {
    data.name = name.value;
    console.log(data);
    const response: checkInResponse = await signIn(data);
    console.log(response);
    if (response.code === 0) {
      responseMessage.value = `${name.value}，签到成功！`;
      isSignedIn.value = true;
      showError.value = false;
    } else {
      responseMessage.value = "签到失败，请重试";
      showError.value = true;
    }
  } catch (error: any) {
    showError.value = true;
  }}
};

const navigateToDetails = () => {
  uni.navigateTo({ url: "/pages/sign-in-details/sign-in-details" }); // 跳转到 sign-in-details 页面
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

.success-check {
  margin-top: -20rpx;
  margin-bottom: 20rpx;
  width: 400rpx;
  height: 400rpx;
  color: green;
}

.warning-exclamation {
  margin-top: -20rpx;
  margin-bottom: 20rpx;
  width: 400rpx;
  height: 400rpx;
  color: yellow;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 80%;
  height: 60%;
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

.fixed-button {
  position: fixed;
  top: 20rpx;
  left: 20rpx;
  padding: 10rpx 20rpx;
  background-color: #e1efc4;
  color: #e1efc4;
  border-radius: 20rpx;
  z-index: 1000;
  opacity: 0;
  border: none;
}


.response-message {
  font-size: 40rpx;
  margin-top: 40rpx;
}
</style>
