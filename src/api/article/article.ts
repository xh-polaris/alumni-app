import { httpRequest } from "@/api/request";
import type {
  GetArticleListData,
  GetArticleListResponse,
} from "@/api/article/article-interface";

export const getArticleList = (
  data: GetArticleListData,
): Promise<GetArticleListResponse> => {
  const chapterQuery = data.chapterId ? `&chapterId=${encodeURIComponent(data.chapterId)}` : "";
  return httpRequest<GetArticleListResponse>({
    url: `/articles?page=${data.page}&pageSize=${data.pageSize}${chapterQuery}`,
    method: "GET",
    auth: false,
  });
};
