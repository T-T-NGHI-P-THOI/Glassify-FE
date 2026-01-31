import api from './axios';
import { API_ENDPOINTS } from './endpoints';

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
  productType: string;
  createdAt: string;
  updatedAt: string;
}

// Product filter parameters
export interface ProductFilterParams {
  page?: number;
  unitPerPage?: number;
  shopId?: string;
  brandId?: string;
  categoryId?: string;
  name?: string;
  sku?: string;
  slug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isReturnable?: boolean;
  productType?: 'EYEGLASSES' | 'SUNGLASSES' | 'ACCESSORIES';
  minStock?: number;
  maxStock?: number;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  minRating?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
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
}
