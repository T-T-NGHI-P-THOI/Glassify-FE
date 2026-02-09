export interface FilterOptions {
  productTypes: Array<'FRAME' | 'LENS' | 'ACCESSORIES'>;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  priceRange: {
    min: number;
    max: number;
  };
  ratings: number[];
}

export interface ActiveFilters {
  productType?: 'FRAME' | 'LENS' | 'ACCESSORIES';
  brandIds: string[];
  categoryNames: string[];
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  searchQuery?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'popular';
  isFeatured?: boolean;
  isReturnable?: boolean;
  inStock?: boolean;
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
  productType: 'FRAME' | 'LENS' | 'ACCESSORIES';
  image: string;
  colorVariants: ColorVariant[];
  isFeatured?: boolean;
  isNew?: boolean;
  stockQuantity: number;
  brandId: string | null;
  categoryName?: string;
}
