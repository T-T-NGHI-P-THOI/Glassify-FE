import axiosInstance from '@/api/axios.config';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

export type LensCategory = 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE' | 'READING' | 'FASHION' | string;

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
  basePrice?: number;
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
  isNonPrescription?: boolean;
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

export interface LensProductResponse {
  id?: string;
  shopId?: string;
  sku?: string;
  name?: string;
  basePrice?: number;
  costPrice?: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  warrantyMonths?: number;
  isReturnable?: boolean;
  isFeatured?: boolean;
  productType?: string;
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

interface LensDetailFields {
  featureIds?: string[];
  tintIds?: string[];
  usageIds?: string[];
  featuresToCreate?: LensFeatureCreateInput[];
  tintsToCreate?: LensTintCreateInput[];
  usagesToCreate?: LensUsageCreateInput[];
  progressiveOptions?: LensProgressiveOptionCreateInput[];
}

export interface CreateLensRequest extends LensDetailFields {
  shopId: string;
  sku: string;
  name: string;
  imageFile?: File;
  basePrice: number;
  costPrice?: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  warrantyMonths?: number;
  isReturnable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  category: LensCategory;
  progressiveType?: LensProgressiveType;
}

export interface LensFeatureFrameCompatibility {
  id: string;
  shopId?: string;
  featureId: string;
  featureSku?: string;
  frameVariantId: string;
  frameVariantName?: string;
  sph?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LensFeatureFrameCompatibilityCreateRequest {
  shopId: string;
  featureId: string;
  frameVariantId: string;
  sph?: number;
}

export interface LensFeatureFrameCompatibilityUpdateRequest {
  shopId: string;
  sph?: number;
}

export interface LensFeatureFrameCompatibilityFilterRequest {
  featureId?: string;
  frameVariantId?: string;
  shopId?: string;
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
  type?: string;
  isNonPrescription?: boolean;
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
  basePrice?: number;
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
  imageFileId?: string;
  imageUrl?: string;
  basePrice: number;
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

export interface LensWithProductResult {
  lens: LensResponse;
  product?: LensProductResponse;
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
  
