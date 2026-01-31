import type {AuthResponse, LoginRequest} from "@/models/Auth.ts";
import type {ApiResponse} from "@/models/ApiResponse.ts";
import axiosInstance from "@/api/axios.config.ts";


export const authApi = {
    login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
        const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
            '/v1/auth/login',
            data
        );
        return response.data;
    },
};