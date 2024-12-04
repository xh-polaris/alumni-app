<script setup lang="ts">
import Layout from "@/components/Layout.vue";
import { getActivityList } from "@/api/activity/activity";
import type { Activity } from "@/api/activity/activity-interface";
import { onMounted, ref } from "vue";
import ActivityBox from "@/components/ActivityBox.vue";

const activities = ref<Activity[]>([]);
const LIMIT = 10;
const page = ref(1);
const loading = ref(false); // 用于防止重复请求

// 请求活动列表函数
const fetchActivities = async () => {
  if (loading.value) return; // 防止重复请求

  loading.value = true;
  try {
    const res = await getActivityList({paginationOptions: { page: page.value, limit: LIMIT} });
    activities.value = [...activities.value, ...res.activities]; // 追加数据
    page.value += 1; // 增加页码
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 监听页面滚动事件，判断是否滚动到底部
const handleScroll = (event: Event) => {
  const container = event.target as HTMLElement;
  // 判断是否滚动到底部
  if (container.scrollHeight - container.scrollTop <= container.clientHeight + 10) {
    fetchActivities(); // 滚动到底部时加载更多数据
  }
};

// 初始化时请求数据
onMounted(() => {
  fetchActivities();
});
</script>


<template>
<layout>
  <view class="scroll-container" @scroll="handleScroll">
    <activity-box v-for="activity in activities" :key="activity.id" :activity="activity" />
  </view>
</layout>

</template>

<style scoped>
.scroll-container{
  margin-top: 50rpx;
  height: 100%;
  overflow-y: scroll;
}
</style>