  category?: LensCategory;
  progressiveType?: LensProgressiveType;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface UpdateLensRequest extends LensDetailFields {
  shopId?: string;
  sku?: string;
  name?: string;
  imageFile?: File;
  keepImageUrls?: string[];
  basePrice?: number;
  costPrice?: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  warrantyMonths?: number;
  isReturnable?: boolean;
  isFeatured?: boolean;
  
  isActive?: boolean;
  category?: LensCategory;
  progressiveType?: LensProgressiveType;
}

const DECIMAL_10_2_MAX_ABS = 99_999_999.99;

const assertDecimal10_2 = (value: number, fieldName: string, allowZero = false) => {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number`);
  }
  if ((allowZero && value < 0) || (!allowZero && value <= 0)) {
    throw new Error(`${fieldName} must be ${allowZero ? '>= 0' : '> 0'}`);
  }
  if (Math.abs(value) > DECIMAL_10_2_MAX_ABS) {
    throw new Error(`${fieldName} must be <= ${DECIMAL_10_2_MAX_ABS}`);
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !(value instanceof Blob);
};

const compactRequestObject = <T extends Record<string, unknown>>(payload: T): T => {
  const result = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null),
  );
  return result as T;
};

const extractLensResponse = (value: unknown): LensResponse | null => {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  if (record.lens && typeof record.lens === 'object') {
    return record.lens as LensResponse;
  }

  return value as LensResponse;
};

const mergeLensWithProduct = (value: unknown): LensResponse & Partial<LensProductResponse> | null => {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const lens = record.lens && typeof record.lens === 'object' ? (record.lens as LensResponse) : null;
  const product = record.product && typeof record.product === 'object' ? (record.product as LensProductResponse) : null;

  if (lens && product) {
    return { ...product, ...lens };
  }

  if (lens) {
    return lens;
  }

  return value as LensResponse & Partial<LensProductResponse>;
};

const appendLensMultipartRequest = (
  formData: FormData,
  requestPayload: Record<string, unknown>,
  imageFile?: File,
) => {
  // Backend expects @RequestPart("request") + optional @RequestPart("imageFile").
  formData.append('request', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));
  if (imageFile) {
    formData.append('imageFile', imageFile);
  }
};

const buildUpdateLensFormData = (payload: UpdateLensRequest): FormData => {
  const formData = new FormData();

  const { imageFile, ...requestPayload } = payload;
  appendLensMultipartRequest(formData, compactRequestObject(requestPayload), imageFile);

  return formData;
};

const buildCreateLensFormData = (payload: CreateLensRequest): FormData => {
  const formData = new FormData();

  const { imageFile, ...requestPayload } = payload;
  appendLensMultipartRequest(formData, compactRequestObject(requestPayload), imageFile);

  return formData;
};

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
  shopId?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  isNonPrescription?: boolean;
  usageDetailData?: {
    shopId: string;
    lensIds: string[];
    usageRules?: Array<{
      shopId?: string;
      usageId?: string;
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
  shopId?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  isNonPrescription?: boolean;
}

export interface LensCatalogUsageOption {
  usageId?: string;
  type?: string;
  isNonPrescription?: boolean;
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

const sanitizeLensDetailFields = (payload: LensDetailFields): LensDetailFields => {
  const sanitized: LensDetailFields = {
    featureIds: toNonEmptyArray(payload.featureIds),
    tintIds: toNonEmptyArray(payload.tintIds),
    usageIds: toNonEmptyArray(payload.usageIds),
    featuresToCreate: toNonEmptyArray(payload.featuresToCreate),
    tintsToCreate: toNonEmptyArray(payload.tintsToCreate),
    usagesToCreate: toNonEmptyArray(payload.usagesToCreate),
    progressiveOptions: toNonEmptyArray(payload.progressiveOptions),
  };

  return sanitized;
};

export const sanitizeCreateLensPayload = (payload: CreateLensRequest): CreateLensRequest => ({
  ...payload,
  progressiveType: (payload.category === 'PROGRESSIVE') ? payload.progressiveType : undefined,
  ...sanitizeLensDetailFields(payload),
});

export const lensApi = {
  getCatalogForFrame: async (frameVariantId: string): Promise<FrameLensCatalogResponse | null> => {
    const response = await axiosInstance.get<ApiResponse<FrameLensCatalogResponse>>(
      API_ENDPOINTS.LENS.CATALOG_FOR_FRAME(frameVariantId),
    );
    return response.data?.data ?? null;
  },

  /**
   * Get lens related enums (categories, progressive types, tint behaviors, usages)
   */
  getEnums: async (): Promise<{
    lensCategories?: string[];
    progressiveTypes?: string[];
    lensTintBehaviors?: string[];
    prescriptionUsages?: string[];
  } | null> => {
    const url = `${API_ENDPOINTS.LENS.BASE}/enums`;
    const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(url);
    return response.data?.data ?? null;
  },

  getById: async (id: string): Promise<LensWithProductResult> => {
    const response = await axiosInstance.get<ApiResponse<LensWithProductResult>>(
      API_ENDPOINTS.LENS.GET_BY_ID(id),
    );
    return response.data?.data as LensWithProductResult;
  },

  getMany: async (filter: LensFilterRequest = {}): Promise<Array<LensResponse & Partial<LensProductResponse>>> => {
    const response = await axiosInstance.get<ApiResponse<Array<LensResponse | LensWithProductResult> | LensResponse | LensWithProductResult>>(
      API_ENDPOINTS.LENS.GET_ALL,
      { params: filter },
    );
    const payload = response.data?.data;
    if (Array.isArray(payload)) {
      return payload
        .map((item) => mergeLensWithProduct(item))
        .filter((item): item is LensResponse & Partial<LensProductResponse> => Boolean(item));
    }
    const lens = mergeLensWithProduct(payload);
    if (lens) return [lens];
    return [];
  },

  create: async (payload: CreateLensRequest): Promise<ApiResponse<LensWithProductResult>> => {
    assertDecimal10_2(payload.basePrice, 'basePrice');
    const sanitizedPayload = sanitizeCreateLensPayload(payload);
    const formData = buildCreateLensFormData(sanitizedPayload);
    const response = await axiosInstance.post<ApiResponse<LensWithProductResult>>(
      API_ENDPOINTS.LENS.CREATE,
      formData,
    );
    return response.data;
  },

  createForFrame: async (
    frameVariantId: string,
    payload: CreateLensRequest,
  ): Promise<ApiResponse<LensWithProductResult>> => {
    assertDecimal10_2(payload.basePrice, 'basePrice');
    const sanitizedPayload = sanitizeCreateLensPayload(payload);
    const formData = buildCreateLensFormData(sanitizedPayload);
    const response = await axiosInstance.post<ApiResponse<LensWithProductResult>>(
      API_ENDPOINTS.LENS.CREATE_FOR_FRAME(frameVariantId),
      formData,
    );
    return response.data;
  },

  createForFrameGroup: async (
    frameGroupId: string,
    payload: CreateLensRequest,
  ): Promise<ApiResponse<LensWithProductResult>> => {
    assertDecimal10_2(payload.basePrice, 'basePrice');
    const sanitizedPayload = sanitizeCreateLensPayload(payload);
    const formData = buildCreateLensFormData(sanitizedPayload);
    const response = await axiosInstance.post<ApiResponse<LensWithProductResult>>(
      API_ENDPOINTS.LENS.CREATE_FOR_FRAME_GROUP(frameGroupId),
      formData,
    );
    return response.data;
  },

  update: async (id: string, payload: UpdateLensRequest): Promise<ApiResponse<LensWithProductResult>> => {
    if (typeof payload.basePrice === 'number') {
      assertDecimal10_2(payload.basePrice, 'basePrice');
    }
    const formData = buildUpdateLensFormData(payload);
    const response = await axiosInstance.put<ApiResponse<LensWithProductResult>>(
      API_ENDPOINTS.LENS.UPDATE(id),
      formData,
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
    if (Array.isArray(payload)) {
      if (filter.shopId) {
        return payload.filter((item) => !item?.shopId || item.shopId === filter.shopId);
      }
      return payload;
    }
    if (payload && typeof payload === 'object') {
      if (filter.shopId && payload.shopId && payload.shopId !== filter.shopId) {
        return [];
      }
      return [payload];
    }
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

  getFeatureFrameCompatibilities: async (
    filter: LensFeatureFrameCompatibilityFilterRequest = {},
  ): Promise<LensFeatureFrameCompatibility[]> => {
    const response = await axiosInstance.get<ApiResponse<LensFeatureFrameCompatibility[] | LensFeatureFrameCompatibility>>(
      API_ENDPOINTS.LENS.FEATURE_FRAME_COMPATIBILITIES,
      { params: filter },
    );
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') return [payload];
    return [];
  },

  getFeatureFrameCompatibility: async (
    compatibilityId: string,
  ): Promise<LensFeatureFrameCompatibility | null> => {
    const response = await axiosInstance.get<ApiResponse<LensFeatureFrameCompatibility>>(
      API_ENDPOINTS.LENS.FEATURE_FRAME_COMPATIBILITY_BY_ID(compatibilityId),
    );
    return response.data?.data ?? null;
  },

  createFeatureFrameCompatibility: async (
    payload: LensFeatureFrameCompatibilityCreateRequest,
  ): Promise<ApiResponse<LensFeatureFrameCompatibility>> => {
    const response = await axiosInstance.post<ApiResponse<LensFeatureFrameCompatibility>>(
      API_ENDPOINTS.LENS.FEATURE_FRAME_COMPATIBILITIES,
      payload,
    );
    return response.data;
  },

  updateFeatureFrameCompatibility: async (
    compatibilityId: string,
    payload: LensFeatureFrameCompatibilityUpdateRequest,
  ): Promise<ApiResponse<LensFeatureFrameCompatibility>> => {
    const response = await axiosInstance.put<ApiResponse<LensFeatureFrameCompatibility>>(
      API_ENDPOINTS.LENS.FEATURE_FRAME_COMPATIBILITY_BY_ID(compatibilityId),
      payload,
    );
    return response.data;
  },

  deleteFeatureFrameCompatibility: async (
    compatibilityId: string,
    shopId: string,
  ): Promise<ApiResponse<LensFeatureFrameCompatibility>> => {
    const response = await axiosInstance.delete<ApiResponse<LensFeatureFrameCompatibility>>(
      API_ENDPOINTS.LENS.FEATURE_FRAME_COMPATIBILITY_BY_ID(compatibilityId),
      { params: { shopId } },
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
