export interface Article {
  id: string;
  title: string;
  summary: string;
  cover: string;
  wechatUrl: string;
  source: string;
  author: string;
  chapterId: string;
  chapterName: string;
  publishTime: number;
}

export interface GetArticleListData {
  page: number;
  pageSize: number;
  /** 不传表示全部分会（契约 2.7） */
  chapterId?: string;
}

export interface GetArticleListResponse {
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
}
