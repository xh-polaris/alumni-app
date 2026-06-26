import { httpRequest } from "@/api/request";
import type {
  GetArticleListData,
  GetArticleListResponse,
} from "@/api/article/article-interface";

export const getArticleList = (
  data: GetArticleListData,
): Promise<GetArticleListResponse> =>
  httpRequest<GetArticleListResponse>({
    url: `/articles?page=${data.page}&pageSize=${data.pageSize}`,
    method: "GET",
    auth: false,
  });
