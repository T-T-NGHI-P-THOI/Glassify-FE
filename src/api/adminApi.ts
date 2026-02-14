import type { ShopRequestsResponse, ShopRequest, ReviewShopRequest } from '@/models/Shop';
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
};
