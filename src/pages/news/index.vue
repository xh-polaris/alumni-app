<script setup lang="ts">
import { ref, shallowRef } from "vue";
import { onLoad, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import Layout from "@/components/Layout.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatePanel from "@/components/StatePanel.vue";
import { getArticleList } from "@/api/article/article";
import type { Article } from "@/api/article/article-interface";
import { getErrorMessage } from "@/api/request";

const PAGE_SIZE = 10;
const articles = shallowRef<Article[]>([]);
const page = ref(1);
const hasMore = ref(true);
const isInitialLoading = ref(true);
const isLoadingMore = ref(false);
const errorMessage = ref("");

const formatPublishTime = (timestamp: number) => {
  if (!timestamp) return "刚刚发布";
  const date = new Date(timestamp * 1000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}月${day}日`;
};

const fetchArticles = async (reset = false) => {
  if ((!hasMore.value && !reset) || isLoadingMore.value) return;
  const targetPage = reset ? 1 : page.value;
  if (reset && articles.value.length === 0) isInitialLoading.value = true;
  if (!reset) isLoadingMore.value = true;
  errorMessage.value = "";

  try {
    const response = await getArticleList({ page: targetPage, pageSize: PAGE_SIZE });
    const next = response.items ?? [];
    articles.value = reset ? next : [...articles.value, ...next];
    hasMore.value = articles.value.length < response.total;
    page.value = targetPage + 1;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "资讯加载失败，请稍后重试");
  } finally {
    isInitialLoading.value = false;
    isLoadingMore.value = false;
  }
};

const openArticle = (article: Article) => {
  if (!article.wechatUrl) {
    uni.showToast({ title: "暂无文章链接", icon: "none" });
    return;
  }

  // #ifdef H5
  window.open(article.wechatUrl, "_blank", "noopener,noreferrer");
  // #endif

  // #ifndef H5
  uni.setClipboardData({
    data: article.wechatUrl,
    success: () => {
      uni.showToast({ title: "链接已复制，请在浏览器打开", icon: "none" });
    },
  });
  // #endif
};

onLoad(() => fetchArticles(true));
onPullDownRefresh(async () => {
  await fetchArticles(true);
  uni.stopPullDownRefresh();
});
onReachBottom(() => fetchArticles());
</script>

<template>
  <Layout tone="warm">
    <view class="page-shell">
      <view class="page-shell__content">
        <PageHeader eyebrow="NEWS" title="校友资讯" description="商会动态与校友活动信息" />

        <view v-if="isInitialLoading" class="news-skeletons">
          <view v-for="item in 3" :key="item" class="news-skeleton surface-card-padding">
            <view class="skeleton news-skeleton__cover" />
            <view class="news-skeleton__body">
              <view class="skeleton news-skeleton__tag" />
              <view class="skeleton news-skeleton__title" />
              <view class="skeleton news-skeleton__summary" />
            </view>
          </view>
        </view>

        <StatePanel
          v-else-if="errorMessage && !articles.length"
          tone="error"
          title="资讯加载失败"
          :description="errorMessage"
          action-label="重新加载"
          @action="fetchArticles(true)"
        />
        <StatePanel
          v-else-if="!articles.length"
          title="暂无资讯"
          description="新的商会动态和校友信息将在这里发布"
        />
        <view v-else>
          <view
            v-for="article in articles"
            :key="article.id"
            class="news-card"
            hover-class="news-card--pressed"
            hover-stay-time="90"
            @click="openArticle(article)"
          >
            <image v-if="article.cover" class="news-card__cover" :src="article.cover" mode="aspectFill" />
            <view class="news-card__body">
              <view class="news-card__meta">
                <text>{{ article.source || "校友资讯" }}</text>
                <text>{{ formatPublishTime(article.publishTime) }}</text>
              </view>
              <view class="news-card__title">{{ article.title }}</view>
              <view class="news-card__summary">{{ article.summary }}</view>
              <view class="news-card__footer">
                <text v-if="article.author">{{ article.author }}</text>
                <text class="news-card__link">查看原文</text>
              </view>
            </view>
          </view>
          <view v-if="errorMessage" class="list-error">
            <text>{{ errorMessage }}</text>
            <button class="text-button" @click="fetchArticles()">重试</button>
          </view>
          <view v-else class="load-hint">
            <view v-if="isLoadingMore" class="load-hint__loading"><view class="loading-dot" />正在加载</view>
            <text v-else-if="!hasMore">已显示全部资讯</text>
          </view>
        </view>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
.news-skeleton { overflow: hidden; }
.news-skeleton__cover { height: 260rpx; border-radius: 0; }
.news-skeleton__body { padding: 28rpx; }
.news-skeleton__tag { width: 180rpx; height: 30rpx; }
.news-skeleton__title { width: 78%; height: 42rpx; margin-top: 22rpx; }
.news-skeleton__summary { width: 92%; height: 30rpx; margin-top: 18rpx; }
.news-card { margin-bottom: 26rpx; overflow: hidden; border: 1rpx solid rgba(21, 63, 50, 0.07); border-radius: var(--alumni-radius-lg); background: #fff; box-shadow: var(--alumni-shadow); transition: transform 180ms ease, box-shadow 180ms ease; }
.news-card--pressed { transform: scale(0.985); box-shadow: 0 10rpx 28rpx rgba(21, 63, 50, 0.07); }
.news-card__cover { width: 100%; height: 260rpx; display: block; background: var(--alumni-primary-soft); }
.news-card__body { padding: 30rpx; }
.news-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; color: var(--alumni-muted); font-size: 22rpx; }
.news-card__title { margin-top: 16rpx; color: var(--alumni-text); font-family: "Songti SC", "STSong", serif; font-size: 34rpx; font-weight: 600; line-height: 1.42; }
.news-card__summary { margin-top: 14rpx; color: var(--alumni-muted); font-size: 25rpx; line-height: 1.62; }
.news-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; margin-top: 24rpx; padding-top: 18rpx; border-top: 1rpx solid var(--alumni-border); color: var(--alumni-muted); font-size: 22rpx; }
.news-card__link { color: var(--alumni-primary); font-weight: 600; }
.load-hint { min-height: 68rpx; display: flex; align-items: center; justify-content: center; color: var(--alumni-muted); font-size: 22rpx; }
.load-hint__loading { display: flex; align-items: center; gap: 12rpx; }
.loading-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: var(--alumni-accent); animation: loading-pulse 1s ease-in-out infinite alternate; }
.list-error { display: flex; align-items: center; justify-content: center; gap: 8rpx; color: var(--alumni-danger); font-size: 22rpx; }
.list-error .text-button { min-height: 58rpx; padding: 8rpx 14rpx; font-size: 22rpx; }
@keyframes loading-pulse { from { opacity: 0.35; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .news-card, .loading-dot { transition: none; animation: none; } }
</style>
