<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatePanel from "@/components/StatePanel.vue";
import { signIn, getCheckInDetails } from "@/api/check-in";
import type { checkInDetails, checkInData, Register } from "@/api/check-in";
import { getErrorMessage } from "@/api/request";
import { timestampToTime } from "@/utils/time";

const activityId = ref("");
const name = ref("");
const phone = ref("");
const responseMessage = ref("");
const statusType = ref<"success" | "error" | "info">("info");
const isSubmitting = ref(false);
const isLoading = ref(true);
const loadError = ref("");
const stats = ref({ total: 0, checked: 0 });
const registers = shallowRef<Register[]>([]);
const lastSynced = ref("");

const canSubmit = computed(() => Boolean(name.value.trim()) && /^1[3-9]\d{9}$/.test(phone.value));

const fetchStats = async () => {
  if (!activityId.value) return;
  loadError.value = "";
  try {
    const response: checkInDetails = await getCheckInDetails(activityId.value);
    stats.value = { total: response.total, checked: response.checked };
    registers.value = response.registers ?? [];
    lastSynced.value = timestampToTime(Math.floor(Date.now() / 1000), "HH:mm");
  } catch (error) {
    loadError.value = getErrorMessage(error, "签到信息加载失败");
  } finally {
    isLoading.value = false;
  }
};

onLoad((options) => {
  activityId.value = options?.activityId ?? "";
  if (!activityId.value) {
    loadError.value = "缺少活动信息，请从活动详情重新进入";
    isLoading.value = false;
    return;
  }
  fetchStats();
});

const handleSignIn = async () => {
  if (!canSubmit.value || isSubmitting.value) {
    responseMessage.value = "请输入报名时使用的姓名和手机号";
    statusType.value = "error";
    return;
  }
  const normalizedName = name.value.trim();
  const normalizedPhone = phone.value.trim();
  const matched = registers.value.find((item) => item.name === normalizedName && item.phone === normalizedPhone);
  if (!matched) {
    responseMessage.value = "未找到对应报名信息，请核对后重试";
    statusType.value = "error";
    return;
  }
  if (matched.checkIn) {
    responseMessage.value = "该报名信息已完成签到";
    statusType.value = "info";
    return;
  }

  const payload: checkInData = { activityId: activityId.value, name: normalizedName, phone: normalizedPhone };
  isSubmitting.value = true;
  try {
    const response = await signIn(payload);
    if (response.code !== 0) throw new Error(response.msg || "签到失败");
    responseMessage.value = "签到成功";
    statusType.value = "success";
    await fetchStats();
  } catch (error) {
    responseMessage.value = getErrorMessage(error, "签到失败，请稍后重试");
    statusType.value = "error";
  } finally {
    isSubmitting.value = false;
  }
};

const openManagement = () => {
  if (!activityId.value) return;
  uni.navigateTo({ url: `/pages/sign-in-details/sign-in-details?activityId=${activityId.value}` });
};
</script>

<template>
  <Layout tone="warm">
    <view class="page-shell">
      <view class="page-shell__content">
        <PageHeader eyebrow="CHECK IN" title="活动签到" description="填写报名姓名和手机号完成签到" />
        <view v-if="isLoading" class="surface-card checkin-skeleton">
          <view class="skeleton checkin-skeleton__title" />
          <view class="skeleton checkin-skeleton__field" />
          <view class="skeleton checkin-skeleton__field" />
        </view>
        <StatePanel
          v-else-if="loadError"
          tone="error"
          title="无法加载签到信息"
          :description="loadError"
          :action-label="activityId ? '重新加载' : ''"
          @action="fetchStats"
        />
        <view v-else>
          <view class="checkin-summary">
            <view>
              <text class="checkin-summary__label">签到进度</text>
              <view class="checkin-summary__count"><text>{{ stats.checked }}</text> / {{ stats.total }}</view>
            </view>
            <text v-if="lastSynced" class="checkin-summary__time">{{ lastSynced }} 更新</text>
          </view>

          <view class="surface-card checkin-card">
            <view class="form-row">
              <text class="form-label">姓名</text>
              <input v-model="name" class="input-field" placeholder="请输入报名姓名" @input="responseMessage = ''" />
            </view>
            <view class="form-row">
              <text class="form-label">手机号</text>
              <input v-model="phone" class="input-field" type="number" maxlength="11" placeholder="请输入报名手机号" @input="responseMessage = ''" />
            </view>
            <button class="primary-button checkin-button" :disabled="isSubmitting" @click="handleSignIn">
              {{ isSubmitting ? "签到中…" : "确认签到" }}
            </button>

            <view v-if="responseMessage" class="status-result" :class="`status-result--${statusType}`">
              <view v-if="statusType === 'success'" class="arrival-track"><view class="arrival-track__dot" /></view>
              <text>{{ responseMessage }}</text>
            </view>
          </view>
          <!-- <button class="text-button management-link" @click="openManagement">工作人员签到管理</button> -->
        </view>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.checkin-summary { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24rpx; padding: 28rpx 30rpx; border-radius: var(--alumni-radius-lg); background: var(--alumni-primary); color: #fff; }
.checkin-summary__label { font-size: 21rpx; opacity: .68; }
.checkin-summary__count { margin-top: 6rpx; font-size: 29rpx; }
.checkin-summary__count text { color: var(--alumni-accent); font-family: "Songti SC", serif; font-size: 54rpx; font-weight: 700; }
.checkin-summary__time { padding-bottom: 8rpx; font-size: 20rpx; opacity: .65; }
.checkin-card { padding: 34rpx; }
.checkin-button { width: 100%; }
.management-link { margin: 18rpx auto 0; font-size: 23rpx; }
.status-result { margin-top: 24rpx; padding: 20rpx; border-radius: var(--alumni-radius-md); font-size: 24rpx; text-align: center; }
.status-result--success { background: var(--alumni-accent-soft); color: #4c6c15; }
.status-result--error { background: rgba(199, 75, 66, .09); color: var(--alumni-danger); }
.status-result--info { background: var(--alumni-primary-soft); color: var(--alumni-primary); }
.arrival-track { position: relative; width: 120rpx; height: 18rpx; margin: 0 auto 14rpx; border-top: 1rpx solid rgba(76, 108, 21, .35); }
.arrival-track__dot { position: absolute; top: -7rpx; left: calc(100% - 12rpx); width: 14rpx; height: 14rpx; border-radius: 50%; background: var(--alumni-accent); box-shadow: 0 0 0 7rpx rgba(148, 197, 47, .15); animation: arrive 520ms ease-out both; }
.checkin-skeleton__title { width: 42%; height: 44rpx; }
.checkin-skeleton__field { width: 100%; height: 88rpx; margin-top: 26rpx; }
@keyframes arrive { from { left: 0; opacity: .2; } to { left: calc(100% - 12rpx); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .arrival-track__dot { animation: none; } }
</style>
