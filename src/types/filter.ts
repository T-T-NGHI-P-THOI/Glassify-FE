import type { ProductType } from "@/api/service/Type";

export interface FilterOptions {
  productTypes: Array<'FRAME' | 'LENSES' | 'ACCESSORIES'>;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  shopCities: string[];
  ageGroups: string[];
  priceRange: {
    min: number;
    max: number;
  };
  ratings: number[];
}

export interface ActiveFilters {
  productType?: ProductType;
  brandIds: string[];
  categoryNames: string[];
  shopCities: string[];
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  searchQuery?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'popular';
  isFeatured?: boolean;
  isReturnable?: boolean;
  inStock?: boolean;
  colors?: string[];
  frameShapes?: string[];
  ageGroups?: string[];
}

export interface ColorVariant {
  color: string;
  colorCode: string;
  slug: string;
  productId: string;
  variantId: string;
  image?: string;
}

export interface BrowseProduct {
  id: string;
  slug: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  price: number;
  rating: number;
  reviewCount: number;
  productType: 'FRAME' | 'LENSES' | 'ACCESSORIES';
  image: string;
  colorVariants: ColorVariant[];
  isFeatured?: boolean;
  isNew?: boolean;
  stockQuantity: number;
  brandId: string | null;
  categoryName?: string;
  shopCity?: string;
  shopAddress?: string;
}
