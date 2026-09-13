<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from "vue";
import { onShow } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import PageHeader from "@/components/PageHeader.vue";
import ChapterContactCard from "@/components/ChapterContactCard.vue";
import StatePanel from "@/components/StatePanel.vue";
import EducationExperience from "@/pages/mine/EducationExperience.vue";
import EmploymentExperience from "@/pages/mine/EmploymentExperience.vue";
import { updateUserInfo, replaceEducations, replaceEmployments, updateProfile, getProfile, exchangeWxPhone } from "@/api/user/user";
import { ApiError, getErrorMessage } from "@/api/request";
import { pickAndUploadImage, uploadImage } from "@/api/upload/upload";
import type { UploadedImage } from "@/api/upload/upload";
import type { Education, Employment, MemberRole, UpdateInfo, UserProfile } from "@/api/user/user-interface";
import type { Chapter } from "@/api/chapter/chapter-interface";
import { dateToTimestamp, timestampToTime } from "@/utils/time";
import { STORAGE_KEYS } from "@/constants/storage";
import { useChapters } from "@/composables/useChapters";

interface ProfileDraft {
  avatar: string;
  name: string;
  gender: number;
  birthday: number;
  phone: string;
  hometown: string;
}

const genders = ["未选择", "男", "女"];
const IDENTITY_BADGES: Record<MemberRole, { label: string; tone: string }> = {
  pending: { label: "待认证", tone: "pending" },
  alumni: { label: "校友", tone: "alumni" },
  guest: { label: "嘉宾", tone: "guest" },
};

const profile = reactive<ProfileDraft>({ avatar: "", name: "", gender: 0, birthday: 0, phone: "", hometown: "" });
const profileBackup = shallowRef<ProfileDraft | null>(null);
const educationList = ref<Education[]>([]);
const employmentList = ref<Employment[]>([]);
const memberRole = ref<MemberRole | null>(null);
const chapterId = ref("");
const chapterName = ref("");
const profileComplete = ref(true);
const isLoading = ref(true);
const loadError = ref("");
const isEditingInfo = ref(false);
const savingInfo = ref(false);
const isAvatarUploading = ref(false);
const isAuthed = ref(false);
const { chapters, loadChapters } = useChapters();

const genderIndex = computed(() => Math.max(0, genders[profile.gender] ? profile.gender : 0));
const birthdayDisplay = computed(() => profile.birthday ? timestampToTime(profile.birthday, "yyyy-MM-DD") : "");
const avatarInitial = computed(() => profile.name.trim().slice(0, 1) || "友");
const identityBadge = computed(() => (memberRole.value ? IDENTITY_BADGES[memberRole.value] : null));
const chapterLabel = computed(() => chapterName.value || "未设置");

/** 分会信息弹窗：展示本分会联络人与二维码，并在其中提供修改分会的入口 */
const isChapterDialogVisible = ref(false);
const currentChapter = computed(
  () => chapters.value.find((item) => item.id === chapterId.value) ?? null,
);
/** 待认证时在「分会信息」行上给一个提示，让用户知道可以点进去找联络人 */
const chapterRowHint = computed(() => {
  if (!chapterId.value) return "未设置 · 查看分会信息";
  if (memberRole.value === "pending") return "认证中 · 查看联络人";
  return "查看";
});

const openChapterDialog = () => {
  if (!chapters.value.length) {
    uni.showToast({ title: "分会信息加载中，请稍后重试", icon: "none" });
    void loadChapters();
    return;
  }
  isChapterDialogVisible.value = true;
};
const closeChapterDialog = () => {
  isChapterDialogVisible.value = false;
};
const completeness = computed(() => {
  const completed = [profile.avatar, profile.name, profile.gender, profile.birthday, profile.phone, profile.hometown].filter(Boolean).length;
  return Math.round((completed / 6) * 100);
});

