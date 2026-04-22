# State Management — Glassify Frontend

> Context API + useReducer is the chosen pattern. No Redux. This file documents all global state.

---

## Overview

| Context | Provider File | Hook | Scope |
|---------|--------------|------|-------|
| Auth | `src/auth/AuthProvider.tsx` | `useAuth()` | App-wide |
| Cart | `src/contexts/CartProvider.tsx` | `useCart()` | App-wide |
| Layout | `src/layouts/LayoutContext.tsx` | `useLayoutConfig()` | App-wide |

**Provider nesting order** (`src/App.tsx`):
```tsx
<BrowserRouter>
  <AuthProvider>          // Must be outermost — Cart depends on auth state
    <CartProvider>
      <LayoutProvider>
        <Layout>
          <Routes />
        </Layout>
      </LayoutProvider>
    </CartProvider>
  </AuthProvider>
</BrowserRouter>
```

---

## Auth State

### State Shape
```typescript
// src/auth/AuthContext.ts
interface AuthState {
    isAuthenticated?: boolean;   // Is user logged in?
    isInitialized?: boolean;     // Has auth been checked on app load?
    user: UserResponse | null;
}

// Initial state
{ isInitialized: false, isAuthenticated: false, user: null }
```

### Action Types
```typescript
// src/types/auth-action-type.enum.ts
enum AuthActionType {
    INITIALIZE = "INITIALIZE",   // App startup — check stored token
    SIGN_IN    = "SIGN_IN",      // User logs in
    SIGN_OUT   = "SIGN_OUT",     // User logs out
}
```

### Reducer (src/auth/Reducer.ts)
| Action | Effect |
|--------|--------|
| `INITIALIZE` | Sets `isInitialized: true`, sets `isAuthenticated` + `user` from payload |
| `SIGN_IN` | Sets `isAuthenticated: true`, updates `user` |
| `SIGN_OUT` | Sets `isAuthenticated: false`, `user: null`, calls `TokenManager.clearTokens()` |

### Action Creators
```typescript
initialize(payload: AuthState)      // dispatch on app load
logIn(payload: AuthState)           // dispatch after successful login
logOut()                            // dispatch on logout — also clears tokens
```

### AuthProvider Initialization Flow
```
Mount
  ↓
Check: TokenManager.getAccessToken()
  ├─ Token exists → call userApi.getMyProfile()
  │     ├─ user.enabled === false → redirect('/account-disabled')
  │     └─ Success → dispatch initialize({ isAuthenticated: true, user })
  └─ No token → dispatch initialize({ isAuthenticated: false, user: null })
  ↓
Render children (until initialized: render <Loading />)
```

### Consuming Auth State
```tsx
import { useAuth } from '@/hooks/useAuth';

const { isAuthenticated, isInitialized, user, dispatch } = useAuth();

// Login
dispatch(logIn({ isAuthenticated: true, user }));

// Logout
dispatch(logOut());
```

---

## Cart State

### State Shape
```typescript
// src/contexts/CartContext.ts
interface CartContextType {
    cartData: CartResponse | null;
    itemCount: number;           // Derived: cartData.summary.items_count ?? 0
    summary: CartSummary;
    isLoading: boolean;
    isAnimating: boolean;        // Cart icon animation (800ms)
    loadCart: () => Promise<void>;
    addItem: (params: AddToCartParams) => Promise<string>;     // returns createdItemId
    addFrameWithLens: (frameParams, lensParams) => Promise<void>;
    updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
    removeCoupon: () => Promise<void>;
    triggerAnimation: () => void;
}

interface CartSummary {
    items_count: number;
    items_subtotal: number;
    promotion_discount: number;
    coupon_discount: number;
    shipping_fee: number;
    tax_amount: number;
    total_amount: number;
    applied_promotions: [];
}
```

### Cart Item Params
```typescript
interface AddToCartParams {
    productName: string;
    productSlug: string;
    productId: string;
    productType: 'FRAME' | 'LENSES' | 'ACCESSORIES';
    brandName?: string;
    shopName?: string;
    sku?: string;
    color?: string;
    size?: string;
    imageUrl?: string;
    unitPrice: number;
    itemType: 'FRAME' | 'LENS' | 'ACCESSORY' | 'GIFT';
    parentItemId?: string;      // For child lens items
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
```

### CartProvider Key Behaviors

**Auth state reactivity** (watches `isAuthenticated` transitions):
| Transition | Action |
|------------|--------|
| `null → any` (init) | Load cart |
| `true → false` (logout) | Clear cart UI, call `CartService.resetCartId()` |
| `false → true` (login) | Load user's server-side cart |

**Cart animation:**
```typescript
triggerAnimation()  // sets isAnimating=true, resets to false after 800ms
```

**applyCoupon:** Currently returns `{ success: false, message: 'Coupon feature coming soon' }` — not yet implemented on BE.

### Consuming Cart State
```tsx
import { useCart } from '@/hooks/useCart';

const { cartData, itemCount, isLoading, addItem, removeItem } = useCart();

// Add a simple item
await addItem({ productId, productName, unitPrice, itemType: 'FRAME', ... });

// Add frame + lens together
await addFrameWithLens(frameParams, lensParams);
```

---

## Layout State

### State Shape
```typescript
// src/layouts/LayoutContext.tsx
interface LayoutContextType {
    showNavbar: boolean;
    showFooter: boolean;
    showNavCategories: boolean;
    setShowNavbar: (show: boolean) => void;
    setShowFooter: (show: boolean) => void;
    setShowNavCategories: (show: boolean) => void;
}
```

### Usage Pattern
```tsx
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

// Hide footer on a specific page
useEffect(() => {
    setShowFooter(false);
    return () => setShowFooter(true); // always restore on unmount
}, []);
```

---

## Token Management

**Location:** `src/api/axios.config.ts` — `TokenManager` object

```typescript
TokenManager.ACCESS_TOKEN_KEY  = 'accessToken'   // localStorage key
TokenManager.REFRESH_TOKEN_KEY = 'refreshToken'  // localStorage key

TokenManager.getAccessToken()                    // → string | null
TokenManager.getRefreshToken()                   // → string | null
TokenManager.setTokens(access, refresh?)         // saves to localStorage
TokenManager.clearTokens()                       // removes both
TokenManager.isAuthenticated()                   // → boolean (access token exists)
```

**Auto-refresh flow** (handled in `axios.config.ts` response interceptor):
```
Response 401
  ↓
Call: POST /auth/refresh { refreshToken }
  ├─ Success → TokenManager.setTokens(new), retry original request
  └─ Fail    → TokenManager.clearTokens(), redirect('/login')
```

---

## Local Component State Patterns

### Async data loading
```tsx
const [data, setData] = useState<T | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    const load = async () => {
        try {
            setIsLoading(true);
            const result = await someApi.get();
            setData(result);
        } catch (err) {
            // handle
        } finally {
            setIsLoading(false);
        }
    };
    load();
}, []);
```

### Snackbar feedback
```tsx
const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error'
});

// Show
setSnackbar({ open: true, message: 'Done!', severity: 'success' });

// Dismiss
setSnackbar(prev => ({ ...prev, open: false }));
```

### Derived state (prefer over extra state)
```tsx
// Good — derived from cartData
const itemCount = cartData?.summary?.items_count ?? 0;

// Not good — don't create separate state for this
const [itemCount, setItemCount] = useState(0);
```
