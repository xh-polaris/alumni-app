import { STORAGE_KEYS } from "@/constants/storage";

const ONLINE_BASE_URL = "https://api.xhpolaris.com/alumni";
let BASE_URL = import.meta.env.VITE_API_BASE_URL || ONLINE_BASE_URL;

const BUILD_DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

// #ifdef H5
if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_DEV_MODE !== "true") {
  BASE_URL = "/api";
}
// #endif

interface RequestParams<TData = unknown> {
  url: string;
  method: "GET" | "POST";
  data?: TData;
  headers?: Record<string, string>;
  auth?: boolean;
}

interface ApiErrorPayload {
  code?: number;
  msg?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const getAccessToken = () => {
  const session = uni.getStorageSync(STORAGE_KEYS.USER) as { accessToken?: string } | undefined;
  return session?.accessToken ?? "";
};

const handleUnauthorized = () => {
  uni.removeStorageSync(STORAGE_KEYS.USER);
  const pages = getCurrentPages();
  const currentRoute = pages[pages.length - 1]?.route;
  if (currentRoute !== "pages/login/index") {
    uni.showToast({ title: "登录已失效，请重新登录", icon: "none" });
    uni.reLaunch({ url: "/pages/login/index" });
  }
};

export const httpRequest = <T, TData = unknown>(params: RequestParams<TData>): Promise<T> => {
  const token = params.auth === false ? "" : getAccessToken();
  const header: Record<string, string> = {
    "Content-Type": "application/json",
    ...params.headers,
  };

  if (token) {
    header.Authorization = token;
  }
  if (BUILD_DEV_MODE || uni.getStorageSync(STORAGE_KEYS.DEV_MODE) === "dev") {
    header["X-Alumni-Mode"] = "dev";
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${params.url}`,
      method: params.method,
      data: params.data ?? {},
      header,
      success: (response) => {
        const payload = response.data as ApiErrorPayload | T;
        if (response.statusCode >= 200 && response.statusCode < 300) {
          const businessPayload = payload as ApiErrorPayload;
          if (
            typeof businessPayload.code === "number" &&
            businessPayload.code !== 0
          ) {
            reject(new ApiError(
              businessPayload.msg || businessPayload.message || "请求失败，请稍后重试",
              response.statusCode,
              businessPayload.code,
            ));
            return;
          }
          resolve(payload as T);
          return;
        }

        if (response.statusCode === 401 || response.statusCode === 403) {
          handleUnauthorized();
        }

        const errorPayload = payload as ApiErrorPayload;
        reject(new ApiError(
          errorPayload.msg || errorPayload.message || "请求失败，请稍后重试",
          response.statusCode,
          errorPayload.code,
        ));
      },
      fail: () => {
        reject(new ApiError("网络连接失败，请检查网络后重试"));
      },
    });
  });
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;
