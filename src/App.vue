<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";
import { STORAGE_KEYS } from "@/constants/storage";

const AUTH_WHITELIST = new Set([
  "pages/login/index",
  "pages/login/sign-up",
  "pages/activity/index",
  "pages/activity/details",
  "pages/check-in/index",
  "pages/mine/index",
]);

const getCurrentRoute = () => {
  const pages = getCurrentPages();
  if (pages.length) return pages[pages.length - 1]?.route ?? "";
  return uni.getLaunchOptionsSync?.().path ?? "";
};

const getLaunchQuery = () => {
  const launchOptions = uni.getLaunchOptionsSync?.();
  return (launchOptions?.query ?? {}) as Record<string, string | undefined>;
};

const hasDevModeQuery = () => {
  const query = getLaunchQuery();
  return query.env === "dev" || query.mode === "dev" || query.dev === "1" || query.dev === "true";
};

const ensureDevMockSession = () => {
  if (hasDevModeQuery()) {
    uni.setStorageSync(STORAGE_KEYS.DEV_MODE, "dev");
  }
  if (uni.getStorageSync(STORAGE_KEYS.DEV_MODE) !== "dev") return;
  if (uni.getStorageSync(STORAGE_KEYS.USER)) return;
  uni.setStorageSync(STORAGE_KEYS.USER, {
    id: "66a000000000000000000001",
    accessToken: "mock-token",
    accessExpire: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  });
};

const ensureAuth = () => {
  ensureDevMockSession();
  if (AUTH_WHITELIST.has(getCurrentRoute())) return;
  const userInfo = uni.getStorageSync(STORAGE_KEYS.USER);
  if (!userInfo) {
    uni.reLaunch({ url: "/pages/login/index" });
  }
};

onLaunch(ensureAuth);
onShow(ensureAuth);
</script>

<style lang="scss">
@import "@/styles/theme.scss";

page {
  min-height: 100%;
  background: var(--alumni-surface-muted);
  color: var(--alumni-text);
  font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>
