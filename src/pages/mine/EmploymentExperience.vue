<!-- src/components/EmploymentExperience.vue -->
<template>
  <view class="employment-experience">
    <view class="title">工作经历</view>
    <view v-for="(employment, index) in employments" :key="index" class="experience-block">
      <view class="info-item">
        <view class="info-title">工作单位</view>
        <input v-model="employment.organization"/>
      </view>
      <view class="info-item">
        <view class="info-title">职位</view>
        <input v-model="employment.position" />
      </view>
      <view class="info-item">
        <view class="info-title">行业</view>
        <input v-model="employment.industry" />
      </view>
      <view class="info-item">
        <view class="info-title">入职年份</view>
        <picker :range="yearsArray" :value="selectedYear" @change="(e) => onYearChange(e, index, 'entry')">
          <view>{{ employment.entry || '请选择' }}</view>
        </picker>
      </view>
      <view class="info-item">
        <view class="info-title">离职年份</view>
        <picker :range="yearsArray" :value="selectedYear" @change="(e) => onYearChange(e, index, 'departure')">
          <view>{{ employment.departure === 0 ? '至今' : employment.departure }}</view>
        </picker>
      </view>
      <view class="buttons">
        <button @click="removeEmployment(index)">删除</button>
        <button @click="saveEmployment(index)">保存</button>
      </view>
    </view>
    <button @click="addEmployment">添加工作经历</button>
  </view>
</template>

<script setup lang="ts">
import { defineComponent, ref } from 'vue';
import type { Employment } from '@/api/user/user-interface';

const employments = ref<Employment[]>([]);

const addEmployment = () => {
  employments.value.push({ organization: '', position: '', industry: '', entry: 0, departure: 0 });
};

const removeEmployment = (index: number) => {
  employments.value.splice(index, 1);
};

const currentYear = new Date().getFullYear();
const yearsArray = ref(['至今', ...Array.from({ length: 60 }, (_, i) => `${currentYear - i}`)]);

// 默认选中最新年份
const selectedYear = ref(0);

// 处理年份选择变化
const onYearChange = (event: any, index: number, type: 'entry' | 'departure') => {
  const selectedValue = event.detail.value;
  const selectedYear = yearsArray.value[selectedValue];

  if (type === 'departure') {
    employments.value[index].departure = selectedYear === '至今' ? 0 : parseInt(selectedYear); // 0 表示至今
  } else {
    employments.value[index].entry = parseInt(selectedYear);
  }
};


const saveEmployment = (index: number) => {
  const employment = employments.value[index];
  // TODO: 调用接口保存工作经历
};
</script>

<style scoped>
.title{
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.employment-experience{
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
}

.experience-block {
  margin-bottom: 30rpx;
  width: 80vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 40rpx;
  padding: 30rpx;
  z-index: 1;
  box-shadow: 0 0 10rpx #ccc;
  opacity: 0.8;
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

input {
  width: 40%;
  text-align: right;
}

.buttons {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 80%;
}
.buttons button {
  padding: 6rpx;
  background-color: #a2e494;
  color: white;
  border-radius: 40rpx;
  text-align: center;
  cursor: pointer;
  font-size: 16px; /* 增大按钮文字大小 */
  width: 40%;
  margin-left: 0;
  margin-right: 0;
}

button {
  padding: 8rpx;
  background-color: #a2e494;
  color: white;
  border-radius: 20rpx;
  text-align: center;
  cursor: pointer;
  font-size: 18px; /* 增大按钮文字大小 */
  width: 60%;
  margin-left: 0;
  margin-right: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>