import { ApiError, buildApiUrl, buildRequestHeaders, resolveApiErrorMessage } from "@/api/request";

/**
 * `POST /upload` 的成功响应（契约 2.10.1，**裸 JSON**，不套 `code/message/data`）。
 */
export interface UploadedImage {
    url: string;
    key: string;
    size: number;
    contentType: string;
}

/** 服务端错误体（契约 2.10.1 的 400/401/500 为 `{code,message}`；兼容旧 `msg`） */
interface UploadErrorPayload {
    code?: number;
    msg?: string;
    message?: string;
}

/** 上传接口的相对路径；完整 url 由 `buildApiUrl()` 按 request.ts 的同一规则解析 */
const UPLOAD_PATH = "/upload";
/** 与契约 2.10.1 一致的服务端限制，用于在上传前给出即时反馈 */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const NETWORK_ERROR_MESSAGE = "网络连接失败，请检查网络后重试";
/** 服务端「图片过大」文案（契约 2.10.1 的 400 与 hertz 的 413 都归到这一句） */
const IMAGE_TOO_LARGE_MESSAGE = "图片过大，请压缩后重试";
/**
 * 服务端 message 命中「过大」语义时统一成本地固定文案。
 * 服务端当前返回的就是「图片过大，请压缩后重试」，这里只是防止大小写/措辞变体
 * 让 pre-check 与网络失败两条路径的提示不一致。
 */
const MESSAGE_TOO_LARGE_PATTERN = /(图片)?过大|too large|entity too large/i;
/** 服务端嗅探的四种图片类型 */
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const IMAGE_TYPE_MESSAGE = "仅支持 PNG / JPG / WEBP / GIF 格式的图片";
/**
 * 部分小程序宿主会给所有 `tempFiles` 项填 `application/octet-stream`，
 * 这类不确定的类型不做拦截，交给服务端内容嗅探兜底。
 */
const UNKNOWN_MIME_TYPES = ["", "application/octet-stream"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const isFileObject = (value: unknown): value is File =>
    typeof File !== "undefined" && value instanceof File;

const hasStringType = (value: Record<string, unknown>): value is { type: string } =>
    typeof value.type === "string";

/** App / 小程序端 `tempFiles` 的元素形状：`{ path, size, type? }` */
const isChooseImageFile = (value: unknown): value is UniApp.ChooseImageSuccessCallbackResultFile =>
    isRecord(value) && typeof value.path === "string" && typeof value.size === "number";

const firstOf = <T>(value: T | T[] | undefined): T | undefined =>
    Array.isArray(value) ? value[0] : value;

const toBytes = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const readMimeType = (value: unknown): string => {
    if (isFileObject(value)) return value.type.toLowerCase();
    if (isRecord(value) && hasStringType(value)) return value.type.toLowerCase();
    return "";
};

const isUnsupportedImageType = (mimeType: string): boolean =>
    !UNKNOWN_MIME_TYPES.includes(mimeType) && !ALLOWED_IMAGE_TYPES.includes(mimeType);

/**
 * `uni.uploadFile` 的 `filePath` 在 H5 端也接受 `File` 对象
 * （见 `UploadFileOption.file`：H5 专有字段），因此内部统一用一个发送函数。
 * 小程序端没有 `File` 构造器，所以判定前必须先看 `typeof File`。
 */
type UploadSource = string | File;

const parseUploadPayload = (raw: string): UploadErrorPayload => {
    if (!raw) return {};
    try {
        const parsed: unknown = JSON.parse(raw);
        return isRecord(parsed) ? parsed : {};
    } catch {
        // 非 JSON 响应体（例如网关 HTML 错误页）统一走状态码文案
        return {};
    }
};

const toUploadedImage = (payload: UploadErrorPayload, statusCode: number): UploadedImage => {
    const parsed = payload as unknown as Partial<UploadedImage>;
    if (!parsed.url) {
        // 2xx 但没有 url：按服务端异常处理，绝不把空值写进业务字段。
        throw new ApiError(resolveApiErrorMessage(statusCode, payload), statusCode, payload.code);
    }
    return {
        url: parsed.url,
        key: parsed.key ?? "",
        size: typeof parsed.size === "number" ? parsed.size : 0,
        contentType: parsed.contentType ?? "",
    };
};

/**
 * 把一次上传响应映射为 `UploadedImage`，失败即抛 `ApiError`。
 *
 * 错误分支按契约 2.10.1 与实测行为处理：
 * - 413：请求体超过 hertz 的 body 上限，响应是**纯文本** `Request Entity Too Large`，
 *   `JSON.parse` 必然失败，这里先按状态码短路，绝不冒泡成解析错误；
 * - 400：`{code:40000,message:"图片过大，请压缩后重试"}`，服务端 message 优先展示；
 *   同为 400 的非图片（`{code:40000,message:"只支持 PNG / JPG / WEBP / GIF 图片"}`）原样透出；
 * - 其余非 2xx、`code !== 0`、2xx 但没有 `url`：都以状态码 + 服务端 message 归一到 `ApiError`。
 */
const parseUploadResponse = (response: UniApp.UploadFileSuccessCallbackResult): UploadedImage => {
    const statusCode = response.statusCode;
    const payload = parseUploadPayload(response.data);
    if (statusCode === 413) {
        throw new ApiError(IMAGE_TOO_LARGE_MESSAGE, statusCode);
    }
    if (statusCode < 200 || statusCode >= 300) {
        const message = resolveApiErrorMessage(statusCode, payload);
        // 服务端 message 命中「过大」语义时统一成本地固定文案，
        // 让用户在「本地预检」与「网络返回」两条路径上看到完全一致的提示。
        if (MESSAGE_TOO_LARGE_PATTERN.test(message)) {
            throw new ApiError(IMAGE_TOO_LARGE_MESSAGE, statusCode, payload.code);
        }
        throw new ApiError(message, statusCode, payload.code);
    }
    // 上传接口是裸 JSON，没有成功码；若服务端意外返回 code 则按业务错误处理。
    if (typeof payload.code === "number" && payload.code !== 0) {
        throw new ApiError(resolveApiErrorMessage(statusCode, payload), statusCode, payload.code);
    }
    return toUploadedImage(payload, statusCode);
};

/**
 * 发送一次 `multipart/form-data` 上传。
 *
 * `uni.uploadFile` 的响应体是**字符串**，解析与错误映射统一在 `parseUploadResponse()` 中完成。
 * 请求头与 `httpRequest` 完全一致，由 `buildRequestHeaders()` 单点生成，两端不会漂移。
 */
const sendUpload = (source: UploadSource, scope?: string): Promise<UploadedImage> => {
    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: buildApiUrl(UPLOAD_PATH),
            // H5 专有：直接传 File，避免 blob URL 在部分浏览器下无法作为 filePath 读取
            ...(isFileObject(source) ? { file: source } : {}),
            filePath: source as string,
            name: "file",
            formData: scope ? { scope } : {},
            header: buildRequestHeaders(),
            success: (response) => {
                try {
                    resolve(parseUploadResponse(response));
                } catch (error) {
                    reject(error);
                }
            },
            fail: () => reject(new ApiError(NETWORK_ERROR_MESSAGE)),
        });
    });
};

