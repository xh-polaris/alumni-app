<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

/**
 * 资讯原文承载页：小程序端用 web-view 打开外部链接。
 * 若链接不在业务域名白名单内，web-view 会触发 error，此时提示并回退到复制链接。
 */
const sourceUrl = ref("");

const copyLink = () => {
  if (!sourceUrl.value) return;
  uni.setClipboardData({
    data: sourceUrl.value,
    success: () => uni.showToast({ title: "链接已复制，请在浏览器打开", icon: "none" }),
  });
};

onLoad((options) => {
  sourceUrl.value = decodeURIComponent(options?.src ?? "");
});
</script>

<template>
  <view class="webview-page">
    <!-- #ifdef MP-WEIXIN -->
    <web-view v-if="sourceUrl" :src="sourceUrl" @error="copyLink" />
    <!-- #endif -->
    <view v-if="!sourceUrl" class="webview-fallback">
      <view class="section-title">链接不可用</view>
      <view class="section-subtitle">请返回资讯列表后重试</view>
    </view>
    <!-- #ifndef MP-WEIXIN -->
    <view class="webview-fallback">
      <view class="section-title">请在浏览器中打开</view>
      <view class="section-subtitle">当前平台不支持内嵌网页，可复制链接后在浏览器查看原文</view>
      <button class="secondary-button" @click="copyLink">复制链接</button>
    </view>
    <!-- #endif -->
  </view>
</template>

<style scoped>
.webview-page { min-height: 100vh; background: var(--alumni-surface-muted); }
.webview-fallback { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 140rpx 48rpx; text-align: center; }
.webview-fallback .secondary-button { min-width: 240rpx; margin-top: 26rpx; }
</style>
