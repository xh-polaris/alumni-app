import type {
    createActivityData, createActivityResponse, getActivityDetailsData, getActivityDetailsResponse,
    getMyActivityRegistrationsData,
    getMyActivityRegistrationsResponse,
    getActivityListData,
    getActivityListResponse,
    registerData,
    registerResponse, updateActivityData, updateActivityResponse,
} from "@/api/activity/activity-interface";
import {httpRequest} from "@/api/request";


/**
 * @description 创建活动
 * @param data
 */
export const createActivity = (data: createActivityData): Promise<createActivityResponse> => {
    return httpRequest<createActivityResponse>({
        url: '/activity/create',
        method: 'POST',
        data,
    });
}

/**
 * @description 更新活动
 * @param data
 */
export const updateActivity = (data: updateActivityData): Promise<updateActivityResponse> => {
    return httpRequest<updateActivityResponse>({
        url: '/activity/update',
        method: 'POST',
        data,
    });
}

/**
 * @description 获取活动列表
 * @param data
 */
export const getActivityList = (data: getActivityListData): Promise<getActivityListResponse> => {
    return httpRequest<getActivityListResponse>({
        url: '/activity/get_many',
        method: 'POST',
        data,
        auth: false,
    });
}

/**
 * @description 获取活动详情
 * @param data
 */
export const getActivityDetails = (data: getActivityDetailsData): Promise<getActivityDetailsResponse> => {
    return httpRequest<getActivityDetailsResponse>({
        url: '/activity/get',
        method: 'POST',
        data,
        auth: false,
    });
}

/**
 * @description 获取当前用户在某活动下的报名记录
 * @param data
 */
export const getMyActivityRegistrations = (data: getMyActivityRegistrationsData): Promise<getMyActivityRegistrationsResponse> => {
    return httpRequest<getMyActivityRegistrationsResponse>({
        url: '/activity/get_register',
        method: 'POST',
        data: {
            activityId: `:${data.activityId}`,
        },
    });
}

/**
 * @description 报名活动
 * @param data
 */
export const registerUser = (data: registerData): Promise<registerResponse> => {
    return httpRequest<registerResponse>({
        url: '/activity/register',
        method: 'POST',
        data,
    });
}
