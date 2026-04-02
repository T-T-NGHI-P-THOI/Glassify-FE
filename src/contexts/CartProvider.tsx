import { type FC, type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext, type AddToCartParams } from './CartContext';
import { CartService } from '@/api/service/CartService';
import { useAuth } from '@/hooks/useAuth';
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
    const { isAuthenticated, isInitialized } = useAuth();
    const navigate = useNavigate();
    const [cartData, setCartData] = useState<CartResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    // Track previous auth state to detect transitions (null = not yet initialized)
    const prevIsAuthenticatedRef = useRef<boolean | null>(null);

    const itemCount = cartData?.summary?.items_count ?? 0;
    const summary = cartData?.summary ?? defaultSummary;

    const loadCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCartData(null);
            return;
        }
        try {
            setIsLoading(true);
            const data = await CartService.getCart();
            setCartData(data);
        } catch (error) {
            console.error('Failed to load cart:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // React to auth state changes:
    // - On initial init: load cart (guest uses sessionId, user uses token)
    // - On logout: wipe cart from UI immediately, reset CartService state
    // - On login: reload cart (loads user's server-side cart)
    useEffect(() => {
        if (!isInitialized) return;

        const prev = prevIsAuthenticatedRef.current;
        prevIsAuthenticatedRef.current = isAuthenticated ?? false;

        if (prev === null) {
            // First initialization — load cart for whoever is here (guest or user)
            loadCart();
        } else if (prev === true && !isAuthenticated) {
            // User logged out — clear cart from UI, reset service state
            CartService.resetCartId();
            setCartData(null);
        } else if (prev === false && isAuthenticated) {
            // User logged in — load their server-side cart
            CartService.resetCartId();
            loadCart();
        }
    }, [isAuthenticated, isInitialized, loadCart]);

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
        if (!isAuthenticated) {
            navigate('/login');
            return '';
        }
        const result = await CartService.addItem({
            productName: params.productName,
            productSlug: params.productSlug,
            productId: params.productId,
            productType: params.productType,
            brandName: params.brandName,
            shopName: params.shopName,
            sku: params.sku,
            color: params.color,
            size: params.size,
            imageUrl: params.imageUrl,
            unitPrice: params.unitPrice,
            itemType: params.itemType,
            parentItemId: params.parentItemId,
            isFree: params.isFree,
            giftNote: params.giftNote,
            shopId: params.shopId,
            variantId: params.variantId,
            lensId: params.lensId,
            lensTintId: params.lensTintId,
            lensFeatureIds: params.lensFeatureIds,
            prescriptionId: params.prescriptionId,
            lensSelection: params.lensSelection,
            stockQuantity: params.stockQuantity,
        });
        setCartData(result.cartResponse);
        triggerAnimation();
        return result.createdItemId;
    }, [isAuthenticated, navigate, triggerAnimation]);

    const addFrameWithLens = useCallback(async (frameParams: AddToCartParams, lensParams: AddToCartParams) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
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
    }, [isAuthenticated, navigate, addItem, triggerAnimation]);

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
