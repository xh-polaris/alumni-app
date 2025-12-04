<template>
  <VerificationCode>
    <Layout>
      <view class="page-shell">
        <view class="page-shell__content">
          <view class="surface-card">
            <view class="section-title">签到概览</view>
            <view class="pill">签到 {{ details?.checked || 0 }}/{{ details?.total || 0 }}</view>
            <view class="actions">
              <button class="primary-button" @click="openModal">添加用户</button>
              <button class="secondary-button" @click="fetchDetails">刷新数据</button>
            </view>
            <input class="input-field" v-model="searchQuery" placeholder="搜索姓名" />
          </view>

          <view class="surface-card">
            <view class="list" v-if="filteredRegisters.length">
              <view
                class="register-item"
                v-for="register in filteredRegisters"
                :key="register.id"
              >
                <view>
                  <view class="name">{{ register.name }}</view>
                  <view class="muted-text">{{ register.phone }}</view>
                </view>
                <view class="status" :class="{ checked: register.checkIn }">
                  {{ register.checkIn ? "已签到" : "未签到" }}
                </view>
              </view>
            </view>
            <view class="empty-state" v-else>暂无匹配的签到记录</view>
          </view>
        </view>
      </view>
    </Layout>

    <view class="register-modal" v-if="isModalVisible">
      <view class="register-modal__backdrop" @click="closeModal" />
      <view class="register-modal__content surface-card">
        <view class="section-title">添加报名用户</view>
        <view class="form-row">
          <text class="form-label">姓名</text>
          <input class="input-field" v-model="newUserName" placeholder="请输入姓名" />
        </view>
        <view class="form-row">
          <text class="form-label">手机号</text>
          <input class="input-field" v-model="newUserPhone" maxlength="11" placeholder="请输入手机号" />
        </view>
        <view class="modal-actions">
          <button class="secondary-button" @click="closeModal">取消</button>
          <button class="primary-button" @click="handleRegister">确定</button>
        </view>
      </view>
    </view>
  </VerificationCode>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import VerificationCode from "@/components/VerificationCode.vue";
import Layout from "@/components/Layout.vue";
import { getCheckInDetails } from "@/api/check-in";
import { registerUser } from "@/api/activity/activity";
import type { checkInDetails as CheckInDetails } from "@/api/check-in";
import type { registerData } from "@/api/activity/activity-interface";
import { onLoad } from "@dcloudio/uni-app";


const activityId = ref("");
const details = ref<CheckInDetails | null>(null);
const searchQuery = ref("");
const isModalVisible = ref(false);
const newUserName = ref("");
const newUserPhone = ref("");

const fetchDetails = async () => {
  try {
    details.value = await getCheckInDetails(activityId.value);
  } catch (error) {
    uni.showToast({ title: "获取签到信息失败", icon: "none" });
  }
};

onLoad((options) => {
  console.log(options);
  if (options?.activityId) {
    activityId.value = options.activityId;
  }})
  fetchDetails()

onMounted(() => {
  fetchDetails();
});

const openModal = () => {
  newUserName.value = "";
  newUserPhone.value = "";
  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
};

const handleRegister = async () => {
  if (!newUserName.value.trim() || !/^1[3-9]\d{9}$/.test(newUserPhone.value)) {
    uni.showToast({ title: "请输入有效的姓名和手机号", icon: "none" });
    return;
  }
  if (details.value?.registers.some(item => item.name === newUserName.value.trim())) {
    uni.showToast({ title: "用户已存在", icon: "none" });
    return;
  }
  const payload: registerData = {
    activityId: activityId.value,
    items: [{ name: newUserName.value.trim(), phone: newUserPhone.value.trim() }],
  };
  try {
    const res = await registerUser(payload);
    if (res.code === 0) {
      uni.showToast({ title: "添加成功", icon: "success" });
      closeModal();
      fetchDetails();
    } else {
      uni.showToast({ title: res.msg || "添加失败", icon: "none" });
    }
  } catch (error) {
    uni.showToast({ title: "添加失败，请稍后重试", icon: "none" });
  }
};

const filteredRegisters = computed(() => {
  if (!details.value) return [];
  const keyword = searchQuery.value.trim().toLowerCase();
  return details.value.registers
    .slice()
    .sort((a, b) => (a.checkIn === b.checkIn ? 0 : a.checkIn ? 1 : -1))
    .filter((item) => (keyword ? item.name.toLowerCase().includes(keyword) : true));
});
</script>

<style scoped>
.actions {
  display: flex;
  gap: 16rpx;
  margin: 24rpx 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.register-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1px solid var(--alumni-border);
}

.register-item:last-child {
  border-bottom: none;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
}

.status {
  font-size: 24rpx;
  color: var(--alumni-muted);
}

.status.checked {
  color: var(--alumni-primary);
}

.register-modal {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.register-modal__content {
  position: relative;
  width: 90%;
  max-width: 600rpx;
  z-index: 2;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}
</style>
