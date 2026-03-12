import CartAPI from '@/api/cart-api';
import { TokenManager } from '@/api/axios.config';
import type { CartItemWithDetails, CartResponse, BeCartItemResponse, BeCartItemRequest, BeCartResponse, ItemType } from './Type';
import type { LensSelection } from '@/models/Lens';

// ==================== Display Metadata Cache ====================
// BE cart items only store UUIDs. We cache display metadata locally
// so the UI can render product names, images, etc.

interface ItemDisplayMeta {
    productName: string;
    productSlug: string;
    productType: string;
    description?: string;
    brandName?: string;
    sku?: string;
    color?: string;
    size?: string;
    imageUrl?: string;
    isFree?: boolean;
    lensSelection?: LensSelection;
    stockQuantity?: number;
}

const DISPLAY_CACHE_KEY = 'glassify_cart_display_cache';

function getDisplayCache(): Record<string, ItemDisplayMeta> {
    try {
        const raw = localStorage.getItem(DISPLAY_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveDisplayCache(cache: Record<string, ItemDisplayMeta>) {
    try {
        localStorage.setItem(DISPLAY_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // localStorage full or unavailable
    }
}

function cacheItemDisplay(itemId: string, meta: ItemDisplayMeta) {
    const cache = getDisplayCache();
    cache[itemId] = meta;
    saveDisplayCache(cache);
}

function cleanupCache(activeItemIds: Set<string>) {
    const cache = getDisplayCache();
    const cleaned: Record<string, ItemDisplayMeta> = {};
    for (const id of activeItemIds) {
        if (cache[id]) cleaned[id] = cache[id];
    }
    saveDisplayCache(cleaned);
}

// ==================== Session Management ====================

function getOrCreateSessionId(): string {
    const key = 'glassify_session_id';
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem(key, sessionId);
    }
    return sessionId;
}

// ==================== Transform BE -> FE ====================

function collectItemIds(items: BeCartItemResponse[]): Set<string> {
    const ids = new Set<string>();
    for (const item of items) {
        ids.add(item.id);
    }
    return ids;
}

function transformBeItems(beItems: BeCartItemResponse[]): CartItemWithDetails[] {
    const cache = getDisplayCache();

    // Cache shopId for each item so updateItemQuantity can use it
    for (const item of beItems) {
        if (item.shopId) shopIdCache.set(item.id, item.shopId);
    }

    // Separate parent items and child items
    const parentItems = beItems.filter(item => !item.parentItemId);
    const childrenMap = new Map<string, BeCartItemResponse[]>();

    for (const item of beItems) {
        if (item.parentItemId) {
            const children = childrenMap.get(item.parentItemId) || [];
            children.push(item);
            childrenMap.set(item.parentItemId, children);
        }
    }

    return parentItems.map(item => transformSingleItem(item, childrenMap, cache));
}

function transformSingleItem(
    beItem: BeCartItemResponse,
    childrenMap: Map<string, BeCartItemResponse[]>,
    cache: Record<string, ItemDisplayMeta>,
): CartItemWithDetails {
    const meta = cache[beItem.id];
    const children = childrenMap.get(beItem.id) || [];
    const now = new Date().toISOString();

    const productType = meta?.productType || getProductTypeFromItemType(beItem.itemType);

    return {
        id: beItem.id,
        cart_id: beItem.cartId,
        product_id: beItem.productId || '',
        parent_item_id: beItem.parentItemId || undefined,
        quantity: beItem.quantity,
        unit_price: beItem.unitPrice,
        added_at: beItem.createdAt || now,
        updated_at: beItem.updatedAt || now,
        item_type: beItem.itemType,
        shop_id: beItem.shopId,
        product: {
            id: beItem.productId || '',
            product_type: productType as 'frame' | 'lens' | 'accessory',
            name: meta?.productName || 'Product',
            slug: meta?.productSlug || '',
            description: meta?.description,
            is_active: true,
            is_featured: false,
            is_instock: true,
            brand: meta?.brandName ? {
                id: '',
                code: '',
                name: meta.brandName,
                is_active: true,
            } : undefined,
            created_at: beItem.createdAt || now,
            updated_at: beItem.updatedAt || now,
        },
        variant_details: {
            sku: meta?.sku || '',
            color: meta?.color,
            size: meta?.size,
            image_url: meta?.imageUrl,
        },
        is_gift: beItem.isFree || meta?.isFree || false,
        children: children.map(child => transformSingleItem(child, childrenMap, cache)),
        lens_selection: meta?.lensSelection,
        stock_quantity: meta?.stockQuantity,
    };
}

function getProductTypeFromItemType(itemType: ItemType): string {
    switch (itemType) {
        case 'FRAME': return 'frame';
        case 'LENS': return 'lens';
        case 'ACCESSORY': return 'accessory';
        case 'GIFT': return 'accessory';
        default: return 'frame';
    }
}

function transformBeCart(beCart: BeCartResponse): CartResponse {
    const items = transformBeItems(beCart.items || []);

    // Calculate summary from items
    const calculateItemTotal = (item: CartItemWithDetails): number => {
        const selfTotal = item.unit_price * item.quantity;
        const childrenTotal = item.children.reduce((sum, child) => sum + calculateItemTotal(child), 0);
        return selfTotal + childrenTotal;
    };

    const itemsSubtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    // Cleanup stale cache entries
    const activeIds = collectItemIds(beCart.items || []);
    cleanupCache(activeIds);

    return {
        cart: {
            id: beCart.id,
            user_id: beCart.userId || undefined,
            session_id: beCart.sessionId || undefined,
            status: (beCart.status?.toLowerCase() || 'active') as 'active' | 'abandoned' | 'converted' | 'expired',
            created_at: beCart.createdAt,
            updated_at: beCart.updatedAt,
            expires_at: beCart.expiresAt || undefined,
        },
        items,
        summary: {
            items_count: items.length,
            items_subtotal: itemsSubtotal,
            promotion_discount: 0,
            coupon_discount: 0,
            shipping_fee: 0,
            tax_amount: 0,
            total_amount: itemsSubtotal,
            applied_promotions: [],
        },
    };
}

// ==================== Empty Cart Response ====================

function emptyCartResponse(): CartResponse {
    return {
        cart: {
            id: '',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        items: [],
        summary: {
            items_count: 0,
            items_subtotal: 0,
            promotion_discount: 0,
            coupon_discount: 0,
            shipping_fee: 0,
            tax_amount: 0,
            total_amount: 0,
            applied_promotions: [],
        },
    };
}

// ==================== Cart ID & ShopId Management ====================

let currentCartId: string | null = null;
const shopIdCache = new Map<string, string>(); // itemId -> shopId

async function ensureCart(): Promise<string> {
    if (currentCartId) return currentCartId;

    try {
        const isAuthenticated = TokenManager.isAuthenticated();
        let beCart: BeCartResponse;

        if (isAuthenticated) {
            beCart = await CartAPI.getMyCart();
        } else {
            const sessionId = getOrCreateSessionId();
            beCart = await CartAPI.getActiveCart(undefined, sessionId);
        }

        currentCartId = beCart.id;
        return currentCartId;
    } catch {
        // No active cart found, create one
        const isAuthenticated = TokenManager.isAuthenticated();
        const beCart = await CartAPI.createCart({
            sessionId: isAuthenticated ? undefined : getOrCreateSessionId(),
            status: 'ACTIVE',
        });
        currentCartId = beCart.id;
        return currentCartId;
    }
}

// ==================== Public API ====================

export interface AddToCartMockParams {
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
    shopId?: string;
    variantId?: string;
    lensId?: string;
    lensTintId?: string;
    lensFeatureIds?: string[];
    prescriptionId?: string;
    lensSelection?: LensSelection;
    stockQuantity?: number;
}

export const CartService = {
    async getCart(): Promise<CartResponse> {
        try {
            const isAuthenticated = TokenManager.isAuthenticated();
            let beCart: BeCartResponse;

            if (isAuthenticated) {
                beCart = await CartAPI.getMyCart();
            } else {
                const sessionId = getOrCreateSessionId();
                beCart = await CartAPI.getActiveCart(undefined, sessionId);
            }

            currentCartId = beCart.id;
            return transformBeCart(beCart);
        } catch {
            return emptyCartResponse();
        }
    },

    async addItem(params: AddToCartMockParams): Promise<{ cartResponse: CartResponse; createdItemId: string }> {
        const cartId = await ensureCart();

        const beRequest: BeCartItemRequest = {
            parentItemId: params.parentItemId,
            shopId: params.shopId || '',
            productId: params.itemType !== 'LENS' ? params.productId : undefined,
            variantId: params.variantId,
            lensId: params.lensId,
            lensTintId: params.lensTintId,
            lensFeatureIds: params.lensFeatureIds,
            prescriptionId: params.prescriptionId,
            quantity: 1,
            unitPrice: params.unitPrice,
            lineTotal: params.unitPrice,
            isFree: params.isFree,
            giftNote: params.giftNote,
            itemType: params.itemType,
        };

        const beCart = await CartAPI.addItem(cartId, beRequest);
        currentCartId = beCart.id;

        // Find the newly created item (it's the one not in our cache)
        const cache = getDisplayCache();
        const newBeItem = (beCart.items || []).find(item => !cache[item.id]);
        const newItemId = newBeItem?.id || '';

        // Cache display metadata for the new item
        if (newItemId) {
            cacheItemDisplay(newItemId, {
                productName: params.productName,
                productSlug: params.productSlug,
                productType: params.productType,
                brandName: params.brandName,
                sku: params.sku,
                color: params.color,
                size: params.size,
                imageUrl: params.imageUrl,
                isFree: params.isFree,
                lensSelection: params.lensSelection,
                stockQuantity: params.stockQuantity,
            });
        }

        return {
            cartResponse: transformBeCart(beCart),
            createdItemId: newItemId,
        };
    },

    async updateItemQuantity(itemId: string, quantity: number): Promise<CartResponse> {
        const cartId = await ensureCart();

        const beRequest = {
            shopId: shopIdCache.get(itemId) || '',
            quantity,
            unitPrice: 0,
            lineTotal: 0,
            itemType: 'FRAME' as ItemType,
        };

        const beCart = await CartAPI.updateItem(cartId, itemId, beRequest);
        currentCartId = beCart.id;
        return transformBeCart(beCart);
    },

    async removeItem(itemId: string): Promise<CartResponse> {
        const cartId = await ensureCart();
        const beCart = await CartAPI.removeItem(cartId, itemId);
        currentCartId = beCart.id;
        return transformBeCart(beCart);
    },

    async applyCoupon(_code: string): Promise<{ success: boolean; message: string; data?: CartResponse }> {
        // Coupon API not yet available in BE
        return { success: false, message: 'Coupon feature coming soon' };
    },

    async removeCoupon(): Promise<CartResponse> {
        return this.getCart();
    },

    resetCartId() {
        currentCartId = null;
        shopIdCache.clear();
    },
};