const assignProfile = (data: UserProfile) => {
  Object.assign(profile, {
    avatar: data.avatar || "",
    name: data.name || "",
    gender: data.gender || 0,
    birthday: data.birthday || 0,
    phone: data.phone || "",
    hometown: data.hometown || "",
  });
  // 服务端已把旧的家乡/在沪教育经历合并进 educations，这里不再自行拼接
  educationList.value = (data.educations ?? []).map((item) => ({ ...item }));
  employmentList.value = (data.employments ?? []).map((item) => ({ ...item }));
  memberRole.value = data.memberRole ?? null;
  chapterId.value = data.chapterId || "";
  chapterName.value = data.chapterName || "";
  profileComplete.value = data.profileComplete !== false;
};

const showGuestProfile = () => {
  uni.removeStorageSync(STORAGE_KEYS.USER);
  isAuthed.value = false;
  loadError.value = "";
  isEditingInfo.value = false;
  profileBackup.value = null;
  memberRole.value = null;
  chapterId.value = "";
  chapterName.value = "";
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
    // 统一走新档案接口（契约 2.3）：一次拿到基础资料 + 身份 + 分会 + 教育/工作经历。
    // 不再调用旧 /user/info —— 它把未认证编码成 HTTP 200 + code 1000，
    // 曾导致登录用户被误判为未登录并清掉会话。
    assignProfile(await getProfile());
    await loadChapters();
  } catch (error) {
    // 只有明确的 401（会话真的失效）才回到未登录态；其余错误保留登录态并可重试。
    if (error instanceof ApiError && error.statusCode === 401) {
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
const openCompleteProfile = () => uni.navigateTo({ url: "/pages/mine/complete-profile" });
const logout = () => {
  uni.showModal({
    title: "退出登录",
    content: "确定退出当前账号吗？",
    success: (result) => {
      if (!result.confirm) return;
      uni.removeStorageSync(STORAGE_KEYS.USER);
      uni.removeStorageSync(STORAGE_KEYS.DEV_MODE);
      showGuestProfile();
      uni.showToast({ title: "已退出登录", icon: "success" });
    },
  });
};

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
/**
 * 头像「上传 → 落库」的唯一实现。
 *
 * 关键修复：`open-type="chooseAvatar"` 与 `uni.chooseImage` 给到的都是**本地临时路径**
 * （小程序 `wxfile://`、H5 `blob:`），只有当前设备当前会话能打开。
 * 旧实现把它直接写进 `profile.avatar` 并保存，于是别人的客户端永远拿到一个无法解析的路径。
 * 现在一律先 `POST /upload` 换成服务端 URL，只有上传成功才写入 `profile.avatar`。
 */
const uploadAvatar = async (source: () => Promise<UploadedImage>) => {
  if (isAvatarUploading.value) return;
  const previousAvatar = profile.avatar;
  isAvatarUploading.value = true;
  uni.showToast({ title: "头像上传中", icon: "none", duration: 1500 });
  try {
    const uploaded = await source();
    profile.avatar = uploaded.url;
    if (!isEditingInfo.value) startEdit();
    // 头像只有落到服务端才对他人可见，所以上传成功后立即保存，不要求用户再点「保存」。
    // 基础信息仍沿用既有的 `POST /user/update_info`，不改变保存端点。
    await updateUserInfo({ avatar: uploaded.url });
    // 先关掉「头像上传中」再提示结果，避免两个 toast 叠在一起
    uni.hideToast();
    uni.showToast({ title: "头像已更新", icon: "success" });
  } catch (error) {
    // 失败时保持原头像不变，绝不把临时路径留在页面上
    profile.avatar = previousAvatar;
    uni.hideToast();
    uni.showToast({ title: getErrorMessage(error, "头像上传失败，请重试"), icon: "none" });
  } finally {
    isAvatarUploading.value = false;
  }
};

/** 微信原生头像按钮：`avatarUrl` 是临时路径，交给 `uploadImage` 换成服务端 URL */
const onChooseAvatar = (event: { detail?: { avatarUrl?: string } }) => {
  const avatarUrl = event.detail?.avatarUrl;
  if (!avatarUrl) return;
  void uploadAvatar(() => uploadImage(avatarUrl, "avatar"));
};

/** H5 入口：`uni.chooseImage` 选图后上传（原实现完全没有头像入口） */
const onChangeAvatar = () => {
  void uploadAvatar(() => pickAndUploadImage("avatar"));
};
const onPhoneNumberAuthorized = async (event: { detail?: { errMsg?: string; phoneNumber?: string; code?: string } }) => {
  const detail = event.detail;
  if (!detail?.errMsg?.includes("ok")) {
    uni.showToast({ title: "未完成手机号授权", icon: "none" });
    return;
  }
  // 新版微信返回 code，需要服务端换取手机号
  if (detail.code) {
    try {
      const resp = await exchangeWxPhone(detail.code);
      profile.phone = resp.phoneNumber;
      if (!isEditingInfo.value) startEdit();
      uni.showToast({ title: "手机号已获取", icon: "success" });
      return;
    } catch {
      uni.showToast({ title: "手机号换取失败，请手动填写", icon: "none" });
      return;
    }
  }
  // 兼容旧版微信直接返回 phoneNumber
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
  const payload: UpdateInfo = { ...profile, name: profile.name.trim(), phone: profile.phone.trim(), hometown: profile.hometown.trim() };
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

/** 分会切换：先确认再提交，成功后立即刷新页面上的分会与活动页默认分会 */
/** 从分会信息弹窗里发起：先用系统选择器选分会，再走同一条确认 + 更新流程 */
const onChangeChapterFromDialog = () => {
  const list = chapters.value;
  if (!list.length) return;
  uni.showActionSheet({
    itemList: list.map((item) => item.name),
    success: ({ tapIndex }) => {
      const picked = list[tapIndex];
      if (picked) changeChapter(picked);
    },
  });
};

const changeChapter = (picked: Chapter) => {
  if (!picked || picked.id === chapterId.value) return;
  uni.showModal({
    title: "修改所属分会",
    content: "修改后将由新分会管理员维护资料",
    confirmText: "确认修改",
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        const updated = await updateProfile({ chapterId: picked.id });
        chapterId.value = updated.chapterId || picked.id;
        chapterName.value = updated.chapterName || picked.name;
        memberRole.value = updated.memberRole || memberRole.value;
        try {
          uni.setStorageSync(STORAGE_KEYS.CHAPTER_ID, chapterId.value);
        } catch {
          // 缓存失败不影响当前页面
        }
        uni.showToast({ title: "分会已更新", icon: "success" });
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, "分会修改失败，请稍后重试"), icon: "none" });
      }
    },
  });
};

