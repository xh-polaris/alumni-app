<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { onLoad, onPullDownRefresh, onReachBottom, onShow, onUnload } from "@dcloudio/uni-app";
import ActivityBox from "@/components/ActivityBox.vue";
import ChapterSwitcher from "@/components/ChapterSwitcher.vue";
import Layout from "@/components/Layout.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatePanel from "@/components/StatePanel.vue";
import { getPublicActivities } from "@/api/activity/activity";
import type { PublicActivity } from "@/api/activity/activity-interface";
import { toChapterShortName } from "@/api/chapter/chapter-interface";
import { getProfile } from "@/api/user/user";
import { getErrorMessage } from "@/api/request";
import { STORAGE_KEYS } from "@/constants/storage";
import { useChapters } from "@/composables/useChapters";

const LIMIT = 10;
const activities = shallowRef<PublicActivity[]>([]);
const page = ref(1);
const hasMore = ref(true);
const isInitialLoading = ref(true);
const isLoadingMore = ref(false);
const errorMessage = ref("");
const isInvited = ref(false);
/** "" = 全部分会；未选择时为 null */
const activeChapterId = ref<string | null>(null);
const isSheetVisible = ref(false);
const { chapters, loadChapters, findChapter } = useChapters();

const hasChapterOptions = computed(() => chapters.value.length > 0);
const needsChapterPick = computed(() => activeChapterId.value === null);
const activeChapterLabel = computed(() => {
  if (activeChapterId.value === null) return "未选择分会";
  if (activeChapterId.value === "") return "全部分会";
  const chapter = findChapter(activeChapterId.value);
  return chapter ? toChapterShortName(chapter) : "全部分会";
});

const cacheChapterId = (chapterId: string) => {
  try {
    uni.setStorageSync(STORAGE_KEYS.CHAPTER_ID, chapterId);
  } catch {
    // 缓存失败不影响当前会话使用
  }
};

const readCachedChapterId = (): string | null => {
  try {
    const cached = uni.getStorageSync(STORAGE_KEYS.CHAPTER_ID);
    return typeof cached === "string" ? cached : null;
  } catch {
    return null;
  }
};

const fetchActivities = async (reset = false) => {
  if (needsChapterPick.value) return;
  if ((!hasMore.value && !reset) || isLoadingMore.value) return;
  const targetPage = reset ? 1 : page.value;
  if (reset && activities.value.length === 0) isInitialLoading.value = true;
  if (!reset) isLoadingMore.value = true;
  errorMessage.value = "";

  try {
    const response = await getPublicActivities({
      chapterId: activeChapterId.value || undefined,
      page: targetPage,
      pageSize: LIMIT,
    });
    const next = response.items ?? [];
    activities.value = reset ? next : [...activities.value, ...next];
    hasMore.value = activities.value.length < response.total;
    page.value = targetPage + 1;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "活动加载失败，请稍后重试");
  } finally {
    isInitialLoading.value = false;
    isLoadingMore.value = false;
  }
};

/** 默认分会：登录用户取档案 chapterId，其次取本地缓存，两者都没有则要求先选 */
const resolveDefaultChapter = async (): Promise<string | null> => {
  const session = uni.getStorageSync(STORAGE_KEYS.USER) as { accessToken?: string } | undefined;
  if (session?.accessToken) {
    try {
      const profile = await getProfile();
      if (profile.chapterId) return profile.chapterId;
    } catch {
      // 档案读取失败时退回到本地缓存
    }
  }
  return readCachedChapterId();
};

const initialize = async () => {
  isInitialLoading.value = true;
  await loadChapters();
  const fallback = await resolveDefaultChapter();
  if (fallback === null) {
    // 未登录或档案没有分会：不自动选中，弹出选择面板
    isInitialLoading.value = false;
    isSheetVisible.value = true;
    return;
  }
  activeChapterId.value = fallback;
  await fetchActivities(true);
};

