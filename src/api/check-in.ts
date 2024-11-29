import { httpRequest } from "./request";

export interface checkInResponse {
    code: number;
    msg: string;
}

export interface checkInDetails {
    total: number;
    checked: number;
    registers : Register[]
}

export interface Register {
    id: string;
    activityId: string;
    name: string;
    phone: string;
    checkIn: boolean;
    createTime: number;
    updateTime: number;
}

export interface checkInData {
    activityId: string;
    name: string;
    phone: string;
}
export const signIn = (data: checkInData) => {
    return httpRequest<checkInResponse>({
        url: "/activity/check_in",
        method: "POST",
        data: data,
    });
};

export const getCheckInDetails = (activityId: string) => {
    return httpRequest<checkInDetails>({
        url: "/activity/get_register",
        method: "POST",
        data: {
            activityId: activityId
        }
    });
};
