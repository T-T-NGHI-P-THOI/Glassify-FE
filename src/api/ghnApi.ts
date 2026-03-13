import type { GhnProvince, GhnDistrict, GhnWard } from '@/models/Shop';
import type { ApiResponse } from '@/models/ApiResponse';
import axiosInstance from '@/api/axios.config';

const GHN_BASE_URL = '/api/v1/ghn';

export interface GhnShippingFeeRequest {
  shopId: string;
  toDistrictId: number;
  toWardCode: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  insuranceValue: number;
}

export interface GhnShippingFeeOption {
  serviceId: number;
  serviceName: string;
  serviceTypeId: number;
  totalFee: number;
  insuranceFee: number;
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

  getShippingFee: async (body: GhnShippingFeeRequest): Promise<ApiResponse<GhnShippingFeeOption[]>> => {
    const response = await axiosInstance.post<ApiResponse<GhnShippingFeeOption[]>>(
      `${GHN_BASE_URL}/shipping-fee`,
      body,
    );
    return response.data;
  },
};
