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
    UserInfo
} from '@/api/user/user-interface';
import { httpRequest } from '@/api/request';
import { STORAGE_KEYS } from '@/constants/storage';
// 发送验证码
export const sendVerifyCode = (data: SendVerifyCode): Promise<SendVerifyCodeResponse> => {
    return httpRequest<SendVerifyCodeResponse>({
        url: '/sts/send_verify_code',
        method: 'POST',
        data: data
    });
};

// 注册
export const signUp = (data: signUpData): Promise<SignUpResponse> => {
    return httpRequest<SignUpResponse>({
        url: '/user/sign_up',
        method: 'POST',
        data: data
    });
};

// 登录
export const signIn = (data: signInData): Promise<SignInResponse> => {
    return httpRequest<SignInResponse>({
        url: '/user/sign_in',
        method: 'POST',
        data: data
    });
};

// 更新用户信息
export const updateUserInfo = (data: UpdateInfo): Promise<UpdateInfoResponse> => {
    return httpRequest<UpdateInfoResponse>({
        url: '/user/update_info',
        method: 'POST',
        data: data,
        headers: {
            'Authorization': uni.getStorageSync(STORAGE_KEYS.USER).accessToken
        }
    });
};

// 更新工作经历
export const updateEmployment = (data: UpdateEmployment): Promise<UpdateEmploymentResponse> => {
    return httpRequest<UpdateEmploymentResponse>({
        url: '/user/update_employment',
        method: 'POST',
        data: data,
        headers: {
            'Authorization': uni.getStorageSync(STORAGE_KEYS.USER).accessToken
        }
    });
};

// 更新教育经历
export const updateEducation = (data: UpdateEducation): Promise<UpdateEducationResponse> => {
    return httpRequest<UpdateEducationResponse>({
        url: '/user/update_edu',
        method: 'POST',
        headers: {
                    'Authorization': uni.getStorageSync(STORAGE_KEYS.USER).accessToken
                },
        data: data
    });
};

// 获取用户信息
export const getUserInfo = (): Promise<UserInfo> => {
    return httpRequest<UserInfo>({
        url: '/user/info',
        method: 'GET',
        headers: {
                    'Authorization': uni.getStorageSync(STORAGE_KEYS.USER).accessToken
                }
    });
};
