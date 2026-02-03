// ============================================
// USER API SERVICE - Các API endpoints cho User
// Bao gồm: get profile, update profile, change password, upload avatar
// ============================================


import type {
    ChangePasswordRequest,
    UpdateProfileRequest,
    UploadAvatarResponse,
    UserResponse,
    UserProfileResponse
} from "@/models/User.ts";
import axiosInstance, { TokenManager } from "@/api/axios.config.ts";
import type { ApiResponse } from "@/models/ApiResponse.ts";

/**
 * Base URL cho user endpoints
 */
const USER_BASE_URL = '/users';

export interface UserResponseTemp {
    id: number;
    username: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
}

/**
 * User API Service
 * Chứa tất cả các API calls liên quan đến User
 */
export const userApi = {
    // ==================== GET PROFILE ====================

    /**
     * Lấy thông tin profile của current user
     * @returns Promise<UserProfileResponse>
     */
    getMyProfile: async (): Promise<ApiResponse<UserProfileResponse>> => {
        const response = await axiosInstance.get<ApiResponse<UserProfileResponse>>(
            `${USER_BASE_URL}/me`
        );
        return response.data;
    },

    // getCurrentUser: async (): Promise<ApiResponse<UserResponse>> => {
    //     const token = TokenManager.getAccessToken();
    //     if (!token) {
    //         throw new Error("No access token found");
    //     }
    //     const response = await axiosInstance.get<ApiResponse<UserResponse>>(
    //         `${USER_BASE_URL}/${token}`
    //     );
    //     return response.data;
    // },

    getMyProfileTemp: async (): Promise<ApiResponse<UserResponseTemp>> => {
        const response = await axiosInstance.get<ApiResponse<UserResponseTemp>>(
            `${USER_BASE_URL}/me`
        );
        return response.data;
    },

    /**
     * Lấy thông tin profile theo user ID (cho admin hoặc public profile)
     * @param userId - ID của user cần lấy
     * @returns Promise<User>
     */
    getUserById: async (userId: number): Promise<ApiResponse<UserProfileResponse>> => {
        const response = await axiosInstance.get<ApiResponse<UserProfileResponse>>(
            `${USER_BASE_URL}/${userId}`
        );
        return response.data;
    },

    // ==================== UPDATE PROFILE ====================

    /**
     * Cập nhật thông tin profile
     * @param data - Dữ liệu cần update
     * @returns Promise<User>
     */
    updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<UserProfileResponse>> => {
        const response = await axiosInstance.put<ApiResponse<UserProfileResponse>>(
            `${USER_BASE_URL}/me`,
            data
        );
        return response.data;
    },

    /**
     * Cập nhật full name
     * @param fullName - Tên mới
     * @returns Promise<User>
     */
    updateFullName: async (fullName: string): Promise<ApiResponse<UserProfileResponse>> => {
        return userApi.updateProfile({ fullName });
    },

    // ==================== AVATAR ====================

    /**
     * Upload avatar mới
     * @param file - File ảnh avatar
     * @returns Promise<UploadAvatarResponse>
     */
    uploadAvatar: async (file: File): Promise<ApiResponse<UploadAvatarResponse>> => {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await axiosInstance.post<ApiResponse<UploadAvatarResponse>>(
            `${USER_BASE_URL}/me/avatar`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Xóa avatar hiện tại
     * @returns Promise<void>
     */
    deleteAvatar: async (): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `${USER_BASE_URL}/me/avatar`
        );
        return response.data;
    },

    // ==================== PASSWORD ====================

    /**
     * Đổi mật khẩu
     * @param data - Thông tin đổi mật khẩu
     * @returns Promise<void>
     */
    changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.put<ApiResponse<void>>(
            `${USER_BASE_URL}/me/password`,
            data
        );
        return response.data;
    },

    /**
     * Kiểm tra mật khẩu hiện tại có đúng không
     * @param password - Mật khẩu cần kiểm tra
     * @returns Promise<boolean>
     */
    verifyPassword: async (password: string): Promise<ApiResponse<boolean>> => {
        const response = await axiosInstance.post<ApiResponse<boolean>>(
            `${USER_BASE_URL}/me/verify-password`,
            { password }
        );
        return response.data;
    },

    // ==================== AUTH PROVIDERS ====================

    /**
     * Liên kết tài khoản với Google
     * @param googleToken - Token từ Google OAuth
     * @returns Promise<User>
     */
    linkGoogleAccount: async (googleToken: string): Promise<ApiResponse<UserProfileResponse>> => {
        const response = await axiosInstance.post<ApiResponse<UserProfileResponse>>(
            `${USER_BASE_URL}/me/link/google`,
            { token: googleToken }
        );
        return response.data;
    },

    /**
     * Hủy liên kết tài khoản Google
     * @returns Promise<User>
     */
    unlinkGoogleAccount: async (): Promise<ApiResponse<UserProfileResponse>> => {
        const response = await axiosInstance.delete<ApiResponse<UserProfileResponse>>(
            `${USER_BASE_URL}/me/link/google`
        );
        return response.data;
    },

    // ==================== ACCOUNT ====================

    /**
     * Xóa tài khoản (soft delete)
     * @returns Promise<void>
     */
    deleteAccount: async (): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `${USER_BASE_URL}/me`
        );
        return response.data;
    },

    /**
     * Export dữ liệu cá nhân (GDPR compliance)
     * @returns Promise<Blob>
     */
    exportMyData: async (): Promise<Blob> => {
        const response = await axiosInstance.get(`${USER_BASE_URL}/me/export`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

export default userApi;