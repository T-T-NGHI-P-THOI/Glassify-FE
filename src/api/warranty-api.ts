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
    // Customer info
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
    // Resolution & fault
    resolutionType?: string;
    faultType?: string;
    inspectionNote?: string;
    repairCost?: number;
    customerPays?: number;
    returnTrackingNumber?: string;
    replacementTrackingNumber?: string;
    // Shipping fee breakdown
    customerShippingFeeToShop?: number;
    platformSubsidyToShop?: number;
    customerShippingFeeToCustomer?: number;
    platformSubsidyToCustomer?: number;
    // Escrow
    escrowAmount?: number;
    escrowHeldAt?: string;
    escrowReleasedAt?: string;
    // Payment
    paymentStatus?: string;
    paymentMethod?: string;
    paidAt?: string;
    // Actual delivery times (set by GHN webhook)
    deliveredToShopAt?: string;
    deliveredToCustomerAt?: string;
    // Status & dates
    status: string;
    submittedAt: string;
    approvedAt?: string;
    itemReceivedAt?: string;
    quotedAt?: string;
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

    uploadWarrantyImages: async (files: File[]): Promise<ApiResponse<string[]>> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await axiosInstance.post<ApiResponse<string[]>>(
            `${API_ENDPOINTS.WARRANTY.CLAIMS}/upload-images`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
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

    payClaimVnpay: async (claimId: string): Promise<ApiResponse<string>> => {
        const response = await axiosInstance.post<ApiResponse<string>>(
            API_ENDPOINTS.WARRANTY.PAY_VNPAY(claimId)
        );
        return response.data;
    },

    payClaimWallet: async (claimId: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.WARRANTY.PAY_WALLET(claimId)
        );
        return response.data;
    },

    rejectQuote: async (claimId: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.WARRANTY.REJECT_QUOTE(claimId)
        );
        return response.data;
    },

    markCustomerReceived: async (claimId: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.WARRANTY.RECEIVE(claimId)
        );
        return response.data;
    },

    getWarrantyGhnStatus: async (claimId: string): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.get<ApiResponse<any>>(
            API_ENDPOINTS.WARRANTY.GHN_STATUS(claimId)
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

    getShopClaimDetail: async (claimId: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.CLAIM_BY_ID(claimId)
        );
        return response.data;
    },

    approveShopClaim: async (claimId: string, resolutionType: string, faultType?: string, repairCost?: number): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.APPROVE(claimId),
            { resolutionType, faultType, repairCost }
        );
        return response.data;
    },

    rejectShopClaim: async (claimId: string, reason: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.REJECT(claimId), { reason }
        );
        return response.data;
    },

    markItemReceived: async (claimId: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.RECEIVE(claimId)
        );
        return response.data;
    },

    quoteShopClaim: async (claimId: string, resolutionType: string, faultType: string, repairCost: number, inspectionNote?: string): Promise<ApiResponse<WarrantyClaimResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyClaimResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.QUOTE(claimId),
            { resolutionType, faultType, repairCost, inspectionNote }
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
