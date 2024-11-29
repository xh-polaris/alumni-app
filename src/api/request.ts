const BASE_URL = "https://api.xhpolaris.com/alumni"

interface RequestParams {
    url: string;
    method: "GET" | "POST";
    data?: Record<string, any>;
    headers?: Record<string, string>;
}

export const httpRequest = <T>(params: RequestParams): Promise<T> => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${BASE_URL}${params.url}`,
            method: params.method,
            data: params.data || {},
            header: params.headers || { "Content-Type": "application/json" },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data as T);
                } else {
                    reject(new Error("请求失败，请重试"));
                }
            },
            fail: (err) => {
                reject(new Error("网络错误"));
            },
        });
    });
};
