import { STORAGE_KEYS } from "@/constants/storage";

const ONLINE_BASE_URL = "https://api.xhpolaris.com/alumni";
/** 是否使用 H5 开发服务器代理（vite.config.ts 把 /api 转发到 http://localhost:8888） */
/**
 * H5 开发态若没有显式配置 VITE_API_BASE_URL，就走 Vite 的 `/api` 代理。
 *
 * 注意这里**刻意不再看 VITE_DEV_MODE**：dev 演示模式只是一个「是否附带
 * X-Alumni-Mode 头」的开关，跟 API 地址无关。早先把两者绑在一起，导致
 * 在 .env.local 里打开 VITE_DEV_MODE 就会跳过代理、把请求打到线上域名。
 * 想指向远端时显式设置 VITE_API_BASE_URL 即可。
 */
const USE_H5_DEV_PROXY = import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL;
let BASE_URL = USE_H5_DEV_PROXY ? "/api" : import.meta.env.VITE_API_BASE_URL || ONLINE_BASE_URL;

const BUILD_DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

interface RequestParams<TData = unknown> {
  url: string;
  /** 契约 2.4 需要 PATCH；@dcloudio/types 的 method 联合类型尚未包含它 */
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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

/**
 * 与 `uni.request` / `uni.uploadFile` 共用的请求头。
 *
 * 抽取成导出的单点实现，避免上传逻辑与普通请求的鉴权头各自演化：
 * - `Authorization`：裸 token（服务端约定），未登录时不带；
 * - `X-Alumni-Mode: dev`：构建期 `VITE_DEV_MODE=true`，或运行时把 `alumni:dev-mode` 置为 `dev`。
 *
 * `httpRequest` 的 `auth: false` 由调用方通过 `includeAuth` 表达。
 */
export const buildRequestHeaders = (includeAuth = true): Record<string, string> => {
  const header: Record<string, string> = { "Content-Type": "application/json" };
  const token = includeAuth ? getAccessToken() : "";
  if (token) {
    header.Authorization = token;
  }
  if (BUILD_DEV_MODE || uni.getStorageSync(STORAGE_KEYS.DEV_MODE) === "dev") {
    header["X-Alumni-Mode"] = "dev";
  }
  return header;
};

/**
 * `uni.uploadFile` 的 url 参数（含协议与域名），与 `httpRequest` 使用同一份 BASE_URL 解析规则。
 *
 * 之所以由调用方拼好完整 url 再传入，是因为 `// #ifdef H5` 条件编译块内的引用
 * 在非 H5 构建中仍会被 TypeScript 检查，所以 BASE_URL 的读取必须留在本文件内。
 */
export const buildApiUrl = (url: string): string => `${BASE_URL}${url}`;

/**
 * 处理「登录态失效」。
 *
 * 关键约束：用户正在登录页时**不能**清会话。登录成功后紧跟的档案请求若因任何原因返回 401，
 * 旧实现会把刚写入的会话删掉，于是页面提示「登录成功」但用户实际已登出——
 * 表现为「登录成功了还显示未登录」。此时只上报错误，由页面决定如何提示。
 */
const handleUnauthorized = () => {
  const pages = getCurrentPages();
  const currentRoute = pages[pages.length - 1]?.route;
  if (currentRoute === "pages/login/index" || currentRoute === "pages/login/sign-up") {
    return false;
  }
  uni.removeStorageSync(STORAGE_KEYS.USER);
  uni.showToast({ title: "登录已失效，请重新登录", icon: "none" });
  uni.reLaunch({ url: "/pages/login/index" });
  return true;
};

/**
 * 统一的错误文案解析（`httpRequest` 与 `uni.uploadFile` 共用）。
 * 优先服务端 message，其次按状态码给固定文案，最后兜底。
 */
export const resolveApiErrorMessage = (statusCode: number, payload?: ApiErrorPayload): string => {
  const serverMessage = payload?.msg || payload?.message;
  if (serverMessage) return serverMessage;
  if (statusCode === 400) return "请求参数错误";
  if (statusCode === 401) return "登录已失效";
  if (statusCode === 403) return "当前身份无权执行此操作";
  if (statusCode === 404) return "资源不存在";
  if (statusCode >= 500) return "服务异常";
  return "请求失败，请稍后重试";
};

export const httpRequest = <T, TData = unknown>(params: RequestParams<TData>): Promise<T> => {
  const header: Record<string, string> = {
    ...buildRequestHeaders(params.auth !== false),
    ...params.headers,
  };

  return new Promise((resolve, reject) => {
    uni.request({
      url: buildApiUrl(params.url),
      // @dcloudio/types 的 method 联合类型缺少 PATCH，运行时与 H5/小程序均支持
      method: params.method as UniApp.RequestOptions["method"],
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
              resolveApiErrorMessage(response.statusCode, businessPayload),
              response.statusCode,
              businessPayload.code,
            ));
            return;
          }
          resolve(payload as T);
          return;
        }

        // 只有 401 才代表登录态失效。403 是「身份不足」（例如待认证用户报名活动），
        // 清会话会把已登录用户误判成未登录，必须交给页面提示。
        if (response.statusCode === 401) {
          handleUnauthorized();
        }

        const errorPayload = payload as ApiErrorPayload;
        reject(new ApiError(
          resolveApiErrorMessage(response.statusCode, errorPayload),
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
