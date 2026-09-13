<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import PageHeader from "@/components/PageHeader.vue";
import { getErrorMessage } from "@/api/request";
import { getProfile, updateProfile } from "@/api/user/user";
import type { MemberRole, UserProfile } from "@/api/user/user-interface";
import { toChapterShortName } from "@/api/chapter/chapter-interface";
import { useChapters } from "@/composables/useChapters";

/**
 * 旧客户端注册用户的补全页。
 *
 * 一次 `PATCH /user/profile` 同时写入姓名、所属分会、毕业年份与出生日期；
 * 服务端在用户仍为待认证时会重新执行名册匹配，命中即自动成为校友，
 * 未命中则保持待认证并交由分会管理员人工核验。
 */
const graduationYear = ref(0);
const birthDate = ref("");
const chapterId = ref("");
const fullName = ref("");
const isSubmitting = ref(false);
const hasTriedSubmit = ref(false);
const isLoading = ref(true);
const loadError = ref("");
const resultProfile = ref<UserProfile | null>(null);
const { chapters, loadChapters } = useChapters();

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1949 + 1 }, (_, index) => String(currentYear - index));
const chapterNames = computed(() => chapters.value.map((item) => toChapterShortName(item)));
const chapterIndex = computed(() => {
  const index = chapters.value.findIndex((item) => item.id === chapterId.value);
  return index >= 0 ? index : 0;
});
const chapterDisplay = computed(() => chapters.value.find((item) => item.id === chapterId.value)?.name ?? "");
const canSubmit = computed(() =>
  Boolean(fullName.value.trim()) &&
  graduationYear.value > 0 &&
  Boolean(birthDate.value) &&
  Boolean(chapterId.value),
);
const resultRole = computed<MemberRole | "">(() => resultProfile.value?.memberRole ?? "");
const resultHeadline = computed(() =>
  resultRole.value === "pending" ? "资料已提交，等待人工核验" : "认证成功，欢迎回家",
);

const loadCurrentProfile = async () => {
  isLoading.value = true;
  loadError.value = "";
  try {
    const profile = await getProfile();
    fullName.value = profile.name || "";
    graduationYear.value = profile.graduationYear || 0;
    birthDate.value = profile.birthDate || "";
    chapterId.value = profile.chapterId || "";
  } catch (error) {
    loadError.value = getErrorMessage(error, "资料加载失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

onLoad(async () => {
  await loadChapters();
  await loadCurrentProfile();
});

const onGraduationYearChange = (event: { detail: { value: string | number } }) => {
  graduationYear.value = Number(yearOptions[Number(event.detail.value)] ?? 0);
};
const onBirthDateChange = (event: { detail: { value: string } }) => {
  birthDate.value = event.detail.value ?? "";
};
const onChapterChange = (event: { detail: { value: string | number } }) => {
  chapterId.value = chapters.value[Number(event.detail.value)]?.id ?? "";
};

const submit = async () => {
  hasTriedSubmit.value = true;
  if (!canSubmit.value || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    // 四项一次提交：服务端据此重新核验名册，命中即自动认证。
    resultProfile.value = await updateProfile({
      name: fullName.value.trim(),
      chapterId: chapterId.value,
      graduationYear: graduationYear.value,
      birthDate: birthDate.value,
    });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "提交失败，请稍后重试"), icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};

const finish = () => {
  uni.switchTab({ url: "/pages/news/index" });
};
</script>

<template>
  <Layout tone="warm">
    <view class="page-shell complete-page">
      <view class="page-shell__content">
        <PageHeader
          eyebrow="COMPLETE PROFILE"
          title="补全认证资料"
          description="你的账号缺少分会与认证资料，补充后即可报名活动"
        />

        <view v-if="isLoading" class="surface-card">
          <view class="skeleton complete-skeleton" />
          <view class="skeleton complete-skeleton" />
        </view>

        <view v-else-if="loadError" class="surface-card">
          <view class="section-title">无法加载资料</view>
          <view class="section-subtitle">{{ loadError }}</view>
          <button class="secondary-button" @click="loadCurrentProfile">重新加载</button>
        </view>

        <template v-else>
          <view v-if="resultProfile" class="surface-card result-card">
            <view class="result-card__headline">{{ resultHeadline }}</view>
            <view class="result-card__description">
              {{
                resultRole === "pending"
                  ? "分会管理员会尽快核验你的资料，认证通过后即可报名活动。"
                  : "资料与校友名册匹配成功，你现在可以报名活动了。"
              }}
            </view>
            <button class="primary-button" @click="finish">返回资讯</button>
          </view>

          <view v-else class="surface-card complete-card">
            <view class="form-row">
              <text class="form-label">姓名</text>
              <input v-model="fullName" class="input-field" placeholder="请输入真实姓名" />
            </view>
            <view class="form-row">
              <text class="form-label">毕业年份</text>
              <picker mode="selector" :range="yearOptions" :value="Math.max(0, yearOptions.indexOf(String(graduationYear)))" @change="onGraduationYearChange">
                <view class="picker-field" :class="{ 'picker-field--placeholder': !graduationYear }">
                  {{ graduationYear || "请选择毕业年份" }}
                </view>
              </picker>
            </view>
            <view class="form-row">
              <text class="form-label">身份证出生日期</text>
              <picker mode="date" :value="birthDate" @change="onBirthDateChange">
                <view class="picker-field" :class="{ 'picker-field--placeholder': !birthDate }">
                  {{ birthDate || "请选择出生日期" }}
                </view>
              </picker>
              <text class="field-hint">用于与校友名册比对，只保存出生日期，不保存证件号码。</text>
            </view>
            <view class="form-row">
              <text class="form-label">所属分会</text>
              <picker mode="selector" :range="chapterNames" :value="chapterIndex" @change="onChapterChange">
                <view class="picker-field" :class="{ 'picker-field--placeholder': !chapterId }">
                  {{ chapterDisplay || "请选择所属分会" }}
                </view>
              </picker>
            </view>
            <text v-if="hasTriedSubmit && !canSubmit" class="field-error">请完整填写姓名、毕业年份、出生日期与分会</text>
            <button class="primary-button complete-submit" :disabled="isSubmitting" @click="submit">
              {{ isSubmitting ? "提交中…" : "提交并核验身份" }}
            </button>
          </view>
        </template>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.complete-page { padding-top: 34rpx; }
.complete-card { padding: 34rpx; }
.complete-skeleton { width: 100%; height: 88rpx; margin-bottom: 24rpx; }
.field-hint { color: var(--alumni-muted); font-size: 21rpx; line-height: 1.5; }
.complete-submit { width: 100%; margin-top: 8rpx; }
.result-card { padding: 40rpx 34rpx; text-align: center; }
.result-card__headline { color: var(--alumni-text); font-family: "Songti SC", "STSong", serif; font-size: 38rpx; font-weight: 600; }
.result-card__description { margin: 14rpx 0 30rpx; color: var(--alumni-muted); font-size: 24rpx; line-height: 1.65; }
.result-card .primary-button { width: 100%; }
</style>