/**
 * 上传图片（契约 2.10.1）。
 *
 * - `multipart/form-data`，字段名固定 `file`；`scope` 可选，仅作存储路径前缀
 *   （`avatar` / `activity` / `article` / `chapter`）。
 * - 需要登录：`Authorization` 与 `X-Alumni-Mode: dev` 由 `buildRequestHeaders()` 统一附加。
 * - 返回的 `url` 可直接写入 `avatar` / `cover` 等业务字段，无需再处理。
 */
export const uploadImage = (filePath: string, scope?: string): Promise<UploadedImage> =>
    sendUpload(filePath, scope);

/**
 * 选图并上传，返回上传后的图片信息（H5 与小程序均可直接调用）。
 *
 * `uni.chooseImage` 的结果在两端形状不同：
 * - H5：`tempFiles` 是 `File[]`，走 `file` 字段上传；
 * - 小程序 / App：`tempFilePaths: string[]`，走 `filePath` 字段上传。
 *
 * 上传前先做本地预检（类型 + 大小），常见错误不必等网络往返：
 * 非图片文件抛「仅支持 PNG / JPG / WEBP / GIF 格式的图片」，
 * 超过 5MB 抛「图片过大，请压缩后重试」；用户取消选择抛「未选择图片」。
 */
export const pickAndUploadImage = async (scope: string): Promise<UploadedImage> => {
    const choice = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
        uni.chooseImage({
            count: 1,
            sizeType: ["compressed"],
            sourceType: ["album", "camera"],
            success: resolve,
            fail: () => reject(new ApiError("未选择图片")),
        });
    });

    const tempFile = firstOf(choice.tempFiles);
    const tempFilePath = firstOf(choice.tempFilePaths);
    const localPath = isChooseImageFile(tempFile) ? tempFile.path : tempFilePath;

    if (isUnsupportedImageType(readMimeType(tempFile))) {
        throw new ApiError(IMAGE_TYPE_MESSAGE);
    }
    if (toBytes(isChooseImageFile(tempFile) ? tempFile.size : undefined) > MAX_UPLOAD_BYTES) {
        throw new ApiError(IMAGE_TOO_LARGE_MESSAGE);
    }
    if (isFileObject(tempFile)) {
        return sendUpload(tempFile, scope);
    }
    if (!localPath) {
        throw new ApiError("未选择图片");
    }
    return sendUpload(localPath, scope);
};
