<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <view class="surface-card">
          <view class="section-title">活动签到</view>
          <view class="section-subtitle">请填写报名姓名与手机号完成签到</view>

          <view class="stats-row">
            <view class="pill">
              已签到 {{ stats.checked }}/{{ stats.total }}
            </view>
            <text class="muted-text" v-if="lastSynced">最近更新：{{ lastSynced }}</text>
          </view>

          <view class="form-row">
            <text class="form-label">姓名</text>
            <input class="input-field" v-model="name" type="text" placeholder="请输入报名姓名" />
          </view>

          <view class="form-row">
            <text class="form-label">手机号</text>
            <input class="input-field" v-model="phone" type="text" maxlength="11" placeholder="请输入报名手机号" />
          </view>
          <view class="one-line">
            <button class="secondary-button" :disabled="!canSubmit || isSubmitting" @click="handleSignIn">
            {{ isSubmitting ? "签到中..." : "点击签到" }}
          </button>
            <button class="secondary-button" @click="navigateToDetails">查看签到详情</button>
          </view>
          <view v-if="responseMessage" class="status-banner" :class="statusType">
            {{ responseMessage }}
          </view>
        </view>
      </view>
    </view>
  </Layout>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import Layout from "@/components/Layout.vue";
import { signIn, getCheckInDetails } from "@/api/check-in";
import type { checkInDetails, checkInData } from "@/api/check-in";
import { timestampToTime } from "@/utils/time";
import { onLoad } from "@dcloudio/uni-app";


const activityId = ref("");
const name = ref("");
const phone = ref("");
const responseMessage = ref("");
const statusType = ref<"success" | "error" | "info">("info");
const isSubmitting = ref(false);
const stats = ref<{ total: number; checked: number }>({ total: 0, checked: 0 });
const lastSynced = ref("");

const canSubmit = computed(() => name.value.trim().length > 0 && /^1[3-9]\d{9}$/.test(phone.value));

const fetchStats = async () => {
  try {
    const res: checkInDetails = await getCheckInDetails(activityId.value);
    stats.value = { total: res.total, checked: res.checked };
    lastSynced.value = timestampToTime(Date.now(), "HH:mm:ss");
    return res.registers;
  } catch (error) {
    uni.showToast({ title: "获取签到信息失败", icon: "none" });
    return [];
  }
};

onLoad((options) => {
  if(options)activityId.value = options.activityId || "692ebe02aac8c1cafbca24e0";
});

onMounted(() => {
  fetchStats();
});

const handleSignIn = async () => {
  if (!canSubmit.value || isSubmitting.value) {
    uni.showToast({ title: "请填写完整信息", icon: "none" });
    return;
  }
  isSubmitting.value = true;
  try {
    const registers = await fetchStats();
    const matched = registers.find((item) => item.name === name.value.trim() && item.phone === phone.value.trim());
    if (!matched) {
      responseMessage.value = "未找到您的报名信息，请联系工作人员";
      statusType.value = "error";
      isSubmitting.value = false;
      return;
    }
    if (matched.checkIn) {
      responseMessage.value = "您已签到，请勿重复操作";
      statusType.value = "info";
      isSubmitting.value = false;
      return;
    }

    const payload: checkInData = {
      activityId: activityId.value,
      name: name.value.trim(),
      phone: phone.value.trim(),
    };
    const res = await signIn(payload);
    if (res.code === 0) {
      responseMessage.value = `${name.value}，签到成功！`;
      statusType.value = "success";
      await fetchStats();
    } else {
      responseMessage.value = res.msg || "签到失败，请稍后重试";
      statusType.value = "error";
    }
  } catch (error) {
    responseMessage.value = "签到失败，请稍后重试";
    statusType.value = "error";
  } finally {
    isSubmitting.value = false;
  }
};

const navigateToDetails = () => {
  uni.navigateTo({ url: `/pages/sign-in-details/sign-in-details` + `?activityId=${activityId.value? activityId.value: '692ebe02aac8c1cafbca24e0'}` });
};
</script>

<style scoped>
.one-line {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.stats-row {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-bottom: 18rpx;
}

.status-banner {
  margin-top: 24rpx;
  padding: 18rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.status-banner.success {
  background: rgba(19, 113, 74, 0.1);
  color: var(--alumni-primary);
}

.status-banner.error {
  background: rgba(255, 99, 71, 0.1);
  color: #ff6347;
}

.status-banner.info {
  background: var(--alumni-surface-muted);
  color: var(--alumni-text);
}
</style>