import type {
  ShopRegisterRequest,
  ShopRegisterResponse,
  ShopDetailResponse,
  UpdateShopRequest,
  ShopBankAccount,
  CreateBankAccountRequest,
} from '@/models/Shop';
import type { ApiResponse } from '@/models/ApiResponse';
import axiosInstance from '@/api/axios.config';

export interface ShopOrderItemResponse {
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

export interface ShopOrderResponse {
  id: string;
  shopOrderNumber: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shopEarning: number;
  commissionRate: number;
  commissionAmount: number;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  ghnOrderCode?: string;
  returnReason?: string;
  returnInTransitAt?: string;
  returnedAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  paymentAddedToWallet?: boolean;
  paymentAddedAt?: string;
  paymentReleased?: boolean;
  paymentReleasedAt?: string;
  orderNumber: string;
  orderedAt: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity?: string;
  customerNote?: string;
  customerId: string;
  customerName: string;
  items: ShopOrderItemResponse[];
}

export interface MonthlyRevenueItem {
  month: number;
  revenue: number;
  orders: number;
}

export interface SalesByCategoryItem {
  categoryName: string;
  percentage: number;
  totalRevenue: number;
}

export interface ShopAnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

const SHOP_BASE_URL = '/api/v1/shops';
const ANALYTICS_BASE_URL = '/api/v1/shop/analytics';

export const shopApi = {
  register: async (
    data: ShopRegisterRequest,
  ): Promise<ApiResponse<ShopRegisterResponse>> => {
    const response = await axiosInstance.post<ApiResponse<ShopRegisterResponse>>(
      `${SHOP_BASE_URL}/register`,
      data,
    );
    return response.data;
  },

  checkEmail: async (email: string): Promise<ApiResponse<{ available: boolean; message: string }>> => {
    const response = await axiosInstance.get(`${SHOP_BASE_URL}/check-email`, { params: { email } });
    return response.data;
  },

  getMyShops: async (): Promise<ApiResponse<ShopDetailResponse[]>> => {
    const response = await axiosInstance.get<ApiResponse<ShopDetailResponse[]>>(
      `${SHOP_BASE_URL}/my-shops`,
    );
    return response.data;
  },

  getMyShopById: async (shopId: string): Promise<ApiResponse<ShopDetailResponse>> => {
    const response = await axiosInstance.get<ApiResponse<ShopDetailResponse>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}`,
    );
    return response.data;
  },

  updateMyShop: async (
    shopId: string,
    data: UpdateShopRequest,
  ): Promise<ApiResponse<ShopDetailResponse>> => {
    const response = await axiosInstance.put<ApiResponse<ShopDetailResponse>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}`,
      data,
    );
    return response.data;
  },

  uploadLicenseImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<ApiResponse<{ url: string }>>(
      `${SHOP_BASE_URL}/upload-license-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  uploadLogoImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<ApiResponse<{ url: string }>>(
      `${SHOP_BASE_URL}/upload-logo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  uploadLogo: async (file: File): Promise<ApiResponse<{ logoUrl: string }>> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await axiosInstance.post<ApiResponse<{ logoUrl: string }>>(
      `${SHOP_BASE_URL}/my-shop/logo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  getBankAccounts: async (): Promise<ApiResponse<ShopBankAccount[]>> => {
    const response = await axiosInstance.get<ApiResponse<ShopBankAccount[]>>(
      `${SHOP_BASE_URL}/bank-accounts`,
    );
    return response.data;
  },

  createBankAccount: async (
    data: CreateBankAccountRequest,
  ): Promise<ApiResponse<ShopBankAccount>> => {
    const response = await axiosInstance.post<ApiResponse<ShopBankAccount>>(
      `${SHOP_BASE_URL}/bank-accounts`,
      data,
    );
    return response.data;
  },

  updateBankAccount: async (
    id: string,
    data: CreateBankAccountRequest,
  ): Promise<ApiResponse<ShopBankAccount>> => {
    const response = await axiosInstance.put<ApiResponse<ShopBankAccount>>(
      `${SHOP_BASE_URL}/bank-accounts/${id}`,
      data,
    );
    return response.data;
  },

  deleteBankAccount: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `${SHOP_BASE_URL}/bank-accounts/${id}`,
    );
    return response.data;
  },

  setDefaultBankAccount: async (id: string): Promise<ApiResponse<ShopBankAccount>> => {
    const response = await axiosInstance.patch<ApiResponse<ShopBankAccount>>(
      `${SHOP_BASE_URL}/bank-accounts/${id}/default`,
    );
    return response.data;
  },

  deactivateRequest: async (shopId: string, reason: string, endDate: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/deactivate-request`,
      { reason, endDate },
    );
    return response.data;
  },

  cancelDeactivate: async (shopId: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/deactivate/cancel`,
    );
    return response.data;
  },

  reactivateRequest: async (shopId: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/reactivate-request`,
    );
    return response.data;
  },

  closeShop: async (shopId: string, reason: string, confirmUnderstand: boolean): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/close`,
      { reason, confirmUnderstand },
    );
    return response.data;
  },

  cancelCloseShop: async (shopId: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/close/cancel`,
    );
    return response.data;
  },

  resubmit: async (shopId: string, data: ShopRegisterRequest): Promise<ApiResponse<ShopRegisterResponse>> => {
    const response = await axiosInstance.put<ApiResponse<ShopRegisterResponse>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/resubmit`,
      data,
    );
    return response.data;
  },

  getMyShopRegistration: async (shopId: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/registration`,
    );
    return response.data;
  },

  getDeactivationStatus: async (shopId: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/deactivation-status`,
    );
    return response.data;
  },

  getClosureStatus: async (shopId: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/closure-status`,
    );
    return response.data;
  },

  getShopOrders: async (
    shopId: string,
    params?: { status?: string },
  ): Promise<ApiResponse<ShopOrderResponse[]>> => {
    const response = await axiosInstance.get<ApiResponse<ShopOrderResponse[]>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/orders`,
      { params },
    );
    return response.data;
  },

  getShopOrderById: async (shopId: string, orderId: string): Promise<ApiResponse<ShopOrderResponse>> => {
    const response = await axiosInstance.get<ApiResponse<ShopOrderResponse>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/orders/${orderId}`,
    );
    return response.data;
  },

  confirmShopOrder: async (shopId: string, orderId: string): Promise<ApiResponse<ShopOrderResponse>> => {
    const response = await axiosInstance.patch<ApiResponse<ShopOrderResponse>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/orders/${orderId}/confirm`,
    );
    return response.data;
  },

  processShopOrder: async (shopId: string, orderId: string): Promise<ApiResponse<ShopOrderResponse>> => {
    const response = await axiosInstance.patch<ApiResponse<ShopOrderResponse>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/orders/${orderId}/process`,
    );
    return response.data;
  },

  cancelShopOrder: async (shopId: string, orderId: string, reason?: string): Promise<ApiResponse<ShopOrderResponse>> => {
    const response = await axiosInstance.patch<ApiResponse<ShopOrderResponse>>(
      `${SHOP_BASE_URL}/my-shops/${shopId}/orders/${orderId}/cancel`,
      reason ? { reason } : {},
    );
    return response.data;
  },

  getMonthlyRevenue: async (shopId: string, year?: number): Promise<ApiResponse<MonthlyRevenueItem[]>> => {
    const response = await axiosInstance.get<ApiResponse<MonthlyRevenueItem[]>>(
      `${ANALYTICS_BASE_URL}/${shopId}/monthly-revenue`,
      { params: { year: year ?? new Date().getFullYear() } },
    );
    return response.data;
  },

  getSalesByCategory: async (shopId: string): Promise<ApiResponse<SalesByCategoryItem[]>> => {
    const response = await axiosInstance.get<ApiResponse<SalesByCategoryItem[]>>(
      `${ANALYTICS_BASE_URL}/${shopId}/sales-by-category`,
    );
    return response.data;
  },

  getAnalyticsSummary: async (shopId: string): Promise<ApiResponse<ShopAnalyticsSummary>> => {
    const response = await axiosInstance.get<ApiResponse<ShopAnalyticsSummary>>(
      `${ANALYTICS_BASE_URL}/${shopId}/summary`,
    );
    return response.data;
  },
};
