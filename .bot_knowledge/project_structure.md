# Glassify Frontend — Project Knowledge Base

> Use this file to provide context to an AI assistant before working with the FE codebase.
> No need to re-read the entire source — this file summarizes everything needed to get started.

---

## Tech Stack

| Layer | Library / Version |
|-------|-------------------|
| Framework | React 19.2.3 + TypeScript 5.9.3 |
| Build tool | Vite 7.2.4 |
| Routing | React Router DOM 7.11.0 |
| UI | Material-UI (MUI) 7.3.8 + @emotion/react |
| HTTP Client | Axios 1.13.4 |
| State | Context API + useReducer (no Redux) |
| Auth | JWT (localStorage) + Google OAuth (@react-oauth/google 0.13.4) |
| 3D / AR | three.js 0.183.1, @react-three/fiber, @react-three/drei |
| Face detection | @mediapipe/face_mesh, @vladmandic/face-api, @mediapipe/tasks-vision |
| Animation | framer-motion 12.34.0 |
| Webcam | react-webcam 7.2.0 |
| Charts | recharts 3.8.0 |
| Notifications | react-toastify 11.0.5 |
| Icons | lucide-react 0.563.0, @mui/icons-material |
| Carousel | embla-carousel + autoplay |
| Deployment | Vercel |

---

## Folder Structure

