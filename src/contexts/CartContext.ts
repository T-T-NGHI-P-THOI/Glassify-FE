import { createContext } from 'react';
import type { CartResponse, CartSummary, ItemType } from '@/api/service/Type';

export interface AddToCartParams {
    productName: string;
    productSlug: string;
    productId: string;
    productType: string;
    brandName?: string;
    sku?: string;
    color?: string;
    size?: string;
    imageUrl?: string;
    unitPrice: number;
    itemType: ItemType;
    parentItemId?: string;
    isFree?: boolean;
    giftNote?: string;
}

export interface CartContextType {
    cartData: CartResponse | null;
    itemCount: number;
    summary: CartSummary;
    isLoading: boolean;
    isAnimating: boolean;
    loadCart: () => Promise<void>;
    addItem: (params: AddToCartParams) => Promise<string>;
    addFrameWithLens: (frameParams: AddToCartParams, lensParams: AddToCartParams) => Promise<void>;
    updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
    removeCoupon: () => Promise<void>;
    triggerAnimation: () => void;
}

const defaultSummary: CartSummary = {
    items_count: 0,
    items_subtotal: 0,
    promotion_discount: 0,
    coupon_discount: 0,
    shipping_fee: 0,
    tax_amount: 0,
    total_amount: 0,
    applied_promotions: [],
};

export const CartContext = createContext<CartContextType>({
    cartData: null,
    itemCount: 0,
    summary: defaultSummary,
    isLoading: false,
    isAnimating: false,
    loadCart: async () => {},
    addItem: async () => '',
    addFrameWithLens: async () => {},
    updateItemQuantity: async () => {},
    removeItem: async () => {},
    applyCoupon: async () => ({ success: false, message: '' }),
    removeCoupon: async () => {},
    triggerAnimation: () => {},
});
