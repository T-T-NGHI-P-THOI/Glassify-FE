import api, { API_CONFIG } from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { Review } from '../types/product';
import axiosInstance from './axios.config';

// Category type from API
export interface ApiCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  iconUrl: string | null;
  bannerImageUrl: string | null;
}

// Response type từ API
export interface ProductApiResponse {
  status: number;
  message: string;
  data: ApiProduct[] | ApiProduct;
  errors: null | string | string[];
}

// Shop info from API
export interface ApiShopInfo {
  id: string;
  shopCode: string;
  shopName: string;
  address?: string;
  city?: string;
  logoUrl: string;
  status: string;
  tier: string;
  avgRating: number;
  totalProducts: number;
  isVerified: boolean;
}

export interface ApiShopBasicInfo {
  id?: string;
  shopCode?: string;
  shopName?: string;
  address?: string;
  city?: string;
}

// Product type từ API
export interface ApiProduct {
  id: string;
  shopId: string;
  shop?: ApiShopInfo;
  shopBasicInfo?: ApiShopBasicInfo;
  shopbasicinfo?: ApiShopBasicInfo;
  brandId: string | null;
  categoryId: string;
  categoryName: string;
  variantId: string | null;
  sku: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  costPrice: number;
  compareAtPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  isReturnable: boolean;
  warrantyMonths: number;
  viewCount: number;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  metaTitle: string;
  metaDescription: string;
  productType: 'FRAME' | 'LENS' | 'ACCESSORIES';
  createdAt: string;
  updatedAt: string;
  fileResponses?: {
    id: string;
    storedName?: string;
    mimeType?: string;
    fileSize?: number;
    storageProvider?: string;
    filePath?: string | null;
    url?: string;
    publicUrl?: string;
    isPrimary?: boolean | null;
    productId?: string;
    createdBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
    altText?: string;
    originalName?: string;
  }[];
  productImages?: string[];
}

export interface ApiFrameGroup {
  id: string;
  frameName?: string;
  frameShape?: string;
  frameStructure?: string;
  frameMaterial?: string;
  vrEnabled?: boolean;
  hasNosePads?: boolean;
  hasSpringHinge?: boolean;
  genderTarget?: string;
  ageGroup?: string;
  description?: string;
  suitableFaceShapes?: string[] | null;
}

export interface ApiFrameVariant {
  id: string;
  frameGroupId?: string;
  colorName?: string;
  colorHex?: string;
  size?: 'SMALL' | 'MEDIUM' | 'LARGE' | string;
  frameWidthMm?: number;
  lensWidthMm?: number;
  lensHeightMm?: number;
  bridgeWidthMm?: number;
  templeLengthMm?: number;
}

export interface ProductWithFrameInfoData {
  productResponse: ApiProduct;
  frameGroup: ApiFrameGroup | null;
  frameVariant: ApiFrameVariant | null;
}

export interface ApiTextureFile {
  colorHex: string;
  url: string;
}

export interface ApiShopFrameVariant {
  id: string;
  frameGroupId: string;
  colorName: string;
  colorHex: string;
  size: string;
  productId: string | null;
}

export interface ApiShopFrameGroup {
  id: string;
  frameName: string;
  frameVariantResponses: ApiShopFrameVariant[];
}

// Product filter parameters
export interface ProductFilterParams {
  page?: number;
  unitPerPage?: number;
  shopId?: string;
  brandId?: string;
  categoryName?: string;
  name?: string;
  sku?: string;
  slug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isReturnable?: boolean;
  productType?: 'FRAME' | 'LENS' | 'ACCESSORIES';
  minStock?: number;
  maxStock?: number;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  minRating?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

// Review filter parameters
export interface ReviewFilterParams {
  page?: number;
  unitPerPage?: number;
}

// Review API response
export interface ReviewResponse {
  reviews: Review[];
  summary: {
    counts: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
    total: number;
  };
}

export default class ProductAPI {

  private static unwrapApiData<T>(payload: unknown): T | null {
    if (!payload) return null;

    if (typeof payload === 'object') {
      const maybeWrapped = payload as { data?: unknown };
      if (maybeWrapped.data !== undefined) {
        return maybeWrapped.data as T;
      }
    }

    return payload as T;
  }

  private static normalizeProductsPayload(payload: unknown): ApiProduct[] {
    const unwrapped = ProductAPI.unwrapApiData<unknown>(payload);
    if (Array.isArray(unwrapped)) return unwrapped as ApiProduct[];
    if (unwrapped && typeof unwrapped === 'object') return [unwrapped as ApiProduct];
    return [];
  }

  private static normalizeSingleProductPayload(payload: unknown): ApiProduct {
    const products = ProductAPI.normalizeProductsPayload(payload);
    if (products.length === 0) {
      throw new Error('Invalid product payload');
    }
    return products[0];
  }

