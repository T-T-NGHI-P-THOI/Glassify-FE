export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  rating: number;
  reviewCount: number;
  shape: string;
  colors: ProductColor[];
  images: string[];
  frameMeasurements: FrameMeasurements;
  frameDetails: FrameDetails;
  prescriptionDetails: PrescriptionDetails;
  features: string[];
  deliveryDate?: string;
  description?: string;
  reviews?: Review[];
}

export interface ProductColor {
  name: string;
  code: string;
  image?: string;
}

export interface FrameMeasurements {
  frameWidth: { mm: number; inches: number };
  bridge: { mm: number; inches: number };
  lensWidth: { mm: number; inches: number };
  lensHeight: { mm: number; inches: number };
  templeLength: { mm: number; inches: number };
}

export interface FrameDetails {
  size: string;
  sizeRange: string;
  material: string;
  weight: string;
  weightGrams: number;
  rim: string;
  shape: string;
}

export interface PrescriptionDetails {
  pdRange: string;
  pdRangeNote?: string;
  prescriptionRange: string;
  progressive: boolean;
  bifocal: boolean;
  readers: boolean;
}

export interface RecommendedProduct {
  id: string;
  slug: string;
  variant: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  shape: string;
  image: string;
  colors: string[];
  deliveryDate?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
}
