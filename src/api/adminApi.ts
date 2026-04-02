import type { ShopRequestsResponse, ShopRequest, ReviewShopRequest, AdminShopItem, ShopDetailResponse } from '@/models/Shop';
import type { ApiResponse } from '@/models/ApiResponse';
import type { UserResponse, AdminUserListResponse } from '@/models/User';
import axiosInstance from '@/api/axios.config';
import { API_ENDPOINTS } from '@/api/endpoints';

export interface AdminOverviewStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalDeliveries: number;
  totalGrossRevenue: number;
  totalShippingSubsidy: number;
  netAfterShippingSubsidy: number;
}

export interface PageResponse<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminOrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  customerFullName: string;
  customerEmail: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  customerNote?: string;
  orderedAt: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  trackingNumber?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  refundRequestId?: string;
  refundRequestedAt?: string;
  refundStatus?: string;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
}

export interface AdminRefundResponse {
  id: string;
  requestNumber: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  shopId: string;
  shopName: string;
  userId: string;
  returnType: string;
  reason: string;
  reasonDetail?: string;
  refundAmount: number;
  status: string;
  statusDisplay: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
}

export interface AdminWarrantyResponse {
  id: string;
  claimNumber: string;
  orderItemId: string;
  productName: string;
  productImageUrl?: string;
  shopId: string;
  shopName: string;
  customerName: string;
  customerEmail: string;
  customerAvatarUrl?: string;
  purchasedAt?: string;
  warrantyExpiresAt?: string;
  issueType: string;
  issueDescription: string;
  issueImages: string[];
  customerAddress?: string;
  resolutionType?: string;
  repairCost?: number;
  customerPays?: number;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
}