const onChapterChange = (chapterId: string) => {
  activeChapterId.value = chapterId;
  cacheChapterId(chapterId);
  page.value = 1;
  hasMore.value = true;
  activities.value = [];
  isInitialLoading.value = true;
  fetchActivities(true);
};

const chooseChapter = (chapterId: string) => {
  isSheetVisible.value = false;
  onChapterChange(chapterId);
};

const closeSheet = () => {
  isSheetVisible.value = false;
};

const openSheet = () => {
  isSheetVisible.value = true;
};

const openNews = () => uni.switchTab({ url: "/pages/news/index" });

onLoad((options) => {
  if (options?.role === "invited") {
    isInvited.value = true;
    uni.hideTabBar();
  }
  initialize();
});

onShow(() => {
  // 从个人中心切换分会影响默认分会，返回活动页时若仍是「未选择」则重新求解
  if (isInvited.value || activeChapterId.value !== null) return;
  initialize();
});

onPullDownRefresh(async () => {
  await fetchActivities(true);
  uni.stopPullDownRefresh();
});

onReachBottom(() => fetchActivities());
onUnload(() => {
  if (isInvited.value) uni.showTabBar();
});
</script>

<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <PageHeader
          eyebrow="EVENTS"
          title="近期校友活动"
          :description="isInvited ? '请选择受邀活动并进入签到' : '按时间查看活动与报名状态'"
        />

        <ChapterSwitcher
          v-if="hasChapterOptions"
          :chapters="chapters"
          :model-value="activeChapterId ?? ''"
          all-label="全部分会"
          @change="onChapterChange"
        />

        <StatePanel
          v-if="needsChapterPick"
          title="请先选择分会"
          description="选择分会后即可查看该分会发布的活动，也可以浏览全部分会。"
          action-label="选择分会"
          @action="openSheet"
        />

        <template v-else>
          <view v-if="isInitialLoading" class="activity-skeletons">
            <view v-for="item in 3" :key="item" class="activity-skeleton surface-card-padding">
              <view class="skeleton activity-skeleton__cover" />
              <view class="activity-skeleton__body">
                <view class="skeleton activity-skeleton__tag" />
                <view class="skeleton activity-skeleton__title" />
                <view class="skeleton activity-skeleton__meta" />
              </view>
            </view>
          </view>

          <StatePanel
            v-else-if="errorMessage && !activities.length"
            tone="error"
            title="活动加载失败"
            :description="errorMessage"
            action-label="重新加载"
            @action="fetchActivities(true)"
          />
          <StatePanel
            v-else-if="!activities.length"
            title="暂无活动"
            description="新的校友活动发布后会显示在这里"
          />
          <view v-else>
            <ActivityBox v-for="activity in activities" :key="activity.id" :activity="activity" />
            <view v-if="errorMessage" class="list-error">
              <text>{{ errorMessage }}</text>
              <button class="text-button" @click="fetchActivities()">重试</button>
            </view>
            <view v-else class="load-hint">
              <view v-if="isLoadingMore" class="load-hint__loading"><view class="loading-dot" />正在加载</view>
              <text v-else-if="!hasMore">已显示全部活动</text>
            </view>
          </view>
        </template>
      </view>
    </view>

    <Transition name="sheet">
      <view v-if="isSheetVisible" class="chapter-sheet">
        <view class="chapter-sheet__backdrop" @click="closeSheet" />
        <view class="chapter-sheet__content">
          <view class="chapter-sheet__handle" />
          <view class="section-title">选择分会</view>
          <view class="section-subtitle">当前选择：{{ activeChapterLabel }}</view>
          <view
            v-for="chapter in chapters"
            :key="chapter.id"
            class="chapter-sheet__option"
            hover-class="chapter-sheet__option--pressed"
            @click="chooseChapter(chapter.id)"
          >
            <text class="chapter-sheet__option-name">{{ toChapterShortName(chapter) }}</text>
            <text class="chapter-sheet__option-meta">{{ chapter.name }}</text>
          </view>
          <view
            class="chapter-sheet__option chapter-sheet__option--all"
            hover-class="chapter-sheet__option--pressed"
            @click="chooseChapter('')"
          >
            <text class="chapter-sheet__option-name">全部分会</text>
            <text class="chapter-sheet__option-meta">浏览所有分会活动</text>
          </view>
          <view class="chapter-sheet__footer">
            <button class="text-button" @click="openNews">先看看资讯</button>
            <button class="secondary-button" @click="closeSheet">暂不选择</button>
          </view>
        </view>
      </view>
    </Transition>
  </Layout>
