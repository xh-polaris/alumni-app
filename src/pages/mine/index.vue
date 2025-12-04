<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        
        <view class="surface-card">
          <view class="first-line">
            <view class="section-title">基础信息</view>
            <div 
                class="primary-button" 
                :disabled="savingInfo" 
                @click="startEdit()"
                v-if="!isEditingInfo"
              >
                  编辑
          </div>
              <div 
              v-if="isEditingInfo"
                class="primary-button" 
                :disabled="savingInfo" 
                @click="saveInfo()"
              >
                  {{ savingInfo ? "保存中..." : "保存" }}
        </div>
          </view >
          <view class="rows">
             <view class="form-row">
            <text class="form-label">姓名</text>
            <template v-if="isEditingInfo">
              <input class="input-field" v-model="profile.name" placeholder="请输入姓名" />
            </template>
            <template v-else>
              <text class="display-field">{{ profile.name || '未填写' }}</text>
            </template>
          </view>
          
          <view class="form-row">
            <text class="form-label">性别</text>
            <template v-if="isEditingInfo">
              <picker mode="selector" :range="genders" :value="genderIndex" @change="onGenderChange">
                <view class="picker-field">{{ genders[genderIndex] }}</view>
              </picker>
            </template>
            <template v-else>
              <text class="display-field">{{ genders[genderIndex] }}</text>
            </template>
          </view>
          
          <view class="form-row">
            <text class="form-label">生日</text>
            <template v-if="isEditingInfo">
              <picker mode="date" :value="birthdayDisplay" @change="onBirthdayPicked">
                <view class="picker-field">{{ birthdayDisplay || "请选择日期" }}</view>
              </picker>
            </template>
            <template v-else>
              <text class="display-field">{{ birthdayDisplay || '未填写' }}</text>
            </template>
          </view>
          
          <view class="form-row">
            <text class="form-label">手机号</text>
            <template v-if="isEditingInfo">
              <input class="input-field" v-model="profile.phone"/>
            </template>
            <template v-else>
              <text class="display-field">{{ profile.phone || '未填写' }}</text>
            </template>
          </view>
          
          <view class="form-row">
            <text class="form-label">微信号</text>
            <template v-if="isEditingInfo">
              <input class="input-field" v-model="profile.wxid" placeholder="请输入微信号" />
            </template>
            <template v-else>
              <text class="display-field">{{ profile.wxid || '未填写' }}</text>
            </template>
          </view>
          </view>
          
         
          
          <view class="button-group">
              
              
              <button 
                v-if="isEditingInfo" 
                class="secondary-button" 
                @click="cancelEdit"
              >
                取消
              </button>
          </view>
        </view>

        <EducationExperience
          title="在沪教育经历"
          :model-value="shanghaiEducations"
          @update:modelValue="(val) => (shanghaiEducations = val)"
          @save="(list) => saveEducation(1, list)"
        />
        <EducationExperience
          title="家乡教育经历"
          :model-value="hometownEducations"
          @update:modelValue="(val) => (hometownEducations = val)"
          @save="(list) => saveEducation(0, list)"
        />
        <EmploymentExperience
          :model-value="employmentList"
          @update:modelValue="(val) => (employmentList = val)"
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
// 💡 控制基础信息是否处于编辑状态，默认是 false (不可编辑)
const isEditingInfo = ref(false); 
// 💡 用于存储进入编辑状态前的原始数据，支持取消操作
const profileBackup = ref<UpdateInfo | null>(null); 

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

// 进入编辑状态，并备份数据
const startEdit = () => {
  // 备份当前数据
  profileBackup.value = { ...profile }; 
  isEditingInfo.value = true;
};

// 取消编辑状态，并恢复数据
const cancelEdit = () => {
  if (profileBackup.value) {
    Object.assign(profile, profileBackup.value); // 恢复数据
    genderIndex.value = profileBackup.value.gender ?? 0;
  }
  isEditingInfo.value = false;
  profileBackup.value = null; // 清空备份
};

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
    // 保存成功后，退出编辑状态，并清空备份
    isEditingInfo.value = false; 
    profileBackup.value = null;
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

<style scoped>
.first-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24rpx;
}

.first-line .section-title {
  margin-top: 38rpx;
}

.rows {
  padding: 0 24rpx 24rpx 24rpx;
}
</style>