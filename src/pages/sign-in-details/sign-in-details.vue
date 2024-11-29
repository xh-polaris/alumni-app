<template>
  <VerificationCode>
    <view class="sign-in-details">
      <view class="button" @click="fetchCheckInDetails">
        更新签到情况
      </view>
      <view class="button" @click="openModal">
        添加用户
      </view>
      <view v-if="isModalVisible" class="modal-overlay">
        <view class="modal-content">
          <text>添加用户</text>
          <input
              v-model="newUserName"
              placeholder="请输入姓名"
              class="add-user-input"
          />
          <view class="modal-buttons">
            <button class="modal-button" @click="handleRegister">确定</button>
            <button class="modal-button" @click="closeModal">取消</button>
          </view>
        </view>
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
import { ref, computed,watch } from "vue";
import { registerUser } from "@/api/activity/activity";
import type { registerData } from "@/api/activity/activity-interface";
import VerificationCode from "@/components/VerificationCode.vue";
import { getCheckInDetails } from "@/api/check-in";
import type { checkInDetails } from "@/api/check-in";

const activityId = "6749c844c9fc4f1f67c398dc";
const checkInDetails = ref<checkInDetails | null>(null);
const searchQuery = ref('');
const isModalVisible = ref(false); // 控制modal的显示与隐藏
const newUserName = ref("");

// 打开modal
const openModal = () => {
  isModalVisible.value = true;
};

// 关闭modal
const closeModal = () => {
  isModalVisible.value = false;
};

// 添加用户逻辑
const handleRegister = async () => {
  if (!newUserName.value) {
    await uni.showToast({ title: "请输入姓名", icon: "error" });
    return;
  }
  const data: registerData = {
    activityId: activityId,
    items: [{ name: newUserName.value, phone: "-1" }],
  };

  //检查新添加的用户是否已存在
  const details: checkInDetails = await getCheckInDetails(activityId);
  const user = details.registers.find(register => register.name === newUserName.value);
  if (user) {
    await uni.showToast({ title: "用户已存在", icon: "error" });
    return;
  }

  try {
    const result = await registerUser(data);
    if (result.code === 0) {
      await uni.showToast({ title: "添加成功" });
      newUserName.value = ""; // 清空输入框
      await fetchCheckInDetails(); // 刷新签到详情
      closeModal(); // 关闭modal
    }
  } catch (error) {
    console.error("添加失败", error);
    await uni.showToast({ title: "添加失败，请重试" });
  }
};


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
  margin-bottom: 40rpx;
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 300px;
  max-width: 90%;
}

.add-user-input {
  margin-top: 20rpx;
  padding: 20rpx;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 36rpx; /* 增大输入框文字大小 */
}

.modal-buttons {
  margin-top: 20rpx;
  display: flex;
  justify-content: space-between;
}

.modal-button {
  padding: 10px;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  font-size: 18px; /* 增大按钮文字大小 */
}

.modal-button:hover {
  background-color: #0056b3;
}
</style>