  static async getAllProducts(filters?: ProductFilterParams): Promise<ApiProduct[]> {
    try {
      const response = await api.get(API_ENDPOINTS.PRODUCTS.GET_ALL, {
        params: filters
      });
      return ProductAPI.normalizeProductsPayload(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async getAccessoriesByParentProductId(productId: string): Promise<ApiProduct[]> {
    try {
      const response = await api.get(
        API_ENDPOINTS.PRODUCTS.GET_ACCESSORIES_BY_PARENT_ID(productId)
      );
      return ProductAPI.normalizeProductsPayload(response.data);
    } catch (error) {
      console.error(`Error fetching accessories for product ${productId}:`, error);
      return [];
    }
  }


  static async getProductById(id: string): Promise<ApiProduct> {
    try {
      const response = await api.get(
        API_ENDPOINTS.PRODUCTS.GET_BY_ID(id)
      );
      return ProductAPI.normalizeSingleProductPayload(response.data);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  static async getProductBySlug(slug: string): Promise<ApiProduct> {
    try {
      const response = await api.get(
        API_ENDPOINTS.PRODUCTS.GET_BY_SLUG(slug)
      );
      return ProductAPI.normalizeSingleProductPayload(response.data);
    } catch (error) {
      console.error(`Error fetching product with slug ${slug}:`, error);
      throw error;
    }
  }

  static async getProductWithFrameInfo(id: string): Promise<ProductWithFrameInfoData> {
    try {
      const response = await api.get(
        API_ENDPOINTS.PRODUCTS.GET_WITH_FRAME_INFO(id)
      );
      const data = ProductAPI.unwrapApiData<ProductWithFrameInfoData>(response.data);
      if (!data) {
        throw new Error('Invalid product with frame info payload');
      }
      return data;
    } catch (error) {
      console.error(`Error fetching product with frame info ${id}:`, error);
      throw error;
    }
  }

  static async getProductsByShopId(shopId: string, filters?: ProductFilterParams): Promise<ApiProduct[]> {
    try {
      const response = await api.get(
        API_ENDPOINTS.PRODUCTS.GET_BY_SHOP_ID(shopId),
        {
          params: filters
        }
      );
      return ProductAPI.normalizeProductsPayload(response.data);
    } catch (error) {
      console.error(`Error fetching products for shop ${shopId}:`, error);
      throw error;
    }
  }

  static async getProductReviews(productId: string, filters?: ReviewFilterParams): Promise<ReviewResponse> {
    try {
      const response = await api.get(
        API_ENDPOINTS.PRODUCTS.GET_REVIEWS(productId),
        {
          params: filters
        }
      );
      const data = ProductAPI.unwrapApiData<ReviewResponse>(response.data);
      if (!data) {
        throw new Error('Invalid product reviews payload');
      }
      return data;
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      // Return empty response structure on error
      return {
        reviews: [],
        summary: {
          counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          total: 0
        }
      };
    }
  }

  static async getCategories(): Promise<ApiCategory[]> {
    try {
      const response = await api.get(
        API_ENDPOINTS.CATEGORIES.GET_ALL
      );
      const data = ProductAPI.unwrapApiData<ApiCategory[]>(response.data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // ── Frame API ───────────────────────────────────────────────────
  static async getFrameGroupFromShopId(shopId: string): Promise<ApiShopFrameGroup[]> {
    const response = await axiosInstance.get(
      API_ENDPOINTS.PRODUCTS.GET_SHOP_FRAME(shopId)
    );
    return response.data.data as ApiShopFrameGroup[];
  }

  static async createFrameGroup(body: FormData) {
    const response = await axiosInstance.post(
      API_ENDPOINTS.PRODUCTS.CREATE_FRAME_GROUP,
      body,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  static async createFrameVariant(body: FormData) {
    const response = await axiosInstance.post(
      API_ENDPOINTS.PRODUCTS.CREATE_FRAME_VARIANT,
      body,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  static async getProductImages(productId: string) {
    const response = await axiosInstance.get(
      API_ENDPOINTS.PRODUCTS.GET_PRODUCT_IMAGES(productId),
    );
    return response.data.data;
  }

  static async activateProduct(productId: string) {
    const response = await axiosInstance.patch(
      API_ENDPOINTS.PRODUCTS.ACTIVATE_PRODUCT(productId)
    );
    return response.data.data;
  }

  static async upload3DModelFile(body: FormData) {
    const response = await axiosInstance.post(
      API_ENDPOINTS.PRODUCTS.UPLOAD_3D_MODEL,
      body,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  static async getModel3D(frameGroupId: string) {
    const response = await axiosInstance.get(
      API_ENDPOINTS.PRODUCTS.GET_MODEL_3D,
      {
        params: { frameGroupId },
        responseType: 'blob',
      }
    );

    return response;
  }

  static async getFrameGroupModel3D(frameGroupId: string): Promise<Blob> {
    const modelUrl = `${API_CONFIG.BASE_URL}/api/v1/product/frame-group/model-3d?frameGroupId=${encodeURIComponent(frameGroupId)}`;
    const response = await axiosInstance.get(modelUrl, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  static async getTextureFiles(frameGroupId: string): Promise<ApiTextureFile[]> {
    const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.GET_TEXTURE_FILES, {
      params: { frameGroupId }
    });
    return response.data.data as ApiTextureFile[];
  }

  static async updateFrameGroup(id: string, body: FormData) {
    const response = await axiosInstance.put(
      API_ENDPOINTS.PRODUCTS.UPDATE_FRAME_GROUP(id),
      body,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }
}
