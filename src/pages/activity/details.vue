<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import StatePanel from "@/components/StatePanel.vue";
import Header from "@/pages/activity/details/Header.vue";
import MetaInfo from "@/pages/activity/details/MetaInfo.vue";
import { getActivityDetails, getMyActivityRegistrations, registerUser } from "@/api/activity/activity";
import { getErrorMessage } from "@/api/request";
import type { Activity, registerData } from "@/api/activity/activity-interface";
import { STORAGE_KEYS } from "@/constants/storage";

interface RegistrantDraft {
  name: string;
  phone: string;
}

const activityId = ref("");
const activityDetails = shallowRef<Activity | null>(null);
const isLoading = ref(true);
const fetchError = ref("");
const showRegisterModal = ref(false);
const registrants = ref<RegistrantDraft[]>([]);
const isSubmitting = ref(false);
const participantCount = ref(0);
const myRegistrationCount = ref(0);
const isCheckingRegistration = ref(false);
const canCheckMyRegistration = computed(() => Boolean(uni.getStorageSync(STORAGE_KEYS.USER)?.id));

const validatePhone = (value: string) => /^1[3-9]\d{9}$/.test(value);
const resetRegistrants = () => { registrants.value = [{ name: "", phone: "" }]; };

const registrationState = computed<"open" | "registered" | "full" | "upcoming" | "closed" | "unavailable">(() => {
  const activity = activityDetails.value;
  if (!activity) return "unavailable";
  if (activity.limit !== -1 && activity.status >= activity.limit) return "full";
  const now = Math.floor(Date.now() / 1000);
  if (now < activity.registerStart) return "upcoming";
  if (now > activity.registerEnd) return "closed";
  if (myRegistrationCount.value > 0) return "registered";
  return "open";
});
const registrationLabel = computed(() => ({
  open: canCheckMyRegistration.value ? "立即报名" : "登录后报名",
  registered: "已报名",
  full: "名额已满",
  upcoming: "报名尚未开始",
  closed: "报名已截止",
  unavailable: "暂不可报名",
}[registrationState.value]));

const fetchMyRegistration = async () => {
  if (!activityId.value || !canCheckMyRegistration.value) {
    myRegistrationCount.value = 0;
    return;
  }
  isCheckingRegistration.value = true;
  try {
    const response = await getMyActivityRegistrations({ activityId: activityId.value });
    myRegistrationCount.value = response.total ?? response.registers?.length ?? 0;
  } catch {
    myRegistrationCount.value = 0;
  } finally {
    isCheckingRegistration.value = false;
  }
};

