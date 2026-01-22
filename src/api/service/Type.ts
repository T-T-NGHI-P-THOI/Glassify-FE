// =====================================================
// Types based on Database Schema
// =====================================================

import type { Product } from "@/models/Product";

// Enums matching PostgreSQL enums
export type ProductType = 'frame' | 'lens' | 'accessory';
export type CartStatus = 'active' | 'abandoned' | 'converted' | 'expired';
export type AccessoryType = 'wiper' | 'glasses_case' | 'glasses_cleaner';
export type FrameSize = 'S' | 'M' | 'L';
export type LensCategory = 'clear' | 'blue_light' | 'photochromic' | 'sunglass' | 'specialty' | 'id_guard';
export type DiscountType = 'percentage' | 'fixed_amount';




export interface ProductVariantPrice {
    id: string;
    product_id: string;
    price: number;
    cost_price?: number;
    compare_at_price?: number;
    valid_from?: string;
    valid_until?: string;
}

export interface FrameVariant {
    id: string;
    glasses_id: string;
    sku: string;
    color: string;
    color_hex?: string;
    size: FrameSize;
    frame_width_mm?: number;
    lens_width_mm?: number;
    lens_height_mm?: number;
    bridge_width_mm?: number;
    temple_length_mm?: number;
    has_nosepads?: boolean;
    image_front?: string;
    image_side?: string;
    image_angle?: string;
}

export interface AccessoryVariant {
    id: string;
    accessory_id: string;
    images?: string;
    color?: string;
    size?: string;
    is_featured: boolean;
}

export interface Lens {
    id: string;
    sku: string;
    name: string;
    category: LensCategory;
    base_price: number;
    is_progressive: boolean;
}

// Cart entities matching database schema
export interface Cart {
    id: string;
    user_id?: string;
    session_id?: string;
    status: CartStatus;
    created_at: string;
    updated_at: string;
    expires_at?: string;
}

export interface CartItem {
    id: string;
    cart_id: string;
    product_id: string;
    parent_item_id?: string; // For accessories/add-ons linked to main product
    quantity: number;
    unit_price: number;
    added_at: string;
    updated_at: string;
    // Populated fields (from JOINs)
    product?: Product;
    variant?: FrameVariant | AccessoryVariant;
    lens?: Lens;
    children?: CartItem[]; // Child items (accessories, gifts)
}

// Coupon & Promotion
export interface Coupon {
    id: string;
    code: string;
    name: string;
    discount_type: DiscountType;
    discount_value: number;
    min_purchase_amount?: number;
    max_discount_amount?: number;
    valid_from: string;
    valid_until: string;
    usage_limit_per_user?: number;
    total_usage_limit?: number;
    used_count: number;
    is_active: boolean;
}

export interface Promotion {
    id: string;
    code: string;
    name: string;
    description?: string;
    discount_type: DiscountType;
    discount_value: number;
    min_purchase_amount?: number;
    max_discount_amount?: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
}

// API Response types
export interface CartResponse {
    cart: Cart;
    items: CartItemWithDetails[];
    summary: CartSummary;
}

export interface CartItemWithDetails extends CartItem {
    product: Product;
    variant_details?: {
        sku: string;
        color?: string;
        size?: string;
        image_url?: string;
    };
    is_gift: boolean;
    children: CartItemWithDetails[];
}

export interface CartSummary {
    items_count: number;
    items_subtotal: number;
    promotion_discount: number;
    coupon_discount: number;
    shipping_fee: number;
    tax_amount: number;
    total_amount: number;
    applied_coupon?: Coupon;
    applied_promotions: Promotion[];
}

// =====================================================
// API Service Layer (Mock Implementation)
// =====================================================



// Mock Data matching database structure


// API Service




export type { CartItemWithDetails as CartItemDTO };