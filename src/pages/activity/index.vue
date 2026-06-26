<script setup lang="ts">
import { ref, shallowRef } from "vue";
import { onLoad, onPullDownRefresh, onReachBottom, onUnload } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatePanel from "@/components/StatePanel.vue";
import ActivityBox from "@/components/ActivityBox.vue";
import { getActivityList } from "@/api/activity/activity";
import { getErrorMessage } from "@/api/request";
import type { Activity } from "@/api/activity/activity-interface";

const LIMIT = 10;
const activities = shallowRef<Activity[]>([]);
const page = ref(1);
const hasMore = ref(true);
const isInitialLoading = ref(true);
const isLoadingMore = ref(false);
const errorMessage = ref("");
const isInvited = ref(false);

const fetchActivities = async (reset = false) => {
  if ((!hasMore.value && !reset) || isLoadingMore.value) return;
  const targetPage = reset ? 1 : page.value;
  if (reset && activities.value.length === 0) isInitialLoading.value = true;
  if (!reset) isLoadingMore.value = true;
  errorMessage.value = "";

  try {
    const response = await getActivityList({ paginationOptions: { page: targetPage, limit: LIMIT } });
    const next = response.activities ?? [];
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

onLoad((options) => {
  if (options?.role === "invited") {
    isInvited.value = true;
    uni.hideTabBar();
  }
  fetchActivities(true);
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
      </view>
    </view>
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
@keyframes loading-pulse { from { opacity: 0.35; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .loading-dot { animation: none; } }
</style>
