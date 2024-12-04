<template>
  <view class="sign">
    <view class="overlay"></view>
    <view class="container">
      <image v-if="!isSignedIn && !showError" src="@/static/logo.png" class="logo" />
      <image v-if="isSignedIn && !showError" src="@/static/success-check.svg" class="success-check" />
      <image v-if="showError" src="@/static/warning-exclamation.svg" class="warning-exclamation" />
      <image src="/static/title.png" class="title" mode="aspectFill"></image>
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
    <image class="background-image" src="@/static/logo.png"/>
  </view>
</template>

<style>
.sign {
  position: relative;
  overflow: auto;
  overflow-x: hidden;
  height: 100vh;
  display: flex;
  justify-content: center;
}
.logo {
  margin-top: -10px;
  margin-bottom: 10px;
  width: 200px;
  height: 203px;
  object-fit: contain;
  transform: scale(1.2);
  transform-origin: center;
}

.success-check {
  margin-top: -10px;
  margin-bottom: 10px;
  width: 200px;
  height: 203px;
  color: green;
}

.warning-exclamation {
  margin-top: -10px;
  margin-bottom: 10px;
  width: 200px;
  height: 203px;
  color: yellow;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}


.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 680px;
  min-height: 500px;
  width: 80%;
  padding: 20px;
  background: #ffffff;
  border-radius: 20px 20px 0 0 ;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  overflow-x: hidden ;
  z-index: 1;
  opacity: 0.8;
  margin-top: auto;
  animation: slideUp 1s ease-out forwards;
}

.overlay {
  position: absolute;
  top: -230px;
  left: calc(50% - 350px);
  width: 700px;
  height: 300px; /* 遮罩的高度 */
  background-color: #13714a; /* 绿色半透明背景 */
  border-radius: 50% / 150px; /* 椭圆形 */
  z-index: 10; /* 确保遮罩在 container 下面 */ /* 应用相同的动画 */
}

.title {
  height: 36px;
  width: 100%;
  margin-bottom: 10px;
}
.subtitle {
  font-size: 16px;
  text-align: center;
  margin-bottom: 10px;
}
.phone-input {
  width: 230px;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  background-color: #fafafa;
  opacity: 1;
}
.sign-button {
  width: 250px;
  padding: 2px;
  background-color: #a2e494;
  color: white;
  border: none;
  border-radius: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.fixed-button {
  position: fixed;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  background-color: #e1efc4;
  color: #e1efc4;
  border-radius: 10px;
  z-index: 1000;
  opacity: 0;
  border: none;
}


.response-message {
  font-size: 20px;
  margin-top: 20px;
}

.background-image {
  position: absolute;
  top: 100px;
  right: -200px;
  width: 500px;
  height: 510px;
  object-fit: contain;
  opacity: 0.3;
  z-index: 0;
}
</style>

<script setup lang="ts">
import { ref } from "vue";
import { signIn, getCheckInDetails } from "@/api/check-in";
import type { checkInData, checkInResponse, checkInDetails } from "@/api/check-in";

const FIRST_ID = "674b0c0cc9fc4f1f67c398e4"; // id for test
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