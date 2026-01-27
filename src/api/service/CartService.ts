import type { CartItemWithDetails, CartResponse } from "./Type";

const mockCartData: CartResponse = {
    cart: {
        id: 'cart-001',
        user_id: 'user-001',
        session_id: 'session-abc123',
        status: 'active',
        created_at: '2025-01-20T10:00:00Z',
        updated_at: '2025-01-20T15:30:00Z',
        expires_at: '2025-01-27T10:00:00Z',
    },
    items: [
        {
            id: 'ci-001',
            cart_id: 'cart-001',
            product_id: 'prod-001',
            quantity: 1,
            unit_price: 33.9,
            added_at: '2025-01-20T10:05:00Z',
            updated_at: '2025-01-20T10:05:00Z',
            product: {
                id: 'prod-001',
                product_type: 'frame',
                name: 'Vel pellentesque bibendum',
                slug: 'vel-pellentesque-bibendum',
                description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                is_active: true,
                is_featured: true,
                is_instock: true,
                brand: {
                    id: 'brand-001',
                    code: 'RAY',
                    name: 'Ray-Ban',
                    is_active: true,
                },
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-15T00:00:00Z',
            },
            variant_details: {
                sku: 'RB-001-BK',
                color: 'Black',
                size: 'M',
                image_url: undefined,
            },
            is_gift: false,
            children: [
                {
                    id: 'ci-001a',
                    cart_id: 'cart-001',
                    product_id: 'prod-acc-001',
                    parent_item_id: 'ci-001',
                    quantity: 1,
                    unit_price: 5.0,
                    added_at: '2025-01-20T10:06:00Z',
                    updated_at: '2025-01-20T10:06:00Z',
                    product: {
                        id: 'prod-acc-001',
                        product_type: 'accessory',
                        name: 'Bảo hành mở rộng 12 tháng',
                        slug: 'extended-warranty-12m',
                        description: 'Extended warranty coverage for 12 months',
                        is_active: true,
                        is_featured: false,
                        is_instock: true,
                        created_at: '2025-01-01T00:00:00Z',
                        updated_at: '2025-01-01T00:00:00Z',
                    },
                    variant_details: {
                        sku: 'WAR-12M',
                    },
                    is_gift: false,
                    children: [],
                },
                {
                    id: 'ci-001b',
                    cart_id: 'cart-001',
                    product_id: 'prod-gift-001',
                    parent_item_id: 'ci-001',
                    quantity: 1,
                    unit_price: 0,
                    added_at: '2025-01-20T10:06:00Z',
                    updated_at: '2025-01-20T10:06:00Z',
                    product: {
                        id: 'prod-gift-001',
                        product_type: 'accessory',
                        name: 'Túi đựng cao cấp',
                        slug: 'premium-case-gift',
                        description: 'Premium glasses case - Gift',
                        is_active: true,
                        is_featured: false,
                        is_instock: true,
                        created_at: '2025-01-01T00:00:00Z',
                        updated_at: '2025-01-01T00:00:00Z',
                    },
                    variant_details: {
                        sku: 'CASE-GIFT',
                    },
                    is_gift: true,
                    children: [],
                },
            ],
        },
        {
            id: 'ci-002',
            cart_id: 'cart-001',
            product_id: 'prod-002',
            quantity: 1,
            unit_price: 14.9,
            added_at: '2025-01-20T11:00:00Z',
            updated_at: '2025-01-20T11:00:00Z',
            product: {
                id: 'prod-002',
                product_type: 'frame',
                name: 'Magna quis at non',
                slug: 'magna-quis-at-non',
                description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Libero.',
                is_active: true,
                is_featured: false,
                is_instock: true,
                brand: {
                    id: 'brand-002',
                    code: 'OAK',
                    name: 'Oakley',
                    is_active: true,
                },
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-10T00:00:00Z',
            },
            variant_details: {
                sku: 'OAK-002-SL',
                color: 'Silver',
                size: 'L',
                image_url: undefined,
            },
            is_gift: false,
            children: [],
        },
        {
            id: 'ci-003',
            cart_id: 'cart-001',
            product_id: 'prod-003',
            quantity: 1,
            unit_price: 16.9,
            added_at: '2025-01-20T12:00:00Z',
            updated_at: '2025-01-20T12:00:00Z',
            product: {
                id: 'prod-003',
                product_type: 'frame',
                name: 'Cursus tortor ac eget',
                slug: 'cursus-tortor-ac-eget',
                description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                is_active: true,
                is_featured: true,
                is_instock: true,
                brand: {
                    id: 'brand-003',
                    code: 'GUC',
                    name: 'Gucci',
                    is_active: true,
                },
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-05T00:00:00Z',
            },
            variant_details: {
                sku: 'GUC-003-GD',
                color: 'Gold',
                size: 'M',
                image_url: undefined,
            },
            is_gift: false,
            children: [
                {
                    id: 'ci-003a',
                    cart_id: 'cart-001',
                    product_id: 'prod-acc-002',
                    parent_item_id: 'ci-003',
                    quantity: 1,
                    unit_price: 3.5,
                    added_at: '2025-01-20T12:01:00Z',
                    updated_at: '2025-01-20T12:01:00Z',
                    product: {
                        id: 'prod-acc-002',
                        product_type: 'accessory',
                        name: 'Dây đeo thay thế',
                        slug: 'replacement-strap',
                        description: 'Replacement strap for glasses',
                        is_active: true,
                        is_featured: false,
                        is_instock: true,
                        created_at: '2025-01-01T00:00:00Z',
                        updated_at: '2025-01-01T00:00:00Z',
                    },
                    variant_details: {
                        sku: 'STRAP-BK',
                        color: 'Black',
                    },
                    is_gift: false,
                    children: [],
                },
            ],
        },
    ],
    summary: {
        items_count: 3,
        items_subtotal: 74.2,
        promotion_discount: 0,
        coupon_discount: 7.42,
        shipping_fee: 0,
        tax_amount: 0,
        total_amount: 66.78,
        applied_coupon: {
            id: 'coupon-001',
            code: 'HAPPY',
            name: 'Happy New Year 2025',
            discount_type: 'percentage',
            discount_value: 10,
            min_purchase_amount: 50,
            max_discount_amount: 100,
            valid_from: '2025-01-01',
            valid_until: '2025-01-31',
            usage_limit_per_user: 1,
            total_usage_limit: 1000,
            used_count: 245,
            is_active: true,
        },
        applied_promotions: [],
    },
};

