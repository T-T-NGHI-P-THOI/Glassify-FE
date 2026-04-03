import axiosInstance from '@/api/axios.config';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

export type LensCategory = 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE' | 'READING' | string;

export type LensProgressiveType = 'STANDARD' | 'PREMIUM' | 'MID_RANGE' | 'NEAR_RANGE' | string;

export type LensTintBehavior =
  | 'NONE'
  | 'SOLID'
  | 'GRADIENT'
  | 'MIRROR'
  | 'PHOTOCHROMIC'
  | string;

export interface LensFeatureCreateInput {
  sku: string;
  name: string;
  description: string;
  featureDetailData?: {
    shopId: string;
    lensIds: string[];
    featureMappings?: Array<{
      lensId: string;
      extraPrice?: number;
      isDefault?: boolean;
    }>;
  };
}

export interface LensTintCreateInput {
  code: string;
  name: string;
  cssValue: string;
  opacity: number;
  basePrice: number;
  isActive: boolean;
  behavior: LensTintBehavior;
  tintDetailData?: {
    shopId: string;
    lensIds: string[];
    tintOptions?: Array<{
      lensId: string;
      extraPrice?: number;
      isDefault?: boolean;
    }>;
  };
}

export interface LensUsageCreateInput {
  name: string;
  description?: string;
  isActive?: boolean;
  usageDetailData?: {
    shopId: string;
    lensIds: string[];
    usageRules?: Array<{
      lensId: string;
      allowTint?: boolean;
      allowProgressive?: boolean;
      minPriceAdjustment?: number;
    }>;
  };
}

export interface LensProgressiveOptionCreateInput {
  shopId: string;
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
  lensDetailData?: CreateLensDetailDataInput;
}

