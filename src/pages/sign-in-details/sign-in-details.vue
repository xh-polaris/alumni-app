<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import VerificationCode from "@/components/VerificationCode.vue";
import Layout from "@/components/Layout.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatePanel from "@/components/StatePanel.vue";
import { getCheckInDetails } from "@/api/check-in";
import { registerUser } from "@/api/activity/activity";
import { getErrorMessage } from "@/api/request";
import type { checkInDetails as CheckInDetails, Register } from "@/api/check-in";
import type { registerData } from "@/api/activity/activity-interface";

const activityId = ref("");
const details = shallowRef<CheckInDetails | null>(null);
const searchQuery = ref("");
const isLoading = ref(true);
const loadError = ref("");
const isModalVisible = ref(false);
const isSubmitting = ref(false);
const newUserName = ref("");
const newUserPhone = ref("");

const fetchDetails = async () => {
  if (!activityId.value) return;
  loadError.value = "";
  try {
    details.value = await getCheckInDetails(activityId.value);
  } catch (error) {
    loadError.value = getErrorMessage(error, "签到信息加载失败");
  } finally {
    isLoading.value = false;
  }
};

onLoad((options) => {
  activityId.value = options?.activityId ?? "";
  if (!activityId.value) {
    loadError.value = "缺少活动信息";
    isLoading.value = false;
    return;
  }
  fetchDetails();
});

const filteredRegisters = computed<Register[]>(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  return [...(details.value?.registers ?? [])]
    .sort((a, b) => Number(a.checkIn) - Number(b.checkIn))
    .filter((item) => !keyword || item.name.toLowerCase().includes(keyword) || item.phone.includes(keyword));
});

const openModal = () => {
  newUserName.value = "";
  newUserPhone.value = "";
  isModalVisible.value = true;
};
const closeModal = () => {
  if (!isSubmitting.value) isModalVisible.value = false;
};