const fetchDetails = async () => {
  if (!activityId.value) return;
  isLoading.value = true;
  fetchError.value = "";
  try {
    const response = await getActivityDetails({ id: activityId.value });
    activityDetails.value = response.activity;
    participantCount.value = response.numbers;
    await fetchMyRegistration();
  } catch (error) {
    fetchError.value = getErrorMessage(error, "活动详情加载失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

onLoad((options) => {
  activityId.value = options?.id ?? "";
  if (!activityId.value) {
    fetchError.value = "未找到活动信息";
    isLoading.value = false;
    return;
  }
  fetchDetails();
});

const openRegister = () => {
  if (registrationState.value !== "open") return;
  if (!canCheckMyRegistration.value) {
    uni.navigateTo({ url: "/pages/login/index" });
    return;
  }
  resetRegistrants();
  showRegisterModal.value = true;
};
const closeRegister = () => {
  if (!isSubmitting.value) showRegisterModal.value = false;
};
const addRegistrant = () => registrants.value.push({ name: "", phone: "" });
const removeRegistrant = (index: number) => registrants.value.splice(index, 1);

const submitRegister = async () => {
  const activity = activityDetails.value;
  if (!activity || isSubmitting.value) return;
  const normalized = registrants.value.map((item) => ({ name: item.name.trim(), phone: item.phone.trim() }));
  if (normalized.some((item) => !item.name || !validatePhone(item.phone))) {
    uni.showToast({ title: "请填写有效的姓名和手机号", icon: "none" });
    return;
  }
  if (new Set(normalized.map((item) => item.phone)).size !== normalized.length) {
    uni.showToast({ title: "报名成员手机号不能重复", icon: "none" });
    return;
  }

  const payload: registerData = { activityId: activity.id, items: normalized };
  isSubmitting.value = true;
  try {
    const response = await registerUser(payload);
    if (response.code !== 0) throw new Error(response.msg || "报名失败");
    showRegisterModal.value = false;
    uni.showToast({ title: "报名成功", icon: "success" });
    myRegistrationCount.value = normalized.length;
    await fetchDetails();
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "报名失败，请稍后重试"), icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};

const openCheckIn = () => {
  if (!activityDetails.value) return;
  uni.navigateTo({ url: `/pages/check-in/index?activityId=${activityDetails.value.id}` });
};
</script>

<template>
  <Layout>
    <view class="page-shell detail-page">
      <view class="page-shell__content">
        <view v-if="isLoading" class="detail-skeleton">
          <view class="skeleton detail-skeleton__cover" />
          <view class="surface-card detail-skeleton__body">
            <view class="skeleton detail-skeleton__title" />
            <view class="skeleton detail-skeleton__line" />
            <view class="skeleton detail-skeleton__line detail-skeleton__line--short" />
          </view>
        </view>
        <StatePanel
          v-else-if="fetchError"
          tone="error"
          title="无法打开活动"
          :description="fetchError"
          :action-label="activityId ? '重新加载' : ''"
          @action="fetchDetails"
        />
        <view v-else-if="activityDetails" class="detail-content">
          <Header :activity="activityDetails" />
          <MetaInfo :activity="activityDetails" :numbers="participantCount" />
        </view>
      </view>
    </view>

    <view v-if="activityDetails && !isLoading && !fetchError" class="action-dock">
      <view class="action-dock__inner">
        <button
          class="secondary-button"
          :disabled="registrationState !== 'open' || isCheckingRegistration"
          @click="openRegister"
        >
          {{ isCheckingRegistration ? "检查报名中" : registrationLabel }}
        </button>
        <button class="primary-button" @click="openCheckIn">活动签到</button>
      </view>
    </view>

    <Transition name="modal">
      <view v-if="showRegisterModal" class="register-modal">
        <view class="register-modal__backdrop" @click="closeRegister" />
        <view class="register-modal__content">
          <view class="register-modal__handle" />
          <view class="modal-header">
            <view>
              <view class="section-title">填写报名信息</view>
              <view class="section-subtitle">每位参与者需要填写姓名和手机号</view>
            </view>
            <button class="text-button modal-close" @click="closeRegister">关闭</button>
          </view>
          <view v-for="(item, index) in registrants" :key="index" class="registrant-form">
            <view class="registrant-form__header">
              <text>参与者 {{ index + 1 }}</text>
              <button v-if="registrants.length > 1" class="text-button remove-button" @click="removeRegistrant(index)">移除</button>
            </view>
            <view class="form-row">
              <text class="form-label">姓名</text>
              <input v-model="item.name" class="input-field" placeholder="请输入姓名" />
            </view>
            <view class="form-row">
              <text class="form-label">手机号</text>
              <input v-model="item.phone" class="input-field" type="number" maxlength="11" placeholder="请输入手机号" />
            </view>
          </view>
          <button class="secondary-button add-button" @click="addRegistrant">添加参与者</button>
          <button class="primary-button submit-button" :disabled="isSubmitting" @click="submitRegister">
            {{ isSubmitting ? "提交中…" : "确认报名" }}
          </button>
        </view>
      </view>
    </Transition>
  </Layout>
</template>

<style scoped>
.detail-page { padding-bottom: calc(220rpx + env(safe-area-inset-bottom)); }
.detail-content { display: flex; flex-direction: column; gap: 24rpx; }
.detail-skeleton__cover { height: 390rpx; border-radius: var(--alumni-radius-lg); }
.detail-skeleton__body { margin-top: 24rpx; }
.detail-skeleton__title { width: 70%; height: 48rpx; }
.detail-skeleton__line { width: 100%; height: 32rpx; margin-top: 26rpx; }
.detail-skeleton__line--short { width: 58%; }
.action-dock { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; padding: 18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom)); border-top: 1rpx solid rgba(21, 63, 50, 0.08); background: rgba(255,255,255,.94); backdrop-filter: blur(18rpx); }
.action-dock__inner { max-width: 720rpx; display: flex; gap: 16rpx; margin: 0 auto; }
.action-dock__inner .primary-button,
.action-dock__inner .secondary-button { flex: 1; }
.register-modal { position: fixed; z-index: 100; inset: 0; display: flex; align-items: flex-end; justify-content: center; }
.register-modal__backdrop { position: absolute; inset: 0; background: rgba(15, 48, 38, 0.42); }
.register-modal__content { position: relative; z-index: 1; width: 100%; max-height: 88vh; overflow-y: auto; padding: 18rpx 32rpx calc(34rpx + env(safe-area-inset-bottom)); border-radius: 38rpx 38rpx 0 0; background: #fff; }
.register-modal__handle { width: 72rpx; height: 8rpx; margin: 0 auto 28rpx; border-radius: 99rpx; background: var(--alumni-border); }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18rpx; }
.modal-close { min-height: 58rpx; padding: 8rpx; font-size: 24rpx; }
.registrant-form { margin-top: 18rpx; padding: 26rpx; border-radius: var(--alumni-radius-md); background: var(--alumni-surface-muted); }
.registrant-form__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22rpx; color: var(--alumni-text); font-size: 25rpx; font-weight: 600; }
.remove-button { min-height: 52rpx; padding: 4rpx 8rpx; color: var(--alumni-danger); font-size: 22rpx; }
.add-button, .submit-button { width: 100%; margin-top: 18rpx; }
.modal-enter-active, .modal-leave-active { transition: opacity 220ms ease; }
.modal-enter-active .register-modal__content, .modal-leave-active .register-modal__content { transition: transform 220ms ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .register-modal__content, .modal-leave-to .register-modal__content { transform: translateY(40rpx); }
@media (prefers-reduced-motion: reduce) { .modal-enter-active, .modal-leave-active, .modal-enter-active .register-modal__content, .modal-leave-active .register-modal__content { transition: none; } }
</style>
