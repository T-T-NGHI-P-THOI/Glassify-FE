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
    customerPhone?: string;
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

export interface WarrantyServicePriceResponse {
    id: string;
    serviceName: string;
    price: number;
    description?: string;
    isActive: boolean;
}

export interface WarrantyIssueTypeResponse {
    id: string;
    typeName: string;
    description?: string;
    isActive: boolean;
}

export interface UpdateWarrantyIssueTypeRequest {
    typeName: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateWarrantyServicePriceRequest {
    serviceName: string;
    price: number;
    description?: string;
    isActive?: boolean;
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

    // --- Warranty Service Prices ---
    getShopServicePrices: async (shopId: string): Promise<ApiResponse<WarrantyServicePriceResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyServicePriceResponse[]>>(
            API_ENDPOINTS.WARRANTY_PUBLIC.SERVICE_PRICES_BY_SHOP(shopId)
        );
        return response.data;
    },

    getMyServicePrices: async (): Promise<ApiResponse<WarrantyServicePriceResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyServicePriceResponse[]>>(
            API_ENDPOINTS.SHOP_WARRANTY.SERVICE_PRICES
        );
        return response.data;
    },

    createServicePrice: async (request: UpdateWarrantyServicePriceRequest): Promise<ApiResponse<WarrantyServicePriceResponse>> => {
        const response = await axiosInstance.post<ApiResponse<WarrantyServicePriceResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.SERVICE_PRICES, request
        );
        return response.data;
    },

    updateServicePrice: async (id: string, request: UpdateWarrantyServicePriceRequest): Promise<ApiResponse<WarrantyServicePriceResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyServicePriceResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.SERVICE_PRICE_BY_ID(id), request
        );
        return response.data;
    },

    deleteServicePrice: async (id: string): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.SHOP_WARRANTY.SERVICE_PRICE_BY_ID(id)
        );
        return response.data;
    },

    // --- Warranty Issue Types ---
    getShopIssueTypes: async (shopId: string): Promise<ApiResponse<WarrantyIssueTypeResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyIssueTypeResponse[]>>(
            API_ENDPOINTS.WARRANTY_PUBLIC.ISSUE_TYPES_BY_SHOP(shopId)
        );
        return response.data;
    },

    getMyIssueTypes: async (): Promise<ApiResponse<WarrantyIssueTypeResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyIssueTypeResponse[]>>(
            API_ENDPOINTS.SHOP_WARRANTY.ISSUE_TYPES
        );
        return response.data;
    },

    createIssueType: async (request: UpdateWarrantyIssueTypeRequest): Promise<ApiResponse<WarrantyIssueTypeResponse>> => {
        const response = await axiosInstance.post<ApiResponse<WarrantyIssueTypeResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.ISSUE_TYPES, request
        );
        return response.data;
    },

    updateIssueType: async (id: string, request: UpdateWarrantyIssueTypeRequest): Promise<ApiResponse<WarrantyIssueTypeResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyIssueTypeResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.ISSUE_TYPE_BY_ID(id), request
        );
        return response.data;
    },

    deleteIssueType: async (id: string): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.SHOP_WARRANTY.ISSUE_TYPE_BY_ID(id)
        );
        return response.data;
    },

    // --- Warranty Policies ---
    getShopPolicies: async (shopId: string): Promise<ApiResponse<WarrantyPolicyResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyPolicyResponse[]>>(
            API_ENDPOINTS.WARRANTY_PUBLIC.POLICIES_BY_SHOP(shopId)
        );
        return response.data;
    },

    getMyPolicies: async (): Promise<ApiResponse<WarrantyPolicyResponse[]>> => {
        const response = await axiosInstance.get<ApiResponse<WarrantyPolicyResponse[]>>(
            API_ENDPOINTS.SHOP_WARRANTY.POLICIES
        );
        return response.data;
    },

    createPolicy: async (request: UpdateWarrantyPolicyRequest): Promise<ApiResponse<WarrantyPolicyResponse>> => {
        const response = await axiosInstance.post<ApiResponse<WarrantyPolicyResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.POLICIES, request
        );
        return response.data;
    },

    updatePolicy: async (id: string, request: UpdateWarrantyPolicyRequest): Promise<ApiResponse<WarrantyPolicyResponse>> => {
        const response = await axiosInstance.put<ApiResponse<WarrantyPolicyResponse>>(
            API_ENDPOINTS.SHOP_WARRANTY.POLICY_BY_ID(id), request
        );
        return response.data;
    },

    deletePolicy: async (id: string): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.SHOP_WARRANTY.POLICY_BY_ID(id)
        );
        return response.data;
    },
};

export interface WarrantyPolicyResponse {
    id: string;
    name: string;
    durationMonths: number;
    coverageDescription?: string;
    excludedIssues: string[];
    isDefault: boolean;
    isActive: boolean;
}

export interface UpdateWarrantyPolicyRequest {
    name: string;
    durationMonths: number;
    coverageDescription?: string;
    excludedIssues: string[];
    isDefault?: boolean;
    isActive?: boolean;
}
