# API Integration — Glassify Frontend

> Everything about how the FE communicates with the BE. Read before adding or modifying any API call.

---

## Axios Instance

**File:** `src/api/axios.config.ts`

```typescript
const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083',
    TIMEOUT: 30000,    // 30 seconds
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000, // 1 second
};
```

The singleton `axiosInstance` is the only HTTP client used across the entire app. Never create a new Axios instance.

---

## Interceptors

### Request Interceptor
1. Records `metadata.startTime` for duration tracking
2. If body is `FormData`: removes `Content-Type` header (lets browser set multipart boundary)
3. Otherwise: sets `Content-Type: application/json`
4. If endpoint is **not** in `PUBLIC_ENDPOINTS`: adds `Authorization: Bearer <token>`
5. Logs request if logging is enabled

### Response Interceptor
1. Records `metadata.endTime`, calculates request duration
2. Logs response if logging enabled
3. **403 + ACCOUNT_DISABLED error code** → clears tokens, redirects to `/account-disabled`
4. **401 (Unauthorized/Expired)** → triggers token refresh flow:
   - Calls `POST /auth/refresh` with `refreshToken`
   - On success: saves new tokens, retries original request
   - On failure: clears tokens, redirects to `/login`
5. All other errors → passed through `formatError()`

---

## Public Endpoints (No Auth Required)

```typescript
const PUBLIC_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/google',
    '/api/v1/auth/google',
    '/categories',
];
```

All other endpoints automatically receive the Bearer token.

---

## Endpoints Registry

**File:** `src/api/endpoints.ts` — **Always add new endpoints here, never hardcode URLs.**

**Structure:**
```typescript
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN:    '/api/v1/auth/login',
        REGISTER: '/api/v1/auth/register',
        REFRESH:  '/api/v1/auth/refresh',
        GOOGLE:   '/api/v1/auth/google',
    },
    PRODUCTS: {
        LIST:           '/api/v1/product',
        DETAIL:         (id: string) => `/api/v1/product/${id}`,
        BY_SLUG:        (slug: string) => `/api/v1/product/slug/${slug}`,
        WITH_FRAME_INFO:(id: string) => `/api/v1/product/${id}/with-frame-info`,
        ACCESSORIES:    (id: string) => `/api/v1/product/${id}/accessories`,
        BY_SHOP:        (shopId: string) => `/api/v1/product/shop/${shopId}`,
    },
    CART: {
        BASE:       '/api/v1/cart',
        ME:         '/api/v1/cart/me',
        ACTIVE:     '/api/v1/cart/active',
        ITEMS:      (cartId: string) => `/api/v1/cart/${cartId}/items`,
        ITEM:       (cartId: string, itemId: string) => `/api/v1/cart/${cartId}/items/${itemId}`,
    },
    LENS: {
        CATALOG:    '/api/v1/lens-catalog',
        LIST:       '/api/v1/lenses',
        DETAIL:     (id: string) => `/api/v1/lenses/${id}`,
        FEATURES:   '/api/v1/lenses/features',
        TINTS:      '/api/v1/lenses/tints',
    },
    // ACCOUNT, CATEGORIES, ORDERS, PRESCRIPTIONS, REFUND, SHOP, USER, ADMIN, WARRANTY, PAYMENT, GHN, ...
};
```

---

## API Service Files

**Location:** `src/api/` — one file per domain

| File | Domain | Key methods |
|------|--------|-------------|
| `auth-api.ts` / `service/authApi.ts` | Auth | `login`, `register`, `loginWithGoogle` |
| `service/userApi.ts` | User profile | `getMyProfile`, `updateProfile`, `uploadAvatar`, `changePassword`, `linkGoogleAccount` |
| `cart-api.ts` | Cart (raw BE) | `createCart`, `getMyCart`, `addItem`, `updateItem`, `removeItem` |
| `service/CartService.ts` | Cart (enriched) | `getCart`, `addItem`, `updateItemQuantity`, `removeItem`, `resetCartId` |
| `product-api.ts` | Products | List, detail, search, by shop |
| `lens-api.ts` | Lens catalog | Features, tints, usage, progressives |
| `order-api.ts` | Orders | Create, list, detail, cancel |
| `shop-api.ts` | Shop | Profile, products, orders, registration |
| `admin-api.ts` | Admin | Shop approval, user mgmt, oversight |
| `refund-api.ts` | Refunds | Create, review, tracking, confirm |
| `warranty-api.ts` | Warranty | Claims |
| `payment-api.ts` | Payment | Create VNPay URL |
| `prescription-api.ts` | Prescriptions | CRUD |
| `ghnApi.ts` | Shipping | Provinces, districts, wards, fee calculation |
| `shop-wallet-api.ts` | Shop wallet | Balance, transactions, withdrawal |
| `user-wallet-api.ts` | User wallet | Balance, transactions |
| `user-address-api.ts` | Addresses | CRUD |
| `user-bank-account-api.ts` | Bank accounts | CRUD |

