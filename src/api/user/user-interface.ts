/**
 * 注册接口
 */
export interface signUpData {
    authid: string
    authType: string
    verifyCode: string
    password: string
    name: string
}

export interface SignUpResponse {
    id: string
    accessToken: string
    accessExpire: number
}

/**
 * 登录接口
 */
export interface signInData {
    authid: string
    authType: string
    verifyCode?: string
    password?: string
}

export interface SignInResponse {
    id: string
    accessToken: string
    accessExpire: number
}

/**
 * 更新用户信息
 */
export interface UpdateInfo {
    avatar?: string
    name?: string
    gender?: number//1男2女0未填写
    birthday?: number// 当天0时的时间戳
    phone?: string
    wxid?: string
    hometown?: string
}

export interface UpdateInfoResponse {
    code: number
    msg: string
}

/**
 * 更新在沪工作经历
 */
export interface UpdateEmployment {
    employments: Employment[]
}

export interface Employment {
    organization: string
    position: string
    industry: string
    entry: number
    departure: number
}

export interface UpdateEmploymentResponse {
    code: number
    msg: string
}

/**
 * 更新教育经历
 */
export interface UpdateEducation {
    type: number
    educations: Education[]
}

export interface Education {
    phrase: string
    school: string
    year: number//毕业年份
}

export interface UpdateEducationResponse {
    code: number
    msg: string
}

/**
 * 获取用户信息
 */
export interface UserInfo {
    name: string
    avatar: string
    gender: number
    birthday: number
    phone: string
    wxid: string
    hometown: string
    employments: Employment[]
    hometownEducations: Education[]
    shanghaiEducations: Education[]
}