export interface LensFeatureFrameCompatibility {
  id: string;
  featureId: string;
  featureSku?: string;
  frameVariantId: string;
  frameVariantName?: string;
  sph?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LensFeature {
  id: string;
  sku: string;
  name: string;
  description?: string;
  lensFeatureFrameCompatibilities?: LensFeatureFrameCompatibility[];
  lensFeatureMappings?: LensFeatureMapping[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LensTint {
  id: string;
  code: string;
  name: string;
  cssValue?: string;
  opacity?: number;
  basePrice?: number;
  isActive?: boolean;
  behavior?: LensTintBehavior;
  lensTintOptions?: LensTintOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LensUsage {
  id: string;
  shopId?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  lensUsageRules?: LensUsageRule[];
}

export interface LensProgressiveOption {
  id: string;
  lensId: string;
  name: string;
  description: string;
  maxViewDistanceFt: number;
  extraPrice: number;
  isRecommended: boolean;
  isActive: boolean;
  progressiveType: LensProgressiveType;
  createdAt: string;
  updatedAt: string;
}

export interface LensTintOption {
  id: string;
  lensId: string;
  tintId: string;
  tintCode?: string;
  extraPrice?: number;
  isDefault?: boolean;
  tint?: LensTint;
  createdAt?: string;
  updatedAt?: string;
}

export interface LensFeatureMapping {
  id: string;
  lensId: string;
  featureId: string;
  extraPrice?: number;
  isDefault?: boolean;
  feature?: LensFeature;
  createdAt?: string;
  updatedAt?: string;
}

export interface LensUsageRule {
  id: string;
  lensId: string;
  usageId: string;
  usage?: LensUsage;
  allowTint?: boolean;
  allowProgressive?: boolean;
  minPriceAdjustment?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LensResponse {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  basePrice: number;
  isProgressive: boolean;
  isActive: boolean;
  category: LensCategory;
  progressiveType?: LensProgressiveType;
  createdAt: string;
  updatedAt: string;
  usageRules?: LensUsageRule[];
  tintOptions?: LensTintOption[];
  progressiveOptions?: LensProgressiveOption[];
  featureMappings?: LensFeatureMapping[];
}

export interface LensFilterRequest {
  page?: number;
  unitPerPage?: number;
  shopId?: string;
  sku?: string;
  name?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isProgressive?: boolean;
  category?: LensCategory;
  progressiveType?: LensProgressiveType;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface UpdateLensRequest {
  sku?: string;
  name?: string;
  basePrice?: number;
  isProgressive?: boolean;
  isActive?: boolean;
  category?: LensCategory;
  progressiveType?: LensProgressiveType;
}

export interface CreateLensFeatureRequest {
  sku: string;
  name: string;
  description?: string;
  featureDetailData?: {
    shopId: string;
    lensIds: string[];
    featureMappings?: Array<{
      lensId: string;
      extraPrice?: number;
      isDefault?: boolean;
    }>;
  };
}

export interface CreateLensTintRequest {
  code: string;
  name: string;
  cssValue?: string;
  opacity?: number;
  basePrice?: number;
  isActive?: boolean;
  behavior?: LensTintBehavior;
  tintDetailData?: {
    shopId: string;
    lensIds: string[];
    tintOptions?: Array<{
      lensId: string;
      extraPrice?: number;
      isDefault?: boolean;
    }>;
  };
}

export interface CreateLensUsageRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  usageDetailData?: {
    shopId: string;
    lensIds: string[];
    usageRules?: Array<{
      lensId: string;
      allowTint?: boolean;
      allowProgressive?: boolean;
      minPriceAdjustment?: number;
    }>;
  };
}

export interface CreateLensFeatureMappingRequest {
  shopId: string;
  featureId: string;
  extraPrice?: number;
  isDefault?: boolean;
}

export interface CreateLensTintOptionRequest {
  shopId: string;
  tintId: string;
  extraPrice?: number;
  isDefault?: boolean;
}

export interface CreateLensUsageRuleRequest {
  lensId?: string;
  shopId: string;
  usageId: string;
  allowTint?: boolean;
  allowProgressive?: boolean;
  minPriceAdjustment?: number;
}

export interface CreateLensProgressiveOptionRequest {
  shopId: string;
  name: string;
  description?: string;
  maxViewDistanceFt?: number;
  extraPrice?: number;
  isRecommended?: boolean;
  isActive?: boolean;
  progressiveType: LensProgressiveType;
}

export interface LensUsageFilterRequest {
  page?: number;
  unitPerPage?: number;
  shopId?: string;
  search?: string;
  name?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface UpdateLensUsageRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface LensCatalogUsageOption {
  usageId?: string;
  type?: string;
  name?: string;
  description?: string;
  allowTint?: boolean;
  allowProgressive?: boolean;
  minPriceAdjustment?: number;
}

export interface LensCatalogFeatureOption {
  featureId?: string;
  sku?: string;
  name?: string;
  description?: string;
  extraPrice?: number;
  isDefault?: boolean;
  sphLimit?: number;
}

export interface LensCatalogTintOption {
  tintId?: string;
  code?: string;
  name?: string;
  cssValue?: string;
  opacity?: number;
  behavior?: string;
  basePrice?: number;
  extraPrice?: number;
  isDefault?: boolean;
}

export interface LensCatalogProgressiveOption {
  progressiveOptionId?: string;
  name?: string;
  description?: string;
  progressiveType?: string;
  maxViewDistanceFt?: number;
  extraPrice?: number;
  isRecommended?: boolean;
  isActive?: boolean;
}

export interface LensCatalogLensOption {
  lensId?: string;
  lensSku?: string;
  lensName?: string;
  basePrice?: number;
  isProgressive?: boolean;
  usages?: LensCatalogUsageOption[];
  features?: LensCatalogFeatureOption[];
  tints?: LensCatalogTintOption[];
  progressiveOptions?: LensCatalogProgressiveOption[];
}

export interface FrameLensCatalogResponse {
  frameVariantId?: string;
  frameVariantSku?: string;
  lenses?: LensCatalogLensOption[];
}

const toNonEmptyArray = <T>(items?: T[]): T[] | undefined => {
  if (!items || items.length === 0) return undefined;
  return items;
};

const sanitizeLensDetailData = (
  lensDetailData?: CreateLensDetailDataInput,
): CreateLensDetailDataInput | undefined => {
  if (!lensDetailData) return undefined;

  const sanitized: CreateLensDetailDataInput = {
    featureIds: toNonEmptyArray(lensDetailData.featureIds),
    tintIds: toNonEmptyArray(lensDetailData.tintIds),
    usageIds: toNonEmptyArray(lensDetailData.usageIds),
    featuresToCreate: toNonEmptyArray(lensDetailData.featuresToCreate),
    tintsToCreate: toNonEmptyArray(lensDetailData.tintsToCreate),
    usagesToCreate: toNonEmptyArray(lensDetailData.usagesToCreate),
    progressiveOptions: toNonEmptyArray(lensDetailData.progressiveOptions),
  };

  const hasAnyDetail = Object.values(sanitized).some((value) => value !== undefined);
  return hasAnyDetail ? sanitized : undefined;
};

export const sanitizeCreateLensPayload = (payload: CreateLensRequest): CreateLensRequest => ({
  ...payload,
  progressiveType: payload.isProgressive ? payload.progressiveType : undefined,
  lensDetailData: sanitizeLensDetailData(payload.lensDetailData),
});

export const lensApi = {
  getCatalogForFrame: async (frameVariantId: string): Promise<FrameLensCatalogResponse | null> => {
    const response = await axiosInstance.get<ApiResponse<FrameLensCatalogResponse>>(
      API_ENDPOINTS.LENS.CATALOG_FOR_FRAME(frameVariantId),
    );
    return response.data?.data ?? null;
  },

  getById: async (id: string): Promise<LensResponse> => {
    const response = await axiosInstance.get<ApiResponse<LensResponse>>(
      API_ENDPOINTS.LENS.GET_BY_ID(id),
    );
    return response.data?.data as LensResponse;
  },

  getMany: async (filter: LensFilterRequest = {}): Promise<LensResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<LensResponse[] | LensResponse>>(
      API_ENDPOINTS.LENS.GET_ALL,
      { params: filter },
    );
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') return [payload];
    return [];
  },

  create: async (payload: CreateLensRequest): Promise<ApiResponse<LensResponse>> => {
    const sanitizedPayload = sanitizeCreateLensPayload(payload);
    const response = await axiosInstance.post<ApiResponse<LensResponse>>(
      API_ENDPOINTS.LENS.CREATE,
      sanitizedPayload,
    );
    return response.data;
  },

  createForFrame: async (
    frameVariantId: string,
    payload: CreateLensRequest,
  ): Promise<ApiResponse<LensResponse>> => {
    const sanitizedPayload = sanitizeCreateLensPayload(payload);
    const response = await axiosInstance.post<ApiResponse<LensResponse>>(
      API_ENDPOINTS.LENS.CREATE_FOR_FRAME(frameVariantId),
      sanitizedPayload,
    );
    return response.data;
  },

  createForFrameGroup: async (
    frameGroupId: string,
    payload: CreateLensRequest,
  ): Promise<ApiResponse<LensResponse>> => {
    const sanitizedPayload = sanitizeCreateLensPayload(payload);
    const response = await axiosInstance.post<ApiResponse<LensResponse>>(
      API_ENDPOINTS.LENS.CREATE_FOR_FRAME_GROUP(frameGroupId),
      sanitizedPayload,
    );
    return response.data;
  },

  update: async (id: string, payload: UpdateLensRequest): Promise<ApiResponse<LensResponse>> => {
    const response = await axiosInstance.put<ApiResponse<LensResponse>>(
      API_ENDPOINTS.LENS.UPDATE(id),
      payload,
    );
    return response.data;
  },

  createFeature: async (
    payload: CreateLensFeatureRequest,
  ): Promise<ApiResponse<LensFeature>> => {
    const response = await axiosInstance.post<ApiResponse<LensFeature>>(
      API_ENDPOINTS.LENS.CREATE_FEATURE,
      payload,
    );
    return response.data;
  },

  createTint: async (
    payload: CreateLensTintRequest,
  ): Promise<ApiResponse<LensTint>> => {
    const response = await axiosInstance.post<ApiResponse<LensTint>>(
      API_ENDPOINTS.LENS.CREATE_TINT,
      payload,
    );
    return response.data;
  },

  createUsage: async (
    payload: CreateLensUsageRequest,
  ): Promise<ApiResponse<LensUsage>> => {
    const response = await axiosInstance.post<ApiResponse<LensUsage>>(
      API_ENDPOINTS.LENS.CREATE_USAGE,
      payload,
    );
    return response.data;
  },

  getUsages: async (filter: LensUsageFilterRequest = {}): Promise<LensUsage[]> => {
    const response = await axiosInstance.get<ApiResponse<LensUsage[] | LensUsage>>(
      `${API_ENDPOINTS.LENS.BASE}/usages`,
      { params: filter },
    );
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') return [payload];
    return [];
  },

  createFeatureMapping: async (
    lensId: string,
    payload: CreateLensFeatureMappingRequest,
  ): Promise<ApiResponse<LensFeatureMapping>> => {
    const response = await axiosInstance.post<ApiResponse<LensFeatureMapping>>(
      API_ENDPOINTS.LENS.CREATE_FEATURE_MAPPING(lensId),
      payload,
    );
    return response.data;
  },

  createTintOption: async (
    lensId: string,
    payload: CreateLensTintOptionRequest,
  ): Promise<ApiResponse<LensTintOption>> => {
    const response = await axiosInstance.post<ApiResponse<LensTintOption>>(
      API_ENDPOINTS.LENS.CREATE_TINT_OPTION(lensId),
      payload,
    );
    return response.data;
  },

  createUsageRule: async (
    lensId: string,
    payload: CreateLensUsageRuleRequest,
  ): Promise<ApiResponse<LensUsageRule>> => {
    const response = await axiosInstance.post<ApiResponse<LensUsageRule>>(
      API_ENDPOINTS.LENS.CREATE_USAGE_RULE(lensId),
      {
        ...payload,
        lensId,
      },
    );
    return response.data;
  },

  createProgressiveOption: async (
    lensId: string,
    payload: CreateLensProgressiveOptionRequest,
  ): Promise<ApiResponse<LensProgressiveOption>> => {
    const response = await axiosInstance.post<ApiResponse<LensProgressiveOption>>(
      API_ENDPOINTS.LENS.CREATE_PROGRESSIVE_OPTION(lensId),
      payload,
    );
    return response.data;
  },

  updateFeature: async (
    featureId: string,
    payload: Partial<CreateLensFeatureRequest>,
  ): Promise<ApiResponse<LensFeature>> => {
    const response = await axiosInstance.put<ApiResponse<LensFeature>>(
      API_ENDPOINTS.LENS.UPDATE_FEATURE(featureId),
      payload,
    );
    return response.data;
  },

  updateTint: async (
    tintId: string,
    payload: Partial<CreateLensTintRequest>,
  ): Promise<ApiResponse<LensTint>> => {
    const response = await axiosInstance.put<ApiResponse<LensTint>>(
      API_ENDPOINTS.LENS.UPDATE_TINT(tintId),
      payload,
    );
    return response.data;
  },

  updateUsage: async (
    usageId: string,
    payload: UpdateLensUsageRequest,
  ): Promise<ApiResponse<LensUsage>> => {
    const response = await axiosInstance.put<ApiResponse<LensUsage>>(
      API_ENDPOINTS.LENS.UPDATE_USAGE(usageId),
      payload,
    );
    return response.data;
  },

  updateFeatureMapping: async (
    lensId: string,
    mappingId: string,
    payload: Partial<CreateLensFeatureMappingRequest>,
  ): Promise<ApiResponse<LensFeatureMapping>> => {
    const response = await axiosInstance.put<ApiResponse<LensFeatureMapping>>(
      API_ENDPOINTS.LENS.UPDATE_FEATURE_MAPPING(lensId, mappingId),
      payload,
    );
    return response.data;
  },

  updateTintOption: async (
    lensId: string,
    optionId: string,
    payload: Partial<CreateLensTintOptionRequest>,
  ): Promise<ApiResponse<LensTintOption>> => {
    const response = await axiosInstance.put<ApiResponse<LensTintOption>>(
      API_ENDPOINTS.LENS.UPDATE_TINT_OPTION(lensId, optionId),
      payload,
    );
    return response.data;
  },

  updateUsageRule: async (
    lensId: string,
    ruleId: string,
    payload: Partial<CreateLensUsageRuleRequest>,
  ): Promise<ApiResponse<LensUsageRule>> => {
    const response = await axiosInstance.put<ApiResponse<LensUsageRule>>(
      API_ENDPOINTS.LENS.UPDATE_USAGE_RULE(lensId, ruleId),
      {
        ...payload,
        lensId,
      },
    );
    return response.data;
  },

  updateProgressiveOption: async (
    lensId: string,
    optionId: string,
    payload: Partial<CreateLensProgressiveOptionRequest>,
  ): Promise<ApiResponse<LensProgressiveOption>> => {
    const response = await axiosInstance.put<ApiResponse<LensProgressiveOption>>(
      API_ENDPOINTS.LENS.UPDATE_PROGRESSIVE_OPTION(lensId, optionId),
      payload,
    );
    return response.data;
  },
};
