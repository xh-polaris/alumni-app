<template>
  <view class="verification" v-if="showVerification">
    <view class="surface-card verification__card">
      <view class="section-title">请输入校验码</view>
      <input class="input-field" v-model="verificationCode" placeholder="管理员校验码" />
      <button class="primary-button" @click="verifyCode">验证</button>
    </view>
  </view>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref } from "vue";

const showVerification = ref(true);
const verificationCode = ref("");
const CORRECT_CODE = "xiaoyou";

const verifyCode = () => {
  if (verificationCode.value.trim() === CORRECT_CODE) {
    showVerification.value = false;
    verificationCode.value = "";
  } else {
    uni.showToast({ title: "校验码错误", icon: "none" });
  }
};
</script>

<style scoped>
.verification {
  min-height: 100vh;
  padding: 80rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verification__card {
  width: 100%;
  max-width: 600rpx;
  text-align: center;
}

.verification__card .input-field {
  margin: 24rpx 0;
}
</style>
