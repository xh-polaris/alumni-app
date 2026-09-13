import { ApiError } from "@/api/request";

/** 服务端身份校验失败时的兜底文案（契约 4：403 / 当前身份无权执行此操作） */
export const IDENTITY_REQUIRED_MESSAGE = "认证通过后可报名";

const IDENTITY_HINTS = ["无权", "认证", "身份", "审核", "核验"];

const normalize = (value?: string) => (value || "").trim();

/**
 * 报名接口的服务端身份/权限拒绝：HTTP 403（或带 403 语义的业务错误）。
 * 服务端已强校验，客户端不能只依赖按钮置灰。
 */
export const isIdentityRejectedError = (error: unknown): boolean => {
  if (error instanceof ApiError && error.statusCode === 403) return true;
  const message = error instanceof Error ? error.message : "";
  return IDENTITY_HINTS.some((hint) => message.includes(hint));
};

/**
 * 把报名失败映射为可展示文案：
 * 403（身份未通过）优先用一句明确的中文提示，其余情况用服务端 message，最后才用兜底文案。
 */
export const getRegisterErrorMessage = (error: unknown, fallback = "报名失败，请稍后重试"): string => {
  if (isIdentityRejectedError(error)) {
    const serverMessage = normalize(error instanceof Error ? error.message : "");
    if (serverMessage && IDENTITY_HINTS.some((hint) => serverMessage.includes(hint))) {
      return serverMessage;
    }
    return IDENTITY_REQUIRED_MESSAGE;
  }
  const message = normalize(error instanceof Error ? error.message : "");
  return message || fallback;
};