---

## Response Type

All BE responses follow `ApiResponse<T>`:
```typescript
// src/models/ApiResponse.ts
interface ApiResponse<T> {
    status: number;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}
```

Accessing the data:
```typescript
const response = await axiosInstance.get<ApiResponse<ProductResponse>>('/api/v1/product/123');
const product = response.data.data;   // note: .data.data
```

---

## Writing an API Call

```typescript
// src/api/some-api.ts
import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';

export const someApi = {
    async getList(): Promise<SomeItem[]> {
        const res = await axiosInstance.get<ApiResponse<SomeItem[]>>(API_ENDPOINTS.SOME.LIST);
        return res.data.data!;
    },

    async getById(id: string): Promise<SomeItem> {
        const res = await axiosInstance.get<ApiResponse<SomeItem>>(API_ENDPOINTS.SOME.DETAIL(id));
        return res.data.data!;
    },

    async create(payload: CreateSomeRequest): Promise<SomeItem> {
        const res = await axiosInstance.post<ApiResponse<SomeItem>>(API_ENDPOINTS.SOME.BASE, payload);
        return res.data.data!;
    },

    async uploadFile(id: string, file: File): Promise<void> {
        const form = new FormData();
        form.append('file', file);
        // Do NOT set Content-Type manually — axios interceptor handles it
        await axiosInstance.post(API_ENDPOINTS.SOME.UPLOAD(id), form);
    },
};
```

---

## Error Handling

### In Components
```typescript
import { getApiErrorMessage } from '@/utils/api-error';

try {
    await someApi.create(data);
    toast.success('Created successfully');
} catch (error) {
    const message = getApiErrorMessage(error, 'Failed to create item');
    toast.error(message);
    // or: setSnackbar({ open: true, message, severity: 'error' });
}
```

### Error Extraction Priority (`src/utils/api-error.ts`)
`getApiErrorMessage(error, fallback)` checks in order:
1. `error.response?.data.errors` — first field validation error
2. `error.response?.data.message`
3. `error.originalError?.response?.data.errors`
4. `error.originalError?.response?.data.message`
5. `error.errors` (direct)
6. `error.message`
7. `fallback`

### FormattedError Shape
```typescript
interface FormattedError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;   // field-level validation errors
    originalError: AxiosError;
}
```

---

## CartService — Local Enrichment Layer

**File:** `src/api/service/CartService.ts`

CartService sits between the raw BE cart API and the CartProvider. It:

1. **Manages Cart ID** — creates/retrieves cart, stores `currentCartId` in module scope
2. **Session management** — creates a guest session ID (`glassify_session_id` in localStorage) for unauthenticated users
3. **Display cache** — stores frontend-only metadata (product name, image, color, size, etc.) in localStorage key `glassify_cart_display_cache`, since BE only returns IDs
4. **Data transformation** — `transformBeCart(beCart)` converts the flat BE response into a tree structure (parent frame → child lens)
5. **Cache cleanup** — removes stale cache entries for items that no longer exist in cart

**Cart ID flow:**
```
getCart()
  ↓
ensureCart()
  ├─ currentCartId exists → use it
  ├─ Call GET /cart/me → get cartId
  └─ No cart → POST /cart to create one
```

**`resetCartId()`** — called on logout to clear the in-memory cartId so next login starts fresh.

---

## API Logging

Controlled by: `import.meta.env.VITE_API_LOGGING === 'true'` or in development mode.

Logs include:
- Request: method, URL, headers, params, body, timestamp
- Response: status, data, duration (ms)
- Error: status, message, response data, timestamp

Set `VITE_API_LOGGING=false` in production `.env`.
