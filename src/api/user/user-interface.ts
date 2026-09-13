/**
 * 发送验证码
 */
export interface SendVerifyCode {
    authType: string // 默认为"phone"
    authId: string
    type: number //0是注册，1是登录
}

export interface SendVerifyCodeResponse {
    code: number
    msg: string
}

/**
 * 注册接口
 */
export interface signUpData {
    authId: string //电话号码
    authType: string //默认为"phone"
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
    authId: string
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
    provinceCode?: string
    provinceName?: string
    cityCode?: string
    cityName?: string
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

/** 契约 2.5 允许的学段（其余值服务端返回 400） */
export const SUPPORTED_EDUCATION_PHASES = ['大专', '本科', '硕士', '博士', '其他'] as const

/** 旧数据中可能出现的学段，用户端只读展示，不允许新增 */
export const LEGACY_EDUCATION_PHASES = ['小学', '初中', '高中', '中专/职高'] as const

export interface Education {
    phase: string
    school: string
    year: number//毕业年份
    provinceCode?: string
    provinceName?: string
    cityCode?: string
    cityName?: string
}

export interface UpdateEducationResponse {
    code: number
    msg: string
}

/** 用户身份（契约 1） */
export type MemberRole = 'pending' | 'alumni' | 'guest'

/** 认证方式（契约 1） */
export type VerificationMethod = 'none' | 'roster' | 'manual'

/**
 * 分会联络人（契约 2.2 注册返回）
 */
export interface ChapterContactInfo {
    name: string
    wechat: string
    phone: string
    description: string
    qrCodeUrl: string
}

/** 契约 2.2 响应中的 chapterContact（分会对象本身） */
export interface RegisterChapter {
    id: string
    code: string
    name: string
    contact: ChapterContactInfo
}

/**
 * 注册接口（契约 2.2 POST /user/register）
 */
export interface RegisterProfileData {
    authId: string //电话号码
    authType: string //默认为"phone"
    verifyCode: string
    password: string
    name: string
    graduationYear: number
    birthDate: string // YYYY-MM-DD
    chapterId: string
}

export interface RegisterProfileResponse {
    id: string
    accessToken: string
    accessExpire: number
    memberRole: MemberRole
    autoVerified: boolean
    chapterContact: RegisterChapter
}

/**
 * 用户档案（契约 2.3 GET /user/profile）
 */
export interface UserProfile {
    id: string
    avatar: string
    name: string
    gender: number
    birthday: number
    birthDate: string
    phone: string
    wxId: string
    hometown: string
    chapterId: string
    chapterName: string
    graduationYear: number
    memberRole: MemberRole
    verificationMethod: VerificationMethod
    profileComplete: boolean
    educations: Education[]
    employments: Employment[]
}

/**
 * 可更新档案字段（契约 2.4 PATCH /user/profile）
 */
export interface UpdateProfileData {
    avatar?: string
    name?: string
    gender?: number
    phone?: string
    wxId?: string
    hometown?: string
    chapterId?: string
    /** 四位毕业年份；补全资料时与出生日期一起提交会触发名册重新核验 */
    graduationYear?: number
    /** 身份证出生日期，格式 YYYY-MM-DD；服务端只保存出生日期 */
    birthDate?: string
}

/**
 * 整体替换教育/工作经历（契约 2.5 / 2.6）
 */
export interface ReplaceEducationsData {
    educations: Education[]
}

export interface ReplaceEmploymentsData {
    employments: Employment[]
}

/**
 * 获取用户信息（旧接口 /user/info，仍在使用）
 * `educations` 为新契约 2.3 的统一教育经历；旧客户端可能只有
 * shanghaiEducations / hometownEducations 两组，个人中心会做兼容合并。
 */
export interface UserInfo {
    name: string
    avatar: string
    gender: number
    birthday: number
    phone: string
    hometown: string
    employments: Employment[]
    hometownEducations: Education[]
    shanghaiEducations: Education[]
    educations?: Education[]
}

/** 微信手机号换取 */
export interface ExchangeWxPhoneResp {
    phoneNumber: string
}
