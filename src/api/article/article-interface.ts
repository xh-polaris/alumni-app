export interface Article {
  id: string;
  title: string;
  summary: string;
  cover: string;
  wechatUrl: string;
  source: string;
  author: string;
  publishTime: number;
}

export interface GetArticleListData {
  page: number;
  pageSize: number;
}

export interface GetArticleListResponse {
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
}
