import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

// ==================== Request Types ====================
export interface CreateOrderRequest {
    cartId: string;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity?: string;
    customerNote?: string;
    paymentMethod: string;
    couponCode?: string;
    selectedServiceId?: number;
    toDistrictId?: number;
    toWardCode?: string;
}

export interface CancelOrderRequest {
    reason?: string;
}

// ==================== Response Types ====================
export interface OrderItemResponse {
    id: string;
    productName: string;
    productSku?: string;
    productImageUrl?: string;
    variantInfo?: Record<string, unknown>;
    lensName?: string;
    lensTintName?: string;
    lensFeaturesSnapshot?: Record<string, unknown>;
    prescriptionSnapshot?: Record<string, unknown>;
    unitPrice: number;
    quantity: number;
    discountAmount: number;
    lineTotal: number;
    isFree: boolean;
    giftNote?: string;
    warrantyMonths: number;
    warrantyExpiresAt?: string;
    timesReturned: number;
    timesWarrantyClaimed: number;
    itemType: string;
    shopId: string;
    shopName: string;
    shopLogoUrl?: string;
}

export interface OrderResponse {
    id: string;
    orderNumber: string;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    totalAmount: number;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity?: string;
    customerNote?: string;
    orderedAt: string;
    paidAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    trackingNumber?: string;
    toDistrictId?: number;
    toWardCode?: string;
    items: OrderItemResponse[];
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    refundRequestId?: string;
    refundRequestedAt?: string;
    refundStatus?: string;
}

export interface OrderListResponse {
    orders: OrderResponse[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    statusCounts: Record<string, number>;
}

// ==================== API ====================
export const orderApi = {
    createOrder: async (request: CreateOrderRequest): Promise<ApiResponse<OrderResponse>> => {
        const response = await axiosInstance.post<ApiResponse<OrderResponse>>(
            API_ENDPOINTS.ORDERS.CREATE, request
        );
        return response.data;
    },

    getMyOrders: async (params?: {
        status?: string;
        page?: number;
        size?: number;
    }): Promise<ApiResponse<OrderListResponse>> => {
        const response = await axiosInstance.get<ApiResponse<OrderListResponse>>(
            API_ENDPOINTS.ORDERS.GET_MY_ORDERS, { params }
        );
        return response.data;
    },

    getOrderDetail: async (orderId: string): Promise<ApiResponse<OrderResponse>> => {
        const response = await axiosInstance.get<ApiResponse<OrderResponse>>(
            API_ENDPOINTS.ORDERS.GET_BY_ID(orderId)
        );
        return response.data;
    },

    cancelOrder: async (orderId: string, request?: CancelOrderRequest): Promise<ApiResponse<OrderResponse>> => {
        const response = await axiosInstance.put<ApiResponse<OrderResponse>>(
            API_ENDPOINTS.ORDERS.CANCEL(orderId), request
        );
        return response.data;
    },

    cancelShopOrder: async (orderId: string, shopOrderId: string, reason?: string): Promise<ApiResponse<unknown>> => {
        const response = await axiosInstance.put<ApiResponse<unknown>>(
            API_ENDPOINTS.ORDERS.CANCEL_SHOP_ORDER(orderId, shopOrderId),
            null,
            { params: reason ? { reason } : undefined }
        );
        return response.data;
    },


    reOrder: async (orderId: string): Promise<ApiResponse<OrderResponse>> => {
        const response = await axiosInstance.post<ApiResponse<OrderResponse>>(
            API_ENDPOINTS.ORDERS.RE_ORDER(orderId)
        );
        return response.data;
    },

    confirmReceived: async (orderId: string): Promise<ApiResponse<OrderResponse>> =>
        (await axiosInstance.put<ApiResponse<OrderResponse>>(API_ENDPOINTS.ORDERS.CONFIRM_RECEIVED(orderId))).data,

    markDeliveryFailed: async (orderId: string): Promise<ApiResponse<OrderResponse>> =>
        (await axiosInstance.put<ApiResponse<OrderResponse>>(API_ENDPOINTS.ORDERS.DELIVERY_FAILED(orderId))).data,

    refuseDelivery: async (orderId: string): Promise<ApiResponse<OrderResponse>> =>
        (await axiosInstance.put<ApiResponse<OrderResponse>>(API_ENDPOINTS.ORDERS.REFUSE_DELIVERY(orderId))).data,

    forceStatus: async (orderId: string, status: string): Promise<ApiResponse<OrderResponse>> =>
        (await axiosInstance.put<ApiResponse<OrderResponse>>(API_ENDPOINTS.ORDERS.FORCE_STATUS(orderId), { status })).data,
};