/**
 * `PUT /user/educations` 是整体替换：必须把要保留的记录（含旧的中小学记录）一起提交，
 * 否则服务端会认为用户删除了它们。新增记录只能选 SUPPORTED_EDUCATION_PHASES，
 * 旧记录原样回传时服务端会放行；用户显式删除某条旧记录时不再提交它，即完成清理。
 */
const saveEducation = async (list: Education[]) => {
  try {
    const updated = await replaceEducations(list);
    educationList.value = (updated.educations ?? list).map((item) => ({ ...item }));
    uni.showToast({ title: "教育经历已保存", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "教育经历保存失败"), icon: "none" });
  }
};

const saveEmployment = async (list: Employment[]) => {
  try {
    const updated = await replaceEmployments(list);
    employmentList.value = (updated.employments ?? list).map((item) => ({ ...item }));
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
            <!--
              编辑态才让头像可点：
              - 小程序用 open-type="chooseAvatar"（原生选择器体验更好）
              - H5 的 open-type 是空操作，这里渲染成普通视图，避免出现「点了没反应」的假入口；
                改头像走下面编辑态里的「更换头像」按钮（uni.chooseImage）
            -->
            <!-- #ifdef MP-WEIXIN -->
            <button v-if="isEditingInfo" class="profile-hero__avatar-button" open-type="chooseAvatar" :disabled="isAvatarUploading" @chooseavatar="onChooseAvatar">
              <image v-if="profile.avatar" class="profile-hero__avatar profile-hero__avatar--image" :class="{ 'profile-hero__avatar--uploading': isAvatarUploading }" :src="profile.avatar" mode="aspectFill" />
              <view v-else class="profile-hero__avatar profile-hero__avatar--initial" :class="{ 'profile-hero__avatar--uploading': isAvatarUploading }">{{ avatarInitial }}</view>
            </button>
            <image v-else-if="profile.avatar" class="profile-hero__avatar profile-hero__avatar--image" :class="{ 'profile-hero__avatar--uploading': isAvatarUploading }" :src="profile.avatar" mode="aspectFill" />
            <view v-else class="profile-hero__avatar profile-hero__avatar--initial" :class="{ 'profile-hero__avatar--uploading': isAvatarUploading }">{{ avatarInitial }}</view>
            <!-- #endif -->
            <!-- #ifndef MP-WEIXIN -->
            <image v-if="profile.avatar" class="profile-hero__avatar profile-hero__avatar--image" :class="{ 'profile-hero__avatar--uploading': isAvatarUploading }" :src="profile.avatar" mode="aspectFill" />
            <view v-else class="profile-hero__avatar profile-hero__avatar--initial" :class="{ 'profile-hero__avatar--uploading': isAvatarUploading }">{{ avatarInitial }}</view>
            <!-- #endif -->
            <view class="profile-hero__copy">
              <view class="profile-hero__name-row">
                <view class="profile-hero__name">{{ profile.name || "未填写姓名" }}</view>
                <view v-if="identityBadge" class="identity-badge" :class="`identity-badge--${identityBadge.tone}`">{{ identityBadge.label }}</view>
              </view>
              <view class="profile-hero__meta">资料完整度 {{ completeness }}%</view>
            </view>
            <button v-if="!isEditingInfo" class="profile-hero__edit" @click="startEdit">编辑</button>
          </view>

          <view v-if="!profileComplete" class="completion-notice">
            <view class="completion-notice__copy">
              <view class="completion-notice__title">认证资料待补全</view>
              <view class="completion-notice__text">补充分会、毕业年份与出生日期后才能报名活动。</view>
            </view>
            <button class="secondary-button completion-notice__action" @click="openCompleteProfile">去补全</button>
          </view>

          <view class="surface-card basic-card">
            <view class="basic-card__header"><view class="basic-card__title">基础信息</view></view>
            <view v-if="!isEditingInfo" class="info-list">
              <view class="info-row"><text>姓名</text><text>{{ profile.name || "未填写" }}</text></view>
              <view class="info-row"><text>身份</text><text>{{ identityBadge ? identityBadge.label : "未获取" }}</text></view>
              <view class="info-row"><text>性别</text><text>{{ genders[genderIndex] }}</text></view>
              <view class="info-row"><text>生日</text><text>{{ birthdayDisplay || "未填写" }}</text></view>
              <view class="info-row"><text>手机号</text><text>{{ profile.phone || "未填写" }}</text></view>
              <view class="info-row"><text>家乡</text><text>{{ profile.hometown || "未填写" }}</text></view>
              <view class="info-row info-row--action" @click="openChapterDialog">
                <text>分会信息</text>
                <view class="info-row__value">
                  <text>{{ chapterLabel }}</text>
                  <text class="info-row__hint">{{ chapterRowHint }}</text>
                </view>
              </view>
            </view>
            <view v-else>
              <!-- #ifdef MP-WEIXIN -->
              <!-- 小程序保留 open-type="chooseAvatar"：原生头像选择器体验更好，拿到临时路径后统一走上传 -->
              <view class="auth-tools">
                <button class="secondary-button auth-tool" open-type="chooseAvatar" :disabled="isAvatarUploading" @chooseavatar="onChooseAvatar">获取头像</button>
                <button class="secondary-button auth-tool" open-type="getPhoneNumber" @getphonenumber="onPhoneNumberAuthorized">授权手机号</button>
              </view>
              <!-- #endif -->
              <!-- #ifndef MP-WEIXIN -->
              <!-- H5 没有 chooseAvatar，统一用 uni.chooseImage + 上传（原实现完全没有头像入口） -->
              <view class="auth-tools auth-tools--single">
                <button class="secondary-button auth-tool" :disabled="isAvatarUploading" @click="onChangeAvatar">更换头像</button>
              </view>
              <!-- #endif -->
              <view class="form-row"><text class="form-label">姓名</text><input v-model="profile.name" class="input-field" /></view>
              <view class="form-row"><text class="form-label">性别</text><picker mode="selector" :range="genders" :value="genderIndex" @change="onGenderChange"><view class="picker-field">{{ genders[genderIndex] }}</view></picker></view>
              <view class="form-row"><text class="form-label">生日</text><picker mode="date" :value="birthdayDisplay" @change="onBirthdayPicked"><view class="picker-field">{{ birthdayDisplay || "请选择日期" }}</view></picker></view>
              <view class="form-row"><text class="form-label">手机号</text><input v-model="profile.phone" class="input-field" type="number" maxlength="11" /></view>
              <view class="form-row"><text class="form-label">家乡</text><input v-model="profile.hometown" class="input-field" placeholder="例：宁波北仑" /></view>
              <view class="button-row"><button class="secondary-button" :disabled="savingInfo" @click="cancelEdit">取消</button><button class="primary-button" :disabled="savingInfo" @click="saveInfo">{{ savingInfo ? "保存中…" : "保存" }}</button></view>
            </view>
          </view>

          <EducationExperience v-model="educationList" @save="saveEducation" />
          <EmploymentExperience v-model="employmentList" @save="saveEmployment" />
          <button class="logout-button" @click="logout">退出登录</button>
        </template>
      </view>
    </view>

    <!-- 分会信息弹窗：展示本分会联络人与二维码，并提供修改分会的入口 -->
    <Transition name="modal">
      <view v-if="isChapterDialogVisible" class="chapter-dialog">
        <view class="chapter-dialog__backdrop" @click="closeChapterDialog" />
        <view class="chapter-dialog__content">
          <view class="chapter-dialog__header">
            <view class="chapter-dialog__title">分会信息</view>
            <view class="chapter-dialog__close" @click="closeChapterDialog">关闭</view>
          </view>
          <ChapterContactCard :chapter="currentChapter" title="联络人信息" />
          <button class="secondary-button chapter-dialog__change" @click="onChangeChapterFromDialog">
            修改所属分会
          </button>
          <view class="chapter-dialog__tip">修改后将由新分会管理员维护资料</view>
        </view>
      </view>
    </Transition>
  </Layout>
</template>

<style scoped>
.guest-profile { min-height: 58vh; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; padding: 72rpx 34rpx; border-radius: var(--alumni-radius-lg); background: var(--alumni-surface); box-shadow: var(--alumni-shadow); }
.guest-profile__actions { margin-top: 10rpx; }
.profile-hero { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; padding: 30rpx; border-radius: var(--alumni-radius-lg); background: var(--alumni-primary); color: #fff; }
.profile-hero__avatar-button { width: 94rpx; height: 94rpx; flex: none; margin: 0; padding: 0; border-radius: 50%; background: transparent; overflow: hidden; }
.profile-hero__avatar-button::after { border: 0; }
.profile-hero__avatar { width: 94rpx; height: 94rpx; display: grid; place-items: center; flex: none; overflow: hidden; border-radius: 50%; background: var(--alumni-accent); color: var(--alumni-primary); font-family: "Songti SC", serif; font-size: 38rpx; font-weight: 700; }
.profile-hero__avatar--image { display: block; }
/* 上传中的视觉反馈：半透明 + 禁用 pointer，与 toast「头像上传中」同时出现 */
.profile-hero__avatar--uploading { opacity: .45; pointer-events: none; }
.profile-hero__copy { min-width: 0; flex: 1; }
.profile-hero__name-row { display: flex; align-items: center; gap: 14rpx; }
.profile-hero__name { min-width: 0; font-family: "Songti SC", serif; font-size: 34rpx; font-weight: 600; }
.profile-hero__meta { margin-top: 7rpx; font-size: 21rpx; opacity: .68; }
.profile-hero__edit { min-height: 58rpx; margin: 0; padding: 8rpx 18rpx; border: 1rpx solid rgba(255,255,255,.25); border-radius: 99rpx; background: rgba(255,255,255,.1); color: #fff; font-size: 22rpx; }
.profile-hero__edit::after { border: 0; }
.identity-badge { flex: none; display: inline-flex; align-items: center; padding: 7rpx 16rpx; border-radius: 999rpx; font-size: 21rpx; line-height: 1.3; }
.identity-badge--pending { background: var(--alumni-paper); color: #6c6455; }
.identity-badge--alumni { background: var(--alumni-accent); color: #16311f; font-weight: 600; }
.identity-badge--guest { background: rgba(255, 255, 255, 0.16); color: rgba(255, 255, 255, 0.82); }
.completion-notice { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 24rpx; padding: 24rpx 26rpx; border-radius: var(--alumni-radius-lg); background: var(--alumni-paper); }
.completion-notice__title { color: var(--alumni-text); font-size: 26rpx; font-weight: 600; }
.completion-notice__text { margin-top: 6rpx; color: var(--alumni-muted); font-size: 21rpx; line-height: 1.5; }
.completion-notice__action { min-width: 150rpx; min-height: 68rpx; flex: none; padding: 12rpx 20rpx; font-size: 23rpx; }
.chapter-dialog { position: fixed; z-index: 200; inset: 0; display: flex; align-items: flex-end; justify-content: center; padding: 40rpx 32rpx calc(40rpx + env(safe-area-inset-bottom)); }
.chapter-dialog__backdrop { position: absolute; inset: 0; background: rgba(15, 48, 38, 0.48); }
.chapter-dialog__content { position: relative; z-index: 1; width: 100%; max-width: 660rpx; max-height: 84vh; overflow-y: auto; padding: 32rpx 28rpx; border-radius: var(--alumni-radius-lg); background: var(--alumni-surface-muted); box-shadow: 0 30rpx 70rpx rgba(15, 48, 38, 0.24); }
.chapter-dialog__header { display: flex; align-items: baseline; justify-content: space-between; padding: 0 4rpx 20rpx; }
.chapter-dialog__title { font-family: "Songti SC", "STSong", serif; font-size: 34rpx; font-weight: 600; }
.chapter-dialog__close { color: var(--alumni-muted); font-size: 24rpx; }
.chapter-dialog__change { width: 100%; margin-top: 24rpx; }
.chapter-dialog__tip { margin-top: 14rpx; color: var(--alumni-muted); font-size: 21rpx; line-height: 1.55; text-align: center; }
.basic-card { padding: 30rpx; }
.basic-card__header { display: flex; align-items: center; justify-content: space-between; }
.basic-card__title { font-family: "Songti SC", serif; font-size: 31rpx; font-weight: 600; }
.auth-tools { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12rpx; margin: 22rpx 0 28rpx; }
.auth-tools--single { grid-template-columns: minmax(0, 1fr); }
.auth-tool { min-height: 72rpx; padding: 16rpx 8rpx; font-size: 23rpx; }
.info-list { margin-top: 18rpx; }
.info-row { display: flex; align-items: center; justify-content: space-between; gap: 28rpx; padding: 20rpx 0; border-bottom: 1rpx solid var(--alumni-border); font-size: 25rpx; }
.info-row:last-child { border-bottom: 0; }
.info-row text:first-child { color: var(--alumni-muted); }
.info-row text:last-child { color: var(--alumni-text); text-align: right; word-break: break-all; }
.info-row--action { padding-right: 0; }
.info-row__picker { min-width: 0; max-width: 58%; }
.info-row__value { display: flex; align-items: center; justify-content: flex-end; gap: 12rpx; }
.info-row__hint { color: var(--alumni-primary); font-size: 22rpx; }
.profile-skeleton__hero { height: 154rpx; margin-bottom: 24rpx; border-radius: var(--alumni-radius-lg); }
.profile-skeleton__line { width: 100%; height: 48rpx; margin-bottom: 24rpx; }
.logout-button { width: 100%; margin: 26rpx 0 0; min-height: 76rpx; border-radius: 99rpx; background: #fff; color: #B42318; font-size: 26rpx; border: 1rpx solid rgba(180,35,24,.18); }
.logout-button::after { border: 0; }
</style>
