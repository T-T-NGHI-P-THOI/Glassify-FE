import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Store,
  Verified,
  Star,
  Inventory,
  Search,
  ArrowBack,
  TuneRounded,
} from '@mui/icons-material';
import ProductGrid from '../../components/ProductBrowse/ProductGrid';
import type { BrowseProduct } from '../../types/filter';
import type { ApiShopInfo } from '../../api/product-api';
import ProductAPI from '../../api/product-api';
import { useLayout } from '../../layouts/LayoutContext';

type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name: A → Z' },
  { value: 'name_desc', label: 'Name: Z → A' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating_desc', label: 'Top Rated' },
];

const ShopDetailPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { setShowNavCategories } = useLayout();

  useEffect(() => {
    setShowNavCategories(false);
    return () => setShowNavCategories(true);
  }, [setShowNavCategories]);

  const [shop, setShop] = useState<ApiShopInfo | null>(null);
  const [products, setProducts] = useState<BrowseProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopProducts = async () => {
      if (!shopId) return;
      try {
        setIsLoading(true);
        const apiProducts = await ProductAPI.getProductsByShopId(shopId);

        if (apiProducts.length === 0) {
          setError('No products found for this shop');
          return;
        }

        if (apiProducts[0].shop) {
          setShop(apiProducts[0].shop);
        }

        const browseProducts: BrowseProduct[] = apiProducts.map((p) => ({
          id: p.id,
          productId: p.id,
          slug: p.slug,
          sku: p.sku,
          name: p.name,
          price: p.basePrice,
          rating: p.avgRating || 0,
          reviewCount: p.reviewCount || 0,
          productType: p.productType,
          image: ProductAPI.getPrimaryImageUrl(p),
          stockQuantity: p.stockQuantity,
          isNew: false,
          isFeatured: p.isFeatured,
          variantId: p.variantId || p.id,
          brandId: p.brandId,
          categoryName: p.categoryName,
          colorVariants: [
            {
              color: 'Default',
              colorCode: '#000000',
              slug: p.slug,
              productId: p.id,
              variantId: p.variantId || p.id,
            },
          ],
        }));

        setProducts(browseProducts);
      } catch (err) {
        console.error('Error fetching shop products:', err);
        setError('Failed to load shop products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopProducts();
  }, [shopId]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    products.forEach((p) => { if (p.categoryName) seen.add(p.categoryName); });
    return Array.from(seen).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      result = result.filter((p) => p.categoryName === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (minPrice !== '') result = result.filter((p) => p.price >= Number(minPrice));
    if (maxPrice !== '') result = result.filter((p) => p.price <= Number(maxPrice));

    switch (sortBy) {
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name_desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating_desc': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    }

    return result;
  }, [products, searchQuery, sortBy, minPrice, maxPrice, selectedCategory]);

  const hasActiveFilter = !!(searchQuery || minPrice || maxPrice || sortBy !== 'name_asc' || selectedCategory);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !shop) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <Store sx={{ fontSize: 64, color: '#d1d5db' }} />
        <Typography sx={{ color: '#6b7280', fontSize: 16 }}>{error || 'Shop not found'}</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f9fafb', minHeight: '100vh', pb: 8 }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 4 }, pt: 4 }}>

        {/* ── Shop Header Card ── */}
        <Box
          sx={{
            bgcolor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            p: 3,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Avatar
            variant="rounded"
            src={shop.logoUrl || undefined}
            sx={{ width: 72, height: 72, bgcolor: '#f3f4f6', flexShrink: 0, borderRadius: 1.5 }}
          >
            <Store sx={{ fontSize: 36, color: '#9ca3af' }} />
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                {shop.shopName}
              </Typography>
              {shop.isVerified && (
                <Verified sx={{ fontSize: 18, color: '#3b82f6' }} titleAccess="Verified" />
              )}
              <Chip
                label={shop.tier}
                size="small"
                sx={{ fontWeight: 700, fontSize: 10, bgcolor: '#f3f4f6', color: '#6b7280' }}
              />
            </Box>

            <Typography sx={{ fontSize: 11, color: '#9ca3af', mb: 1.25 }}>
              #{shop.shopCode}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star sx={{ fontSize: 14, color: '#f59e0b' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                {(shop.avgRating ?? 0).toFixed(1)}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#9ca3af', mr: 2 }}>Rating</Typography>

              <Inventory sx={{ fontSize: 14, color: '#9ca3af' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                {shop.totalProducts}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>Products</Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Toolbar: Category Tabs + Filters (one card) ── */}
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            mb: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Category tabs row */}
          <Tabs
            value={selectedCategory ?? '__all__'}
            onChange={(_, val: string) => setSelectedCategory(val === '__all__' ? null : val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              minHeight: 46,
              borderBottom: '1px solid #f3f4f6',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: 13,
                minHeight: 46,
                px: 2,
                color: '#6b7280',
              },
              '& .Mui-selected': { fontWeight: 700, color: '#111827' },
              '& .MuiTabs-indicator': { backgroundColor: '#667eea', height: 2 },
            }}
          >
            <Tab label={`All  (${products.length})`} value="__all__" />
            {categories.map((cat) => (
              <Tab
                key={cat}
                label={`${cat}  (${products.filter((p) => p.categoryName === cat).length})`}
                value={cat}
              />
            ))}
          </Tabs>

          {/* Filter controls row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.25,
              flexWrap: 'wrap',
            }}
          >
            <TuneRounded sx={{ fontSize: 18, color: '#9ca3af', flexShrink: 0 }} />

            <TextField
              placeholder="Search products..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 160,
                '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#f9fafb' },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#9ca3af', fontSize: 16 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControl
              size="small"
              sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#f9fafb' } }}
            >
              <InputLabel>Sort by</InputLabel>
              <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value as SortOption)}>
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              placeholder="Min ₫"
              size="small"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#f9fafb' } }}
              slotProps={{ htmlInput: { min: 0 } }}
            />

            <TextField
              placeholder="Max ₫"
              size="small"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#f9fafb' } }}
              slotProps={{ htmlInput: { min: 0 } }}
            />

            {hasActiveFilter && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  setSearchQuery('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSortBy('name_asc');
                  setSelectedCategory(null);
                }}
                sx={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap', textTransform: 'none' }}
              >
                Clear all
              </Button>
            )}

            <Typography sx={{ ml: 'auto', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
              {filteredProducts.length} / {products.length} products
            </Typography>
          </Box>
        </Box>

        {/* ── Product Grid ── */}
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} viewMode="grid" />
        ) : (
          <Box sx={{ py: 10, textAlign: 'center', bgcolor: '#fff', borderRadius: 2, border: '1px solid #e5e7eb' }}>
            <Store sx={{ fontSize: 56, color: '#d1d5db', mb: 1.5 }} />
            <Typography sx={{ fontSize: 15, color: '#9ca3af' }}>No products found</Typography>
            {hasActiveFilter && (
              <Button
                size="small"
                sx={{ mt: 1.5, color: '#667eea', textTransform: 'none' }}
                onClick={() => {
                  setSearchQuery('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSortBy('name_asc');
                  setSelectedCategory(null);
                }}
              >
                Clear filters
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ShopDetailPage;
