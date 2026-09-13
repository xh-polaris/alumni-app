/**
 * 分会（契约 2.1 GET /chapters）
 */
export interface ChapterContact {
  name: string;
  wechat: string;
  phone: string;
  description: string;
  qrCodeUrl: string;
}

export interface Chapter {
  id: string;
  code: string;
  name: string;
  contact: ChapterContact;
  status: number;
}

/** 去掉「分会」后缀，用于 chip 等紧凑展示：上海分会 -> 上海 */
export const toChapterShortName = (chapter: Pick<Chapter, "name">): string =>
  (chapter.name || "").replace(/分会$/, "");
