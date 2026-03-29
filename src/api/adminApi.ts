import type { ShopRequestsResponse, ShopRequest, ReviewShopRequest, AdminShopItem, ShopDetailResponse } from '@/models/Shop';
import type { ApiResponse } from '@/models/ApiResponse';
import type { UserResponse, AdminUserListResponse } from '@/models/User';
import axiosInstance from '@/api/axios.config';
import { API_ENDPOINTS } from '@/api/endpoints';

export const adminApi = {
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
};
