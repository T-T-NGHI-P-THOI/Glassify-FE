import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TableSortLabel,
  Avatar,
  TextField,
  InputAdornment,
  Tooltip,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  MoreVert,
  Search,
  Add,
  Inventory,
  Verified,
  Inventory2,
  Warehouse,
  RemoveShoppingCart,
  EditNote,
  Visibility,
  Edit,
  DeleteOutline,
  KeyboardArrowDown,
  KeyboardArrowUp,
  InfoOutlined,
} from '@mui/icons-material';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { useLayout } from '../../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { CustomButton } from '@/components/custom';
import { useAuth } from '@/hooks/useAuth';
import { shopApi } from '@/api/shopApi';
import type { ShopDetailResponse } from '@/models/Shop';
import ProductAPI from '@/api/product-api';
import { ProductImagesCell } from './ImageGalleryCell';
import type { CreateFrameVariantFormData } from './Create/CreateFrameVariantPage';
import FrameVariantDetailDialog from './View/FrameVariantDetailDialog';

// ─── API Types (from real response) ──────────────────────────────────────────

interface FrameVariantResponse {
  id: string;
  frameGroupId: string;
  colorName: string;
  colorHex: string;
  frameWidthMm: number;
  lensWidthMm: number;
  lensHeightMm: number;
  bridgeWidthMm: number;
  templeLengthMm: number;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | string;
  isActive: boolean | null;
  productId: string | null;
  productName: string | null;
  slug: string | null;
  basePrice: number;
  costPrice: number;
  compareAtPrice: number;
  // Inventory from ShopInventory (source of truth)
  qtyOnHand: number | null;
  qtyAvailable: number | null;
  qtyReserved: number | null;
  lowStockThreshold: number | null;
}

interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  costPrice: number;
  compareAtPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  productType: string;
  productImages: string[];
  sku: string | null;
  categoryName: string | null;
  fileResponses: { url: string }[] | null;
  createdAt: string;
  updatedAt: string;
}

interface FrameGroup {
  id: string;
  frameName: string;
  frameShape: string;
  frameStructure: string;
  frameMaterial: string;
  genderTarget: string;
  ageGroup: string;
  vrEnabled?: boolean;
  suitableFaceShapes: string[] | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  productResponses: ProductResponse[];
  frameVariantResponses: FrameVariantResponse[];
}

// ─── Variant status helper ────────────────────────────────────────────────────

function getVariantStatus(v: FrameVariantResponse): 'in_stock' | 'low_stock' | 'out_of_stock' {
  const available = v.qtyAvailable ?? 0;
  const threshold = v.lowStockThreshold ?? 10;
  if (available === 0) return 'out_of_stock';
  if (available <= threshold) return 'low_stock';
  return 'in_stock';
}

const variantStatusConfig = {
  in_stock: { label: 'In Stock', bg: '#dcfce7', color: '#16a34a' },
  low_stock: { label: 'Low Stock', bg: '#fef9c3', color: '#ca8a04' },
  out_of_stock: { label: 'Out of Stock', bg: '#fee2e2', color: '#dc2626' },
};

// ─── Helper: map FrameVariantResponse → CreateFrameVariantFormData ────────────

function mapVariantResponseToFormData(v: FrameVariantResponse): CreateFrameVariantFormData & {
  qtyOnHand?: number | null;
  qtyAvailable?: number | null;
  qtyReserved?: number | null;
  lowStockThreshold?: number | null;
} {
  return {
    colorName: v.colorName,
    colorHex: v.colorHex,
    size: v.size as 'SMALL' | 'MEDIUM' | 'LARGE' | '',
    frameWidthMm: String(v.frameWidthMm ?? ''),
    lensWidthMm: String(v.lensWidthMm ?? ''),
    lensHeightMm: String(v.lensHeightMm ?? ''),
    bridgeWidthMm: String(v.bridgeWidthMm ?? ''),
    templeLengthMm: String(v.templeLengthMm ?? ''),
    stock: String(v.qtyOnHand ?? ''),
    stockThreshold: String(v.lowStockThreshold ?? ''),
    warrantyMonths: '',
    costPrice: String(v.costPrice ?? ''),
    basePrice: String(v.basePrice ?? ''),
    compareAtPrice: String(v.compareAtPrice ?? ''),
    isReturnable: false,
    isFeatured: false,
    images: [],
    textureFile: null,
    // Pass raw inventory numbers for detail dialog display
    qtyOnHand: v.qtyOnHand,
    qtyAvailable: v.qtyAvailable,
    qtyReserved: v.qtyReserved,
    lowStockThreshold: v.lowStockThreshold,
  };
}

