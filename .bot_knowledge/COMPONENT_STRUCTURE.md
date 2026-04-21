# Component Structure — Glassify Frontend

> Conventions and patterns for organizing, building, and consuming components.

---

## Provider Tree (App Root)

**File:** `src/App.tsx`

```tsx
<BrowserRouter>
  <AuthProvider>                     // src/auth/AuthProvider.tsx
    <CartProvider>                   // src/contexts/CartProvider.tsx
      <LayoutProvider>               // src/layouts/LayoutContext.tsx
        <ToastContainer (bottom-right, 3s) />
        <Layout>                     // src/layouts/Layout.tsx
          <Routes />                 // src/routes/index.tsx
        </Layout>
      </LayoutProvider>
    </CartProvider>
  </AuthProvider>
  <ToastContainer (top-right, 4s, z-index 99999) />
</BrowserRouter>
```

---

## Folder Responsibilities

| Folder | Purpose |
|--------|---------|
| `src/components/` | Shared, reusable components used across multiple pages |
| `src/components/custom/` | Generic wrappers (CustomButton, CustomTextField, etc.) |
| `src/pages/` | Route-level page components — one folder per domain |
| `src/layouts/` | Shell layout, guards, loading screen |
| `src/auth/guards/` | Route protection HOCs |
| `src/hooks/` | Custom hooks for consuming context |

---

## Layout Component

**File:** `src/layouts/Layout.tsx`

```tsx
const Layout: FC<{ children: ReactNode }> = ({ children }) => {
    const { showNavbar, showFooter } = useLayoutConfig();
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {showNavbar && <Navbar />}
            <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#ffffff' }}>
                {children}
            </Box>
            {showFooter && <Footer />}
        </Box>
    );
};
```

---

## Routing Structure

**File:** `src/routes/index.tsx`

```tsx
<Routes>
    {PublicRoutesComponent()}     // src/routes/public-route.tsx
    {PrivateRoutesComponent()}    // src/routes/private-route.tsx
    <Route path="/products" element={<ProductBrowsePage />} />
    <Route path="/products/:category" element={<ProductBrowsePage />} />
    <Route path="/product/:slug/:sku" element={<ProductDetailPage />} />
    <Route path="/shop/:shopId" element={<ShopDetailPage />} />
    <Route path="/cart" element={<ShoppingCart />} />
    <Route path="/account-disabled" element={<AccountDisabledPage />} />
    <Route path="*" element={<NotFoundPage />} />
</Routes>
```

---

## Route Guards

### AuthGuard — block unauthenticated users
```tsx
// src/auth/guards/AuthGuard.tsx
const AuthGuard: FC<PropsWithChildren> = ({ children }) => {
    const { isInitialized, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isInitialized) return <Loading />;
    if (!isAuthenticated) {
        return <Navigate to={PAGE_ENDPOINTS.AUTH.LOGIN} state={{ from: location }} replace />;
    }
    return <>{children}</>;
};
```

### GuestGuard — redirect logged-in users away from login page
```tsx
// src/auth/guards/GuestGuard.tsx
// Redirects to home if already authenticated
```

### RoleBasedGuard — restrict by role
```tsx
// src/auth/guards/RoleBaseGuard.tsx
// Accepts allowedRoles: string[] prop
// Renders ForbiddenPage if user.role not in allowedRoles
```

**Usage in private routes:**
```tsx
<AuthGuard>
    <RoleBasedGuard allowedRoles={['SHOP_OWNER', 'ADMIN']}>
        <ShopDashboardPage />
    </RoleBasedGuard>
</AuthGuard>
```

---

## Page Component Pattern

Page components are route targets. They:
- Live in `src/pages/<Domain>/`
- Own their local state (data fetching, loading, dialog open/close)
- Consume context via custom hooks (`useAuth`, `useCart`)
- Compose multiple feature components

**Typical page structure:**
```tsx
// src/pages/Product/ProductDetailPage.tsx
const ProductDetailPage: React.FC = () => {
    // 1. Router hooks
    const { slug, sku } = useParams<{ slug: string; sku: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // 2. Context hooks
    const { addItem, addFrameWithLens, cartData } = useCart();
    const { isAuthenticated } = useAuth();

    // 3. Local state
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // 4. Derived/memoized values
    const editCartItemId = searchParams.get('editCartItemId');
    const isEditMode = !!editCartItemId;

    // 5. Effects
    useEffect(() => { loadProduct(); }, [slug, sku]);

    // 6. Handlers
    const handleAddToCart = async () => { ... };

    // 7. Render
    return ( ... );
};
```

---

## Component Naming Conventions

