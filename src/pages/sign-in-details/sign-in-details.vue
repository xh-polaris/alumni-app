<template>
  <VerificationCode>
    <view class="sign-in-details">
      <view class="button" @click="fetchCheckInDetails">
        更新签到情况
      </view>
      <input v-model="searchQuery" placeholder="搜索用户" class="search-input" />
      <view v-if="checkInDetails" class="details-container">
        <view class="summary">签到情况：{{ checkInDetails.checked }}/{{ checkInDetails.total }}</view>
        <view class="registers-list">
          <view v-for="register in filteredRegisters" :key="register.id" class="register-item">
            {{ register.name }}: {{ register.checkIn ? '已签到' : '未签到' }}
          </view>
        </view>
      </view>
    </view>
  </VerificationCode>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { checkInDetails } from "@/api/check-in";
import { getCheckInDetails } from "@/api/check-in";
import VerificationCode from "@/components/VerificationCode.vue";

const activityId = "67486c5422ded7a41d86aa7a";
const checkInDetails = ref<checkInDetails | null>(null);
const searchQuery = ref('');

const fetchCheckInDetails = async () => {
  try {
    checkInDetails.value = await getCheckInDetails(activityId);
    console.log('签到详情:', checkInDetails.value);
  } catch (error) {
    console.error('获取签到详情失败', error);
  }
};

watch(checkInDetails, (newVal) => {
  if (newVal) {
    console.log('签到详情更新:', newVal);
  }
});

const sortedRegisters = computed(() => {
  if (!checkInDetails.value) return [];
  return [...checkInDetails.value.registers].sort((a, b) => {
    // 未签到的用户排在前面
    return a.checkIn === b.checkIn ? 0 : a.checkIn ? 1 : -1;
  });
});

const filteredRegisters = computed(() => {
  if (!searchQuery.value) return sortedRegisters.value;
  return sortedRegisters.value.filter(register =>
    register.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
</script>

<style scoped>
.button {
  padding: 10px;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  font-size: 18px; /* 增大按钮文字大小 */
}

.button:hover {
  background-color: #0056b3;
}

.search-input {
  margin-top: 40rpx;
  padding: 20rpx;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 36rpx; /* 增大输入框文字大小 */
}

.details-container {
  margin-top: 40rpx;
  max-height: 80vh; /* 设置最大高度 */
  overflow-y: auto; /* 内容溢出时滚动 */
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 20rpx;
}

.summary {
  font-size: 24px; /* 增大签到情况文字大小 */
  margin-bottom: 10px;
}

.registers-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.register-item {
  font-size: 18px; /* 增大每个注册用户的文字大小 */
  margin-bottom: 10px;
}

.sign-in-details {
  display: flex;
  flex-direction: column;
  margin: 20rpx;
}
</style>