</template>

<style scoped>
.activity-skeleton { overflow: hidden; }
.activity-skeleton__cover { height: 320rpx; border-radius: 0; }
.activity-skeleton__body { padding: 28rpx; }
.activity-skeleton__tag { width: 120rpx; height: 38rpx; }
.activity-skeleton__title { width: 76%; height: 42rpx; margin-top: 22rpx; }
.activity-skeleton__meta { width: 55%; height: 28rpx; margin-top: 18rpx; }
.load-hint { min-height: 68rpx; display: flex; align-items: center; justify-content: center; color: var(--alumni-muted); font-size: 22rpx; }
.load-hint__loading { display: flex; align-items: center; gap: 12rpx; }
.loading-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: var(--alumni-accent); animation: loading-pulse 1s ease-in-out infinite alternate; }
.list-error { display: flex; align-items: center; justify-content: center; gap: 8rpx; color: var(--alumni-danger); font-size: 22rpx; }
.list-error .text-button { min-height: 58rpx; padding: 8rpx 14rpx; font-size: 22rpx; }
.chapter-sheet { position: fixed; z-index: 100; inset: 0; display: flex; align-items: flex-end; justify-content: center; }
.chapter-sheet__backdrop { position: absolute; inset: 0; background: rgba(15, 48, 38, 0.42); }
.chapter-sheet__content { position: relative; z-index: 1; width: 100%; max-width: 720rpx; max-height: 86vh; overflow-y: auto; padding: 18rpx 32rpx calc(34rpx + env(safe-area-inset-bottom)); border-radius: 38rpx 38rpx 0 0; background: #fff; }
.chapter-sheet__handle { width: 72rpx; height: 8rpx; margin: 0 auto 28rpx; border-radius: 99rpx; background: var(--alumni-border); }
.chapter-sheet__option { display: flex; flex-direction: column; gap: 6rpx; min-height: 108rpx; box-sizing: border-box; justify-content: center; margin-bottom: 16rpx; padding: 24rpx 26rpx; border: 1rpx solid var(--alumni-border); border-radius: var(--alumni-radius-md); background: var(--alumni-surface); transition: transform 180ms ease, background-color 180ms ease; }
.chapter-sheet__option--pressed { transform: scale(0.985); background: var(--alumni-primary-soft); }
.chapter-sheet__option--all { border-style: dashed; }
.chapter-sheet__option-name { color: var(--alumni-text); font-family: "Songti SC", serif; font-size: 30rpx; font-weight: 600; }
.chapter-sheet__option-meta { color: var(--alumni-muted); font-size: 22rpx; }
.chapter-sheet__footer { display: flex; gap: 16rpx; margin-top: 12rpx; }
.chapter-sheet__footer .text-button,
.chapter-sheet__footer .secondary-button { min-width: 0; flex: 1; }
.sheet-enter-active, .sheet-leave-active { transition: opacity 220ms ease; }
.sheet-enter-active .chapter-sheet__content, .sheet-leave-active .chapter-sheet__content { transition: transform 220ms ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .chapter-sheet__content, .sheet-leave-to .chapter-sheet__content { transform: translateY(40rpx); }
@keyframes loading-pulse { from { opacity: 0.35; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .loading-dot { animation: none; } .chapter-sheet__option { transition: none; } .sheet-enter-active, .sheet-leave-active, .sheet-enter-active .chapter-sheet__content, .sheet-leave-active .chapter-sheet__content { transition: none; } }
</style>
