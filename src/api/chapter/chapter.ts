import type { Chapter } from "@/api/chapter/chapter-interface";
import { httpRequest } from "@/api/request";

/**
 * @description 获取启用中的分会列表（契约 2.1）
 */
export const getChapters = (): Promise<Chapter[]> => {
    return httpRequest<Chapter[]>({
        url: '/chapters',
        method: 'GET',
        auth: false,
    });
}
