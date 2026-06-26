<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from "vue";
import { onShow } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatePanel from "@/components/StatePanel.vue";
import EducationExperience from "@/pages/mine/EducationExperience.vue";
import EmploymentExperience from "@/pages/mine/EmploymentExperience.vue";
import { getUserInfo, updateUserInfo, updateEducation, updateEmployment } from "@/api/user/user";
import { ApiError, getErrorMessage } from "@/api/request";
import type { Education, Employment, UpdateInfo, UserInfo } from "@/api/user/user-interface";
import { dateToTimestamp, timestampToTime } from "@/utils/time";
import { STORAGE_KEYS } from "@/constants/storage";

interface ProfileDraft {
  avatar: string;
  name: string;
  gender: number;
  birthday: number;
  phone: string;
  wxId: string;
  hometown: string;
}

const genders = ["未选择", "男", "女"];
const NOT_AUTHENTICATED_CODE = 1000;
const profile = reactive<ProfileDraft>({ avatar: "", name: "", gender: 0, birthday: 0, phone: "", wxId: "", hometown: "" });
const profileBackup = shallowRef<ProfileDraft | null>(null);
const shanghaiEducations = ref<Education[]>([]);
const hometownEducations = ref<Education[]>([]);
const employmentList = ref<Employment[]>([]);
const isLoading = ref(true);
const loadError = ref("");
const isEditingInfo = ref(false);
const savingInfo = ref(false);
const isAuthed = ref(false);
const isAuthorizingWechat = ref(false);

const genderIndex = computed(() => Math.max(0, genders[profile.gender] ? profile.gender : 0));
const birthdayDisplay = computed(() => profile.birthday ? timestampToTime(profile.birthday, "yyyy-MM-DD") : "");
const avatarInitial = computed(() => profile.name.trim().slice(0, 1) || "友");
const completeness = computed(() => {
  const completed = [profile.avatar, profile.name, profile.gender, profile.birthday, profile.phone, profile.wxId, profile.hometown].filter(Boolean).length;
  return Math.round((completed / 7) * 100);
});

const assignProfile = (data: UserInfo) => {
  Object.assign(profile, {
    avatar: data.avatar || "",
    name: data.name || "",
    gender: data.gender || 0,
    birthday: data.birthday || 0,
    phone: data.phone || "",
    wxId: data.wxId || "",
    hometown: data.hometown || "",
  });
  shanghaiEducations.value = (data.shanghaiEducations ?? []).map((item) => ({ ...item }));
  hometownEducations.value = (data.hometownEducations ?? []).map((item) => ({ ...item }));
  employmentList.value = (data.employments ?? []).map((item) => ({ ...item }));
};

const showGuestProfile = () => {
  uni.removeStorageSync(STORAGE_KEYS.USER);
  isAuthed.value = false;
  loadError.value = "";
  isEditingInfo.value = false;
  profileBackup.value = null;
};

const loadProfile = async () => {
  isAuthed.value = Boolean(uni.getStorageSync(STORAGE_KEYS.USER)?.accessToken);
  if (!isAuthed.value) {
    isLoading.value = false;
    loadError.value = "";
    return;
  }

  isLoading.value = true;
  loadError.value = "";
  try {
    assignProfile(await getUserInfo());
  } catch (error) {
    if (error instanceof ApiError && error.code === NOT_AUTHENTICATED_CODE) {
      showGuestProfile();
      return;
    }
    loadError.value = getErrorMessage(error, "个人信息加载失败");
  } finally {
    isLoading.value = false;
  }
};

onShow(loadProfile);

const openLogin = () => uni.navigateTo({ url: "/pages/login/index" });
const openRegister = () => uni.navigateTo({ url: "/pages/login/sign-up" });

const startEdit = () => {
  profileBackup.value = { ...profile };
  isEditingInfo.value = true;
};
const cancelEdit = () => {
  if (profileBackup.value) Object.assign(profile, profileBackup.value);
  profileBackup.value = null;
  isEditingInfo.value = false;
};
const onGenderChange = (event: { detail: { value: string | number } }) => {
  profile.gender = Number(event.detail.value);
};
const onBirthdayPicked = (event: { detail: { value: string } }) => {
  if (event.detail.value) profile.birthday = dateToTimestamp(`${event.detail.value} 00:00:00`);
};
const onChooseAvatar = (event: { detail?: { avatarUrl?: string } }) => {
  const avatarUrl = event.detail?.avatarUrl;
  if (!avatarUrl) return;
  profile.avatar = avatarUrl;
  if (!isEditingInfo.value) startEdit();
};
const authorizeWechatProfile = async () => {
  if (isAuthorizingWechat.value) return;

  // #ifdef MP-WEIXIN
  isAuthorizingWechat.value = true;
  try {
    const response = await uni.getUserProfile({ desc: "用于完善校友资料" });
    const userInfo = response.userInfo as { nickName?: string; avatarUrl?: string };
    if (userInfo.nickName) profile.wxId = userInfo.nickName;
    if (!profile.avatar && userInfo.avatarUrl) profile.avatar = userInfo.avatarUrl;
    if (!isEditingInfo.value) startEdit();
    uni.showToast({ title: "微信名已获取", icon: "success" });
  } catch {
    uni.showToast({ title: "未完成微信授权", icon: "none" });
  } finally {
    isAuthorizingWechat.value = false;
  }
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: "当前端请手动填写微信名", icon: "none" });
  // #endif
};
const onPhoneNumberAuthorized = (event: { detail?: { errMsg?: string; phoneNumber?: string } }) => {
  const detail = event.detail;
  if (!detail?.errMsg?.includes("ok")) {
    uni.showToast({ title: "未完成手机号授权", icon: "none" });
    return;
  }
  if (detail.phoneNumber) {
    profile.phone = detail.phoneNumber;
    if (!isEditingInfo.value) startEdit();
    uni.showToast({ title: "手机号已获取", icon: "success" });
    return;
  }
  uni.showToast({ title: "请手动填写手机号", icon: "none" });
};