```
src/
├── api/                        # All BE communication layer
│   ├── axios.config.ts         # Axios instance, interceptors, token refresh, logging
│   ├── endpoints.ts            # Centralized endpoint definitions (~400 lines)
│   ├── service/                # Service classes (CartService, LensService, ...)
│   ├── auth-api.ts
│   ├── product-api.ts
│   ├── order-api.ts
│   ├── cart-api.ts
│   ├── lens-api.ts
│   ├── shop-api.ts
│   ├── admin-api.ts
│   ├── refund-api.ts
│   ├── warranty-api.ts
│   ├── payment-api.ts
│   ├── prescription-api.ts
│   ├── ghnApi.ts               # GHN shipping API
│   ├── shop-wallet-api.ts
│   ├── user-wallet-api.ts
│   ├── user-address-api.ts
│   └── user-bank-account-api.ts
│
├── auth/                       # Auth system
│   ├── AuthContext.ts          # Auth context types
│   ├── AuthProvider.tsx        # Provider (useReducer, token init, refresh)
│   ├── Reducer.ts              # Auth state reducer
│   └── guards/
│       ├── AuthGuard.tsx       # Block route if not logged in
│       ├── GuestGuard.tsx      # Redirect if already logged in
│       └── RoleBaseGuard.tsx   # RBAC: CUSTOMER / SHOP_OWNER / ADMIN / STAFF
│
├── contexts/
│   ├── CartContext.ts          # Cart context interface
│   └── CartProvider.tsx        # Cart state (add/update/remove/coupon, server-side sync)
│
├── hooks/
│   ├── useAuth.tsx             # Consume AuthContext
│   ├── useCart.ts              # Consume CartContext
│   ├── useLayoutConfig.ts
│   ├── usePrescriptions.ts
│   └── useUserProfile.ts
│
├── models/                     # TypeScript DTO / response types
│   ├── ApiResponse.ts          # Generic ApiResponse<T> wrapper
│   ├── User.ts
│   ├── Product.ts
│   ├── Lens.ts
│   ├── Order.ts
│   ├── Auth.ts
│   ├── Prescription.ts
│   ├── Brand.ts
│   ├── Shop.ts
│   ├── Recommendation.ts
│   └── Refund.ts
│
├── types/                      # Enums & additional types
│   ├── auth-state.enum.ts
│   ├── auth-action-type.enum.ts
│   ├── user-recommendation.enum.ts
│   ├── product.ts
│   ├── filter.ts
│   └── user.dto.ts
│
├── components/                 # Shared / reusable components
│   ├── navbar/Navbar.tsx
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   └── ShopOwnerSidebar.tsx
│   ├── footer/Footer.tsx
│   ├── ProductBrowse/
│   │   ├── ProductGrid.tsx
│   │   └── FilterSidebar.tsx
│   ├── ProductDetailPage/
│   │   ├── ProductInfo.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── ProductDetails.tsx
│   │   ├── RecommendedProducts.tsx
│   │   ├── ShopInfo.tsx
│   │   └── Product3DPreviewDialog.tsx
│   ├── LensSelection/
│   │   └── LensSelectionDialog.tsx
│   └── custom/
│       ├── CustomCard.tsx
│       ├── CustomTextField.tsx
│       ├── CustomEmblaCarousel.tsx
│       └── index.ts            # Barrel export
│
├── pages/                      # Page-level components (route targets)
│   ├── MainPage.tsx
│   ├── NotFoundPage.tsx
│   ├── AccountDisabledPage.tsx
│   ├── auth/Login.tsx
│   ├── cart/Cart.tsx
│   ├── checkout/
│   │   ├── CheckoutPage.tsx
│   │   └── PaymentResultPage.tsx
│   ├── Dashboard/DashboardPage.tsx
│   ├── Help/HelpPage.tsx
│   ├── Product/
│   │   ├── ProductBrowsePage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── Frame/               # Frame CRUD pages
│   │   └── Lens/                # Lens CRUD + detail pages
│   ├── Shop/                    # All pages for Shop Owner role
│   │   ├── ShopDetailPage.tsx
│   │   ├── ShopProfilePage.tsx
│   │   ├── ShopDashboardPage.tsx
│   │   ├── ShopRegistrationPage.tsx
│   │   ├── ShopProductsPage.tsx
│   │   ├── ShopOrdersPage.tsx
│   │   ├── ShopTrackingPage.tsx
│   │   ├── ShopBankAccountPage.tsx
│   │   ├── ShopWalletPage.tsx
│   │   ├── ShopStaffPage.tsx
│   │   ├── ShopRefundReviewPage.tsx
│   │   └── ShopWarrantyPage.tsx
│   ├── User/
│   │   ├── UserProfilePage.tsx
│   │   ├── UserWalletPage.tsx
│   │   ├── UserBankAccountPage.tsx
│   │   └── Refund/
│   ├── Order/MyOrdersPage.tsx
│   ├── Admin/                   # All pages for Admin role
│   │   ├── AdminShopApprovalPage.tsx
│   │   ├── AdminUserManagementPage.tsx
│   │   ├── AdminOrdersPage.tsx
│   │   ├── AdminRefundsPage.tsx
│   │   ├── AdminWarrantiesPage.tsx
│   │   └── AdminTransactionsPage.tsx
│   ├── Refund/                  # Buyer & Seller refund pages
│   ├── Warranty/WarrantyPage.tsx
│   ├── Virtrual-Try-On/         # 3D AR try-on feature pages
│   └── Shipping/                # Delivery & internal transfer pages
│
├── layouts/
│   ├── Layout.tsx               # Shell layout (Navbar + Sidebar + Footer)
│   ├── LayoutContext.tsx        # Layout state (sidebar open/close, config)
│   ├── ForbiddenPage.tsx
│   └── Loading.tsx
│
├── routes/
│   ├── index.tsx                # Root router
│   ├── public-route.tsx         # Public routes (no auth required)
│   └── private-route.tsx        # Protected routes with role guards
│
├── utils/
│   ├── api-error.ts             # API error formatting
│   ├── color-helpers.ts
│   ├── face-detect-helpers.ts
│   ├── cart-helpers.ts
│   └── formatCurrency.ts
│
├── configs/env.config.ts        # Runtime env vars wrapper
├── theme/theme.ts               # MUI theme (red/blue/grey palette)
├── assets/                      # Images, videos, 3D models
├── App.tsx                      # Root component (provider nesting)
└── main.tsx                     # Entry point
```

