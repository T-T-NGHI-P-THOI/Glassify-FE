import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Button,
  IconButton,
  Tooltip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Inventory,
  Search,
  CalendarToday,
  Visibility,
  Edit,
  DeleteOutline,
  UnfoldMore,
  Close,
  Star,
  TrendingUp,
  LocalMall,
} from '@mui/icons-material';
import { useEffect, useState, useMemo } from 'react';
import { useLayout } from '../../layouts/LayoutContext';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopApi } from '@/api/shopApi';
import { useAuth } from '@/hooks/useAuth';
import type { ShopDetailResponse } from '@/models/Shop';
import ProductAPI, { type ApiProduct } from '@/api/product-api';

const SortIcon = () => (
  <UnfoldMore sx={{ fontSize: 14, color: '#9ca3af', ml: 0.5, verticalAlign: 'middle' }} />
);

const ShopProductsPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { setShowNavbar, setShowFooter } = useLayout();

  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FRAME' | 'LENS' | 'ACCESSORIES'>('ALL');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  useEffect(() => {
    (async () => {
      try {
        const shopRes = await shopApi.getMyShops();
        const myShop = shopRes.data?.[0] ?? null;
        setShop(myShop);
        if (myShop?.id) {
          const data = await ProductAPI.getAllProducts({ shopId: myShop.id, page: 1, unitPerPage: 200 });
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load shop products:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'ALL' || p.productType === typeFilter;
      return matchSearch && matchType;
    });
  }, [products, search, typeFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startEntry = filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, filtered.length);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const sidebarProps = {
    activeMenu: PAGE_ENDPOINTS.SHOP.PRODUCTS,
    shopName: shop?.shopName,
    shopLogo: shop?.logoUrl,
    ownerName: user?.fullName,
    ownerEmail: user?.email,
    ownerAvatar: user?.avatarUrl,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar {...sidebarProps} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar {...sidebarProps} />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Products
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Manage your product catalog and inventory
            </Typography>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{
                width: 200,
                '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              variant="outlined"
              size="small"
              startIcon={<CalendarToday sx={{ fontSize: 15 }} />}
              sx={{
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 500,
                borderColor: theme.palette.custom.border.light,
                color: theme.palette.custom.neutral[600],
                bgcolor: '#fff',
                borderRadius: 1.5,
                px: 2,
                height: 40,
                '&:hover': { borderColor: theme.palette.custom.neutral[400], bgcolor: theme.palette.custom.neutral[50] },
              }}
            >
              Date Range
            </Button>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}
                displayEmpty
                sx={{
                  borderRadius: 1.5,
                  bgcolor: '#fff',
                  fontSize: 13,
                  height: 40,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border.light },
                }}
              >
                <MenuItem value="ALL">Category</MenuItem>
                <MenuItem value="FRAME">Frame</MenuItem>
                <MenuItem value="LENS">Lens</MenuItem>
                <MenuItem value="ACCESSORIES">Accessories</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
            bgcolor: '#fff',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                  {['Product Name', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Action'].map((col) => (
                    <TableCell
                      key={col}
                      sx={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: theme.palette.custom.neutral[600],
                        borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                      {col !== 'Action' && <SortIcon />}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                      <Inventory sx={{ fontSize: 48, color: theme.palette.custom.neutral[300], mb: 1 }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                        No products found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((product) => (
                    <TableRow
                      key={product.id}
                      hover
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      {/* Product Name */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            variant="rounded"
                            src={product.fileResponses?.[0]?.url}
                            sx={{ width: 44, height: 44, bgcolor: theme.palette.custom.neutral[100], borderRadius: 1.5 }}
                          >
                            <Inventory sx={{ fontSize: 22, color: theme.palette.custom.neutral[400] }} />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Tooltip title={product.name}>
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: theme.palette.custom.neutral[800],
                                  maxWidth: 220,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {product.name}
                              </Typography>
                            </Tooltip>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mt: 0.25 }}>
                              {product.categoryName}{product.productType ? ` · ${product.productType}` : ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* SKU */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontFamily: 'monospace' }}>
                          {product.sku}
                        </Typography>
                      </TableCell>

                      {/* Category */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                          {product.categoryName || '—'}
                        </Typography>
                      </TableCell>

                      {/* Price */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                          {product.basePrice.toLocaleString('vi-VN')}₫
                        </Typography>
                        {product.compareAtPrice > product.basePrice && (
                          <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                            {product.compareAtPrice.toLocaleString('vi-VN')}₫
                          </Typography>
                        )}
                      </TableCell>

                      {/* Stock */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: product.stockQuantity === 0
                              ? theme.palette.custom.status.error.main
                              : product.stockQuantity <= product.lowStockThreshold
                                ? theme.palette.custom.status.warning.main
                                : theme.palette.custom.neutral[700],
                          }}
                        >
                          {product.stockQuantity}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={product.isActive ? 'Active' : 'Draft'}
                          size="small"
                          sx={{
                            fontSize: 12,
                            fontWeight: 500,
                            bgcolor: product.isActive
                              ? theme.palette.custom.status.success.light
                              : theme.palette.custom.status.warning.light,
                            color: product.isActive
                              ? theme.palette.custom.status.success.main
                              : theme.palette.custom.status.warning.main,
                            border: 'none',
                          }}
                        />
                      </TableCell>

                      {/* Action */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedProduct(product)}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 1,
                                bgcolor: theme.palette.custom.neutral[100],
                                '&:hover': { bgcolor: theme.palette.custom.neutral[200] },
                              }}
                            >
                              <Visibility sx={{ fontSize: 15, color: theme.palette.custom.neutral[500] }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 1,
                                bgcolor: theme.palette.custom.neutral[100],
                                '&:hover': { bgcolor: theme.palette.custom.status.info.light },
                                '&:hover .edit-icon': { color: theme.palette.custom.status.info.main },
                              }}
                            >
                              <Edit className="edit-icon" sx={{ fontSize: 15, color: theme.palette.custom.neutral[500] }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 1,
                                bgcolor: theme.palette.custom.status.error.light,
                                '&:hover': { bgcolor: '#fecaca' },
                              }}
                            >
                              <DeleteOutline sx={{ fontSize: 15, color: theme.palette.custom.status.error.main }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filtered.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 1.5,
                borderTop: `1px solid ${theme.palette.custom.border.light}`,
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                size="small"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': { fontSize: 13 },
                  '& .Mui-selected': {
                    bgcolor: `${theme.palette.custom.status.info.main} !important`,
                    color: '#fff',
                  },
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  Showing {startEntry} to {endEntry} of {filtered.length} entries
                </Typography>
                <FormControl size="small">
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                    sx={{
                      fontSize: 13,
                      height: 32,
                      borderRadius: 1.5,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border.light },
                    }}
                  >
                    <MenuItem value={10}>Show 10</MenuItem>
                    <MenuItem value={20}>Show 20</MenuItem>
                    <MenuItem value={50}>Show 50</MenuItem>
                    <MenuItem value={100}>Show 100</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </Box>
  );
};

