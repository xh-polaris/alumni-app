<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { STORAGE_KEYS } from "@/constants/storage";

const AUTH_WHITELIST = ["pages/login/index", "pages/login/sign-up"];

const isAuthFreePage = () => {
  const pages = getCurrentPages();
  if (pages.length) {
    const current = pages[pages.length - 1];
    return AUTH_WHITELIST.includes(current.route || "");
  }
  const options = uni.getLaunchOptionsSync?.();
  if (options?.path) {
    return AUTH_WHITELIST.includes(options.path);
  }
  return false;
};

const ensureAuth = () => {
  if (isAuthFreePage()) {
    return;
  }
  const userInfo = uni.getStorageSync(STORAGE_KEYS.USER);
  if (!userInfo) {
    uni.showToast({ title: "请先登录", icon: "none" });
    uni.reLaunch({ url: "/pages/login/index" });
  }
};

onLaunch(() => {
  ensureAuth();
});

onShow(() => {
  ensureAuth();
});

onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
@import "@/styles/theme.scss";

page {
  font-family: "PingFang SC", "SF Pro Display", sans-serif;
  background-color: var(--alumni-surface-muted);
  color: var(--alumni-text);
}
</style>
