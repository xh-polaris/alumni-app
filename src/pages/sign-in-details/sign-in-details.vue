<template>
  <view class="page">
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
        <view class="search-input">签到情况：{{ checkInDetails.checked }}/{{ checkInDetails.total }}</view>
        <view v-if="checkInDetails" class="details-container">
          <view class="registers-list">
            <view v-for="register in filteredRegisters" :key="register.id" class="register-item">
              <view class="register-name">
                {{ register.name }}
              </view>
              <view class="register-status">
                {{ register.checkIn ? '已签到' : '未签到' }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </VerificationCode>
    <image class="background-image" src="@/static/logo.png"/>
  </view>
</template>

<script setup lang="ts">
import { ref, computed,watch } from "vue";
import { registerUser } from "@/api/activity/activity";
import type { registerData } from "@/api/activity/activity-interface";
import VerificationCode from "@/components/VerificationCode.vue";
import { getCheckInDetails } from "@/api/check-in";
import type { checkInDetails } from "@/api/check-in";

const activityId = "674b0c0cc9fc4f1f67c398e4";
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
.page {
  position: relative;
  overflow: auto;
  overflow-x: hidden;
  height: 100vh;
  background-color: #f5f5fa;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.button {
  padding: 10px;
  width: 250px;
  background-color: #a2e494;
  color: white;
  border: none;
  border-radius: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 15px;
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.button:hover {
  background-color: darkgreen;
}

.search-input {
  width: 250px;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  background-color: #fafafa;
  opacity: 0.9;
  z-index: 1;
  margin-left: auto;
  margin-right: auto;
}

.details-container {
  margin-top: -5px;
  max-height: 80vh; /* 设置最大高度 */
  overflow-y: auto; /* 内容溢出时滚动 */
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  padding: 10px;
  z-index: 1;
  opacity: 0.8;
  margin-left: auto;
  margin-right: auto;
  width: 250px;
  text-align: center;
}


.registers-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.register-item {
  margin-left: 10%;
  width: 60%;
  display: flex;
  justify-content: space-between;
  font-size: 18px; /* 增大每个注册用户的文字大小 */
  margin-bottom: 10px;
}

.sign-in-details {
  display: flex;
  flex-direction: column;
  margin: 10px;
}
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 850px;
  overflow: auto;
  width : 100vw;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index:10;
  backdrop-filter: blur(2px);
}

.modal-content {
  margin-top: -200px;
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 80vw;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.add-user-input {
  margin-top: 10px;
  padding: 10px;
  width: calc(80% - 20px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  font-size: 18px; /* 增大输入框文字大小 */
}

.modal-buttons {
  margin-top: 10px;
  width: 80%;
  display: flex;
  justify-content: space-between;
}

.modal-button {
  padding: 5px;
  background-color: #a2e494;
  color: white;
  border-radius: 20px;
  text-align: center;
  cursor: pointer;
  font-size: 18px; /* 增大按钮文字大小 */
  width: 40%;
  margin-left: 0;
  margin-right: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-button:hover {
  background-color: darkgreen;
}

.background-image {
  position: absolute;
  top: 100px;
  right: -200px;
  width: 500px;
  height: 510px;
  object-fit: contain;
  opacity: 0.3;
  z-index: 0;
}
</style>
