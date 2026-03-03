import type { ShopRequestsResponse, ShopRequest, ReviewShopRequest, AdminShopItem, ShopDetailResponse } from '@/models/Shop';
import type { ApiResponse } from '@/models/ApiResponse';
import axiosInstance from '@/api/axios.config';
import { API_ENDPOINTS } from '@/api/endpoints';

export const adminApi = {
  getShopRequests: async (): Promise<ApiResponse<ShopRequestsResponse>> => {
    const response = await axiosInstance.get<ApiResponse<ShopRequestsResponse>>(
      API_ENDPOINTS.ADMIN.SHOPS.REQUESTS,
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
};
