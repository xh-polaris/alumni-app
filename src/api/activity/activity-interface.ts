export interface registerData {
    activityId: string;
    items: Item[];
}

interface Item {
    name: string;
    phone: string;
}

export interface registerResponse {
    code: number;
    msg: string;
}