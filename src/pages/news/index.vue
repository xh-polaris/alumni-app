<script setup lang="ts">
import Layout from "@/components/Layout.vue";
import { STORAGE_KEYS } from "@/constants/storage";
import { onShow } from "@dcloudio/uni-app";
const ensureAuth = () => {
  const userInfo = uni.getStorageSync(STORAGE_KEYS.USER);
  if (!userInfo) {
    uni.showToast({ title: "请先登录", icon: "none" });
    uni.reLaunch({ url: "/pages/login/index" });
  }
};

onShow(() => {
  ensureAuth();
});
</script>

<template>
  <Layout>
    <view class="page-shell">
      <view class="page-shell__content">
        <view class="surface-card">
          <view class="section-title">资讯中心</view>
          <view class="empty-state">暂无资讯，敬请期待</view>
        </view>
      </view>
    </view>
  </Layout>
</template>
