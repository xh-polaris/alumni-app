<script setup lang="ts">
import { onMounted, ref } from "vue";
import { onLoad, onPullDownRefresh, onReachBottom, onUnload } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import ActivityBox from "@/components/ActivityBox.vue";
import { getActivityList } from "@/api/activity/activity";
import type { Activity } from "@/api/activity/activity-interface";

const activities = ref<Activity[]>([]);
const LIMIT = 10;
const page = ref(1);
const hasMore = ref(true);
const isInitialLoading = ref(true);
const isLoadingMore = ref(false);
const errorMessage = ref("");
const isInvited = ref(false);

const fetchActivities = async (reset = false) => {
  if (reset) {
    page.value = 1;
    hasMore.value = true;
    activities.value = [];
    errorMessage.value = "";
  }
  if (!hasMore.value && !reset) {
    return;
  }

  if (reset) {
    isInitialLoading.value = true;
  } else {
    isLoadingMore.value = true;
  }

  try {
    const res = await getActivityList({
      paginationOptions: { page: page.value, limit: LIMIT },
    });
    activities.value = reset
      ? res.activities
      : [...activities.value, ...res.activities];
    const loadedTotal = activities.value.length;
    hasMore.value = loadedTotal < res.total;
    if (hasMore.value) {
      page.value += 1;
    }
  } catch (error) {
    errorMessage.value = "活动加载失败，请稍后再试";
    uni.showToast({ title: errorMessage.value, icon: "none" });
  } finally {
    isInitialLoading.value = false;
    isLoadingMore.value = false;
  }
};

onLoad((options)=> {
  console.log(options);
  if(options?.role==="invited"){
    uni.showToast({ title: "欢迎受邀参加活动！", icon: "none" });
    isInvited.value=true;
    uni.hideTabBar();
  }
})

onMounted(() => {
  fetchActivities(true);
});

onPullDownRefresh(async () => {
  await fetchActivities(true);
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (hasMore.value && !isLoadingMore.value) {
    fetchActivities();
  }
});

onUnload(()=>{
  if(isInvited.value){
    uni.showTabBar();
  }
})
</script>

<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <view class="section-title">活动日历</view>
        <view class="section-subtitle">掌握第一手校友活动动态</view>

        <view v-if="isInitialLoading" class="empty-state">正在加载活动...</view>

        <view v-else>
          <view v-if="!activities.length" class="empty-state">
            暂无活动，敬请期待
          </view>
          <view v-else>
            <ActivityBox
              v-for="activity in activities"
              :key="activity.id"
              :activity="activity"
            />
          </view>

          <view class="load-hint" v-if="isLoadingMore">
            <text class="muted-text">加载中...</text>
          </view>
          <view class="load-hint" v-else-if="!hasMore">
            <text class="muted-text">已经到底啦</text>
          </view>
        </view>

        <view v-if="errorMessage" class="error-hint">
          {{ errorMessage }}
        </view>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.load-hint {
  text-align: center;
  padding: 24rpx 0;
}

.error-hint {
  margin-top: 20rpx;
  text-align: center;
  color: #ff6347;
  font-size: 26rpx;
}
</style>