| Pattern | Example |
|---------|---------|
| Page component | `ProductDetailPage.tsx` |
| Feature/section component | `ProductInfo.tsx`, `ImageGallery.tsx` |
| Dialog/modal | `LensSelectionDialog.tsx`, `Product3DPreviewDialog.tsx` |
| Generic wrapper | `CustomCard.tsx`, `CustomTextField.tsx` |
| Layout component | `Navbar.tsx`, `Sidebar.tsx`, `Footer.tsx` |
| Guard | `AuthGuard.tsx`, `RoleBaseGuard.tsx` |
| Co-located CSS | `ProductGrid.css` (same folder as `ProductGrid.tsx`) |

---

## TypeScript Props Pattern

```tsx
// Define props interface above the component
interface ProductInfoProps {
    product: Product;
    onAddToCart: () => void;
    variant?: 'compact' | 'full';    // optional with default
    disabled?: boolean;
}

// Use React.FC<Props> with destructuring + defaults
const ProductInfo: React.FC<ProductInfoProps> = ({
    product,
    onAddToCart,
    variant = 'full',
    disabled = false,
}) => {
    return ( ... );
};

export default ProductInfo;
```

For components with children:
```tsx
const Wrapper: React.FC<PropsWithChildren<{ title: string }>> = ({ children, title }) => (
    <Box>
        <Typography>{title}</Typography>
        {children}
    </Box>
);
```

---

## Hook Patterns

### Creating a context hook (pattern used everywhere)
```tsx
export const useSomething = () => {
    const context = useContext(SomethingContext);
    if (!context) {
        throw new Error('useSomething must be used within SomethingProvider');
    }
    return context;
};
```

### Async data loading in hooks
```tsx
export const useUserProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await userApi.getMyProfile();
            setProfile(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    return { profile, isLoading, refetch: loadProfile };
};
```

---

## useEffect Patterns

```tsx
// On mount only
useEffect(() => { init(); }, []);

// On dependency change
useEffect(() => { fetchData(); }, [id]);

// With cleanup (timeouts, subscriptions)
useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
}, [isAnimating]);

// Sync URL param → state
useEffect(() => {
    const lensParam = searchParams.get('lens');
    if (lensParam === 'open') setLensDialogOpen(true);
}, [searchParams]);
```

---

## Feature Components (Product Domain)

**Location:** `src/components/ProductDetailPage/`

| Component | Role |
|-----------|------|
| `ImageGallery.tsx` | Product image carousel/switcher |
| `ProductInfo.tsx` | Name, price, variant selector, add-to-cart |
| `ProductDetails.tsx` | Specs, material, dimensions tab content |
| `RecommendedProducts.tsx` | "You may also like" section |
| `ShopInfo.tsx` | Shop name, rating, follow button |
| `Product3DPreviewDialog.tsx` | MUI Dialog with three.js 3D viewer |

**Location:** `src/components/LensSelection/`

| Component | Role |
|-----------|------|
| `LensSelectionDialog.tsx` | Full lens picker dialog (features, tints, prescription) |

---

## Cart Item Structure

Cart items can be nested (parent → children). The tree shape:

```typescript
interface CartItemWithDetails {
    id: string;
    item_type: 'FRAME' | 'LENSES' | 'ACCESSORY' | 'GIFT';
    children: CartItemWithDetails[];   // Child items (e.g., lens inside a frame)
    lens_selection?: LensSelection;
    variant_details: { sku, color?, size?, image_url? };
    is_gift: boolean;
    shop_id?: string;
    shop_name?: string;
    stock_quantity?: number;
    // ... quantity, unit_price, line_total, etc.
}
```

When rendering a cart item that has `children`, render child items indented below the parent. The parent is always the FRAME; child is the LENS.

---

## Edit Mode Pattern (Cart Edit)

When navigating to `ProductDetailPage` with `?editCartItemId=<id>`, the page enters **edit mode**:
```tsx
const editCartItemId = searchParams.get('editCartItemId');
const isEditMode = !!editCartItemId;

// Pre-populate lens selection from existing cart item
const editLensSelection = useMemo(() => {
    if (!isEditMode || !cartData) return undefined;
    const parentItem = cartData.items.find(i => i.id === editCartItemId);
    return parentItem?.children.find(c => c.item_type === 'LENS')?.lens_selection;
}, [isEditMode, editCartItemId, cartData]);
```

In edit mode: remove old item → add updated item (atomic swap).

---

## Custom Components Barrel Export

```typescript
// src/components/custom/index.ts
export { default as CustomButton } from './CustomButton';
export { default as CustomTextField } from './CustomTextField';
export { default as CustomCard } from './CustomCard';
// ...

// Usage
import { CustomCard, CustomTextField } from '@/components/custom';
```
