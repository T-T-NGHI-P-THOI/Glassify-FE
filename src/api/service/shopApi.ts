import type { ShopRegisterRequest, ShopRegisterResponse } from '@/models/Shop';
import type { ApiResponse } from '@/models/ApiResponse';
import axiosInstance from '@/api/axios.config';

const SHOP_BASE_URL = '/v1/shops';

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
};
