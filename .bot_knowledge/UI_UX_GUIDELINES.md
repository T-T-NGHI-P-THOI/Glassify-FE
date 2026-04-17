# UI/UX Guidelines — Glassify Frontend

> Reference for consistent UI/UX decisions. Use this when building or modifying any UI component.

---

## Theme Configuration

**File:** `src/theme/theme.ts`

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary.main` | `#000000` | Primary buttons, text |
| `primary.light` | `#ffffff` | Inverse/light text |
| `secondary.main` | `#f5576c` | Accent, CTAs |
| `secondary.light` | `#ff7a8a` | Hover states |
| `secondary.dark` | `#e4465b` | Active states |
| `success.main` | `#16a34a` | Success indicators |
| `success.light` | `#dcfce7` | Success backgrounds |
| `warning.main` | `#d97706` | Warning indicators |
| `warning.light` | `#fef3c7` | Warning backgrounds |
| `error.main` | `#dc2626` | Error states |
| `error.light` | `#fee2e2` | Error backgrounds |
| `info.main` | `#2563eb` | Info indicators |
| `info.light` | `#dbeafe` | Info backgrounds |

**Extended palette:**
- Purple: `#8b5cf6`, Pink: `#ec4899`, Indigo: `#4f46e5`, Rose: `#db2777`, Teal: `#059669`

**Neutral/Gray scale:**
| Token | Value |
|-------|-------|
| gray.50 | `#f9fafb` |
| gray.100 | `#f3f4f6` |
| gray.200 | `#e5e7eb` |
| gray.300 | `#d1d5db` |
| gray.400 | `#9ca3af` |
| gray.500 | `#6b7280` |
| gray.600 | `#4b5563` |
| gray.700 | `#374151` |
| gray.800 | `#1f2937` |
| gray.900 | `#111827` |

**Border colors:**
- Light: `#e5e7eb` | Main: `#d1d5db` | Dark: `#9ca3af`

---

### Typography

- **Font family:** `"Manrope", "Inter", "Roboto", "Helvetica", "Arial", sans-serif`
- **Button text:** `text-transform: none`, `font-weight: 600`
- **Default border-radius:** `15px`

---

### MUI Component Overrides

#### MuiButton
```
border-radius: 25px
height: 45px
padding: 0 32px
font-size: 16px
font-weight: 600
box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1)
outlined: border-width 2px
```

#### MuiTextField
```
border-radius: 15px
padding: 14px 16px
font-size: 15px
(focus and transition states defined in theme)
```

#### MuiCard
```
border-radius: 15px
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
hover: box-shadow 0 8px 30px rgba(0, 0, 0, 0.12) + translateY(-4px)
```

---

## Responsive Design

### Breakpoints (CSS)
| Breakpoint | Value |
|------------|-------|
| Large desktop | > 1200px |
| Tablet | ≤ 768px |
| Mobile | ≤ 480px |

### Carousel Slide Sizes (Embla)
```css
/* Product carousel */
.embla--product  { --slide-size: 25% }   /* desktop */
@media (max-width: 768px) { --slide-size: 50% }
@media (max-width: 480px) { --slide-size: 100% }

/* Feature carousel */
.embla--feature  { --slide-size: 33% }
```

### MUI Responsive Props Pattern
```tsx
// Use sx prop with breakpoint objects
sx={{ width: { xs: 340, sm: 360, md: 400 } }}
sx={{ display: { xs: 'none', md: 'flex' } }}
```

---

## Notifications (Toast)

**Library:** `react-toastify`  
**File:** `src/App.tsx`

Two `ToastContainer` instances:
| Instance | Position | Auto-close | Z-index |
|----------|----------|------------|---------|
| General | `bottom-right` | 3000ms | default |
| Alerts | `top-right` | 4000ms | 99999 |

**Usage pattern:**
```ts
import { toast } from 'react-toastify';

toast.success('Item added to cart');
toast.error('Something went wrong');
toast.info('Your order has been placed');
toast.warning('Stock is low');
```

---

## Loading States

- **App-level init:** `<Loading />` component rendered by `AuthProvider` until `isInitialized === true`
- **Data fetching:** local `isLoading` state + MUI `Skeleton` or spinner
- **Button actions:** disable button + show loading indicator while async op runs

**Pattern:**
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
    setIsLoading(true);
    try { await someApi(); }
    finally { setIsLoading(false); }
};

<Button disabled={isLoading}>
    {isLoading ? <CircularProgress size={20} /> : 'Submit'}
</Button>
```

---

## Error States

**Inline errors:** MUI `Snackbar` + `Alert`
```tsx
const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}>({ open: false, message: '', severity: 'success' });

<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
    <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
</Snackbar>
```

**Field-level errors:** MUI `TextField` with `error` and `helperText` props.

**Page-level errors:** `<ForbiddenPage />` or `<NotFoundPage />` components.

---

## Empty States

- Placeholder image: `https://placehold.co/600x400/000000/FFFFFF?text=Product`
- `CustomCard` renders a styled icon placeholder when no image is available
- For lists with no data: render a centered message with an icon

---

## Reusable Custom Components

**Location:** `src/components/custom/`  
**Import:** `import { CustomCard, CustomTextField, ... } from '@/components/custom';`

| Component | Description |
|-----------|-------------|
| `CustomButton` | MUI Button with defaults: `variant='contained'`, `color='primary'` |
| `CustomTextField` | MUI TextField with defaults: `variant='outlined'`, `fullWidth=true` |
| `CustomCard` | Product/feature card with image, title, description, link |
| `CustomEmblaCarousel` | Base Embla carousel wrapper |
| `CustomEmblaCarouselButtons` | Prev/Next buttons for carousel (backdrop-filter blur) |
| `CustomFeatureCarousel` | Carousel for feature sections |
| `CustomProductCarousel` | Product carousel with rating/reviews display |
| `ThreeDViewer` | 3D product preview using three.js |
| `RecommendationSearchButton` | Button for face-shape recommendation flow |

---

## Layout Shell

**Structure** (from `src/layouts/Layout.tsx`):
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    {showNavbar && <Navbar />}
    <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#ffffff' }}>
        {children}
    </Box>
    {showFooter && <Footer />}
</Box>
```

**Controlling Navbar/Footer visibility:**
```tsx
const { setShowNavbar, setShowFooter } = useLayoutConfig();

// In a page that needs no footer:
useEffect(() => {
    setShowFooter(false);
    return () => setShowFooter(true); // restore on unmount
}, []);
```

---

## Icons

**Preferred sources (in order):**
1. `@mui/icons-material` — for MUI-integrated usage
2. `lucide-react` — for custom standalone icons

```tsx
import { Add, Remove, Close } from '@mui/icons-material';
import { ShoppingCart } from 'lucide-react';
```

---

## Image Handling

- Product images: extracted and validated via `getProductImages(apiProduct)`
- Fallback placeholder: `https://placehold.co/600x400/000000/FFFFFF?text=Product`
- Avatars: uploaded via FormData to `POST /api/users/me/avatar`
- 3D Models: loaded via `ThreeDViewer` component using `three.js`
