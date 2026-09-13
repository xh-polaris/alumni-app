<script setup lang="ts">
import { computed, ref } from "vue";
import Layout from "@/components/Layout.vue";
import { getErrorMessage } from "@/api/request";
import { registerProfile, sendVerifyCode } from "@/api/user/user";
import type { RegisterProfileData, RegisterProfileResponse } from "@/api/user/user-interface";
import type { Chapter } from "@/api/chapter/chapter-interface";
import { toChapterShortName } from "@/api/chapter/chapter-interface";
import { STORAGE_KEYS } from "@/constants/storage";
import { useCountdown } from "@/composables/useCountdown";
import { useChapters } from "@/composables/useChapters";

const name = ref("");
const phone = ref("");
const code = ref("");
const password = ref("");
const graduationYear = ref(0);
const birthDate = ref("");
const chapterId = ref("");
const isSendingCode = ref(false);
const isSubmitting = ref(false);
const hasTriedSubmit = ref(false);
const registerResult = ref<RegisterProfileResponse | null>(null);
const isQrCodeFailed = ref(false);
const { seconds, isRunning, start } = useCountdown();
const { chapters, loadChapters } = useChapters();

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1949 + 1 }, (_, index) => String(currentYear - index));
const chapterNames = computed(() => chapters.value.map((item) => toChapterShortName(item)));
const chapterIndex = computed(() => {
  const index = chapters.value.findIndex((item) => item.id === chapterId.value);
  return index >= 0 ? index : 0;
});
const chapterDisplay = computed(() => {
  const chapter = chapters.value.find((item) => item.id === chapterId.value);
  return chapter ? chapter.name : "";
});

const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(phone.value));
const canSendCode = computed(() => isPhoneValid.value && !isRunning.value && !isSendingCode.value);
const canSubmit = computed(() =>
  Boolean(name.value.trim()) &&
  isPhoneValid.value &&
  code.value.length === 6 &&
  password.value.length >= 6 &&
  graduationYear.value > 0 &&
  Boolean(birthDate.value) &&
  Boolean(chapterId.value),
);

const isAutoVerified = computed(() => Boolean(registerResult.value?.autoVerified));
const resultHeadline = computed(() =>
  isAutoVerified.value ? "认证成功，欢迎回家" : "注册成功，等待人工核验",
);
const resultDescription = computed(() =>
  isAutoVerified.value
    ? "你填写的姓名、毕业年份与出生日期与校友名册一致，已自动完成校友认证。"
    : "资料已提交，分会管理员会尽快核验你的身份；认证通过后即可报名活动。",
);
const resultChapter = computed(() => registerResult.value?.chapterContact ?? null);
const isResultDialogVisible = computed(() => registerResult.value !== null);

loadChapters();

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

const onGraduationYearChange = (event: { detail: { value: string | number } }) => {
  graduationYear.value = Number(yearOptions[Number(event.detail.value)] ?? 0);
};
const onBirthDateChange = (event: { detail: { value: string } }) => {
  birthDate.value = event.detail.value ?? "";
};
const onChapterChange = (event: { detail: { value: string | number } }) => {
  const chapter: Chapter | undefined = chapters.value[Number(event.detail.value)];
  chapterId.value = chapter?.id ?? "";
};

const register = async () => {
  hasTriedSubmit.value = true;
  if (!canSubmit.value || isSubmitting.value) return;

  const payload: RegisterProfileData = {
    authId: phone.value,
    authType: "phone",
    verifyCode: code.value,
    password: password.value,
    name: name.value.trim(),
    graduationYear: graduationYear.value,
    birthDate: birthDate.value,
    chapterId: chapterId.value,
  };
  isSubmitting.value = true;
  try {
    const session = await registerProfile(payload);
    uni.setStorageSync(STORAGE_KEYS.USER, session);
    isQrCodeFailed.value = false;
    registerResult.value = session;
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "注册失败，请稍后重试"), icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};

const dismissResult = () => {
  registerResult.value = null;
  uni.switchTab({ url: "/pages/news/index" });
};

