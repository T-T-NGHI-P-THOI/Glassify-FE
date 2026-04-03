import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

export interface UserBankAccountResponse {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isDefault: boolean;
    createdAt: string;
}

export interface UserBankAccountRequest {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isDefault?: boolean;
}

export const userBankAccountApi = {
    getMyBankAccounts: async (): Promise<ApiResponse<UserBankAccountResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<UserBankAccountResponse[]>>(
            API_ENDPOINTS.USER_BANK_ACCOUNTS.BASE
        );
        return response.data;
    },

    addBankAccount: async (req: UserBankAccountRequest): Promise<ApiResponse<UserBankAccountResponse>> => {
        const response = await axiosInstance.post<ApiResponse<UserBankAccountResponse>>(
            API_ENDPOINTS.USER_BANK_ACCOUNTS.BASE, req
        );
        return response.data;
    },

    setDefaultBankAccount: async (id: string): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.put<ApiResponse<void>>(
            API_ENDPOINTS.USER_BANK_ACCOUNTS.SET_DEFAULT(id)
        );
        return response.data;
    },

    deleteBankAccount: async (id: string): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.USER_BANK_ACCOUNTS.DELETE(id)
        );
        return response.data;
    },
};
