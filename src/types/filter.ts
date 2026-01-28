export interface FilterOptions {
  categories: string[];
  shapes: string[];
  materials: string[];
  colors: string[];
  rimTypes: string[];
  sizes: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface ActiveFilters {
  category?: string;
  shapes: string[];
  materials: string[];
  colors: string[];
  rimTypes: string[];
  sizes: string[];
  priceMin?: number;
  priceMax?: number;
  searchQuery?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'popular';
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
  shape: string;
  material: string;
  color: string;
  rimType: string;
  size: string;
  image: string;
  colorVariants: ColorVariant[];
  isNew?: boolean;
  isBestSeller?: boolean;
}