// ==================== Product Detail Dialog ====================

interface ProductDetailDialogProps {
  product: ApiProduct;
  onClose: () => void;
}

const ProductDetailDialog = ({ product, onClose }: ProductDetailDialogProps) => {
  const theme = useTheme();

  const estimatedRevenue = product.soldCount * product.basePrice;

  const getPerformance = () => {
    if (product.avgRating >= 4.5) return 'Excellent';
    if (product.avgRating >= 3.5) return 'Good';
    if (product.avgRating >= 2.5) return 'Average';
    return 'Poor';
  };

  const insights = [
    { label: 'Total Sales', value: product.soldCount, unit: 'Unit', icon: <LocalMall sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} /> },
    { label: 'Total Revenue', value: `${estimatedRevenue.toLocaleString('vi-VN')}₫`, icon: <TrendingUp sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} /> },
    { label: 'Avg Rating', value: product.avgRating > 0 ? product.avgRating.toFixed(1) : '—', unit: `(${product.reviewCount} reviews)`, icon: <Star sx={{ fontSize: 18, color: theme.palette.custom.status.warning.main }} /> },
    { label: 'Performance', value: getPerformance(), icon: <TrendingUp sx={{ fontSize: 18, color: theme.palette.custom.status.purple.main }} /> },
  ];

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );

  const FieldBox = ({ children }: { children: React.ReactNode }) => (
    <Box
      sx={{
        border: `1px solid ${theme.palette.custom.border.light}`,
        borderRadius: 1.5,
        px: 2,
        py: 1.5,
        bgcolor: '#fff',
        fontSize: 14,
        color: theme.palette.custom.neutral[700],
      }}
    >
      {children}
    </Box>
  );

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
      {/* Header */}
      <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Product Detail
            </Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mt: 0.25 }}>
              This is all product information.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit sx={{ fontSize: 15 }} />}
              sx={{
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 500,
                borderColor: theme.palette.custom.border.main,
                color: theme.palette.custom.neutral[700],
                borderRadius: 1.5,
                '&:hover': { borderColor: theme.palette.custom.neutral[400] },
              }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DeleteOutline sx={{ fontSize: 15 }} />}
              sx={{
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 500,
                borderColor: theme.palette.custom.status.error.main,
                color: theme.palette.custom.status.error.main,
                borderRadius: 1.5,
                '&:hover': { bgcolor: theme.palette.custom.status.error.light, borderColor: theme.palette.custom.status.error.main },
              }}
            >
              Delete
            </Button>
            <IconButton size="small" onClick={onClose} sx={{ color: theme.palette.custom.neutral[500] }}>
              <Close sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Divider sx={{ mt: 2 }} />

      <DialogContent sx={{ p: 0 }}>
        <Grid container sx={{ minHeight: 480 }}>
          {/* Left panel */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{ p: 3, bgcolor: theme.palette.custom.neutral[50], borderRight: `1px solid ${theme.palette.custom.border.light}` }}
          >
            {/* Product Image */}
            <Box
              sx={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: 2,
                bgcolor: theme.palette.custom.neutral[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                mb: 2.5,
              }}
            >
              {product.fileResponses?.[0]?.url ? (
                <img
                  src={product.fileResponses[0].url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Inventory sx={{ fontSize: 64, color: theme.palette.custom.neutral[300] }} />
              )}
            </Box>

            {/* Product Insight */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, p: 2, bgcolor: '#fff' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Product Insight
                </Typography>
              </Box>
              <Grid container spacing={1.5}>
                {insights.map((item) => (
                  <Grid key={item.label} size={{ xs: 6 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        border: `1px solid ${theme.palette.custom.border.light}`,
                        bgcolor: theme.palette.custom.neutral[50],
                      }}
                    >
                      <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800], lineHeight: 1.2 }}>
                        {item.value}
                        {item.unit && (
                          <Typography component="span" sx={{ fontSize: 11, fontWeight: 400, color: theme.palette.custom.neutral[400], ml: 0.5 }}>
                            {item.unit}
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Right panel */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3, overflowY: 'auto', maxHeight: 560 }}>
            {/* ID + Product Name */}
            <Field label="ID and Product Name">
              <FieldBox>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], fontFamily: 'monospace' }}>
                    #{product.id.slice(0, 6).toUpperCase()}
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {product.name}
                  </Typography>
                </Box>
              </FieldBox>
            </Field>

            {/* Description */}
            <Field label="Description">
              <FieldBox>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {product.description || 'No description provided.'}
                </Typography>
              </FieldBox>
            </Field>

            {/* Categories */}
            <Field label="Categories">
              <FieldBox>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                    {product.categoryName || '—'}
                  </Typography>
                  <Chip
                    label={product.productType}
                    size="small"
                    sx={{ fontSize: 11, bgcolor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] }}
                  />
                </Box>
              </FieldBox>
            </Field>

            {/* Price & Discount */}
            <Field label="Price & Discount">
              <FieldBox>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>Base Price</Typography>
                  <Divider orientation="vertical" flexItem />
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                    {product.basePrice.toLocaleString('vi-VN')}₫
                  </Typography>
                  {product.compareAtPrice > product.basePrice && (
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                      {product.compareAtPrice.toLocaleString('vi-VN')}₫
                    </Typography>
                  )}
                </Box>
              </FieldBox>
            </Field>

            {/* Status */}
            <Field label="Status">
              <FieldBox>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                    {product.isActive ? 'Published' : 'Draft'}
                  </Typography>
                  <Chip
                    label={product.isActive ? 'Active' : 'Draft'}
                    size="small"
                    sx={{
                      fontSize: 11,
                      fontWeight: 500,
                      bgcolor: product.isActive ? theme.palette.custom.status.success.light : theme.palette.custom.status.warning.light,
                      color: product.isActive ? theme.palette.custom.status.success.main : theme.palette.custom.status.warning.main,
                    }}
                  />
                </Box>
              </FieldBox>
            </Field>

            {/* Stock */}
            <Field label="Stock & SKU">
              <FieldBox>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.25 }}>SKU</Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: theme.palette.custom.neutral[700] }}>
                      {product.sku}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.25 }}>In Stock</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: product.stockQuantity === 0 ? theme.palette.custom.status.error.main : theme.palette.custom.neutral[800] }}>
                      {product.stockQuantity}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Low Stock At</Typography>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                      {product.lowStockThreshold}
                    </Typography>
                  </Box>
                </Box>
              </FieldBox>
            </Field>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ShopProductsPage;