const copyContact = (value: string, label: string) => {
  if (!value) return;
  uni.setClipboardData({
    data: value,
    success: () => uni.showToast({ title: `${label}已复制`, icon: "none" }),
  });
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
          <view class="form-row">
            <text class="form-label">毕业年份</text>
            <picker mode="selector" :range="yearOptions" :value="Math.max(0, yearOptions.indexOf(String(graduationYear)))" @change="onGraduationYearChange">
              <view class="picker-field" :class="{ 'picker-field--placeholder': !graduationYear }">
                {{ graduationYear || "请选择毕业年份" }}
              </view>
            </picker>
            <text v-if="hasTriedSubmit && !graduationYear" class="field-error">请选择毕业年份</text>
          </view>
          <view class="form-row">
            <text class="form-label">身份证出生日期</text>
            <picker mode="date" :value="birthDate" @change="onBirthDateChange">
              <view class="picker-field" :class="{ 'picker-field--placeholder': !birthDate }">
                {{ birthDate || "请选择出生日期" }}
              </view>
            </picker>
            <text class="field-hint">用于与校友名册比对，只保存出生日期，不保存证件号码。</text>
            <text v-if="hasTriedSubmit && !birthDate" class="field-error">请选择出生日期</text>
          </view>
          <view class="form-row">
            <text class="form-label">所属分会</text>
            <picker mode="selector" :range="chapterNames" :value="chapterIndex" @change="onChapterChange">
              <view class="picker-field" :class="{ 'picker-field--placeholder': !chapterId }">
                {{ chapterDisplay || "请选择所属分会" }}
              </view>
            </picker>
            <text v-if="hasTriedSubmit && !chapterId" class="field-error">请选择所属分会</text>
          </view>
          <button class="primary-button signup-submit" :disabled="isSubmitting" @click="register">
            {{ isSubmitting ? "提交中…" : "完成注册" }}
          </button>
        </view>
      </view>
    </view>

    <Transition name="modal">
      <view v-if="isResultDialogVisible" class="result-overlay">
        <view class="result-overlay__backdrop" />
        <view class="result-overlay__content">
          <view class="result-overlay__mark" :class="{ 'result-overlay__mark--pending': !isAutoVerified }">
            <view class="result-overlay__dot" />
          </view>
          <view class="result-overlay__headline">{{ resultHeadline }}</view>
          <view class="result-overlay__description">{{ resultDescription }}</view>

          <view v-if="resultChapter" class="contact-block">
            <view class="contact-block__title">{{ resultChapter.name }}</view>
            <view class="contact-block__row"><text class="contact-block__label">联络人</text><text>{{ resultChapter.contact.name || "待补充" }}</text></view>
            <view v-if="resultChapter.contact.description" class="contact-block__description">{{ resultChapter.contact.description }}</view>
            <view v-if="resultChapter.contact.wechat" class="contact-block__row contact-block__row--action" @click="copyContact(resultChapter.contact.wechat, '微信号')">
              <text class="contact-block__label">微信号</text>
              <text class="contact-block__value">{{ resultChapter.contact.wechat }} · 点击复制</text>
            </view>
            <view v-if="resultChapter.contact.phone" class="contact-block__row contact-block__row--action" @click="copyContact(resultChapter.contact.phone, '电话')">
              <text class="contact-block__label">联系电话</text>
              <text class="contact-block__value">{{ resultChapter.contact.phone }} · 点击复制</text>
            </view>
            <view class="contact-block__qr">
              <image
                v-if="resultChapter.contact.qrCodeUrl && !isQrCodeFailed"
                class="contact-block__qr-image"
                :src="resultChapter.contact.qrCodeUrl"
                mode="aspectFit"
                @error="isQrCodeFailed = true"
              />
              <view v-else class="contact-block__qr-fallback">
                <view class="contact-block__qr-placeholder">二维码待补充</view>
                <text class="contact-block__qr-hint">
                  {{ resultChapter.contact.wechat ? `请添加微信号 ${resultChapter.contact.wechat}` : "请通过联络人电话联系分会" }}
                </text>
              </view>
            </view>
          </view>
          <view v-else class="contact-block contact-block--empty">分会联络人信息待管理员补充，可稍后在个人中心查看。</view>

          <button class="primary-button result-overlay__confirm" @click="dismissResult">开始使用</button>
        </view>
      </view>
    </Transition>
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
.field-hint { color: var(--alumni-muted); font-size: 21rpx; line-height: 1.5; }
.signup-submit { width: 100%; margin-top: 8rpx; }
.result-overlay { position: fixed; z-index: 200; inset: 0; display: flex; align-items: center; justify-content: center; padding: 40rpx 32rpx; }
.result-overlay__backdrop { position: absolute; inset: 0; background: rgba(15, 48, 38, 0.48); }
.result-overlay__content { position: relative; z-index: 1; width: 100%; max-width: 660rpx; max-height: 88vh; overflow-y: auto; padding: 44rpx 36rpx calc(36rpx + env(safe-area-inset-bottom)); border-radius: var(--alumni-radius-lg); background: #fff; box-shadow: 0 30rpx 70rpx rgba(15, 48, 38, 0.24); text-align: center; }
.result-overlay__mark { width: 104rpx; height: 104rpx; display: grid; place-items: center; margin: 0 auto 26rpx; border-radius: 50%; background: var(--alumni-accent-soft); }
.result-overlay__mark--pending { background: var(--alumni-paper); }
.result-overlay__dot { width: 30rpx; height: 30rpx; border-radius: 50%; background: var(--alumni-accent); box-shadow: 0 0 0 14rpx rgba(148, 197, 47, 0.18); }
.result-overlay__mark--pending .result-overlay__dot { background: var(--alumni-muted); box-shadow: 0 0 0 14rpx rgba(113, 128, 120, 0.14); }
.result-overlay__headline { color: var(--alumni-text); font-family: "Songti SC", "STSong", serif; font-size: 40rpx; font-weight: 600; line-height: 1.3; }
.result-overlay__description { margin-top: 14rpx; color: var(--alumni-muted); font-size: 24rpx; line-height: 1.65; }
.contact-block { margin-top: 30rpx; padding: 28rpx; border-radius: var(--alumni-radius-md); background: var(--alumni-surface-muted); text-align: left; }
.contact-block--empty { color: var(--alumni-muted); font-size: 23rpx; line-height: 1.6; text-align: center; }
.contact-block__title { color: var(--alumni-text); font-family: "Songti SC", serif; font-size: 30rpx; font-weight: 600; }
.contact-block__row { display: flex; align-items: baseline; justify-content: space-between; gap: 20rpx; margin-top: 16rpx; font-size: 24rpx; }
.contact-block__row--action { padding: 8rpx 0; }
.contact-block__label { flex: none; color: var(--alumni-muted); font-size: 22rpx; }
.contact-block__value { color: var(--alumni-primary); text-align: right; word-break: break-all; }
.contact-block__description { margin-top: 14rpx; color: var(--alumni-muted); font-size: 23rpx; line-height: 1.6; }
.contact-block__qr { margin-top: 24rpx; padding-top: 22rpx; border-top: 1rpx solid var(--alumni-border); }
.contact-block__qr-image { width: 320rpx; height: 320rpx; display: block; margin: 0 auto; border-radius: var(--alumni-radius-sm); background: #fff; }
.contact-block__qr-fallback { display: flex; flex-direction: column; align-items: center; gap: 12rpx; padding: 34rpx 20rpx; border: 1rpx dashed var(--alumni-border); border-radius: var(--alumni-radius-sm); background: #fff; }
.contact-block__qr-placeholder { color: var(--alumni-muted); font-size: 24rpx; }
.contact-block__qr-hint { color: var(--alumni-muted); font-size: 21rpx; text-align: center; line-height: 1.5; }
.result-overlay__confirm { width: 100%; margin-top: 30rpx; }
.modal-enter-active, .modal-leave-active { transition: opacity 220ms ease; }
.modal-enter-active .result-overlay__content, .modal-leave-active .result-overlay__content { transition: transform 220ms ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .result-overlay__content, .modal-leave-to .result-overlay__content { transform: translateY(30rpx) scale(0.98); }
@media (prefers-reduced-motion: reduce) { .modal-enter-active, .modal-leave-active, .modal-enter-active .result-overlay__content, .modal-leave-active .result-overlay__content { transition: none; } }
</style>