// ─── Variant sub-table ────────────────────────────────────────────────────────

interface VariantRowsProps {
  variants: FrameVariantResponse[];
  colSpan: number;
  vrEnabled?: boolean;
}

const VariantRows = ({ variants, colSpan, vrEnabled }: VariantRowsProps) => {
  const theme = useTheme();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<(CreateFrameVariantFormData & { id?: string }) | null>(null);

  const handleOpenDetail = (v: FrameVariantResponse) => {
    const mapped = mapVariantResponseToFormData(v);
    setSelectedVariant({ ...mapped, id: v.id });
    setDetailOpen(true);
  };

  if (variants.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={colSpan}
          sx={{ p: 0, borderBottom: `2px solid ${theme.palette.custom.border.light}` }}
        >
          <Box sx={{ bgcolor: theme.palette.custom.neutral[50], borderTop: `1px solid ${theme.palette.custom.border.light}`, px: 3, py: 2 }}>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], textAlign: 'center' }}>
              No variants for this frame group
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TableRow>
        <TableCell
          colSpan={colSpan}
          sx={{ p: 0, borderBottom: `2px solid ${theme.palette.custom.border.light}` }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.custom.neutral[50],
              borderTop: `1px solid ${theme.palette.custom.border.light}`,
              px: 3,
              py: 1.5,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Color', 'Size', 'Dimensions (mm)', 'Price', 'Stock', 'Status', 'Image', 'Action'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: theme.palette.custom.neutral[400],
                        py: 0.75,
                        px: 1.5,
                        borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                        bgcolor: 'transparent',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {variants.map((v) => {
                  const status = getVariantStatus(v);
                  const sc = variantStatusConfig[status];
                  const dims = `${v.frameWidthMm} / ${v.lensWidthMm}×${v.lensHeightMm} / ${v.bridgeWidthMm} / ${v.templeLengthMm}`;

                  return (
                    <TableRow
                      key={v.id}
                      sx={{
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                      }}
                    >
                      {/* Color */}
                      <TableCell sx={{ py: 1, px: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: v.colorHex,
                              border: '1.5px solid rgba(0,0,0,0.12)',
                              flexShrink: 0,
                            }}
                          />
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[700] }}>
                            {v.colorName}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Size */}
                      <TableCell sx={{ py: 1, px: 1.5 }}>
                        <Chip
                          label={v.size}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            fontWeight: 600,
                            bgcolor: theme.palette.custom.neutral[100],
                            color: theme.palette.custom.neutral[600],
                            border: 'none',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      </TableCell>

                      {/* Dimensions */}
                      <TableCell sx={{ py: 1, px: 1.5 }}>
                        <Tooltip title="Frame / Lens W×H / Bridge / Temple">
                          <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: theme.palette.custom.neutral[500] }}>
                            {dims}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      {/* Price */}
                      <TableCell sx={{ py: 1, px: 1.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                          {v.basePrice.toLocaleString('vi-VN')}₫
                        </Typography>
                        {v.compareAtPrice > v.basePrice && (
                          <Typography sx={{ fontSize: 10, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                            {v.compareAtPrice.toLocaleString('vi-VN')}₫
                          </Typography>
                        )}
                      </TableCell>

                      {/* Stock */}
                      <TableCell sx={{ py: 1, px: 1.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: sc.color }}>
                          {v.qtyAvailable ?? '—'}
                        </Typography>
                        {v.qtyReserved != null && v.qtyReserved > 0 && (
                          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                            {v.qtyReserved} reserved
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1, px: 1.5 }}>
                        <Chip
                          label={sc.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            fontWeight: 600,
                            bgcolor: sc.bg,
                            color: sc.color,
                            border: 'none',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      </TableCell>

                      {/* Product images */}
                      <TableCell sx={{ py: 1, px: 1.5 }}>
                        <ProductImagesCell
                          productId={v.productId ?? ''}
                          size={v.size}
                        />
                      </TableCell>

                      {/* Variant actions */}
                      <TableCell sx={{ py: 1, px: 1.5 }} align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {/* View detail */}
                          <Tooltip title="View detail">
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleOpenDetail(v); }}
                              sx={{
                                width: 24, height: 24, borderRadius: 0.75,
                                bgcolor: theme.palette.custom.neutral[100],
                                '&:hover': { bgcolor: theme.palette.custom.status.info.light },
                                '&:hover .v-view': { color: theme.palette.custom.status.info.main },
                              }}
                            >
                              <InfoOutlined className="v-view" sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }} />
                            </IconButton>
                          </Tooltip>

                          {/* Edit */}
                          <Tooltip title="Edit variant">
                            <IconButton
                              size="small"
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                width: 24, height: 24, borderRadius: 0.75,
                                bgcolor: theme.palette.custom.neutral[100],
                                '&:hover': { bgcolor: theme.palette.custom.status.info.light },
                                '&:hover .v-edit': { color: theme.palette.custom.status.info.main },
                              }}
                            >
                              <Edit className="v-edit" sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }} />
                            </IconButton>
                          </Tooltip>

                          {/* Delete */}
                          <Tooltip title="Delete variant">
                            <IconButton
                              size="small"
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                width: 24, height: 24, borderRadius: 0.75,
                                bgcolor: theme.palette.custom.status.error.light,
                                '&:hover': { bgcolor: '#fecaca' },
                              }}
                            >
                              <DeleteOutline sx={{ fontSize: 12, color: theme.palette.custom.status.error.main }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </TableCell>
      </TableRow>

      {/* ── Variant Detail Dialog ── */}
      {selectedVariant && (
        <FrameVariantDetailDialog
          open={detailOpen}
          onClose={() => { setDetailOpen(false); setSelectedVariant(null); }}
          variant={selectedVariant}
          modelFile={null}        // truyền modelFile nếu có từ context/props
          vrEnabled={vrEnabled}
        />
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const FrameProductPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setShowNavbar, setShowFooter } = useLayout();

  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [frameGroups, setFrameGroups] = useState<FrameGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
          const data = await ProductAPI.getFrameGroupFromShopId(myShop.id);
          setFrameGroups(data);
        }
      } catch (err) {
        console.error('Failed to load frame groups:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return frameGroups;
    const q = search.toLowerCase();
    return frameGroups.filter(
      (fg) =>
        fg.frameName.toLowerCase().includes(q) ||
        fg.frameMaterial.toLowerCase().includes(q) ||
        fg.frameShape.toLowerCase().includes(q) ||
        fg.frameVariantResponses.some((v) => v.colorName.toLowerCase().includes(q))
    );
  }, [frameGroups, search]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startEntry = filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, filtered.length);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalGroups = frameGroups.length;
  const activeCount = frameGroups.filter((fg) =>
    fg.frameVariantResponses.some((v) => (v.isActive ?? true))
  ).length;
  const inStockCount = frameGroups.filter((fg) =>
    fg.frameVariantResponses.some((v) => (v.qtyAvailable ?? 0) > (v.lowStockThreshold ?? 10))
  ).length;
  const outOfStockCount = frameGroups.filter((fg) =>
    fg.frameVariantResponses.length > 0 &&
    fg.frameVariantResponses.every((v) => (v.qtyAvailable ?? 0) === 0)
  ).length;
  const noVariantCount = frameGroups.filter((fg) => fg.frameVariantResponses.length === 0).length;

  const stats = [
    { icon: <Inventory2 sx={{ color: theme.palette.custom.status.pink.main }} />, label: 'Total Frames', value: totalGroups.toLocaleString(), bgColor: theme.palette.custom.status.pink.light },
    { icon: <Verified sx={{ color: theme.palette.custom.status.success.main }} />, label: 'Active Frames', value: activeCount.toLocaleString(), bgColor: theme.palette.custom.status.success.light },
    { icon: <Warehouse sx={{ color: theme.palette.custom.status.info.main }} />, label: 'In-stock', value: inStockCount.toLocaleString(), bgColor: theme.palette.custom.status.info.light },
    { icon: <RemoveShoppingCart sx={{ color: theme.palette.custom.status.error.main }} />, label: 'Out-of-stock', value: outOfStockCount.toLocaleString(), bgColor: theme.palette.custom.status.error.light },
    { icon: <EditNote sx={{ color: theme.palette.custom.status.warning.main }} />, label: 'No Variants', value: noVariantCount.toLocaleString(), bgColor: theme.palette.custom.status.info.light },
  ];

  const sidebarProps = {
    activeMenu: PAGE_ENDPOINTS.SHOP.PRODUCTS,
    shopName: shop?.shopName,
    shopLogo: shop?.logoUrl,
    ownerName: user?.fullName,
    ownerEmail: user?.email,
    ownerAvatar: user?.avatarUrl,
  };

  const getVariantSummary = (fg: FrameGroup) => {
    const variants = fg.frameVariantResponses;
    const totalStock = variants.reduce((sum, v) => sum + (v.qtyAvailable ?? 0), 0);
    const hasOut = variants.some((v) => (v.qtyAvailable ?? 0) === 0);
    const hasLow = variants.some((v) => {
      const avail = v.qtyAvailable ?? 0;
      return avail > 0 && avail <= (v.lowStockThreshold ?? 10);
    });
    const colors = Array.from(
      new Map(variants.map((v) => [v.colorHex, v.colorName])).entries()
    ).slice(0, 4);
    return { totalStock, hasOut, hasLow, count: variants.length, colors };
  };

  const getPrice = (fg: FrameGroup) => {
    const p = fg.productResponses[0];
    if (p) return { base: p.basePrice, compare: p.compareAtPrice };
    const v = fg.frameVariantResponses[0];
    if (v) return { base: v.basePrice, compare: v.compareAtPrice };
    return null;
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

  const TOTAL_COLS = 8;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar {...sidebarProps} />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 1 }}>
              Frame Management
            </Typography>
            <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>
              Quản lý và theo dõi thông tin gọng kính có trong cửa hàng
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <CustomButton
              variant="outlined"
              startIcon={<Add />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={() => { navigate(PAGE_ENDPOINTS.SHOP.CREATE_LENS); }}
            >
              Add Lens
            </CustomButton>
            <CustomButton
              variant="contained"
              startIcon={<Add />}
              sx={{ backgroundColor: theme.palette.primary.main, textTransform: 'none', fontWeight: 600 }}
              onClick={() => { navigate(PAGE_ENDPOINTS.SHOP.CREATE_FRAME); }}
            >
              Add Frame
            </CustomButton>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{ flex: 1, p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: stat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Frame List */}
        <Paper
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}
        >
          {/* Toolbar */}
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                Frame List
              </Typography>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                · Click a row to expand variants
              </Typography>
            </Box>
            <TextField
              placeholder="Search frames..."
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.custom.neutral[400] }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  {['Frame Name', 'Material & Shape', 'Target', 'Price', 'Variants', 'Status', 'Action'].map((col) => (
                    <TableCell key={col}>
                      {col === 'Action' ? (
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                          {col}
                        </Typography>
                      ) : (
                        <TableSortLabel>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                            {col}
                          </Typography>
                        </TableSortLabel>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TOTAL_COLS} sx={{ textAlign: 'center', py: 8 }}>
                      <Inventory sx={{ fontSize: 48, color: theme.palette.custom.neutral[300], mb: 1 }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                        No frames found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((fg) => {
                    const isExpanded = expandedRows.has(fg.id);
                    const summary = getVariantSummary(fg);
                    const price = getPrice(fg);
                    const isActive = fg.productResponses.some((p) => p.isActive) ||
                      fg.frameVariantResponses.some((v) => v.isActive === true);

                    return (
                      <>
                        {/* Main frame group row */}
                        <TableRow
                          key={fg.id}
                          hover
                          onClick={() => toggleRow(fg.id)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: isExpanded ? `${theme.palette.custom.status.info.light}60` : 'inherit',
                            '&:hover': { backgroundColor: theme.palette.custom.neutral[50] },
                            transition: 'background-color 0.15s',
                          }}
                        >
                          {/* Frame Name */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>
                                <IconButton size="small" tabIndex={-1} sx={{ p: 0.25 }}>
                                  {isExpanded
                                    ? <KeyboardArrowUp sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} />
                                    : <KeyboardArrowDown sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                                  }
                                </IconButton>
                              </Box>

                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                {summary.colors.length > 0 ? (
                                  <Box sx={{ display: 'flex', gap: 0.4 }}>
                                    {summary.colors.map(([hex, name]) => (
                                      <Tooltip key={hex} title={name}>
                                        <Box
                                          sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            bgcolor: hex,
                                            border: '1.5px solid rgba(0,0,0,0.12)',
                                          }}
                                        />
                                      </Tooltip>
                                    ))}
                                    {summary.count > 4 && (
                                      <Typography sx={{ fontSize: 10, color: theme.palette.custom.neutral[400], alignSelf: 'center' }}>
                                        +{summary.count - 4}
                                      </Typography>
                                    )}
                                  </Box>
                                ) : (
                                  <Avatar
                                    variant="rounded"
                                    sx={{ width: 40, height: 40, bgcolor: theme.palette.custom.neutral[100], borderRadius: 1.5 }}
                                  >
                                    <Inventory sx={{ fontSize: 20, color: theme.palette.custom.neutral[400] }} />
                                  </Avatar>
                                )}
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800],
                                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}
                                >
                                  {fg.frameName}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mt: 0.25, fontFamily: 'monospace' }}>
                                  {fg.id.slice(0, 8).toUpperCase()}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Material & Shape */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip
                                label={fg.frameMaterial}
                                size="small"
                                sx={{
                                  height: 20, fontSize: 10, fontWeight: 600,
                                  bgcolor: theme.palette.custom.neutral[100],
                                  color: theme.palette.custom.neutral[600],
                                  border: 'none', width: 'fit-content',
                                  '& .MuiChip-label': { px: 1 },
                                }}
                              />
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                                {fg.frameShape} · {fg.frameStructure}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Target */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>
                                {fg.genderTarget}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                                {fg.ageGroup}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Price */}
                          <TableCell sx={{ py: 1.5 }}>
                            {price ? (
                              <>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                  {price.base.toLocaleString('vi-VN')}₫
                                </Typography>
                                {price.compare > price.base && (
                                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                                    {price.compare.toLocaleString('vi-VN')}₫
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>—</Typography>
                            )}
                          </TableCell>

                          {/* Variants summary */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                  {summary.totalStock}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                                  units
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                  label={`${summary.count} variants`}
                                  size="small"
                                  sx={{
                                    height: 18, fontSize: 10, fontWeight: 500,
                                    bgcolor: isExpanded ? theme.palette.custom.status.info.light : theme.palette.custom.neutral[100],
                                    color: isExpanded ? theme.palette.custom.status.info.main : theme.palette.custom.neutral[500],
                                    border: 'none',
                                    '& .MuiChip-label': { px: 1 },
                                  }}
                                />
                                {summary.hasOut && (
                                  <Chip label="OOS" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: '#fee2e2', color: '#dc2626', border: 'none', '& .MuiChip-label': { px: 0.75 } }} />
                                )}
                                {!summary.hasOut && summary.hasLow && (
                                  <Chip label="Low" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: '#fef9c3', color: '#ca8a04', border: 'none', '& .MuiChip-label': { px: 0.75 } }} />
                                )}
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Status */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip
                              label={isActive ? 'Active' : 'Inactive'}
                              size="small"
                              sx={{
                                fontSize: 11, fontWeight: 600,
                                bgcolor: isActive ? theme.palette.custom.status.success.light : theme.palette.custom.status.warning.light,
                                color: isActive ? theme.palette.custom.status.success.main : theme.palette.custom.status.warning.main,
                                border: 'none',
                              }}
                            />
                          </TableCell>

                          {/* Actions */}
                          <TableCell sx={{ py: 1.5 }} align="right">
                            <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                              <Tooltip title="View">
                                <IconButton size="small" onClick={(e) => e.stopPropagation()}
                                  sx={{ width: 30, height: 30, borderRadius: 1, bgcolor: theme.palette.custom.neutral[100], '&:hover': { bgcolor: theme.palette.custom.neutral[200] } }}>
                                  <Visibility sx={{ fontSize: 15, color: theme.palette.custom.neutral[500] }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={(e) => e.stopPropagation()}
                                  sx={{ width: 30, height: 30, borderRadius: 1, bgcolor: theme.palette.custom.neutral[100], '&:hover': { bgcolor: theme.palette.custom.status.info.light }, '&:hover .edit-icon': { color: theme.palette.custom.status.info.main } }}>
                                  <Edit className="edit-icon" sx={{ fontSize: 15, color: theme.palette.custom.neutral[500] }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={(e) => e.stopPropagation()}
                                  sx={{ width: 30, height: 30, borderRadius: 1, bgcolor: theme.palette.custom.status.error.light, '&:hover': { bgcolor: '#fecaca' } }}>
                                  <DeleteOutline sx={{ fontSize: 15, color: theme.palette.custom.status.error.main }} />
                                </IconButton>
                              </Tooltip>
                              <IconButton size="small" onClick={(e) => e.stopPropagation()} sx={{ color: theme.palette.custom.neutral[500] }}>
                                <MoreVert sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>

                        {/* Expanded variant sub-table */}
                        {isExpanded && (
                          <VariantRows
                            key={`${fg.id}-variants`}
                            variants={fg.frameVariantResponses}
                            colSpan={TOTAL_COLS}
                            vrEnabled={fg.vrEnabled}
                          />
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filtered.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, borderTop: `1px solid ${theme.palette.custom.border.light}` }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                size="small"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': { fontSize: 13 },
                  '& .Mui-selected': { bgcolor: `${theme.palette.custom.status.info.main} !important`, color: '#fff' },
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
                    sx={{ fontSize: 13, height: 32, borderRadius: 1.5, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border.light } }}
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
    </Box>
  );
};

export default FrameProductPage;