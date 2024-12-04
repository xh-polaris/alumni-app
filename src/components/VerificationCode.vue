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
  height: 850px;
  overflow: auto;
}

.verification-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  height: 300px;
  width: 80%;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
  opacity: 0.8;
}

.head {
  font-size: 24px;
  margin-bottom: 40rpx;
}

.code-input {
  padding: 10px;
  margin: 10px 0;
  width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  font-size: 18px;
  background-color: #f5f5fa;
}

button {
  width: 220px;
  padding: 2px;
  background-color: #a2e494;
  color: white;
  border: none;
  border-radius: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button:hover {
  background-color: darkgreen;
}
</style>
