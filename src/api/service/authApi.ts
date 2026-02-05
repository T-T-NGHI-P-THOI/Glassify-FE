import type { AuthResponse, LoginRequest } from "@/models/Auth.ts";
import type { ApiResponse } from "@/models/ApiResponse.ts";
import axiosInstance from "@/api/axios.config.ts";
import type { UserResponse } from "@/models/User.ts";



export interface GoogleLoginRequest {
    idToken: string;
}

// export interface AuthResponse {
//     accessToken: string;
//     tokenType: string;
//     user: UserResponse;
// }

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    fullName: string;
    gender: string;
}

export const authApi = {
    login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
        const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
            '/v1/auth/login',
            data
        );
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
        const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
            '/v1/auth/register',
            data
        )
        return response.data;
    },

    loginWithGoogle: async (data: GoogleLoginRequest): Promise<ApiResponse<AuthResponse>> => {
        const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
            '/v1/auth/google',
            data
        )
        return response.data;
    }

};