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

const SHOP_BASE_URL = '/api/v1/shops';

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

  getMyShop: async (): Promise<ApiResponse<ShopDetailResponse>> => {
    const response = await axiosInstance.get<ApiResponse<ShopDetailResponse>>(
      `${SHOP_BASE_URL}/my-shop`,
    );
    return response.data;
  },

  updateMyShop: async (
    data: UpdateShopRequest,
  ): Promise<ApiResponse<ShopDetailResponse>> => {
    const response = await axiosInstance.put<ApiResponse<ShopDetailResponse>>(
      `${SHOP_BASE_URL}/my-shop`,
      data,
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
};
