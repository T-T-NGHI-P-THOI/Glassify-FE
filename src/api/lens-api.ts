import axiosInstance from '@/api/axios.config';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

export type LensCategory = 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE' | string;

export type LensProgressiveType = 'STANDARD' | 'PREMIUM' | 'OFFICE' | string;

export type LensTintBehavior = 'NONE' | 'PHOTOCHROMIC' | 'GRADIENT' | string;

export type LensUsageCreateType =
  | 'NON_PRESCRIPTION'
  | 'SINGLE_VISION'
  | 'READING'
  | 'BIFOCAL'
  | 'PROGRESSIVE'
  | string;

export interface LensFeatureCreateInput {
  sku: string;
  name: string;
  description: string;
}

export interface LensTintCreateInput {
  code: string;
  name: string;
  cssValue: string;
  opacity: number;
  basePrice: number;
  isActive: boolean;
  behavior: LensTintBehavior;
}

export interface LensUsageCreateInput {
  type: LensUsageCreateType;
  name: string;
  description: string;
  isActive: boolean;
}

export interface LensProgressiveOptionCreateInput {
  name: string;
  description: string;
  maxViewDistanceFt: number;
  extraPrice: number;
  isRecommended: boolean;
  isActive: boolean;
  progressiveType: LensProgressiveType;
}

export interface CreateLensDetailDataInput {
  featureIds?: string[];
  tintIds?: string[];
  usageIds?: string[];
  featuresToCreate?: LensFeatureCreateInput[];
  tintsToCreate?: LensTintCreateInput[];
  usagesToCreate?: LensUsageCreateInput[];
  progressiveOptions?: LensProgressiveOptionCreateInput[];
}

export interface CreateLensRequest {
  shopId: string;
  sku: string;
  name: string;
  basePrice: number;
  isProgressive: boolean;
  isActive: boolean;
  category: LensCategory;
  progressiveType?: LensProgressiveType;
  lensDetailData: CreateLensDetailDataInput;
}

export interface LensResponse {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  basePrice: number;
  isProgressive: boolean;
  isActive: boolean;
  category: string;
  progressiveType?: string;
  createdAt: string;
  updatedAt: string;
}

export const lensApi = {
  create: async (payload: CreateLensRequest): Promise<ApiResponse<LensResponse>> => {
    const response = await axiosInstance.post<ApiResponse<LensResponse>>(
      API_ENDPOINTS.LENS.CREATE,
      payload,
    );
    return response.data;
  },

  createForFrame: async (
    frameVariantId: string,
    payload: CreateLensRequest,
  ): Promise<ApiResponse<LensResponse>> => {
    const response = await axiosInstance.post<ApiResponse<LensResponse>>(
      API_ENDPOINTS.LENS.CREATE_FOR_FRAME(frameVariantId),
      payload,
    );
    return response.data;
  },

  createForFrameGroup: async (
    frameGroupId: string,
    payload: CreateLensRequest,
  ): Promise<ApiResponse<LensResponse>> => {
    const response = await axiosInstance.post<ApiResponse<LensResponse>>(
      API_ENDPOINTS.LENS.CREATE_FOR_FRAME_GROUP(frameGroupId),
      payload,
    );
    return response.data;
  },
};
