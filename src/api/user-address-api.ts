import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

// ==================== Types ====================

export interface UserAddressResponse {
    id: string;
    label: string;
    recipientName: string;
    recipientPhone: string;
    addressLine1: string;
    addressLine2?: string;
    ward: string;
    district: string;
    city: string;
    postalCode?: string;
    isDefault: boolean;
    ghnProvinceId: number;
    ghnDistrictId: number;
    ghnWardCode: string;
}

export interface UserAddressRequest {
    label: string;
    recipientName: string;
    recipientPhone: string;
    addressLine1: string;
    addressLine2?: string;
    ward: string;
    district: string;
    city: string;
    postalCode?: string;
    isDefault?: boolean;
    ghnProvinceId: number;
    ghnDistrictId: number;
    ghnWardCode: string;
}

// ==================== API ====================

export const userAddressApi = {
    getAll: async (): Promise<ApiResponse<UserAddressResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<UserAddressResponse[]>>(
            API_ENDPOINTS.USER_ADDRESSES.BASE
        );
        return response.data;
    },

    create: async (data: UserAddressRequest): Promise<ApiResponse<UserAddressResponse>> => {
        const response = await axiosInstance.post<ApiResponse<UserAddressResponse>>(
            API_ENDPOINTS.USER_ADDRESSES.BASE,
            data
        );
        return response.data;
    },

    update: async (id: string, data: UserAddressRequest): Promise<ApiResponse<UserAddressResponse>> => {
        const response = await axiosInstance.put<ApiResponse<UserAddressResponse>>(
            API_ENDPOINTS.USER_ADDRESSES.UPDATE(id),
            data
        );
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.USER_ADDRESSES.DELETE(id)
        );
        return response.data;
    },

    setDefault: async (id: string): Promise<ApiResponse<UserAddressResponse>> => {
        const response = await axiosInstance.patch<ApiResponse<UserAddressResponse>>(
            API_ENDPOINTS.USER_ADDRESSES.SET_DEFAULT(id)
        );
        return response.data;
    },
};
