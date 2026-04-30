import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

// ==================== Bank Account Types ====================
export interface ShopBankAccountResponse {
    id: string;
    shopId: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isDefault: boolean;
    isVerified: boolean;
    createdAt: string;
}

// ==================== Request Types ====================
export interface WithdrawalRequest {
    amount: number;
    bankAccountId: string;
}

// ==================== Response Types ====================
export interface WalletResponse {
    id: string;
    shopId: string;
    shopName: string;
    availableBalance: number;
    pendingBalance: number;
    frozenBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    totalRefunded: number;
}

export interface EscrowSummaryResponse {
    id: string;
    shopOrderId: string;
    shopOrderNumber: string;
    totalAmount: number;
    refundedAmount: number;
    netAmount: number;
    holdUntil: string;
    createdAt: string;
    status: string;
    daysRemaining: number;
}

export interface WithdrawalResponse {
    id: string;
    shopId: string;
    amount: number;
    fee: number;
    netAmount: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    status: string;
    requestedAt: string;
    processedAt?: string;
    rejectionReason?: string;
}

export interface TransactionResponse {
    id: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    type: string;
    status: string;
    referenceType: string;
    referenceId: string;
    orderNumber?: string;
    description: string;
    createdAt: string;
}

// ==================== API ====================
export const shopWalletApi = {
    getMyWallet: async (): Promise<ApiResponse<WalletResponse>> => {
        const response = await axiosInstance.get<ApiResponse<WalletResponse>>(
            API_ENDPOINTS.SHOP_WALLET.BASE
        );
        return response.data;
    },

    requestWithdrawal: async (request: WithdrawalRequest): Promise<ApiResponse<WithdrawalResponse>> => {
        const response = await axiosInstance.post<ApiResponse<WithdrawalResponse>>(
            API_ENDPOINTS.SHOP_WALLET.WITHDRAWALS, request
        );
        return response.data;
    },

    cancelWithdrawal: async (id: string): Promise<ApiResponse<WithdrawalResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WithdrawalResponse>>(
            API_ENDPOINTS.SHOP_WALLET.CANCEL_WITHDRAWAL(id)
        );
        return response.data;
    },

    getWithdrawalHistory: async (params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<WithdrawalResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WithdrawalResponse[]>>(
            API_ENDPOINTS.SHOP_WALLET.WITHDRAWALS, { params }
        );
        return response.data;
    },

    getTransactionHistory: async (params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<TransactionResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<TransactionResponse[]>>(
            API_ENDPOINTS.SHOP_WALLET.TRANSACTIONS, { params }
        );
        return response.data;
    },

    getBankAccounts: async (): Promise<ApiResponse<ShopBankAccountResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<ShopBankAccountResponse[]>>(
            API_ENDPOINTS.SHOP_BANK_ACCOUNTS.BASE
        );
        return response.data;
    },

    getEscrowBreakdown: async (): Promise<ApiResponse<EscrowSummaryResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<EscrowSummaryResponse[]>>(
            API_ENDPOINTS.SHOP_WALLET.ESCROWS
        );
        return response.data;
    },
};
