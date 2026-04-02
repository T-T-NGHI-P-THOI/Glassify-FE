// =====================================================
// Types based on Database Schema
// =====================================================

import type { Product } from "@/models/Product";
import type { LensSelection } from "@/models/Lens";

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
    item_type?: ItemType; // FRAME, LENS, ACCESSORY, GIFT
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
    shop_id?: string | null;
    shop_name?: string | null;
    variant_details?: {
        sku: string;
        color?: string;
        size?: string;
        image_url?: string;
    };
    is_gift: boolean;
    children: CartItemWithDetails[];
    lens_selection?: LensSelection;
    stock_quantity?: number;
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
// BE-aligned types (matches Java DTOs exactly)
// =====================================================

export type ItemType = 'FRAME' | 'LENS' | 'ACCESSORY' | 'GIFT';
export type BeCartStatus = 'ACTIVE' | 'ABANDONED' | 'CONVERTED' | 'EXPIRED';

export interface BeCartItemResponse {
    id: string;
    cartId: string;
    parentItemId: string | null;
    shopId: string | null;
    productId: string | null;
    variantId: string | null;
    lensId: string | null;
    lensTintId: string | null;
    lensFeatureIds: string[];
    prescriptionId: string | null;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    lineTotal: number;
    isFree: boolean;
    promoRuleId: string | null;
    giftNote: string | null;
    itemType: ItemType;
    createdAt: string;
    updatedAt: string;
    qtyAvailable: number | null;
}

export interface BeCartResponse {
    id: string;
    userId: string | null;
    sessionId: string | null;
    itemsCount: number;
    subtotal: number;
    expiresAt: string | null;
    status: BeCartStatus;
    createdAt: string;
    updatedAt: string;
    items: BeCartItemResponse[];
}

export interface BeCartItemRequest {
    parentItemId?: string;
    shopId: string;
    productId?: string;
    variantId?: string;
    lensId?: string;
    lensTintId?: string;
    lensFeatureIds?: string[];
    prescriptionId?: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    lineTotal: number;
    isFree?: boolean;
    promoRuleId?: string;
    giftNote?: string;
    itemType: ItemType;
}

export interface BeCartCreateRequest {
    userId?: string;
    sessionId?: string;
    status?: BeCartStatus;
    expiresAt?: string;
    items?: BeCartItemRequest[];
}

// Enriched types for FE rendering (BE data + display fields)
export interface EnrichedCartItem extends BeCartItemResponse {
    displayName: string;
    displayDescription?: string;
    displayImageUrl?: string;
    displayBrandName?: string;
    displaySku?: string;
    displayColor?: string;
    displaySize?: string;
    displaySlug?: string;
    children: EnrichedCartItem[];
}

export interface EnrichedCart {
    id: string;
    userId: string | null;
    sessionId: string | null;
    itemsCount: number;
    subtotal: number;
    status: BeCartStatus;
    items: EnrichedCartItem[];
}

// =====================================================
// API Service Layer (Mock Implementation)
// =====================================================



// Mock Data matching database structure


// API Service




export type { CartItemWithDetails as CartItemDTO };