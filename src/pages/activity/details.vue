<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import Header from "@/pages/activity/details/Header.vue";
import MetaInfo from "@/pages/activity/details/MetaInfo.vue";
import { getActivityDetails, registerUser } from "@/api/activity/activity";
import { getCheckInDetails,type Register } from "@/api/check-in";
import type { Activity, registerData } from "@/api/activity/activity-interface";
import { STORAGE_KEYS } from "@/constants/storage";


const activityDetails = ref<Activity | null>(null);
const isLoading = ref(true);
const fetchError = ref("");
const showRegisterModal = ref(false);
const registrants = ref<Array<{ name: string; phone: string }>>([]);
const isSubmitting = ref(false);
const participantCount = ref(0);
const registers = ref<Array<Register>>([]);
const isInvited = ref(uni.getStorageSync(STORAGE_KEYS.USER)?.id ? false : true);

const userId = uni.getStorageSync(STORAGE_KEYS.USER)?.id || "";

const resetRegistrants = () => {
  registrants.value = [{ name: "", phone: "" }];
};

const validatePhone = (value: string) => /^1[3-9]\d{9}$/.test(value);

const isRegistrationOpen = computed(() => {
  if (!activityDetails.value) return false;
  const now = Date.now();
  const withinWindow =
    now >= activityDetails.value.registerStart &&
    now <= activityDetails.value.registerEnd;
  return withinWindow && (activityDetails.value.status < activityDetails.value.limit || activityDetails.value.limit === -1);
});

const registrationHint = computed(() => {
  if (!activityDetails.value) return "";
  if (activityDetails.value.status >= activityDetails.value.limit && activityDetails.value.limit !== -1) {
    return "当前名额已满";
  }
  const now = Date.now();
  if (now < activityDetails.value.registerStart) {
    return "报名尚未开始";
  }
  if (now > activityDetails.value.registerEnd) {
    return "报名已截止";
  }
  return "";
});

const fetchDetails = async (id: string) => {
  isLoading.value = true;
  fetchError.value = "";
  try {
    const res = await getActivityDetails({ id });
    activityDetails.value = res.activity;
    participantCount.value = res.numbers;
  } catch (error) {
    fetchError.value = "活动详情加载失败，请稍后重试";
    uni.showToast({ title: fetchError.value, icon: "none" });
  } finally {
    isLoading.value = false;
  }
};

async function getRegisterInfo(activityId: string) {
  try {
    const res = await getCheckInDetails(`:${activityId}` );
    registers.value = res.registers;
    console.log("Register Info:", res.registers);
    return res.registers;
  } catch (error) {
    uni.showToast({ title: "获取报名信息失败", icon: "none" });
  }
}

onLoad((options) => {
  if (options?.id) {
    fetchDetails(options.id);
    getRegisterInfo(options.id);
  } else {
    fetchError.value = "未找到活动信息";
    isLoading.value = false;
  }
});

const handleRegister = () => {
  if (!activityDetails.value) return;
  resetRegistrants();
  showRegisterModal.value = true;
};

const addRegistrant = () => {
  registrants.value.push({ name: "", phone: "" });
};

const removeRegistrant = (index: number) => {
  if (registrants.value.length === 1) {
    registrants.value[0] = { name: "", phone: "" };
    return;
  }
  registrants.value.splice(index, 1);
};

