import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

// ==================== Response Types ====================

export interface UserWalletResponse {
    id: string;
    userId: string;
    availableBalance: number;
    totalTopUp: number;
    totalSpent: number;
}

// UserTransactionType: TOP_UP | ORDER_PAYMENT | REFUND
// TransactionStatus:   PENDING | PROCESSING | COMPLETED | FAILED | CANCELLED
export interface UserTransactionResponse {
    id: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    type: 'TOP_UP' | 'ORDER_PAYMENT' | 'REFUND';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    referenceType: string;
    referenceId: string;
    description: string;
    createdAt: string;
}

// ==================== API ====================

export const userWalletApi = {
    getMyWallet: async (): Promise<ApiResponse<UserWalletResponse>> => {
        const response = await axiosInstance.get<ApiResponse<UserWalletResponse>>(
            API_ENDPOINTS.USER_WALLET.BASE
        );
        return response.data;
    },

    getTransactionHistory: async (params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<UserTransactionResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<UserTransactionResponse[]>>(
            API_ENDPOINTS.USER_WALLET.TRANSACTIONS, { params }
        );
        return response.data;
    },
};
