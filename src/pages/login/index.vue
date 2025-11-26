<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import Layout from "@/components/Layout.vue";
import { sendVerifyCode, signIn } from "@/api/user/user";
import type { signInData } from "@/api/user/user-interface";
import { STORAGE_KEYS } from "@/constants/storage";

const phone = ref("");
const password = ref("");
const code = ref("");
const loginMethod = ref<"code" | "password">("code");

const isSendingCode = ref(false);
const countdown = ref(60);
const isSubmitting = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const validatePhone = (value: string) => /^1[3-9]\d{9}$/.test(value);

const canSendCode = computed(() => validatePhone(phone.value) && !isSendingCode.value);
const canSubmit = computed(() => {
  if (!validatePhone(phone.value)) return false;
  return loginMethod.value === "code" ? !!code.value : !!password.value;
});

const startCountdown = () => {
  isSendingCode.value = true;
  countdown.value = 60;
  timer = setInterval(() => {
    if (countdown.value <= 1) {
      stopCountdown();
      return;
    }
    countdown.value -= 1;
  }, 1000) as unknown as number;
};

const stopCountdown = () => {
  isSendingCode.value = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

onUnmounted(() => {
  stopCountdown();
});

const sendVerificationCode = async () => {
  if (!validatePhone(phone.value)) {
    uni.showToast({ title: "请输入有效手机号", icon: "none" });
    return;
  }
  if (isSendingCode.value) {
    return;
  }
  try {
    const response = await sendVerifyCode({
      authId: phone.value,
      authType: "phone",
      type: 1,
    });
    if (response.code === 0) {
      uni.showToast({ title: "验证码已发送", icon: "success" });
      startCountdown();
    } else {
      uni.showToast({ title: response.msg || "发送失败", icon: "none" });
    }
  } catch (error) {
    uni.showToast({ title: "发送失败，请稍后重试", icon: "none" });
  }
};

const login = async () => {
  if (!canSubmit.value || isSubmitting.value) {
    return;
  }
  const payload: signInData = {
    authId: phone.value,
    authType: "phone",
  };
  if (loginMethod.value === "password") {
    payload.password = password.value;
  } else {
    payload.verifyCode = code.value;
  }

  isSubmitting.value = true;
  try {
    const res = await signIn(payload);
    uni.setStorageSync(STORAGE_KEYS.USER, res);
    await uni.showToast({ title: "登录成功", icon: "success" });
    await uni.switchTab({ url: "/pages/news/index" });
  } catch (error: any) {
    uni.showToast({ title: error?.msg || "登录失败，请稍后重试", icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};

const jump2register = () => {
  uni.navigateTo({ url: "/pages/login/sign-up" });
};
</script>

<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <view class="surface-card auth-card">
          <view class="section-title">欢迎回来</view>
          <view class="section-subtitle">使用绑定手机号登录账号</view>

          <view class="segment">
            <view
              v-for="method in ['code','password']"
              :key="method"
              class="segment__item"
              :class="{ 'segment__item--active': loginMethod === method }"
              @click="loginMethod = method as 'code' | 'password'"
            >
              {{ method === 'code' ? '验证码登录' : '密码登录' }}
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">手机号</text>
            <input
              class="input-field"
              v-model="phone"
              type="text"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </view>

          <view class="form-row" v-if="loginMethod === 'code'">
            <text class="form-label">验证码</text>
            <view class="inline-input">
              <input
                class="input-field"
                v-model="code"
                type="text"
                placeholder="请输入验证码"
                maxlength="6"
              />
              <button class="ghost-button" :disabled="!canSendCode" @click="sendVerificationCode">
                {{ isSendingCode ? `${countdown}s` : "发送验证码" }}
              </button>
            </view>
          </view>

          <view class="form-row" v-else>
            <text class="form-label">密码</text>
            <input
              class="input-field"
              v-model="password"
              type="password"
              placeholder="请输入密码"
            />
          </view>

          <button class="primary-button" :disabled="!canSubmit || isSubmitting" @click="login">
            {{ isSubmitting ? "登录中..." : "登录" }}
          </button>
          <view class="auth-footer">
            <text class="muted-text">还没有账号？</text>
            <text class="link" @click="jump2register">立即注册</text>
          </view>
        </view>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.auth-card {
  margin-top: 80rpx;
}

.segment {
  display: flex;
  padding: 8rpx;
  border-radius: 999rpx;
  background-color: var(--alumni-surface-muted);
  margin-bottom: 36rpx;
}

.segment__item {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: 999rpx;
  font-size: 28rpx;
  color: var(--alumni-muted);
}

.segment__item--active {
  background: #fff;
  box-shadow: 0 10rpx 20rpx rgba(6, 24, 17, 0.08);
  color: var(--alumni-primary);
}

.inline-input {
  display: flex;
  gap: 18rpx;
  align-items: center;
}

.ghost-button {
  padding: 18rpx 32rpx;
  border-radius: var(--alumni-radius-sm);
  border: 1px solid var(--alumni-border);
  color: var(--alumni-primary);
  font-size: 26rpx;
  background: transparent;
}

.ghost-button:disabled {
  opacity: 0.4;
}

.auth-footer {
  margin-top: 24rpx;
  display: flex;
  justify-content: center;
  gap: 10rpx;
}

.link {
  color: var(--alumni-primary);
}
</style>