const saveInfo = async () => {
  if (!profile.name.trim()) {
    uni.showToast({ title: "请输入姓名", icon: "none" });
    return;
  }
  if (profile.phone && !/^1[3-9]\d{9}$/.test(profile.phone)) {
    uni.showToast({ title: "请输入有效手机号", icon: "none" });
    return;
  }
  savingInfo.value = true;
  const payload: UpdateInfo = { ...profile, name: profile.name.trim(), phone: profile.phone.trim(), wxId: profile.wxId.trim(), hometown: profile.hometown.trim() };
  try {
    const response = await updateUserInfo(payload);
    if (response.code !== 0) throw new Error(response.msg || "保存失败");
    Object.assign(profile, payload);
    profileBackup.value = null;
    isEditingInfo.value = false;
    uni.showToast({ title: "个人信息已保存", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "保存失败，请稍后重试"), icon: "none" });
  } finally {
    savingInfo.value = false;
  }
};

const saveEducation = async (type: number, list: Education[]) => {
  try {
    const response = await updateEducation({ type, educations: list });
    if (response.code !== 0) throw new Error(response.msg || "保存失败");
    uni.showToast({ title: "教育经历已保存", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "教育经历保存失败"), icon: "none" });
  }
};
const saveEmployment = async (list: Employment[]) => {
  try {
    const response = await updateEmployment({ employments: list });
    if (response.code !== 0) throw new Error(response.msg || "保存失败");
    uni.showToast({ title: "工作经历已保存", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "工作经历保存失败"), icon: "none" });
  }
};
</script>

<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <PageHeader eyebrow="PROFILE" title="个人信息" description="管理基础资料和个人经历" />
        <view v-if="isLoading" class="profile-skeleton">
          <view class="skeleton profile-skeleton__hero" />
          <view class="surface-card"><view class="skeleton profile-skeleton__line" /><view class="skeleton profile-skeleton__line" /></view>
        </view>
        <view v-else-if="!isAuthed" class="guest-profile">
          <view class="section-title">登录后完善校友资料</view>
          <view class="section-subtitle">注册或登录后，可以管理个人信息、教育经历和工作经历。</view>
          <view class="button-row guest-profile__actions">
            <button class="primary-button" @click="openLogin">登录</button>
            <button class="secondary-button" @click="openRegister">注册</button>
          </view>
        </view>
        <StatePanel v-else-if="loadError" tone="error" title="无法加载个人信息" :description="loadError" action-label="重新加载" @action="loadProfile" />
        <template v-else>
          <view class="profile-hero">
            <button v-if="isEditingInfo" class="profile-hero__avatar-button" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
              <image v-if="profile.avatar" class="profile-hero__avatar profile-hero__avatar--image" :src="profile.avatar" mode="aspectFill" />
              <view v-else class="profile-hero__avatar">{{ avatarInitial }}</view>
            </button>
            <template v-else>
              <image v-if="profile.avatar" class="profile-hero__avatar profile-hero__avatar--image" :src="profile.avatar" mode="aspectFill" />
              <view v-else class="profile-hero__avatar">{{ avatarInitial }}</view>
            </template>
            <view class="profile-hero__copy"><view class="profile-hero__name">{{ profile.name || "未填写姓名" }}</view><view class="profile-hero__meta">资料完整度 {{ completeness }}%</view></view>
            <button v-if="!isEditingInfo" class="profile-hero__edit" @click="startEdit">编辑</button>
          </view>

          <view class="surface-card basic-card">
            <view class="basic-card__header"><view class="basic-card__title">基础信息</view></view>
            <view v-if="!isEditingInfo" class="info-list">
              <view class="info-row"><text>姓名</text><text>{{ profile.name || "未填写" }}</text></view>
              <view class="info-row"><text>性别</text><text>{{ genders[genderIndex] }}</text></view>
              <view class="info-row"><text>生日</text><text>{{ birthdayDisplay || "未填写" }}</text></view>
              <view class="info-row"><text>手机号</text><text>{{ profile.phone || "未填写" }}</text></view>
              <view class="info-row"><text>微信名</text><text>{{ profile.wxId || "未填写" }}</text></view>
              <view class="info-row"><text>家乡</text><text>{{ profile.hometown || "未填写" }}</text></view>
            </view>
            <view v-else>
              <!-- #ifdef MP-WEIXIN -->
              <view class="auth-tools">
                <button class="secondary-button auth-tool" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">获取头像</button>
                <button class="secondary-button auth-tool" open-type="getPhoneNumber" @getphonenumber="onPhoneNumberAuthorized">授权手机号</button>
                <button class="secondary-button auth-tool" :disabled="isAuthorizingWechat" @click="authorizeWechatProfile">{{ isAuthorizingWechat ? "获取中" : "获取微信名" }}</button>
              </view>
              <!-- #endif -->
              <view class="form-row"><text class="form-label">姓名</text><input v-model="profile.name" class="input-field" /></view>
              <view class="form-row"><text class="form-label">性别</text><picker mode="selector" :range="genders" :value="genderIndex" @change="onGenderChange"><view class="picker-field">{{ genders[genderIndex] }}</view></picker></view>
              <view class="form-row"><text class="form-label">生日</text><picker mode="date" :value="birthdayDisplay" @change="onBirthdayPicked"><view class="picker-field">{{ birthdayDisplay || "请选择日期" }}</view></picker></view>
              <view class="form-row"><text class="form-label">手机号</text><input v-model="profile.phone" class="input-field" type="number" maxlength="11" /></view>
              <view class="form-row"><text class="form-label">微信名</text><input v-model="profile.wxId" class="input-field" placeholder="可授权获取，也可手动填写" /></view>
              <view class="form-row"><text class="form-label">家乡</text><input v-model="profile.hometown" class="input-field" placeholder="例：宁波北仑" /></view>
              <view class="button-row"><button class="secondary-button" :disabled="savingInfo" @click="cancelEdit">取消</button><button class="primary-button" :disabled="savingInfo" @click="saveInfo">{{ savingInfo ? "保存中…" : "保存" }}</button></view>
            </view>
          </view>

          <EducationExperience v-model="shanghaiEducations" title="在沪教育经历" @save="(list) => saveEducation(1, list)" />
          <EducationExperience v-model="hometownEducations" title="家乡教育经历" @save="(list) => saveEducation(0, list)" />
          <EmploymentExperience v-model="employmentList" @save="saveEmployment" />
        </template>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.guest-profile { min-height: 58vh; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; padding: 72rpx 34rpx; border-radius: var(--alumni-radius-lg); background: var(--alumni-surface); box-shadow: var(--alumni-shadow); }
