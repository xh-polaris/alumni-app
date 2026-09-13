export const STORAGE_KEYS = {
  USER: "alumni:user",
  DEV_MODE: "alumni:dev-mode",
  /** 活动页默认分会缓存：缓存最近一次用户确认的 chapterId（含 "" 表示全部分会） */
  CHAPTER_ID: "alumni:chapter-id",
  /** 分会列表缓存，避免资讯/活动页每次进入都重复拉取 */
  CHAPTERS: "alumni:chapters",
};
