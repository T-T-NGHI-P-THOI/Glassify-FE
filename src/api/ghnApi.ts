import type { GhnProvince, GhnDistrict, GhnWard } from '@/models/Shop';
import type { ApiResponse } from '@/models/ApiResponse';
import axiosInstance from '@/api/axios.config';

const GHN_BASE_URL = '/api/v1/ghn';

export interface GhnCheckoutShippingFeeResponse {
  actualFee: number;
  buyerFee: number;
  platformSubsidy: number;
  freeShipping: boolean;
}

export interface GhnLeadTimeResponse {
  leadtime: number;
  expectedDeliveryTime: string; // ISO date string
}

export const ghnApi = {
  getProvinces: async (): Promise<ApiResponse<GhnProvince[]>> => {
    const response = await axiosInstance.get<ApiResponse<GhnProvince[]>>(
      `${GHN_BASE_URL}/provinces`,
    );
    return response.data;
  },

  getDistricts: async (provinceId: number): Promise<ApiResponse<GhnDistrict[]>> => {
    const response = await axiosInstance.get<ApiResponse<GhnDistrict[]>>(
      `${GHN_BASE_URL}/districts`,
      { params: { provinceId } },
    );
    return response.data;
  },

  getWards: async (districtId: number): Promise<ApiResponse<GhnWard[]>> => {
    const response = await axiosInstance.get<ApiResponse<GhnWard[]>>(
      `${GHN_BASE_URL}/wards`,
      { params: { districtId } },
    );
    return response.data;
  },

  getLeadTime: async (params: {
    shopId: string;
    toDistrictId: number;
    toWardCode: string;
  }): Promise<ApiResponse<GhnLeadTimeResponse>> => {
    const response = await axiosInstance.get<ApiResponse<GhnLeadTimeResponse>>(
      `${GHN_BASE_URL}/leadtime`,
      { params },
    );
    return response.data;
  },

  getCheckoutShippingFee: async (params: {
    shopId: string;
    toDistrictId: number;
    toWardCode: string;
    orderSubtotal: number;
    cartId: string;
  }): Promise<ApiResponse<GhnCheckoutShippingFeeResponse>> => {
    const response = await axiosInstance.get<ApiResponse<GhnCheckoutShippingFeeResponse>>(
      `${GHN_BASE_URL}/checkout-shipping-fee`,
      { params },
    );
    return response.data;
  },
};
