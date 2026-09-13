<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";
import { STORAGE_KEYS } from "@/constants/storage";

const AUTH_WHITELIST = new Set([
  "pages/login/index",
  "pages/login/sign-up",
  "pages/news/index",
  "pages/activity/index",
  "pages/activity/details",
  "pages/webview/index",
  "pages/check-in/index",
  "pages/sign-in-details/sign-in-details",
  "pages/mine/index",
]);

const getCurrentRoute = () => {
  const pages = getCurrentPages();
  if (pages.length) return pages[pages.length - 1]?.route ?? "";
  return uni.getLaunchOptionsSync?.().path ?? "";
};

/**
 * 读取 dev 演示模式的开关。
 *
 * 关键点：H5 是 hash 路由（`http://host/#/pages/xxx`），而 uni-app 的
 * `getLaunchOptionsSync().query` 取自 **vue-router 的 route.query**，
 * 也就是 `#` **之后** 的那一段。所以把 `?env=dev` 写在 `#` 之前会被完全忽略——
 * 这正是「加了 ?env=dev 但 dev 没生效」的原因。
 *
 * 因此这里把三种来源都读一遍，任一命中即视为开启：
 *   1. `getLaunchOptionsSync().query`（小程序；H5 的 hash 内查询串）
 *   2. `location.search`（H5 `#` 之前的查询串）
 *   3. `location.hash` 里的查询串（H5，兜底）
 */
const getLaunchQuery = () => {
  const launchOptions = uni.getLaunchOptionsSync?.();
  return (launchOptions?.query ?? {}) as Record<string, string | undefined>;
};

const DEV_QUERY_KEYS = ["env", "mode", "dev"] as const;

const isDevQuery = (query: Record<string, string | undefined>) =>
  DEV_QUERY_KEYS.some((key) => {
    const value = query[key];
    return value === "dev" || value === "1" || value === "true";
  });

const parseQueryString = (raw: string): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!raw) return result;
  new URLSearchParams(raw.replace(/^\?/, "")).forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

const getDevModeSources = (): Record<string, string | undefined>[] => {
  const sources: Record<string, string | undefined>[] = [getLaunchQuery()];
  // #ifdef H5
  if (typeof window !== "undefined") {
    sources.push(parseQueryString(window.location.search));
    const hash = window.location.hash;
    const hashQueryIndex = hash.indexOf("?");
    if (hashQueryIndex >= 0) {
      sources.push(parseQueryString(hash.slice(hashQueryIndex)));
    }
  }
  // #endif
  return sources;
};

const hasDevModeQuery = () => getDevModeSources().some(isDevQuery);

const ensureDevMockSession = () => {
  // 演示会话**只**由 URL 参数开启（`?env=dev` 或 `#/pages/xxx?env=dev`）。
  // 刻意不让构建期开关自动登录：否则退出登录后会被立刻重新登录，
  // 真实账号登录 / 退出这条流程就无法验证了。
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

// #ifdef H5
// 地址栏/hash 变化后重新判定，避免「已经在页面上才加 ?env=dev」时失效
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    ensureDevMockSession();
  });
}
// #endif
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
