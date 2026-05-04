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
    totalRefunded: number;
}

export interface OrderTransactionSummary {
    orderNumber: string;
    shippingFee: number;
    subtotal: number;
    totalAmount: number;
    items: Array<{
        productName: string;
        itemType: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        isFree: boolean;
        parentItemId?: string;
    }>;
}

// UserTransactionType: TOP_UP | ORDER_PAYMENT | REFUND | WITHDRAWAL
// TransactionStatus:   PENDING | PROCESSING | COMPLETED | FAILED | CANCELLED
export interface UserTransactionResponse {
    id: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    type: 'TOP_UP' | 'ORDER_PAYMENT' | 'REFUND' | 'WITHDRAWAL';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    referenceType: string;
    referenceId: string;
    description: string;
    createdAt: string;
    orderSummary?: OrderTransactionSummary;
}

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface UserWithdrawalResponse {
    id: string;
    userId: string;
    amount: number;
    fee: number;
    netAmount: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    status: WithdrawalStatus;
    requestedAt: string;
    processedAt?: string;
    rejectionReason?: string;
}

export interface UserWithdrawalRequest {
    amount: number;
    bankAccountId: string;
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

    requestWithdrawal: async (req: UserWithdrawalRequest): Promise<ApiResponse<UserWithdrawalResponse>> => {
        const response = await axiosInstance.post<ApiResponse<UserWithdrawalResponse>>(
            API_ENDPOINTS.USER_WALLET.WITHDRAWALS, req
        );
        return response.data;
    },

    cancelWithdrawal: async (id: string): Promise<ApiResponse<UserWithdrawalResponse>> => {
        const response = await axiosInstance.put<ApiResponse<UserWithdrawalResponse>>(
            API_ENDPOINTS.USER_WALLET.CANCEL_WITHDRAWAL(id)
        );
        return response.data;
    },

    getWithdrawalHistory: async (params?: { page?: number; size?: number }): Promise<ApiResponse<UserWithdrawalResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<UserWithdrawalResponse[]>>(
            API_ENDPOINTS.USER_WALLET.WITHDRAWALS, { params }
        );
        return response.data;
    },
};
