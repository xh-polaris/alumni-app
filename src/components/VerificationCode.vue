<script setup lang="ts">
import { ref } from "vue";

const isVerified = ref(false);
const verificationCode = ref("");
const hasError = ref(false);
const CORRECT_CODE = "xiaoyou";

const verifyCode = () => {
  if (verificationCode.value.trim() === CORRECT_CODE) {
    isVerified.value = true;
    verificationCode.value = "";
    hasError.value = false;
    return;
  }
  hasError.value = true;
};
</script>

<template>
  <view v-if="!isVerified" class="verification">
    <view class="verification__orbit" />
    <view class="surface-card verification__card">
      <view class="verification__eyebrow">STAFF ACCESS</view>
      <view class="section-title">工作人员验证</view>
      <view class="section-subtitle">输入校验码后查看签到管理</view>
      <view class="form-row">
        <text class="form-label">校验码</text>
        <input
          v-model="verificationCode"
          class="input-field"
          password
          placeholder="请输入校验码"
          @input="hasError = false"
          @confirm="verifyCode"
        />
        <text v-if="hasError" class="field-error">校验码错误，请重新输入</text>
      </view>
      <button class="primary-button verification__button" @click="verifyCode">验证并进入</button>
    </view>
  </view>
  <slot v-else />
</template>

<style scoped>
.verification { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; box-sizing: border-box; padding: 48rpx 28rpx; background: linear-gradient(155deg, #edf4f0, #f6f8f6 58%, #f3f0e8); }
.verification__orbit { position: absolute; top: -120rpx; right: -250rpx; width: 680rpx; height: 320rpx; border: 1rpx solid rgba(148, 197, 47, 0.24); border-radius: 50%; transform: rotate(-12deg); box-shadow: 0 32rpx 0 rgba(148, 197, 47, 0.04); }
.verification__card { position: relative; z-index: 1; width: 100%; max-width: 620rpx; padding: 42rpx 36rpx; }
.verification__eyebrow { margin-bottom: 12rpx; color: var(--alumni-muted); font-size: 20rpx; font-weight: 700; letter-spacing: 4rpx; }
.verification__button { width: 100%; }
</style>
