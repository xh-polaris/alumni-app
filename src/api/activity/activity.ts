import type {registerData,registerResponse} from "@/api/activity/activity-interface";
import {httpRequest} from "@/api/request";

export const registerUser = (data: registerData): Promise<registerResponse> => {
    return httpRequest<registerResponse>({
        url: '/activity/register',
        method: 'POST',
        data: data,
        headers:
            {
                'Authorization': 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6MTUsImRldmljZUlkIjoiIiwiZXhwIjoxNzM1MzczMTk5LCJpYXQiOjE3MzI3ODExOTksInVzZXJJZCI6IjY3NDQyNWVkOGU4NjE1NzUxYThkNGFlMyIsIndlY2hhdFVzZXJNZXRhIjp7fX0.ISCNbMgl8-iHpU1G9fQcwMKRY58yd215Qi26ce2EolE2LvzluizZy-PAxnaYvJNw61aat28XEtTteTw1otLKJg'
            }
    });
}