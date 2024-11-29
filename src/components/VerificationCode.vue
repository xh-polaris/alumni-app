<template>
  <view class="verification-code" v-if="showVerification">
    <view class="verification-code-container">
      <view class="head">请输入校验码</view>
      <input v-model="verificationCode" placeholder="校验码" class="code-input" />
      <button @click="verifyCode">验证</button>
    </view>
  </view>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const showVerification = ref(true);
const verificationCode = ref('');
const verifyCode = () => {
  const correctCode = 'xiaoyou'; // 这里可以替换为从后端获取的校验码
  if (verificationCode.value === correctCode) {
    showVerification.value = false;
  } else {
    uni.showToast({title:'校验码错误',icon:"error"});
  }
};
</script>

<style scoped>
.verification-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.verification-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  height: 40vh;
  width: 80%;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.head {
  font-size: 24px;
  margin-bottom: 40rpx;
}

.code-input {
  padding: 10px;
  margin: 10px 0;
  width: 200px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 18px;
}

button {
  width: 40%;
  padding: 15rpx;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 18px;
}

button:hover {
  background-color: #0056b3;
}
</style>
