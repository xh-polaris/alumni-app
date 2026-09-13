import type {
    SendVerifyCode,
    SendVerifyCodeResponse,
    signUpData,
    SignUpResponse,
    signInData,
    SignInResponse,
    UpdateInfo,
    UpdateInfoResponse,
    UpdateEmployment,
    UpdateEmploymentResponse,
    UpdateEducation,
    UpdateEducationResponse,
    ExchangeWxPhoneResp,
    UserInfo,
    RegisterProfileData,
    RegisterProfileResponse,
    UserProfile,
    UpdateProfileData,
    Education,
    Employment
} from '@/api/user/user-interface';
import { ApiError, httpRequest } from '@/api/request';

const assertAuthSession = <T extends SignInResponse>(
    session: T,
    fallback = '登录失败，请重试',
): T => {
    if (!session.accessToken) {
        throw new ApiError(fallback);
    }
    return session;
};

/**
 * 注册并同时补齐分会/毕业年份/出生日期，触发名册自动核验（契约 2.2）。
 * 返回 memberRole / autoVerified / chapterContact，页面据此展示结果弹层。
 */
export const registerProfile = async (data: RegisterProfileData): Promise<RegisterProfileResponse> => {
    const session = await httpRequest<RegisterProfileResponse>({
        url: '/user/register',
        method: 'POST',
        data,
        auth: false,
    });
    return assertAuthSession(session, '注册失败，请重试');
};

// 获取用户档案（契约 2.3，含 memberRole / chapterId / profileComplete）
export const getProfile = (): Promise<UserProfile> => {
    return httpRequest<UserProfile>({
        url: '/user/profile',
        method: 'GET',
    });
};

// 更新用户档案（契约 2.4，未传字段服务端不改动）
export const updateProfile = (data: UpdateProfileData): Promise<UserProfile> => {
    return httpRequest<UserProfile>({
        url: '/user/profile',
        method: 'PATCH',
        data,
    });
};

// 整体替换教育经历（契约 2.5），返回最新档案
export const replaceEducations = (educations: Education[]): Promise<UserProfile> => {
    return httpRequest<UserProfile>({
        url: '/user/educations',
        method: 'PUT',
        data: { educations },
    });
};

// 整体替换工作经历（契约 2.6），返回最新档案
export const replaceEmployments = (employments: Employment[]): Promise<UserProfile> => {
    return httpRequest<UserProfile>({
        url: '/user/employments',
        method: 'PUT',
        data: { employments },
    });
};
// 发送验证码
export const sendVerifyCode = (data: SendVerifyCode): Promise<SendVerifyCodeResponse> => {
    return httpRequest<SendVerifyCodeResponse>({
        url: '/sts/send_verify_code',
        method: 'POST',
        data,
        auth: false,
    });
};

// 注册
export const signUp = async (data: signUpData): Promise<SignUpResponse> => {
    const session = await httpRequest<SignUpResponse>({
        url: '/user/sign_up',
        method: 'POST',
        data,
        auth: false,
    });
    return assertAuthSession(session, '注册失败，请重试');
};

// 登录
export const signIn = async (data: signInData): Promise<SignInResponse> => {
    const session = await httpRequest<SignInResponse>({
        url: '/user/sign_in',
        method: 'POST',
        data,
        auth: false,
    });
    return assertAuthSession(session);
};

// 更新用户信息
export const updateUserInfo = (data: UpdateInfo): Promise<UpdateInfoResponse> => {
    return httpRequest<UpdateInfoResponse>({
        url: '/user/update_info',
        method: 'POST',
        data,
    });
};

// 更新工作经历
export const updateEmployment = (data: UpdateEmployment): Promise<UpdateEmploymentResponse> => {
    return httpRequest<UpdateEmploymentResponse>({
        url: '/user/update_employment',
        method: 'POST',
        data,
    });
};

// 更新教育经历
export const updateEducation = (data: UpdateEducation): Promise<UpdateEducationResponse> => {
    return httpRequest<UpdateEducationResponse>({
        url: '/user/update_edu',
        method: 'POST',
        data,
    });
};

// 获取用户信息
export const getUserInfo = (): Promise<UserInfo> => {
    return httpRequest<UserInfo>({
        url: '/user/info',
        method: 'GET',
    });
};

// 微信手机号换取
export const exchangeWxPhone = (code: string): Promise<ExchangeWxPhoneResp> => {
    return httpRequest<ExchangeWxPhoneResp>({
        url: '/user/exchange_wx_phone',
        method: 'POST',
        data: { code },
    });
};
