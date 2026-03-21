import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

// ==================== Request Types ====================
export interface CreateWarrantyClaimRequest {
    orderItemId: string;
    issueType: string;
    issueDescription: string;
    issueImages?: string[];
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerDistrictId: number;
    customerWardCode: string;
}

export interface CreateReturnRequest {
    orderItemId: string;
    returnType: string;
    reason: string;
    reasonDetail?: string;
    quantity?: number;
    evidenceImages?: string[];
    exchangeVariantId?: string;
}

// ==================== Response Types ====================
export interface WarrantyClaimResponse {
    id: string;
    claimNumber: string;
    orderItemId: string;
    productName: string;
    productImageUrl?: string;
    shopId: string;
    shopName: string;
    // Customer info (populated for shop-owner views)
    customerName?: string;
    customerEmail?: string;
    customerAvatarUrl?: string;
    // Order info
    purchasedAt?: string;
    warrantyExpiresAt?: string;
    // Issue
    issueType: string;
    issueDescription: string;
    issueImages: string[];
    // Customer logistics address
    customerAddress?: string;
    // Resolution
    resolutionType?: string;
    repairCost?: number;
    customerPays?: number;
    returnTrackingNumber?: string;
    returnDeliveredAt?: string;
    replacementTrackingNumber?: string;
    replacementDeliveredAt?: string;
    // Shipping fee breakdown
    customerShippingFeeToShop?: number;
    platformSubsidyToShop?: number;
    customerShippingFeeToCustomer?: number;
    platformSubsidyToCustomer?: number;
    // Status & dates
    status: string;
    submittedAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    completedAt?: string;
}

export interface ReturnRequestResponse {
    id: string;
    requestNumber: string;
    orderItemId: string;
    productName: string;
    shopId: string;
    shopName: string;
    returnType: string;
    reason: string;
    reasonDetail?: string;
    evidenceImages: string[];
    quantity: number;
    refundAmount?: number;
    exchangeVariantInfo?: string;
    exchangePriceDiff?: number;
    returnTrackingNumber?: string;
    itemCondition?: string;
    status: string;
    requestedAt: string;
    approvedAt?: string;
    itemReceivedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    completedAt?: string;
}

// ==================== API ====================
export const warrantyApi = {
    submitClaim: async (request: CreateWarrantyClaimRequest): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.post<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.WARRANTY.CLAIMS, request
        );
        return response.data;
    },

    getMyClaims: async (params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<WarrantyClaimResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyClaimResponse[]>>(
            API_ENDPOINTS.WARRANTY.CLAIMS, { params }
        );
        return response.data;
    },

    getClaimDetail: async (id: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.WARRANTY.CLAIM_BY_ID(id)
        );
        return response.data;
    },

    submitReturnRequest: async (request: CreateReturnRequest): Promise<ApiResponse<ReturnRequestResponse>> => {
        const response = await axiosInstance.post<ApiResponse<ReturnRequestResponse>>(
            API_ENDPOINTS.RETURNS.REQUESTS, request
        );
        return response.data;
    },

    getMyReturns: async (params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<ReturnRequestResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<ReturnRequestResponse[]>>(
            API_ENDPOINTS.RETURNS.REQUESTS, { params }
        );
        return response.data;
    },

    getReturnDetail: async (id: string): Promise<ApiResponse<ReturnRequestResponse>> => {
        const response = await axiosInstance.get<ApiResponse<ReturnRequestResponse>>(
            API_ENDPOINTS.RETURNS.REQUEST_BY_ID(id)
        );
        return response.data;
    },

    cancelReturn: async (id: string): Promise<ApiResponse<ReturnRequestResponse>> => {
        const response = await axiosInstance.put<ApiResponse<ReturnRequestResponse>>(
            API_ENDPOINTS.RETURNS.CANCEL(id)
        );
        return response.data;
    },

    // ==================== Shop Owner ====================
    getShopClaims: async (params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<WarrantyClaimResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyClaimResponse[]>>(
            API_ENDPOINTS.SHOP_WARRANTY.CLAIMS, { params }
        );
        return response.data;
    },

    approveShopClaim: async (claimId: string, resolutionType: string, repairCost?: number): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.APPROVE(claimId),
            { resolutionType, ...(repairCost != null ? { repairCost } : {}) }
        );
        return response.data;
    },

    rejectShopClaim: async (claimId: string, reason: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.REJECT(claimId), { reason }
        );
        return response.data;
    },

    payClaimVnpay: async (claimId: string): Promise<ApiResponse<string>> => {
        const response = await axiosInstance.post<ApiResponse<string>>(
            API_ENDPOINTS.WARRANTY.PAY_VNPAY(claimId)
        );
        return response.data;
    },

    payClaimWallet: async (claimId: string): Promise<ApiResponse<string>> => {
        const response = await axiosInstance.post<ApiResponse<string>>(
            API_ENDPOINTS.WARRANTY.PAY_WALLET(claimId)
        );
        return response.data;
    },

    markItemReceived: async (claimId: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.RECEIVE(claimId)
        );
        return response.data;
    },

    completeShopClaim: async (claimId: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.COMPLETE(claimId)
        );
        return response.data;
    },
};
