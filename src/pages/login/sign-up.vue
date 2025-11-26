<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <view class="surface-card auth-card">
          <view class="section-title">创建校友账号</view>
          <view class="section-subtitle">完善信息后即可加入校友社区</view>

          <view class="form-row">
            <text class="form-label">姓名</text>
            <input class="input-field" v-model="name" type="text" placeholder="请输入姓名" />
          </view>

          <view class="form-row">
            <text class="form-label">手机号</text>
            <input class="input-field" v-model="phone" type="text" maxlength="11" placeholder="请输入手机号" />
          </view>

          <view class="form-row">
            <text class="form-label">验证码</text>
            <view class="inline-input">
              <input class="input-field" v-model="code" type="text" maxlength="6" placeholder="请输入验证码" />
              <button class="ghost-button" :disabled="!canSendCode" @click="sendVerificationCode">
                {{ isSendingCode ? `${countdown}s` : "发送验证码" }}
              </button>
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">设置密码</text>
            <input class="input-field" v-model="password" type="password" placeholder="至少 6 位数字或字母" />
          </view>

          <button class="primary-button" :disabled="!canSubmit || isSubmitting" @click="register">
            {{ isSubmitting ? "提交中..." : "完成注册" }}
          </button>
        </view>
      </view>
    </view>
  </Layout>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import Layout from "@/components/Layout.vue";
import { signUp, sendVerifyCode } from "@/api/user/user";
import type { signUpData } from "@/api/user/user-interface";
import { STORAGE_KEYS } from "@/constants/storage";

const name = ref("");
const phone = ref("");
const code = ref("");
const password = ref("");

const isSendingCode = ref(false);
const countdown = ref(60);
const isSubmitting = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const validatePhone = (value: string) => /^1[3-9]\d{9}$/.test(value);

const canSendCode = computed(() => validatePhone(phone.value) && !isSendingCode.value);
const canSubmit = computed(() => {
  return (
    !!name.value.trim() &&
    validatePhone(phone.value) &&
    code.value.length === 6 &&
    password.value.length >= 6
  );
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
  }, 1000);
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
  try {
    const response = await sendVerifyCode({
      authId: phone.value,
      authType: "phone",
      type: 0,
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

const register = async () => {
  if (!canSubmit.value || isSubmitting.value) {
    return;
  }
  isSubmitting.value = true;
  const payload: signUpData = {
    authType: "phone",
    authid: phone.value,
    name: name.value.trim(),
    password: password.value,
    verifyCode: code.value,
  };

  try {
    const response = await signUp(payload);
    uni.setStorageSync(STORAGE_KEYS.USER, response);
    console.log(uni.getStorageSync(STORAGE_KEYS.USER))
    await uni.showToast({ title: "注册成功", icon: "success" });
    await uni.switchTab({ url: "/pages/news/index" });
  } catch (error: any) {
    uni.showToast({ title: error?.msg || "注册失败，请稍后重试", icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.auth-card {
  margin-top: 60rpx;
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
</style>