const handleRegister = async () => {
  const name = newUserName.value.trim();
  const phone = newUserPhone.value.trim();
  if (!name || !/^1[3-9]\d{9}$/.test(phone)) {
    uni.showToast({ title: "请输入有效的姓名和手机号", icon: "none" });
    return;
  }
  if (details.value?.registers.some((item) => item.phone === phone)) {
    uni.showToast({ title: "该手机号已在报名名单中", icon: "none" });
    return;
  }
  const payload: registerData = { activityId: activityId.value, items: [{ name, phone }] };
  isSubmitting.value = true;
  try {
    const response = await registerUser(payload);
    if (response.code !== 0) throw new Error(response.msg || "添加失败");
    isModalVisible.value = false;
    uni.showToast({ title: "添加成功", icon: "success" });
    await fetchDetails();
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "添加失败，请稍后重试"), icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <VerificationCode>
    <Layout>
      <view class="page-shell">
        <view class="page-shell__content">
          <PageHeader eyebrow="CHECK-IN ADMIN" title="签到管理" description="查看签到进度并管理报名名单">
            <template #action>
              <button class="secondary-button header-action" @click="fetchDetails">刷新</button>
            </template>
          </PageHeader>
          <view v-if="isLoading" class="surface-card"><view class="skeleton overview-skeleton" /></view>
          <StatePanel v-else-if="loadError" tone="error" title="无法加载签到名单" :description="loadError" action-label="重试" @action="fetchDetails" />
          <template v-else-if="details">
            <view class="overview">
              <view class="overview__metric"><text>{{ details.checked }}</text><span>已签到</span></view>
              <view class="overview__divider" />
              <view class="overview__metric"><text>{{ details.total }}</text><span>报名人数</span></view>
            </view>
            <view class="surface-card controls">
              <input v-model="searchQuery" class="input-field" placeholder="搜索姓名或手机号" />
              <button class="primary-button add-user" @click="openModal">添加报名用户</button>
            </view>
            <view class="surface-card register-list-card">
              <view v-if="filteredRegisters.length" class="register-list">
                <view v-for="register in filteredRegisters" :key="register.id" class="register-item">
                  <view class="register-item__identity">
                    <view class="register-item__avatar">{{ register.name.slice(0, 1) }}</view>
                    <view><view class="register-item__name">{{ register.name }}</view><view class="muted-text">{{ register.phone }}</view></view>
                  </view>
                  <view class="status-tag" :class="{ 'status-tag--checked': register.checkIn }">{{ register.checkIn ? "已签到" : "未签到" }}</view>
                </view>
              </view>
              <StatePanel v-else title="没有匹配记录" description="请调整搜索关键词后重试" />
            </view>
          </template>
        </view>
      </view>
    </Layout>

    <Transition name="modal">
      <view v-if="isModalVisible" class="register-modal">
        <view class="register-modal__backdrop" @click="closeModal" />
        <view class="register-modal__content surface-card">
          <view class="section-title">添加报名用户</view>
          <view class="section-subtitle">添加后用户可使用该信息签到</view>
          <view class="form-row"><text class="form-label">姓名</text><input v-model="newUserName" class="input-field" placeholder="请输入姓名" /></view>
          <view class="form-row"><text class="form-label">手机号</text><input v-model="newUserPhone" class="input-field" type="number" maxlength="11" placeholder="请输入手机号" /></view>
          <view class="button-row"><button class="secondary-button" @click="closeModal">取消</button><button class="primary-button" :disabled="isSubmitting" @click="handleRegister">{{ isSubmitting ? "添加中…" : "确认添加" }}</button></view>
        </view>
      </view>
    </Transition>
  </VerificationCode>
</template>

<style scoped>
.header-action { min-height: 64rpx; padding: 12rpx 22rpx; font-size: 23rpx; }
.overview { display: flex; align-items: center; margin-bottom: 24rpx; padding: 30rpx; border-radius: var(--alumni-radius-lg); background: var(--alumni-primary); color: #fff; }
.overview__metric { flex: 1; text-align: center; }
.overview__metric text { display: block; color: var(--alumni-accent); font-family: "Songti SC", serif; font-size: 52rpx; font-weight: 700; }
.overview__metric span { display: block; margin-top: 5rpx; font-size: 21rpx; opacity: .68; }
.overview__divider { width: 1rpx; height: 64rpx; background: rgba(255,255,255,.18); }
.controls { display: flex; align-items: stretch; gap: 14rpx; padding: 24rpx; }
.controls .input-field { min-width: 0; flex: 1; }
.add-user { width: 220rpx; flex: none; padding-inline: 12rpx; font-size: 23rpx; }
.register-list-card { padding: 12rpx 28rpx; }
.register-item { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; padding: 22rpx 0; border-bottom: 1rpx solid var(--alumni-border); }
.register-item:last-child { border-bottom: 0; }
.register-item__identity { min-width: 0; display: flex; align-items: center; gap: 16rpx; }
.register-item__avatar { width: 70rpx; height: 70rpx; display: grid; place-items: center; flex: none; border-radius: 50%; background: var(--alumni-primary-soft); color: var(--alumni-primary); font-family: "Songti SC", serif; font-size: 27rpx; font-weight: 700; }
.register-item__name { margin-bottom: 4rpx; font-size: 27rpx; font-weight: 600; }
.status-tag { flex: none; padding: 8rpx 14rpx; border-radius: 99rpx; background: var(--alumni-surface-muted); color: var(--alumni-muted); font-size: 21rpx; }
.status-tag--checked { background: var(--alumni-accent-soft); color: #537417; }
.overview-skeleton { height: 120rpx; }
.register-modal { position: fixed; z-index: 100; inset: 0; display: flex; align-items: center; justify-content: center; padding: 30rpx; }
.register-modal__backdrop { position: absolute; inset: 0; background: rgba(15, 48, 38, .42); }
.register-modal__content { position: relative; z-index: 1; width: 100%; max-width: 620rpx; padding: 36rpx; }
.modal-enter-active, .modal-leave-active { transition: opacity 220ms ease; }
.modal-enter-active .register-modal__content, .modal-leave-active .register-modal__content { transition: transform 220ms ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .register-modal__content, .modal-leave-to .register-modal__content { transform: translateY(24rpx) scale(.98); }
@media (prefers-reduced-motion: reduce) { .modal-enter-active, .modal-leave-active, .modal-enter-active .register-modal__content, .modal-leave-active .register-modal__content { transition: none; } }
</style>
