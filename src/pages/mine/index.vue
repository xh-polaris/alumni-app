<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <view class="surface-card">
          <view class="section-title">基础信息</view>
          <view class="form-row">
            <text class="form-label">姓名</text>
            <input class="input-field" v-model="profile.name" placeholder="请输入姓名" />
          </view>
          <view class="form-row">
            <text class="form-label">性别</text>
            <picker mode="selector" :range="genders" :value="genderIndex" @change="onGenderChange">
              <view class="picker-field">{{ genders[genderIndex] }}</view>
            </picker>
          </view>
          <view class="form-row">
            <text class="form-label">生日</text>
            <picker mode="date" :value="birthdayDisplay" @change="onBirthdayPicked">
              <view class="picker-field">{{ birthdayDisplay || "请选择日期" }}</view>
            </picker>
          </view>
          <view class="form-row">
            <text class="form-label">手机号</text>
            <input class="input-field" v-model="profile.phone" disabled />
          </view>
          <view class="form-row">
            <text class="form-label">微信号</text>
            <input class="input-field" v-model="profile.wxid" placeholder="请输入微信号" />
          </view>
          <button class="primary-button" :disabled="savingInfo" @click="saveInfo">
            {{ savingInfo ? "保存中..." : "保存基础信息" }}
          </button>
        </view>

        <EducationExperience
          title="在沪教育经历"
          :model-value="shanghaiEducations.value"
          @update:modelValue="(val) => (shanghaiEducations.value = val)"
          @save="(list) => saveEducation(1, list)"
        />
        <EducationExperience
          title="家乡教育经历"
          :model-value="hometownEducations.value"
          @update:modelValue="(val) => (hometownEducations.value = val)"
          @save="(list) => saveEducation(0, list)"
        />
        <EmploymentExperience
          :model-value="employmentList.value"
          @update:modelValue="(val) => (employmentList.value = val)"
          @save="saveEmployment"
        />
      </view>
    </view>
  </Layout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import Layout from "@/components/Layout.vue";
import EducationExperience from "@/pages/mine/EducationExperience.vue";
import EmploymentExperience from "@/pages/mine/EmploymentExperience.vue";
import {
  getUserInfo,
  updateUserInfo,
  updateEducation,
  updateEmployment,
} from "@/api/user/user";
import type {
  UpdateInfo,
  Education,
  Employment,
  UserInfo,
} from "@/api/user/user-interface";
import { dateToTimestamp, timestampToTime } from "@/utils/time";

const genders = ["未选择", "男", "女"];
const genderIndex = ref(0);
const profile = reactive<UpdateInfo>({
  avatar: "",
  name: "",
  gender: 0,
  birthday: 0,
  phone: "",
  wxid: "",
});
const savingInfo = ref(false);
const shanghaiEducations = ref<Education[]>([]);
const hometownEducations = ref<Education[]>([]);
const employmentList = ref<Employment[]>([]);

const birthdayDisplay = computed(() =>
  profile.birthday ? timestampToTime(profile.birthday, "yyyy-MM-DD") : ""
);

const loadProfile = async () => {
  try {
    const data: UserInfo = await getUserInfo();
    Object.assign(profile, {
      avatar: data.avatar,
      name: data.name,
      gender: data.gender,
      birthday: data.birthday,
      phone: data.phone,
      wxid: data.wxid,
    });
    genderIndex.value = data.gender ?? 0;
    shanghaiEducations.value = data.shanghaiEducations || [];
    hometownEducations.value = data.hometownEducations || [];
    employmentList.value = data.employments || [];
  } catch (error) {
    uni.showToast({ title: "获取用户信息失败", icon: "none" });
  }
};

onMounted(() => {
  loadProfile();
});

const onGenderChange = (event: any) => {
  genderIndex.value = Number(event.detail.value);
  profile.gender = genderIndex.value;
};

const onBirthdayPicked = (event: any) => {
  if (event?.detail?.value) {
    profile.birthday = dateToTimestamp(`${event.detail.value} 00:00:00`);
  }
};

const saveInfo = async () => {
  savingInfo.value = true;
  try {
    await updateUserInfo({ ...profile });
    uni.showToast({ title: "保存成功", icon: "success" });
  } catch (error) {
    uni.showToast({ title: "保存失败", icon: "none" });
  } finally {
    savingInfo.value = false;
  }
};

const saveEducation = async (type: number, list: Education[]) => {
  try {
    await updateEducation({ type, educations: list });
    uni.showToast({ title: "教育经历已保存", icon: "success" });
  } catch (error) {
    uni.showToast({ title: "保存教育经历失败", icon: "none" });
  }
};

const saveEmployment = async (list: Employment[]) => {
  try {
    await updateEmployment({ employments: list });
    uni.showToast({ title: "工作经历已保存", icon: "success" });
  } catch (error) {
    uni.showToast({ title: "保存工作经历失败", icon: "none" });
  }
};
</script>