const submitRegister = async () => {
  if (!activityDetails.value) return;
  if (registrants.value.some(item => !item.name.trim() || !validatePhone(item.phone))) {
    uni.showToast({ title: "请填写完整且正确的姓名与手机号", icon: "none" });
    return;
  }
  const payload: registerData = {
    activityId: activityDetails.value.id,
    items: registrants.value.map(item => ({
      name: item.name.trim(),
      phone: item.phone.trim(),
    })),
  };
  isSubmitting.value = true;
  try {
    const res = await registerUser(payload);
    if (res.code === 0) {
      uni.showToast({ title: "报名成功", icon: "success" });
      showRegisterModal.value = false;
      fetchDetails(activityDetails.value.id);
    } else {
      uni.showToast({ title: res.msg || "报名失败", icon: "none" });
    }
  } catch (error) {
    uni.showToast({ title: "报名失败，请稍后重试", icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};

function jump2CheckInDetails() {
  if (!activityDetails.value) return;
  uni.navigateTo({ url: `/pages/check-in/index?activityId=${activityDetails.value.id}`,});
}

const isCheckInAvailable = computed(() => {
  // if (!activityDetails.value) return false;
  // const now = Date.now();
  // return now >= activityDetails.value.start;

  return true;
});
</script>

<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <view v-if="isLoading" class="empty-state">正在加载活动详情...</view>
        <view v-else-if="fetchError" class="empty-state">
          {{ fetchError }}
        </view>
        <view v-else-if="activityDetails" class="detail-wrapper">
          <view class="surface-card">
            <Header :activity="activityDetails" />
            <MetaInfo :activity="activityDetails" :numbers="participantCount" />
          </view>
          <view class="surface-card" v-if="!isInvited">
            <view class="section-title">报名记录</view>
            <view class="row header-row pill">
              <view>姓名</view>
              <view>手机号</view>
            </view>
            <view class="row" v-for="register in registers" :key="register.id">
              <view>{{ register.name }}</view>
              <view>{{ register.phone }}</view>
            </view>
          </view>
          <view class="one-line">
            <button
            class="primary-button"
            :disabled="!isRegistrationOpen"
            @click="handleRegister"
            v-if="!isInvited"
          >
            {{ isRegistrationOpen ? "立即报名" : registrationHint || "报名不可用" }}
          </button>
          <button
            class="primary-button"
            :disabled="!isCheckInAvailable"
            @click="jump2CheckInDetails"
          >
            {{ isCheckInAvailable ? "签到" :  "未到签到时间" }}
          </button>
          </view>
        </view>
      </view>
    </view>

    <view class="register-modal" v-if="showRegisterModal">
      <view class="register-modal__backdrop" @click="showRegisterModal = false" />
      <view class="register-modal__content surface-card">
        <view class="modal-header">
          <view class="section-title">报名信息</view>
          <text class="close" @click="showRegisterModal = false">关闭</text>
        </view>

        <view
          class="registrant-form"
          v-for="(item, index) in registrants"
          :key="index"
        >
          <view class="form-row">
            <text class="form-label">姓名</text>
            <input
              class="input-field"
              placeholder="请输入姓名"
              v-model="item.name"
            />
          </view>
          <view class="form-row">
            <text class="form-label">手机号</text>
            <input
              class="input-field"
              placeholder="请输入手机号"
              type="number"
              maxlength="11"
              v-model="item.phone"
            />
          </view>
          <view class="remove-row" v-if="registrants.length > 1" @click="removeRegistrant(index)">
            移除该成员
          </view>
          <view class="divider" />
        </view>

        <button class="secondary-button" @click="addRegistrant">添加更多成员</button>
        <button class="primary-button" :disabled="isSubmitting" @click="submitRegister">
          {{ isSubmitting ? "提交中..." : "确认报名" }}
        </button>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.one-line {
  display: flex;
  gap: 20rpx;
}

.detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.register-modal {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.register-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.register-modal__content {
  position: relative;
  width: 100%;
  border-radius: 32rpx 32rpx 0 0;
  max-height: 85vh;
  overflow-y: auto;
  z-index: 2;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close {
  color: var(--alumni-primary);
}

.registrant-form :deep(.divider:last-child) {
  display: none;
}

.remove-row {
  color: #ff6347;
  font-size: 26rpx;
  text-align: right;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 24rpx;
}

.header-row {
  font-weight: 600;
  border-bottom: 1rpx solid var(--alumni-border-color);
}
.header-row :nth-child(2) {
  margin-right: 100rpx;
}
</style>
