import type {
    createActivityData, createActivityResponse, getActivityDetailsData, getActivityDetailsResponse,
    getActivityListData,
    getActivityListResponse,
    registerData,
    registerResponse, updateActivityData, updateActivityResponse,
} from "@/api/activity/activity-interface";
import {httpRequest} from "@/api/request";

const Authorization = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6MTUsImRldmljZUlkIjoiIiwiZXhwIjoxNzM1MzczMTk5LCJpYXQiOjE3MzI3ODExOTksInVzZXJJZCI6IjY3NDQyNWVkOGU4NjE1NzUxYThkNGFlMyIsIndlY2hhdFVzZXJNZXRhIjp7fX0.ISCNbMgl8-iHpU1G9fQcwMKRY58yd215Qi26ce2EolE2LvzluizZy-PAxnaYvJNw61aat28XEtTteTw1otLKJg'

/**
 * @description 创建活动
 * @param data
 */
export const createActivity = (data: createActivityData): Promise<createActivityResponse> => {
    return httpRequest<createActivityResponse>({
        url: '/activity/create',
        method: 'POST',
        data: data,
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
        data: data,
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
        data: data,
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
        data: data,
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
        data: data,
        headers:
            {
                'Authorization': Authorization
            }
    });
}