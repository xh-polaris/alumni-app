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
    UserInfo
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