---

## API Layer

### axios.config.ts
- Base URL: `VITE_API_BASE_URL` (default `http://localhost:8083`)
- **Request interceptor:** Automatically attaches `Authorization: Bearer <token>`, removes Content-Type for FormData
- **Response interceptor:** Logs request/response if `VITE_API_LOGGING=true`
- **401 handling:** Automatically calls refresh token endpoint and retries the original request
- **403 handling:** If account disabled → redirect to `/account-disabled`
- Tokens stored in `localStorage` (access + refresh)

### endpoints.ts
- All BE endpoints are defined here:
  ```ts
  AUTH: { LOGIN: '/api/v1/auth/login', ... }
  PRODUCTS: { LIST: '/api/v1/products', DETAIL: (id) => `/api/v1/products/${id}` }
  ```
- Always import from here — never hardcode URLs in API files

---

## State Management

| Context | File | Description |
|---------|------|-------------|
| Auth | `src/auth/AuthProvider.tsx` | user, isAuthenticated, isInitialized; useReducer |
| Cart | `src/contexts/CartProvider.tsx` | cartData, itemCount, summary; synced with server |
| Layout | `src/layouts/LayoutContext.tsx` | sidebar open/close, layout config |

---

## Routing

### Public routes (`src/routes/public-route.tsx`)
- `/` → MainPage
- `/login` → Login (GuestGuard)
- `/products`, `/products/:category` → ProductBrowsePage
- `/product/:slug/:sku` → ProductDetailPage
- `/shop/:shopId` → ShopDetailPage
- `/cart` → Cart
- `/virtual-try-on`, `/image-try-on` → AR/3D pages
- `/checkout`, `/payment-result` → Checkout flow
- `/help` → HelpPage

### Private routes (`src/routes/private-route.tsx`) — Require auth + role
- **CUSTOMER:** `/profile`, `/wallet`, `/orders`, `/refunds/buyer/*`, `/warranty`
- **SHOP_OWNER:** `/shop/dashboard`, `/shop/products/*`, `/shop/orders`, `/shop/refunds`, `/shop/tracking`, `/shop/staff`, `/shop/wallet`
- **ADMIN:** `/admin/shops`, `/admin/users`, `/admin/orders`, `/admin/refunds`, `/admin/warranties`, `/admin/transactions`
- **STAFF:** Access to selected shop routes

---

## Roles (RoleBasedGuard)

```
CUSTOMER    → Buyer flow
SHOP_OWNER  → Shop management
STAFF       → Staff operations (shop context)
ADMIN       → Full admin access
```

---

## Naming Conventions

- Components: `PascalCase` → `ProductGrid.tsx`
- CSS per component: `ProductGrid.css` (co-located in same folder)
- Dialog components: `*Dialog.tsx` → `LensSelectionDialog.tsx`
- API files: `kebab-case-api.ts` → `product-api.ts`
- Models: `PascalCase.ts` → `Product.ts`
- Hooks: `useCamelCase.ts` → `useAuth.tsx`
- Custom barrel: `src/components/custom/index.ts`

---

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8083   # BE API base URL
VITE_API_LOGGING=true                     # Enable request/response logging
```

---

## Quick Reference — Find the Right File Fast

| Goal | File |
|------|------|
| Add / modify an API call | `src/api/<domain>-api.ts` |
| Add a new endpoint | `src/api/endpoints.ts` |
| Modify auth flow | `src/auth/AuthProvider.tsx` |
| Modify cart logic | `src/contexts/CartProvider.tsx` |
| Add a new route | `src/routes/public-route.tsx` or `private-route.tsx` |
| Add a new page | `src/pages/<Module>/` |
| Modify theme colors | `src/theme/theme.ts` |
| Modify axios config | `src/api/axios.config.ts` |
| Add a TypeScript model | `src/models/<Model>.ts` |
| View all enums | `src/types/` |
