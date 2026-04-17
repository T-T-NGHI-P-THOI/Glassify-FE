import axios from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

export type PlatformSetting = {
  id: string;
  platformName: string;
  returnWindowDays?: number;
  refundBuyerShipmentReminderAfterDays?: number;
  refundStuckShipmentWarningAfterDays?: number;
  refundSellerResponseDeadlineHours?: number;
  refundPartialMinPercent?: number;
  refundProcessingMinDays?: number;
  refundProcessingMaxDays?: number;
  createdAt?: string;
  updatedAt?: string;
};

type GetPlatformSettingsParams = {
  page?: number;
  unitPerPage?: number;
  platformName?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
};

export const getPlatformSettings = async (
  params?: GetPlatformSettingsParams
): Promise<ApiResponse<PlatformSetting[]>> => {
  const response = await axios.get<ApiResponse<PlatformSetting[]>>(
    API_ENDPOINTS.PLATFORM_SETTINGS.BASE,
    { params }
  );
  return response.data;
};

export const getCurrentPlatformSetting = async (): Promise<PlatformSetting | null> => {
  const response = await getPlatformSettings({
    page: 1,
    unitPerPage: 1,
    sortBy: 'updatedAt',
    sortDirection: 'DESC',
  });

  const settings = response.data || [];
  return settings.length > 0 ? settings[0] : null;
};