export const adminApi = {
  getOverviewStats: async (): Promise<ApiResponse<AdminOverviewStats>> => {
    const response = await axiosInstance.get<ApiResponse<AdminOverviewStats>>(
      API_ENDPOINTS.ADMIN.STATS.OVERVIEW,
    );
    return response.data;
  },

  getShopRequests: async (status?: string): Promise<ApiResponse<ShopRequestsResponse>> => {
    const response = await axiosInstance.get<ApiResponse<ShopRequestsResponse>>(
      API_ENDPOINTS.ADMIN.SHOPS.REQUESTS,
      { params: status ? { status } : undefined },
    );
    return response.data;
  },

  reviewShopRequest: async (data: ReviewShopRequest): Promise<ApiResponse<ShopRequest>> => {
    const response = await axiosInstance.post<ApiResponse<ShopRequest>>(
      API_ENDPOINTS.ADMIN.SHOPS.REVIEW,
      data,
    );
    return response.data;
  },

  getShops: async (): Promise<ApiResponse<AdminShopItem[]>> => {
    const response = await axiosInstance.get<ApiResponse<AdminShopItem[]>>(
      API_ENDPOINTS.SHOPS.LIST,
    );
    return response.data;
  },

  deactivateShop: async (shopId: string, reason: string, endDate: string): Promise<ApiResponse<AdminShopItem>> => {
    const response = await axiosInstance.post<ApiResponse<AdminShopItem>>(
      API_ENDPOINTS.ADMIN.SHOPS.DEACTIVATE(shopId),
      { reason, endDate },
    );
    return response.data;
  },

  reactivateShop: async (shopId: string): Promise<ApiResponse<AdminShopItem>> => {
    const response = await axiosInstance.post<ApiResponse<AdminShopItem>>(
      API_ENDPOINTS.ADMIN.SHOPS.REACTIVATE(shopId),
    );
    return response.data;
  },

  closeShop: async (shopId: string, reason: string, confirmUnderstand: boolean): Promise<ApiResponse<AdminShopItem>> => {
    const response = await axiosInstance.post<ApiResponse<AdminShopItem>>(
      API_ENDPOINTS.ADMIN.SHOPS.CLOSE(shopId),
      { reason, confirmUnderstand },
    );
    return response.data;
  },

  cancelDeactivateShop: async (shopId: string): Promise<ApiResponse<AdminShopItem>> => {
    const response = await axiosInstance.post<ApiResponse<AdminShopItem>>(
      API_ENDPOINTS.ADMIN.SHOPS.CANCEL_DEACTIVATE(shopId),
    );
    return response.data;
  },

  cancelCloseShop: async (shopId: string): Promise<ApiResponse<AdminShopItem>> => {
    const response = await axiosInstance.post<ApiResponse<AdminShopItem>>(
      API_ENDPOINTS.ADMIN.SHOPS.CANCEL_CLOSE(shopId),
    );
    return response.data;
  },

  getShopById: async (shopId: string): Promise<ApiResponse<ShopDetailResponse>> => {
    const response = await axiosInstance.get<ApiResponse<ShopDetailResponse>>(
      API_ENDPOINTS.SHOPS.GET_BY_ID(shopId),
    );
    return response.data;
  },

  getUsers: async (page = 0, size = 20): Promise<ApiResponse<AdminUserListResponse>> => {
    const response = await axiosInstance.get<ApiResponse<AdminUserListResponse>>(
      API_ENDPOINTS.ADMIN.USERS.LIST,
      { params: { page, size } },
    );
    return response.data;
  },

  getUserById: async (userId: string): Promise<ApiResponse<UserResponse>> => {
    const response = await axiosInstance.get<ApiResponse<UserResponse>>(
      API_ENDPOINTS.ADMIN.USERS.GET_BY_ID(userId),
    );
    return response.data;
  },

  setUserRoles: async (userId: string, roleNames: string[]): Promise<ApiResponse<UserResponse>> => {
    const response = await axiosInstance.put<ApiResponse<UserResponse>>(
      API_ENDPOINTS.ADMIN.USERS.SET_ROLES(userId),
      { roleNames },
    );
    return response.data;
  },

  setUserStatus: async (userId: string, enabled: boolean, reason?: string): Promise<ApiResponse<UserResponse>> => {
    const response = await axiosInstance.put<ApiResponse<UserResponse>>(
      API_ENDPOINTS.ADMIN.USERS.SET_STATUS(userId),
      { enabled, reason },
    );
    return response.data;
  },

  getOrders: async (status?: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<AdminOrderResponse>>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AdminOrderResponse>>>(
      API_ENDPOINTS.ADMIN.ORDERS.LIST,
      { params: { ...(status ? { status } : {}), page, size } },
    );
    return response.data;
  },

  getOrderById: async (orderId: string): Promise<ApiResponse<AdminOrderResponse>> => {
    const response = await axiosInstance.get<ApiResponse<AdminOrderResponse>>(
      API_ENDPOINTS.ADMIN.ORDERS.GET_BY_ID(orderId),
    );
    return response.data;
  },

  getRefunds: async (status?: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<AdminRefundResponse>>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AdminRefundResponse>>>(
      API_ENDPOINTS.ADMIN.REFUNDS.LIST,
      { params: { ...(status ? { status } : {}), page, size } },
    );
    return response.data;
  },

  getRefundById: async (refundId: string): Promise<ApiResponse<AdminRefundResponse>> => {
    const response = await axiosInstance.get<ApiResponse<AdminRefundResponse>>(
      API_ENDPOINTS.ADMIN.REFUNDS.GET_BY_ID(refundId),
    );
    return response.data;
  },

  getWarranties: async (status?: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<AdminWarrantyResponse>>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AdminWarrantyResponse>>>(
      API_ENDPOINTS.ADMIN.WARRANTIES.LIST,
      { params: { ...(status ? { status } : {}), page, size } },
    );
    return response.data;
  },

  getWarrantyById: async (claimId: string): Promise<ApiResponse<AdminWarrantyResponse>> => {
    const response = await axiosInstance.get<ApiResponse<AdminWarrantyResponse>>(
      API_ENDPOINTS.ADMIN.WARRANTIES.GET_BY_ID(claimId),
    );
    return response.data;
  },

  getUserOrders: async (userId: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<AdminOrderResponse>>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AdminOrderResponse>>>(
      API_ENDPOINTS.ADMIN.USERS.ORDERS(userId),
      { params: { page, size } },
    );
    return response.data;
  },

  getUserRefunds: async (userId: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<AdminRefundResponse>>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AdminRefundResponse>>>(
      API_ENDPOINTS.ADMIN.USERS.REFUNDS(userId),
      { params: { page, size } },
    );
    return response.data;
  },

  getUserWarranties: async (userId: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<AdminWarrantyResponse>>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<AdminWarrantyResponse>>>(
      API_ENDPOINTS.ADMIN.USERS.WARRANTIES(userId),
      { params: { page, size } },
    );
    return response.data;
  },
};
