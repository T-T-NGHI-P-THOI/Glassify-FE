import api from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { Review } from '../types/product';

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
  data: ApiProduct[];
  errors: null | string;
}

// Product type từ API
export interface ApiProduct {
  id: string;
  shopId: string;
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

  static async getAllProducts(filters?: ProductFilterParams): Promise<ApiProduct[]> {
    try {
      const response = await api.get<ProductApiResponse>(API_ENDPOINTS.PRODUCTS.GET_ALL, {
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }


  static async getProductById(id: string): Promise<ApiProduct> {
    try {
      const response = await api.get<{ status: number; message: string; data: ApiProduct }>(
        API_ENDPOINTS.PRODUCTS.GET_BY_ID(id)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  static async getProductBySlug(slug: string): Promise<ApiProduct> {
    try {
      const response = await api.get<{ status: number; message: string; data: ApiProduct }>(
        API_ENDPOINTS.PRODUCTS.GET_BY_SLUG(slug)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching product with slug ${slug}:`, error);
      throw error;
    }
  }

  static async getProductReviews(productId: string, filters?: ReviewFilterParams): Promise<ReviewResponse> {
    try {
      const response = await api.get<{ status: number; message: string; data: ReviewResponse }>(
        API_ENDPOINTS.PRODUCTS.GET_REVIEWS(productId),
        {
          params: filters
        }
      );
      return response.data.data;
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
      const response = await api.get<{ status: number; message: string; data: ApiCategory[] }>(
        API_ENDPOINTS.CATEGORIES.GET_ALL
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
}
