import axiosInstance from '@/api/axios.config';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/models/ApiResponse';
import type { PlatformSettingResponse, PlatformSettingUpdateRequest } from '@/models/PlatformSetting';

const platformSettingApi = {
  getCurrent: () =>
    axiosInstance.get<ApiResponse<PlatformSettingResponse>>(API_ENDPOINTS.PLATFORM_SETTINGS.CURRENT),

  getHistory: () =>
    axiosInstance.get<ApiResponse<PlatformSettingResponse[]>>(API_ENDPOINTS.PLATFORM_SETTINGS.HISTORY),

  updateAsNewVersion: (request: PlatformSettingUpdateRequest) =>
    axiosInstance.post<ApiResponse<PlatformSettingResponse>>(
      API_ENDPOINTS.PLATFORM_SETTINGS.UPDATE_AS_NEW,
      request,
    ),

  resetPrescription: () =>
    axiosInstance.post<ApiResponse<PlatformSettingResponse>>(API_ENDPOINTS.PLATFORM_SETTINGS.RESET_PRESCRIPTION),

  resetRefundPolicy: () =>
    axiosInstance.post<ApiResponse<PlatformSettingResponse>>(API_ENDPOINTS.PLATFORM_SETTINGS.RESET_REFUND),
};

export default platformSettingApi;