.guest-profile__mark { width: 96rpx; height: 96rpx; display: grid; place-items: center; margin-bottom: 30rpx; border-radius: 30rpx; background: var(--alumni-primary); color: var(--alumni-accent); font-family: "Songti SC", serif; font-size: 38rpx; font-weight: 700; }
.guest-profile__actions { margin-top: 10rpx; }
.profile-hero { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; padding: 30rpx; border-radius: var(--alumni-radius-lg); background: var(--alumni-primary); color: #fff; }
.profile-hero__avatar-button { width: 94rpx; height: 94rpx; flex: none; margin: 0; padding: 0; border-radius: 50%; background: transparent; overflow: hidden; }
.profile-hero__avatar-button::after { border: 0; }
.profile-hero__avatar { width: 94rpx; height: 94rpx; display: grid; place-items: center; flex: none; overflow: hidden; border-radius: 50%; background: var(--alumni-accent); color: var(--alumni-primary); font-family: "Songti SC", serif; font-size: 38rpx; font-weight: 700; }
.profile-hero__avatar--image { display: block; }
.profile-hero__copy { min-width: 0; flex: 1; }
.profile-hero__name { font-family: "Songti SC", serif; font-size: 34rpx; font-weight: 600; }
.profile-hero__meta { margin-top: 7rpx; font-size: 21rpx; opacity: .68; }
.profile-hero__edit { min-height: 58rpx; margin: 0; padding: 8rpx 18rpx; border: 1rpx solid rgba(255,255,255,.25); border-radius: 99rpx; background: rgba(255,255,255,.1); color: #fff; font-size: 22rpx; }
.profile-hero__edit::after { border: 0; }
.basic-card { padding: 30rpx; }
.basic-card__title { font-family: "Songti SC", serif; font-size: 31rpx; font-weight: 600; }
.auth-tools { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12rpx; margin: 22rpx 0 28rpx; }
.auth-tool { min-height: 72rpx; padding: 16rpx 8rpx; font-size: 23rpx; }
.info-list { margin-top: 18rpx; }
.info-row { display: flex; align-items: center; justify-content: space-between; gap: 28rpx; padding: 20rpx 0; border-bottom: 1rpx solid var(--alumni-border); font-size: 25rpx; }
.info-row:last-child { border-bottom: 0; }
.info-row text:first-child { color: var(--alumni-muted); }
.info-row text:last-child { color: var(--alumni-text); text-align: right; word-break: break-all; }
.profile-skeleton__hero { height: 154rpx; margin-bottom: 24rpx; border-radius: var(--alumni-radius-lg); }
.profile-skeleton__line { width: 100%; height: 48rpx; margin-bottom: 24rpx; }
</style>
