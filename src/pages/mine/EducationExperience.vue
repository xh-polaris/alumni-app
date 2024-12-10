<!-- src/components/EducationExperience.vue -->
<template>
  <view class="education-experience">
    <view class="title">教育经历</view>
    <view v-for="(education, index) in educations" :key="index" class="experience-block">
      <view class="info-item">
        <view class="info-title">选择学段</view>
        <picker :range="educationStagesArray" :value="selectedEducationStage" @change="onEducationStageChange">
          <view>{{ educationStagesArray[selectedEducationStage] }}</view>
        </picker>
      </view>
      <view class="info-item">
        <view class="info-title">学校</view>
        <input v-model="education.school" />
      </view>
      <view class="info-item">
        <view class="info-title">毕业年份</view>
        <picker :range="yearsArray" :value="selectedYear" @change="onYearChange">
          <view>{{ yearsArray[selectedYear] }}</view>
        </picker>
      </view>
      <view class="buttons">
        <button @click="removeEducation(index)">删除</button>
        <button @click="saveEducation(index)">保存</button>
      </view>
    </view>
    <button @click="addEducation">添加教育经历</button>
  </view>
</template>

<script lang="ts" setup>
import { defineComponent, ref } from 'vue';
import type { Education } from '@/api/user/user-interface';

const educations = ref<Education[]>([]);

const addEducation = () => {
  educations.value.push({ phrase: '', school: '', year: new Date().getFullYear() });
};

const removeEducation = (index: number) => {
  educations.value.splice(index, 1);
};

const currentYear = new Date().getFullYear();
const yearsArray = ref(Array.from({ length: 60 }, (_, i) => `${currentYear - i}`)); // 过去60年

// 默认选中最新年份
const selectedYear = ref(0);

// 处理年份选择变化
const onYearChange = (event: any) => {
  selectedYear.value = event.detail.value; // 更新选中值
};

const educationStagesArray = ref(['小学', '初中', '高中', '大学']);
const selectedEducationStage = ref(0); // 默认选择'小学'

const onEducationStageChange = (event: any) => {
  selectedEducationStage.value = event.detail.value; // 更新选中的学段
};

const saveEducation = (index: number) => {
  const education = educations.value[index];
  education.phrase = educationStagesArray.value[selectedEducationStage.value];
  education.year = Number(yearsArray.value[selectedYear.value]);
  console.log('保存教育经历：', education);
  // TODO: 保存教育经历到后端
};

</script>

<style scoped>
.title{
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  margin-top: 20rpx;
}
.education-experience{
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
  padding: 8rpx ;
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
  margin-bottom: 30rpx;
}

input {
  width: 60%;
  text-align: right;
}
</style>