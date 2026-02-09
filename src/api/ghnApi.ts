import type { GhnProvince, GhnDistrict, GhnWard } from '@/models/Shop';
import type { ApiResponse } from '@/models/ApiResponse';
import axiosInstance from '@/api/axios.config';

const GHN_BASE_URL = '/api/v1/ghn';

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
};
