import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

// ==================== Request Types ====================
export interface CreatePaymentRequest {
    orderId: string;
    orderInfo?: string;
    bankCode?: string;
}

// ==================== Response Types ====================
export interface PaymentResultResponse {
    status: string;
    message: string;
    txnRef: string;
    orderId: string;
    orderNumber: string;
    amount: number;
    transactionNo: string;
    bankCode: string;
    cardType: string;
    payDate: string;
    responseCode: string;
}

// ==================== API ====================
export const paymentApi = {
    createVnpayPayment: async (request: CreatePaymentRequest): Promise<ApiResponse<string>> => {
        const response = await axiosInstance.post<ApiResponse<string>>(
            API_ENDPOINTS.PAYMENTS.CREATE_VNPAY, request
        );
        return response.data;
    },

    getPaymentStatus: async (orderId: string): Promise<ApiResponse<PaymentResultResponse>> => {
        const response = await axiosInstance.get<ApiResponse<PaymentResultResponse>>(
            API_ENDPOINTS.PAYMENTS.STATUS(orderId)
        );
        return response.data;
    },
};
