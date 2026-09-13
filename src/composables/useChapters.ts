import { ref } from "vue";
import { getChapters } from "@/api/chapter/chapter";
import type { Chapter } from "@/api/chapter/chapter-interface";
import { STORAGE_KEYS } from "@/constants/storage";

/**
 * 分会列表：低频变化，但**会被管理端改动**（联络人、微信号、二维码）。
 *
 * 早先的实现把列表永久缓存：只要缓存非空就直接返回，永不回源。
 * 结果是管理员在管理端换了分会二维码，用户端一直显示旧图，只有清掉本地存储才更新。
 *
 * 现在的策略是「先返回缓存，再后台回源」（stale-while-revalidate）：
 * - 有缓存时立刻返回，页面不阻塞、不白屏；
 * - 只要距上次请求超过 REFRESH_INTERVAL_MS 就顺带发一次请求，拿到后更新响应式数据，
 *   所以管理端的改动会在下次进入页面时自动出现，无需用户清缓存；
 * - force=true 时等待请求结果（用于「加载中」这类需要结果的场景）。
 */
const REFRESH_INTERVAL_MS = 10 * 1000;

const cached = readCachedChapters();
const chapters = ref<Chapter[]>(cached.list);
let fetchedAt = cached.at;
const isLoading = ref(false);
const errorMessage = ref("");
let inflight: Promise<Chapter[]> | null = null;

function readCachedChapters(): { list: Chapter[]; at: number } {
  try {
    const raw = uni.getStorageSync(STORAGE_KEYS.CHAPTERS) as unknown;
    // 兼容旧格式：早期存的是裸数组、没有时间戳。按「很久以前取过」处理，
    // 这样老用户升级后第一次进页面就会回源，而不是继续用旧数据。
    if (Array.isArray(raw)) return { list: raw as Chapter[], at: 0 };
    if (raw && typeof raw === "object") {
      const wrapped = raw as { data?: unknown; at?: unknown };
      if (Array.isArray(wrapped.data)) {
        return { list: wrapped.data as Chapter[], at: Number(wrapped.at) || 0 };
      }
    }
    return { list: [], at: 0 };
  } catch {
    return { list: [], at: 0 };
  }
}

function writeCachedChapters(list: Chapter[], at: number) {
  try {
    uni.setStorageSync(STORAGE_KEYS.CHAPTERS, { data: list, at });
  } catch {
    // 存储失败不影响页面使用内存缓存
  }
}

function refresh(): Promise<Chapter[]> {
  if (inflight) return inflight;
  isLoading.value = true;
  errorMessage.value = "";
  inflight = getChapters()
    .then((list) => {
      const normalized = Array.isArray(list) ? list : [];
      chapters.value = normalized;
      fetchedAt = Date.now();
      writeCachedChapters(normalized, fetchedAt);
      return normalized;
    })
    .catch((error: unknown) => {
      errorMessage.value = error instanceof Error ? error.message : "分会列表加载失败";
      return chapters.value;
    })
    .finally(() => {
      isLoading.value = false;
      inflight = null;
    });
  return inflight;
}

export const useChapters = () => {
  const loadChapters = async (force = false): Promise<Chapter[]> => {
    const hasCache = chapters.value.length > 0;
    const isStale = Date.now() - fetchedAt >= REFRESH_INTERVAL_MS;

    if (!force && hasCache) {
      // 命中缓存：直接给出数据；过期就在后台静默刷新，界面随响应式数据自动更新
      if (isStale) void refresh();
      return chapters.value;
    }
    return refresh();
  };

  const findChapter = (chapterId: string) =>
    chapterId ? chapters.value.find((item) => item.id === chapterId) : undefined;

  return {
    chapters,
    isLoading,
    errorMessage,
    loadChapters,
    findChapter,
  };
};
