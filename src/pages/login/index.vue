<script setup lang="ts">
import { computed, ref } from "vue";
import Layout from "@/components/Layout.vue";
import { getErrorMessage } from "@/api/request";
import { sendVerifyCode, signIn } from "@/api/user/user";
import type { signInData } from "@/api/user/user-interface";
import { STORAGE_KEYS } from "@/constants/storage";
import { useCountdown } from "@/composables/useCountdown";

const phone = ref("");
const password = ref("");
const code = ref("");
const loginMethod = ref<"code" | "password">("code");
const isSendingCode = ref(false);
const isSubmitting = ref(false);
const hasTriedSubmit = ref(false);
const { seconds, isRunning, start } = useCountdown();

const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(phone.value));
const phoneError = computed(() =>
  hasTriedSubmit.value && !isPhoneValid.value ? "请输入有效的 11 位手机号" : "",
);
const credentialError = computed(() => {
  if (!hasTriedSubmit.value) return "";
  if (loginMethod.value === "code" && code.value.length !== 6) return "请输入 6 位验证码";
  if (loginMethod.value === "password" && !password.value) return "请输入密码";
  return "";
});
const canSendCode = computed(() => isPhoneValid.value && !isRunning.value && !isSendingCode.value);
const canSubmit = computed(() =>
  isPhoneValid.value &&
  (loginMethod.value === "code" ? code.value.length === 6 : Boolean(password.value)),
);

const changeLoginMethod = (method: "code" | "password") => {
  loginMethod.value = method;
  hasTriedSubmit.value = false;
};

const sendVerificationCode = async () => {
  if (!canSendCode.value) {
    uni.showToast({ title: "请先输入有效手机号", icon: "none" });
    return;
  }
  isSendingCode.value = true;
  try {
    await sendVerifyCode({ authId: phone.value, authType: "phone", type: 1 });
    start();
    uni.showToast({ title: "验证码已发送", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "验证码发送失败"), icon: "none" });
  } finally {
    isSendingCode.value = false;
  }
};

const login = async () => {
  hasTriedSubmit.value = true;
  if (!canSubmit.value || isSubmitting.value) return;

  const payload: signInData = { authId: phone.value, authType: "phone" };
  if (loginMethod.value === "password") payload.password = password.value;
  else payload.verifyCode = code.value;

  isSubmitting.value = true;
  try {
    const session = await signIn(payload);
    uni.setStorageSync(STORAGE_KEYS.USER, session);
    uni.showToast({ title: "登录成功", icon: "success" });
    setTimeout(() => uni.switchTab({ url: "/pages/news/index" }), 350);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "登录失败，请稍后重试"), icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};

const openRegister = () => uni.navigateTo({ url: "/pages/login/sign-up" });
const enterAsGuest = () => uni.reLaunch({ url: "/pages/activity/index?role=invited" });
</script>

<template>
  <Layout tone="warm">
    <view class="page-shell auth-page">
      <view class="page-shell__content">
        <view class="surface-card auth-card">
          <view class="auth-card__eyebrow">ALUMNI</view>
          <view class="section-title">登录校友平台</view>
          <view class="section-subtitle">使用已绑定的手机号登录</view>

          <view class="segment" role="tablist">
            <button
              v-for="method in (['code', 'password'] as const)"
              :key="method"
              class="segment__item"
              :class="{ 'segment__item--active': loginMethod === method }"
              @click="changeLoginMethod(method)"
            >
              {{ method === "code" ? "验证码登录" : "密码登录" }}
            </button>
          </view>

          <view class="form-row">
            <text class="form-label">手机号</text>
            <input v-model="phone" class="input-field" type="number" maxlength="11" placeholder="请输入手机号" />
            <text v-if="phoneError" class="field-error">{{ phoneError }}</text>
          </view>

          <view v-if="loginMethod === 'code'" class="form-row">
            <text class="form-label">验证码</text>
            <view class="inline-field">
              <input v-model="code" class="input-field inline-field__input" type="number" maxlength="6" placeholder="请输入验证码" />
              <button class="secondary-button code-button" :disabled="!canSendCode" @click="sendVerificationCode">
                {{ isRunning ? `${seconds}s` : isSendingCode ? "发送中" : "发送验证码" }}
              </button>
            </view>
            <text v-if="credentialError" class="field-error">{{ credentialError }}</text>
          </view>

          <view v-else class="form-row">
            <text class="form-label">密码</text>
            <input v-model="password" class="input-field" type="password" placeholder="请输入密码" />
            <text v-if="credentialError" class="field-error">{{ credentialError }}</text>
          </view>

          <button class="primary-button auth-submit" :disabled="isSubmitting" @click="login">
            {{ isSubmitting ? "登录中…" : "登录" }}
          </button>
          <view class="auth-footer">
            <text class="muted-text">还没有账号？</text>
            <button class="text-button auth-footer__link" @click="openRegister">立即注册</button>
          </view>
        </view>
        <button class="guest-entry" @click="enterAsGuest">受邀嘉宾直接签到</button>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.auth-page { padding-top: 72rpx; }
.brand-mark { width: 92rpx; height: 92rpx; margin: 0 auto 28rpx; display: grid; place-items: center; border-radius: 30rpx; background: var(--alumni-primary); color: var(--alumni-accent); font-family: "Songti SC", serif; font-size: 36rpx; font-weight: 700; box-shadow: 0 20rpx 44rpx rgba(21, 63, 50, 0.18); }
.auth-card { overflow: hidden; padding: 42rpx 36rpx; }
.auth-card__eyebrow { margin-bottom: 12rpx; color: var(--alumni-muted); font-size: 20rpx; font-weight: 700; letter-spacing: 4rpx; }
.segment { display: flex; gap: 8rpx; margin-bottom: 34rpx; padding: 8rpx; border-radius: var(--alumni-radius-md); background: var(--alumni-surface-muted); }
.segment__item { min-height: 68rpx; flex: 1; margin: 0; padding: 14rpx 10rpx; border-radius: 16rpx; background: transparent; color: var(--alumni-muted); font-size: 25rpx; line-height: 1.4; }
.segment__item::after { border: 0; }
.segment__item--active { background: #fff; color: var(--alumni-primary); font-weight: 600; box-shadow: 0 8rpx 20rpx rgba(21, 63, 50, 0.08); }
.inline-field { display: flex; align-items: stretch; gap: 14rpx; }
.inline-field__input { min-width: 0; flex: 1; }
.code-button { width: 210rpx; flex: none; padding-inline: 12rpx; font-size: 24rpx; }
.auth-submit { width: 100%; margin-top: 8rpx; }
.auth-footer { display: flex; align-items: center; justify-content: center; gap: 4rpx; margin-top: 22rpx; }
.auth-footer__link { min-height: 58rpx; padding: 8rpx; font-size: 24rpx; }
.guest-entry { min-height: 76rpx; margin: 24rpx auto 0; padding: 16rpx 24rpx; background: transparent; color: var(--alumni-primary); font-size: 24rpx; }
.guest-entry::after { border: 0; }
</style>
