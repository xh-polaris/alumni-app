<script setup lang="ts">
import { computed, ref } from "vue";
import Layout from "@/components/Layout.vue";
import { getErrorMessage } from "@/api/request";
import { sendVerifyCode, signUp } from "@/api/user/user";
import type { signUpData } from "@/api/user/user-interface";
import { STORAGE_KEYS } from "@/constants/storage";
import { useCountdown } from "@/composables/useCountdown";

const name = ref("");
const phone = ref("");
const code = ref("");
const password = ref("");
const isSendingCode = ref(false);
const isSubmitting = ref(false);
const hasTriedSubmit = ref(false);
const { seconds, isRunning, start } = useCountdown();

const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(phone.value));
const canSendCode = computed(() => isPhoneValid.value && !isRunning.value && !isSendingCode.value);
const canSubmit = computed(() =>
  Boolean(name.value.trim()) && isPhoneValid.value && code.value.length === 6 && password.value.length >= 6,
);

const sendVerificationCode = async () => {
  if (!canSendCode.value) {
    uni.showToast({ title: "请先输入有效手机号", icon: "none" });
    return;
  }
  isSendingCode.value = true;
  try {
    await sendVerifyCode({ authId: phone.value, authType: "phone", type: 0 });
    start();
    uni.showToast({ title: "验证码已发送", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "验证码发送失败"), icon: "none" });
  } finally {
    isSendingCode.value = false;
  }
};

const register = async () => {
  hasTriedSubmit.value = true;
  if (!canSubmit.value || isSubmitting.value) return;

  const payload: signUpData = {
    authId: phone.value,
    authType: "phone",
    verifyCode: code.value,
    password: password.value,
    name: name.value.trim(),
  };
  isSubmitting.value = true;
  try {
    const session = await signUp(payload);
    uni.setStorageSync(STORAGE_KEYS.USER, session);
    uni.showToast({ title: "注册成功", icon: "success" });
    setTimeout(() => uni.switchTab({ url: "/pages/news/index" }), 350);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "注册失败，请稍后重试"), icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Layout tone="warm">
    <view class="page-shell signup-page">
      <view class="page-shell__content">
        <view class="signup-heading">
          <view class="signup-heading__eyebrow">JOIN ALUMNI</view>
          <view class="section-title">创建校友账号</view>
          <view class="section-subtitle">完成基础信息后即可使用活动报名和个人档案</view>
        </view>
        <view class="surface-card signup-card">
          <view class="form-row">
            <text class="form-label">姓名</text>
            <input v-model="name" class="input-field" placeholder="请输入真实姓名" />
            <text v-if="hasTriedSubmit && !name.trim()" class="field-error">请输入姓名</text>
          </view>
          <view class="form-row">
            <text class="form-label">手机号</text>
            <input v-model="phone" class="input-field" type="number" maxlength="11" placeholder="请输入手机号" />
            <text v-if="hasTriedSubmit && !isPhoneValid" class="field-error">请输入有效的 11 位手机号</text>
          </view>
          <view class="form-row">
            <text class="form-label">验证码</text>
            <view class="inline-field">
              <input v-model="code" class="input-field inline-field__input" type="number" maxlength="6" placeholder="请输入验证码" />
              <button class="secondary-button code-button" :disabled="!canSendCode" @click="sendVerificationCode">
                {{ isRunning ? `${seconds}s` : isSendingCode ? "发送中" : "发送验证码" }}
              </button>
            </view>
            <text v-if="hasTriedSubmit && code.length !== 6" class="field-error">请输入 6 位验证码</text>
          </view>
          <view class="form-row">
            <text class="form-label">设置密码</text>
            <input v-model="password" class="input-field" type="password" placeholder="至少 6 位数字或字母" />
            <text v-if="hasTriedSubmit && password.length < 6" class="field-error">密码至少需要 6 位</text>
          </view>
          <button class="primary-button signup-submit" :disabled="isSubmitting" @click="register">
            {{ isSubmitting ? "提交中…" : "完成注册" }}
          </button>
        </view>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.signup-page { padding-top: 54rpx; }
.signup-heading { padding: 0 8rpx 8rpx; }
.signup-heading__eyebrow { margin-bottom: 12rpx; color: var(--alumni-muted); font-size: 20rpx; font-weight: 700; letter-spacing: 4rpx; }
.signup-card { overflow: hidden; padding: 38rpx 34rpx; }
.inline-field { display: flex; align-items: stretch; gap: 14rpx; }
.inline-field__input { min-width: 0; flex: 1; }
.code-button { width: 210rpx; flex: none; padding-inline: 12rpx; font-size: 24rpx; }
.signup-submit { width: 100%; margin-top: 8rpx; }
</style>
