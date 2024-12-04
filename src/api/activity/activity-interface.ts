/**
 * @description 创建活动
 */
export interface createActivityData {
    cover: string;
    name: string;
    location: string;
    exactLocation: string;
    sponsor: string;
    start: number;
    registerStart: number;
    registerEnd: number;
    description: string;
    contact: string;
    limit: number;
}
export interface createActivityResponse {
    code: number;
    msg: string;
}

/**
 * @description 更新活动
 */
export interface updateActivityData {
    id: string;
    cover: string;
    name: string;
    location: string;
    exactLocation: string;
    sponsor: string;
    start: number;
    registerStart: number;
    registerEnd: number;
    description: string;
    contact: string;
    limit: number;
}
export interface updateActivityResponse {
    code: number;
    msg: string;
}

/**
 * @description 获取活动列表
 */
export interface getActivityListData {
    paginationOptions: {
        page: number;
        limit: number;
    }
}

export interface getActivityListResponse {
    total: number;
    activities: Activity[];
}

export interface Activity {
    id: string;
    cover: string;
    name: string;
    location: string;
    exactLocation: string;
    sponsor: string
    start: number;
    registerStart: number;
    registerEnd: number;
    description: string;
    contact: string;
    limit: number;
    status: number;
}

/**
 * @description 获取活动详情
 */
export interface getActivityDetailsData {
    id: string;
}

export interface getActivityDetailsResponse {
    activity: Activity;
    numbers: number
}



/**
 * @description 报名活动
 */
export interface registerData {
    activityId: string;
    items: Item[]
}

export interface registerResponse {
    code: number;
    msg: string;
}

interface Item {
    name: string;
    phone: string;
}