export const CartService = {
    // GET /api/v1/carts/{cartId} or /api/v1/carts/me (for current user)
    async getCart(): Promise<CartResponse> {
        await delay(300);
        return { ...mockCartData };
    },

    // PUT /api/v1/carts/items/{itemId}
    async updateItemQuantity(itemId: string, quantity: number): Promise<CartResponse> {
        await delay(200);
        const updateItem = (items: CartItemWithDetails[]): CartItemWithDetails[] => {
            return items.map(item => {
                if (item.id === itemId) {
                    return { ...item, quantity, updated_at: new Date().toISOString() };
                }
                if (item.children.length > 0) {
                    return { ...item, children: updateItem(item.children) };
                }
                return item;
            });
        };
        mockCartData.items = updateItem(mockCartData.items);
        recalculateSummary();
        return { ...mockCartData };
    },

    // DELETE /api/v1/carts/items/{itemId}
    async removeItem(itemId: string): Promise<CartResponse> {
        await delay(200);
        const removeFromItems = (items: CartItemWithDetails[]): CartItemWithDetails[] => {
            return items
                .filter(item => item.id !== itemId)
                .map(item => ({
                    ...item,
                    children: removeFromItems(item.children),
                }));
        };
        mockCartData.items = removeFromItems(mockCartData.items);
        recalculateSummary();
        return { ...mockCartData };
    },

    // POST /api/v1/carts/coupons
    async applyCoupon(code: string): Promise<{ success: boolean; message: string; data?: CartResponse }> {
        await delay(300);
        if (code.toUpperCase() === 'HAPPY') {
            mockCartData.summary.applied_coupon = {
                id: 'coupon-001',
                code: 'HAPPY',
                name: 'Happy New Year 2025',
                discount_type: 'percentage',
                discount_value: 10,
                min_purchase_amount: 50,
                max_discount_amount: 100,
                valid_from: '2025-01-01',
                valid_until: '2025-01-31',
                usage_limit_per_user: 1,
                total_usage_limit: 1000,
                used_count: 245,
                is_active: true,
            };
            recalculateSummary();
            return { success: true, message: 'Coupon applied successfully', data: { ...mockCartData } };
        }
        return { success: false, message: 'Invalid coupon code' };
    },

    // DELETE /api/v1/carts/coupons
    async removeCoupon(): Promise<CartResponse> {
        await delay(200);
        mockCartData.summary.applied_coupon = undefined;
        mockCartData.summary.coupon_discount = 0;
        recalculateSummary();
        return { ...mockCartData };
    },
};

// Helper to recalculate summary
function recalculateSummary() {
    const calculateItemTotal = (item: CartItemWithDetails): number => {
        const itemTotal = item.unit_price * item.quantity;
        const childrenTotal = item.children.reduce((sum, child) => sum + calculateItemTotal(child), 0);
        return itemTotal + childrenTotal;
    };

    mockCartData.summary.items_subtotal = mockCartData.items.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0
    );

    mockCartData.summary.items_count = mockCartData.items.length;

    if (mockCartData.summary.applied_coupon) {
        const coupon = mockCartData.summary.applied_coupon;
        if (coupon.discount_type === 'percentage') {
            mockCartData.summary.coupon_discount = Math.min(
                (mockCartData.summary.items_subtotal * coupon.discount_value) / 100,
                coupon.max_discount_amount || Infinity
            );
        } else {
            mockCartData.summary.coupon_discount = Math.min(
                coupon.discount_value,
                mockCartData.summary.items_subtotal
            );
        }
    } else {
        mockCartData.summary.coupon_discount = 0;
    }

    mockCartData.summary.total_amount =
        mockCartData.summary.items_subtotal -
        mockCartData.summary.promotion_discount -
        mockCartData.summary.coupon_discount +
        mockCartData.summary.shipping_fee +
        mockCartData.summary.tax_amount;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));