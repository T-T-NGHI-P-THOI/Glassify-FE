import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
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
import { useTheme } from '@mui/material/styles';
import {
  Store,
  Verified,
  Star,
  Inventory,
  Search,
  ArrowBack,
} from '@mui/icons-material';
import ProductGrid from '../../components/ProductBrowse/ProductGrid';
import type { BrowseProduct } from '../../types/filter';
import type { ApiShopInfo } from '../../api/product-api';
import ProductAPI from '../../api/product-api';

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
  const theme = useTheme();

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
          image:
            p.fileResponses?.[0]?.url ||
            'https://placehold.co/300x200/000000/FFFFFF?text=' + encodeURIComponent(p.name),
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

    if (minPrice !== '') {
      result = result.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice !== '') {
      result = result.filter((p) => p.price <= Number(maxPrice));
    }

    switch (sortBy) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating_desc':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return result;
  }, [products, searchQuery, sortBy, minPrice, maxPrice, selectedCategory]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !shop) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <Typography color="text.secondary">{error || 'Shop not found'}</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: theme.palette.custom.neutral[50], minHeight: '100vh', pb: 6 }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 4 }, pt: 4 }}>
        {/* Back button */}
        {/* <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, color: theme.palette.custom.neutral[600] }}
        >
          Back
        </Button> */}

        {/* Shop Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Avatar
            variant="rounded"
            src={shop.logoUrl || undefined}
            sx={{ width: 80, height: 80, bgcolor: theme.palette.custom.neutral[100] }}
          >
            <Store sx={{ fontSize: 40 }} />
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography
                sx={{ fontSize: 22, fontWeight: 700, color: theme.palette.custom.neutral[800] }}
              >
                {shop.shopName}
              </Typography>
              {shop.isVerified && (
                <Verified sx={{ fontSize: 20, color: theme.palette.custom.status.info.main }} />
              )}
              <Chip
                label={shop.tier}
                size="small"
                sx={{
                  ml: 1,
                  fontWeight: 700,
                  fontSize: 11,
                  bgcolor: theme.palette.custom.neutral[100],
                  color: theme.palette.custom.neutral[600],
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 1.5 }}>
              Code: {shop.shopCode}
            </Typography>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Star sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                <Typography
                  sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}
                >
                  {shop.avgRating.toFixed(1)}
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  Rating
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Inventory sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                <Typography
                  sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}
                >
                  {shop.totalProducts}
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  Products
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Category Tabs + Filter — unified */}
        <Paper
          elevation={0}
          sx={{ mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
        >
          {/* Row 1: Category tabs */}
          <Tabs
            value={selectedCategory ?? '__all__'}
            onChange={(_, val: string) => setSelectedCategory(val === '__all__' ? null : val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              borderBottom: `1px solid ${theme.palette.custom.border.light}`,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: 13,
                minHeight: 44,
                px: 1.5,
                color: theme.palette.custom.neutral[600],
              },
              '& .Mui-selected': { fontWeight: 700, color: theme.palette.custom.neutral[900] },
              '& .MuiTabs-indicator': { backgroundColor: theme.palette.custom.neutral[900] },
            }}
          >
            <Tab label={`All (${products.length})`} value="__all__" />
            {categories.map((cat) => (
              <Tab
                key={cat}
                label={`${cat} (${products.filter((p) => p.categoryName === cat).length})`}
                value={cat}
              />
            ))}
          </Tabs>

          {/* Row 2: Filter controls */}
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
            <TextField
              placeholder="Search products..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: 160 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.custom.neutral[400], fontSize: 16 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              placeholder="Min ₫"
              size="small"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              sx={{ width: 100 }}
              slotProps={{ htmlInput: { min: 0 } }}
            />

            <TextField
              placeholder="Max ₫"
              size="small"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              sx={{ width: 100 }}
              slotProps={{ htmlInput: { min: 0 } }}
            />

            {(searchQuery || minPrice || maxPrice || sortBy !== 'name_asc' || selectedCategory) && (
              <Button
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSortBy('name_asc');
                  setSelectedCategory(null);
                }}
                sx={{ color: theme.palette.custom.neutral[500], fontSize: 12, whiteSpace: 'nowrap' }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Paper>

        {/* Products Section */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: `1px solid ${theme.palette.custom.border.light}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}
            >
              {selectedCategory ?? 'All Products'}
            </Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
              {filteredProducts.length} of {products.length} products
            </Typography>
          </Box>

          <Box sx={{ p: 2.5 }}>
            {filteredProducts.length > 0 ? (
              <ProductGrid products={filteredProducts} viewMode="grid" />
            ) : (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Store
                  sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }}
                />
                <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }}>
                  No products found
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ShopDetailPage;
