<!-- src/pages/Mine.vue -->
<template>
  <Layout>
    <view class="page">
      <view class="user-info">
        <view class="info-item">
          <view class="info-title">头像</view>
          <image class="avatar" src="@/static/logo.png"/>
        </view>
        <view class="info-item">
          <view class="info-title">姓名</view>
          <input v-model="userInfo.name"/>
        </view>
        <view class="info-item">
          <view class="uni-title info-title">性别</view>
          <picker :range="gendersArray" :value="selectedGender" @change="onGenderChange">
            <view>{{ gendersArray[selectedGender] }}</view>
          </picker>
        </view>
        <view class="info-item">
          <view class="info-title">生日</view>
          <picker mode="multiSelector" :range="birthdayOptions" :value="selectedBirthday" @change="onBirthdayChange" @columnchange="onColumnChange">
            <view>{{ formattedBirthday }}</view>
          </picker>
        </view>
        <view class="info-item">
          <view class="info-title">手机号</view>
          <text>{{userInfo.phone}}</text>
        </view>
        <view class="info-item">
          <view class="info-title">微信号</view>
          <text>{{userInfo.wxid}}</text>
        </view>
        <button @click="saveInfo">保存信息</button>
      </view>
      <EducationExperience style="z-index: 1;"/>
      <EmploymentExperience style="z-index: 1"/>
    </view>
  </Layout>
</template>

<script setup lang="ts">
import EducationExperience from '@/pages/mine/EducationExperience.vue';
import EmploymentExperience from '@/pages/mine/EmploymentExperience.vue';
import {ref,computed} from "vue";
import type {UpdateInfo} from "@/api/user/user-interface";
import {updateUserInfo} from "@/api/user/user"
import Layout from "@/components/Layout.vue";


const gendersArray = ['未选择', '男', '女'];
const selectedGender = ref(0); // 默认选择'男'

const onGenderChange = (event: any) => {
  selectedGender.value = event.detail.value; // 更新选中的性别
};

const userInfo = ref<UpdateInfo>({
  avatar: '',
  name: '',
  gender: 0,
  birthday: 0,
  phone: '',
  wxid: ''
});

const saveInfo = () => {
  console.log(userInfo.value);
  // TODO调用 API 保存用户信息
  const res = updateUserInfo(userInfo.value);
  if (res.code === 0) {
    uni.showToast({ title: '保存成功' });
  }
  else {
    uni.showToast({ title: '保存失败', icon: 'error' });
  }
};

/**
 * @description: 生日选择器
 */
const currentYear = new Date().getFullYear(); // 获取当前年份
const years = Array.from({ length: 100 }, (_, i) => `${currentYear - i}`); // 最近100年
const months = Array.from({ length: 12 }, (_, i) => `${i + 1}`); // 1-12月
const days = (year: number, month: number) => {
  // 根据年份和月份计算天数
  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return Array.from({ length: daysInMonth[month - 1] }, (_, i) => `${i + 1}`);
};

// 响应式数据
const birthdayOptions = ref([years, months, days(Number(years[0]), 1)]); // 初始选项
const selectedBirthday = ref([0, 0, 0]); // 初始索引值 [年份, 月份, 日期]

// 计算选中的生日格式化输出
const formattedBirthday = computed(() => {
  const [yearIndex, monthIndex, dayIndex] = selectedBirthday.value;
  const year = years[yearIndex];
  const month = months[monthIndex];
  const day = birthdayOptions.value[2][dayIndex];
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
});

// 处理选择变化
const onBirthdayChange = (event: any) => {
  selectedBirthday.value = event.detail.value;
};

// 动态更新天数选项
const onColumnChange = (event: any) => {
  const { column, value } = event.detail;

  if (column === 0 || column === 1) {
    // 年份或月份改变时动态更新天数
    const year = Number(years[selectedBirthday.value[0]]);
    const month = Number(months[column === 0 ? selectedBirthday.value[1] : value]);
    const newDays = days(year, month);
    birthdayOptions.value[2] = newDays;

    // 如果当前选中的天数超出范围，重置为最后一天
    if (selectedBirthday.value[2] >= newDays.length) {
      selectedBirthday.value[2] = newDays.length - 1;
    }
  }

  // 更新当前列的选中值
  selectedBirthday.value[column] = value;
};

</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100vw;
}
.user-info {
  position: relative;
  margin-top: 60rpx;
  margin-bottom: 30rpx;
  width: calc(80vw - 40rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 40rpx;
  padding: 50rpx;
  z-index: 1;
  box-shadow: 0 0 10rpx #ccc;
  opacity: 0.8;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
}
.info-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20rpx;
}
.info-title {
  font-size: 30rpx;
  font-weight: bold;
}
input,text {
  width: 40%;
  text-align: right;
}
button {
  padding: 8rpx;
  background-color: #a2e494;
  color: white;
  border-radius: 40rpx;
  text-align: center;
  cursor: pointer;
  font-size: 18px; /* 增大按钮文字大小 */
  width: 40%;
  margin-left: 0;
  margin-right: 0;
}
</style>