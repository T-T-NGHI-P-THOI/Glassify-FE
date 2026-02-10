import { type FC, type PropsWithChildren, useCallback, useEffect, useState, useRef } from 'react';
import { CartContext, type AddToCartParams } from './CartContext';
import { CartService } from '@/api/service/CartService';
import type { CartResponse, CartSummary } from '@/api/service/Type';

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

const CartProvider: FC<PropsWithChildren> = ({ children }) => {
    const [cartData, setCartData] = useState<CartResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const itemCount = cartData?.summary?.items_count ?? 0;
    const summary = cartData?.summary ?? defaultSummary;

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await CartService.getCart();
            setCartData(data);
        } catch (error) {
            console.error('Failed to load cart:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const triggerAnimation = useCallback(() => {
        setIsAnimating(true);
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
        }, 800);
    }, []);

    const addItem = useCallback(async (params: AddToCartParams): Promise<string> => {
        const result = await CartService.addItem({
            productName: params.productName,
            productSlug: params.productSlug,
            productId: params.productId,
            productType: params.productType,
            brandName: params.brandName,
            sku: params.sku,
            color: params.color,
            size: params.size,
            imageUrl: params.imageUrl,
            unitPrice: params.unitPrice,
            itemType: params.itemType,
            parentItemId: params.parentItemId,
            isFree: params.isFree,
            giftNote: params.giftNote,
            lensSelection: params.lensSelection,
        });
        setCartData(result.cartResponse);
        triggerAnimation();
        return result.createdItemId;
    }, [triggerAnimation]);

    const addFrameWithLens = useCallback(async (frameParams: AddToCartParams, lensParams: AddToCartParams) => {
        // Step 1: Add frame
        const frameItemId = await addItem(frameParams);
        // Step 2: Add lens as child of frame
        await CartService.addItem({
            ...lensParams,
            parentItemId: frameItemId,
        });
        // Reload cart to get updated state
        const data = await CartService.getCart();
        setCartData(data);
        triggerAnimation();
    }, [addItem, triggerAnimation]);

    const updateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        const data = await CartService.updateItemQuantity(itemId, quantity);
        setCartData(data);
    }, []);

    const removeItem = useCallback(async (itemId: string) => {
        const data = await CartService.removeItem(itemId);
        setCartData(data);
    }, []);

    const applyCoupon = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
        const result = await CartService.applyCoupon(code);
        if (result.success && result.data) {
            setCartData(result.data);
        }
        return { success: result.success, message: result.message };
    }, []);

    const removeCoupon = useCallback(async () => {
        const data = await CartService.removeCoupon();
        setCartData(data);
    }, []);

    return (
        <CartContext.Provider value={{
            cartData,
            itemCount,
            summary,
            isLoading,
            isAnimating,
            loadCart,
            addItem,
            addFrameWithLens,
            updateItemQuantity,
            removeItem,
            applyCoupon,
            removeCoupon,
            triggerAnimation,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartProvider;
