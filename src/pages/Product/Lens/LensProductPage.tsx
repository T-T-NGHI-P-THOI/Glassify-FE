import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Tooltip,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, AutoAwesome, InfoOutlined, Inventory2, LensBlur, MoreVert, Search, Verified, Visibility } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { sanitizeSearchInput } from '@/utils/text-input';
import { useAuth } from '@/hooks/useAuth';
import { shopApi } from '@/api/shopApi';
import { lensApi, type LensResponse, type LensUsage, type LensWithProductResult } from '@/api/lens-api';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import type { ShopDetailResponse } from '@/models/Shop';
import { CustomButton } from '@/components/custom';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatCurrency } from '@/utils/formatCurrency';

type LensListItem = LensResponse & Partial<{
  id: string;
  shopId: string;
  sku: string;
  name: string;
  imageFileId: string;
  imageUrl: string;
  variantId: string;
  basePrice: number;
  costPrice: number;
  compareAtPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  warrantyMonths: number;
  isReturnable: boolean;
  isFeatured: boolean;
  productType: string;
  slug: string;
  description: string;
}>;

type UsageFormState = {
  name: string;
  description: string;
  isActive: boolean;
  isNonPrescription: boolean;
  selectedLensIds: string[];
  allowTint: boolean;
  allowProgressive: boolean;
  minPriceAdjustment: string;
};

type UsageDialogMode = 'create' | 'edit';

const DEFAULT_USAGE_FORM: UsageFormState = {
  name: '',
  description: '',
  isActive: true,
  isNonPrescription: false,
  selectedLensIds: [],
  allowTint: true,
  allowProgressive: true,
  minPriceAdjustment: '0',
};

const DEFAULT_USAGE_FORM_STATE = (isActive = true): UsageFormState => ({
  ...DEFAULT_USAGE_FORM,
  isActive,
});

type UsageRuleAttachment = {
  lensId: string;
  lensName: string;
  allowTint?: boolean;
  allowProgressive?: boolean;
  minPriceAdjustment?: number;
};

const LENS_FALLBACK_IMAGE = '/assets/imgs/Logo/logo.png';

const LensProductPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [lenses, setLenses] = useState<LensListItem[]>([]);
  const [usages, setUsages] = useState<LensUsage[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLens, setSelectedLens] = useState<LensResponse | null>(null);
  const [usageMenuAnchorEl, setUsageMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUsage, setSelectedUsage] = useState<LensUsage | null>(null);
  const [usageDialogMode, setUsageDialogMode] = useState<UsageDialogMode>('create');
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [usageSubmitting, setUsageSubmitting] = useState(false);
  const [usageForm, setUsageForm] = useState<UsageFormState>(DEFAULT_USAGE_FORM_STATE());
  const [failedLensImages, setFailedLensImages] = useState<Record<string, true>>({});
  const menuOpen = Boolean(menuAnchorEl);
  const usageMenuOpen = Boolean(usageMenuAnchorEl);

  const getLensImageSrc = (lens: LensListItem): string => {
    if (failedLensImages[lens.id] || !lens.imageUrl) return LENS_FALLBACK_IMAGE;
    return lens.imageUrl;
  };

  const handleLensImageError = (lensId: string) => {
    setFailedLensImages((prev) => {
      if (prev[lensId]) return prev;
      return { ...prev, [lensId]: true };
    });
  };

  const openLensMenu = (event: React.MouseEvent<HTMLElement>, lens: LensListItem) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedLens(lens);
  };

  const closeLensMenu = () => {
    setMenuAnchorEl(null);
  };

  const closeUsageDialog = () => {
    if (usageSubmitting) return;
    setUsageDialogOpen(false);
    setUsageDialogMode('create');
    setSelectedUsage(null);
    setUsageForm(DEFAULT_USAGE_FORM_STATE());
  };

  const openUsageMenu = (event: React.MouseEvent<HTMLElement>, usage: LensUsage) => {
    setUsageMenuAnchorEl(event.currentTarget);
    setSelectedUsage(usage);
  };

  const closeUsageMenu = () => {
    setUsageMenuAnchorEl(null);
  };

  const loadUsages = async (shopId: string) => {
    try {
      const data = await lensApi.getUsages({
        page: 1,
        unitPerPage: 200,
        shopId,
        sortBy: 'name',
        sortDirection: 'ASC',
      });
      setUsages(data);
    } catch (error) {
      console.error('Failed to load usages:', error);
    }
  };

  const openLensDetails = () => {
    if (!selectedLens) return;

    closeLensMenu();
    navigate(PAGE_ENDPOINTS.SHOP.LENS_DETAIL(selectedLens.id));
  };

  const openEditLensPage = () => {
    if (!selectedLens) return;
    closeLensMenu();
    navigate(PAGE_ENDPOINTS.SHOP.EDIT_LENS(selectedLens.id));
  };

  const openCreateUsageDialog = () => {
    setUsageDialogMode('create');
    setSelectedUsage(null);
    setUsageForm(DEFAULT_USAGE_FORM_STATE());
    setUsageDialogOpen(true);
  };

  const openEditUsageDialog = (usage: LensUsage) => {
    const linkedAttachments = lenses.flatMap((lens) =>
      (lens.usageRules ?? [])
        .filter((rule) => rule.usageId === usage.id)
        .map((rule) => ({
          lensId: lens.id,
          lensName: lens.name,
          allowTint: rule.allowTint,
          allowProgressive: rule.allowProgressive,
          minPriceAdjustment: rule.minPriceAdjustment,
        })),
    );

    const firstRule = linkedAttachments[0];

    setUsageDialogMode('edit');
    setSelectedUsage(usage);
    setUsageForm({
      name: usage.name,
      description: usage.description ?? '',
      isActive: Boolean(usage.isActive),
      isNonPrescription: Boolean(usage.isNonPrescription),
      selectedLensIds: linkedAttachments.map((item) => item.lensId),
      allowTint: firstRule?.allowTint ?? true,
      allowProgressive: firstRule?.allowProgressive ?? true,
      minPriceAdjustment: String(firstRule?.minPriceAdjustment ?? 0),
    });
    setUsageDialogOpen(true);
  };

  const handleToggleLensStatus = async (lens: LensListItem) => {
    if (updatingId) return;

    const resolveLensResponse = (value?: LensResponse | LensWithProductResult | null): LensListItem | null => {
      if (!value) return null;
      if ('lens' in value) return value.lens ?? null;
      return value;
    };

    try {
      setUpdatingId(lens.id);
      const res = await lensApi.update(lens.id, {
        shopId: lens.shopId,
        sku: lens.sku,
        name: lens.name,
        category: lens.category,
        progressiveType: lens.progressiveType,
        isActive: !lens.isActive,
      });
      const updatedLens = resolveLensResponse(res.data ?? null);

      if (updatedLens) {
        setLenses((prev) =>
          prev.map((item) => {
            if (item.id !== updatedLens.id) return item;

            return {
              ...item,
              ...updatedLens,
              sku: updatedLens.sku ?? item.sku,
              isActive: updatedLens.isActive ?? item.isActive,
            };
          }),
        );
      } else {
        setLenses((prev) =>
          prev.map((item) =>
            item.id === lens.id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to update lens status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const shopRes = await shopApi.getMyShops();
        const myShop = shopRes.data?.[0] ?? null;
        setShop(myShop);

        if (myShop?.id) {
          const data = await lensApi.getMany({
            shopId: myShop.id,
            page: 1,
            unitPerPage: 200,
            sortBy: 'updatedAt',
            sortDirection: 'DESC',
          });
          setLenses(data);
          await loadUsages(myShop.id);
        } else {
          setUsages([]);
        }
      } catch (error) {
        console.error('Failed to load lenses:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const lensOptions = useMemo(
    () => lenses.map((lens) => ({ id: lens.id, label: `${lens.name} (${lens.sku ?? lens.variantId ?? lens.id})` })),
    [lenses],
  );

  const selectedLensChips = useMemo(
    () =>
      usageForm.selectedLensIds
        .map((lensId) => {
          const option = lensOptions.find((item) => item.id === lensId);
          return option ? { id: option.id, label: option.label } : null;
        })
        .filter((item): item is { id: string; label: string } => Boolean(item)),
    [lensOptions, usageForm.selectedLensIds],
  );

  const usageRuleAttachmentsByUsageId = useMemo(() => {
    const map = new Map<string, UsageRuleAttachment[]>();

    lenses.forEach((lens) => {
      (lens.usageRules ?? []).forEach((rule) => {
        const usageId = rule.usageId;
        if (!usageId) return;

        const current = map.get(usageId) ?? [];
        current.push({
          lensId: lens.id,
          lensName: lens.name,
          allowTint: rule.allowTint,
          allowProgressive: rule.allowProgressive,
          minPriceAdjustment: rule.minPriceAdjustment,
        });
        map.set(usageId, current);
      });
    });

    return map;
  }, [lenses]);

  const selectedUsageRuleAttachments = useMemo(() => {
    if (!selectedUsage) return [] as UsageRuleAttachment[];
    return usageRuleAttachmentsByUsageId.get(selectedUsage.id) ?? [];
  }, [selectedUsage, usageRuleAttachmentsByUsageId]);

  const handleCreateUsage = async () => {
    if (!shop?.id) {
      toast.error('Shop not found');
      return;
    }

    if (!usageForm.name.trim()) {
      toast.error('Usage name is required');
      return;
    }

    if (usageDialogMode === 'edit' && !selectedUsage?.id) {
      toast.error('Usage not found');
      return;
    }

    try {
      setUsageSubmitting(true);

      const selectedLensIds = Array.from(new Set(usageForm.selectedLensIds));
      const shouldSendUsageRules = usageDialogMode === 'edit' && Boolean(selectedUsage?.id);
      const usageDetailData = selectedLensIds.length
        ? {
            shopId: shop.id,
            lensIds: selectedLensIds,
            ...(shouldSendUsageRules
              ? {
                  usageRules: selectedLensIds.map((lensId) => ({
                    shopId: shop.id,
                    usageId: selectedUsage?.id,
                    lensId,
                    allowTint: usageForm.allowTint,
                    allowProgressive: usageForm.allowProgressive,
                    minPriceAdjustment: Number(usageForm.minPriceAdjustment || 0),
                  })),
                }
              : {}),
          }
        : undefined;

      const payload = {
        shopId: shop.id,
        name: usageForm.name.trim(),
        description: usageForm.description.trim(),
        isActive: usageForm.isActive,
        isNonPrescription: usageForm.isNonPrescription,
        usageDetailData,
      };

      const response = usageDialogMode === 'edit' && selectedUsage?.id
        ? await lensApi.updateUsage(selectedUsage.id, payload)
        : await lensApi.createUsage(payload);

      if ((response?.status ?? 0) >= 400 || !response?.data?.id) {
        throw new Error(
          response?.message || (usageDialogMode === 'edit' ? 'Unable to update usage' : 'Unable to create usage'),
        );
      }

      toast.success(usageDialogMode === 'edit' ? 'Usage updated successfully' : 'Usage created successfully');
      await loadUsages(shop.id);
      closeUsageDialog();
    } catch (error) {
      console.error('Failed to save usage:', error);
      toast.error(getApiErrorMessage(error, usageDialogMode === 'edit' ? 'Failed to update usage' : 'Failed to create usage'));
    } finally {
      setUsageSubmitting(false);
    }
  };

  const handleToggleUsageStatus = async (usage: LensUsage) => {
    if (usageSubmitting) return;

    if (!shop?.id) {
      toast.error('Shop not found');
      return;
    }

    try {
      setUsageSubmitting(true);
      const response = await lensApi.updateUsage(usage.id, {
        shopId: shop.id,
        isActive: !usage.isActive,
      });

      if ((response?.status ?? 0) >= 400 || !response?.data?.id) {
        throw new Error(response?.message || 'Unable to update usage');
      }

      toast.success(usage.isActive ? 'Usage deactivated' : 'Usage activated');
      await loadUsages(shop.id);
    } catch (error) {
      console.error('Failed to toggle usage status:', error);
      toast.error(getApiErrorMessage(error, 'Failed to update usage'));
    } finally {
      setUsageSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return lenses.filter((lens) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        lens.name.toLowerCase().includes(q) ||
        (lens.sku || '').toLowerCase().includes(q) ||
        (lens.category || '').toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? lens.isActive : !lens.isActive);

      return matchSearch && matchStatus;
    });
  }, [lenses, search, statusFilter]);

  const totalLenses = lenses.length;
  const activeLenses = lenses.filter((lens) => lens.isActive).length;
  const progressiveLenses = lenses.filter((lens) => (lens.category === 'PROGRESSIVE')).length;
  const usageObjects = usages.length;

  const stats = [
    {
      icon: <Inventory2 sx={{ color: theme.palette.custom.status.info.main }} />,
      label: 'Total Lenses',
      value: totalLenses,
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <Verified sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Active',
      value: activeLenses,
      bgColor: theme.palette.custom.status.success.light,
    },
    {
      icon: <AutoAwesome sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Progressive',
      value: progressiveLenses,
      bgColor: theme.palette.custom.status.warning.light,
    },
    {
      icon: <LensBlur sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Usage Objects',
      value: usageObjects,
      bgColor: theme.palette.custom.status.pink.light,
    },
  ];

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startEntry = filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, filtered.length);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const sidebarProps = {
    activeMenu: PAGE_ENDPOINTS.SHOP.PRODUCT_LENS,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
              Lens Management
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Quản lý và theo dõi lens catalog của cửa hàng
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <CustomButton
              variant="outlined"
              startIcon={<Visibility />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={() => navigate(PAGE_ENDPOINTS.SHOP.PRODUCTS)}
            >
              Frame List
            </CustomButton>
            <CustomButton
              variant="contained"
              startIcon={<Add />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={() => navigate(PAGE_ENDPOINTS.SHOP.CREATE_LENS)}
            >
              Add Lens
            </CustomButton>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
          {stats.map((stat) => (
            <Box
              key={stat.label}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  {stat.value.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            p: 2,
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
              Lens List
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
              · Search, filter, and manage lens cards
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <TextField
              size="small"
              placeholder="Search lenses by name, SKU, category"
              value={search}
              onChange={(e) => {
                setSearch(sanitizeSearchInput(e.target.value));
                setPage(1);
              }}
              sx={{ width: { xs: '100%', sm: 320 } }}
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                <MenuItem value={10}>10 / page</MenuItem>
                <MenuItem value={20}>20 / page</MenuItem>
                <MenuItem value={50}>50 / page</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {paginated.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.custom.border.light}`,
              borderRadius: 2,
              py: 8,
              textAlign: 'center',
            }}
          >
            <LensBlur sx={{ fontSize: 48, color: theme.palette.custom.neutral[300], mb: 1 }} />
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>No lenses found</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
            {paginated.map((lens) => (
              <Paper
                key={lens.id}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.custom.border.light}`,
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
                    <Box
                      component="img"
                      src={getLensImageSrc(lens)}
                      alt={lens.name}
                      onError={() => handleLensImageError(lens.id)}
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 1.5,
                        objectFit: 'cover',
                        border: `1px solid ${theme.palette.custom.border.light}`,
                        flexShrink: 0,
                        bgcolor: theme.palette.custom.neutral[100],
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: theme.palette.custom.neutral[800],
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lens.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontFamily: 'monospace' }}>
                        {lens.sku ?? lens.variantId ?? lens.id}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      label={lens.isActive ? 'ACTIVE' : 'INACTIVE'}
                      color={lens.isActive ? 'success' : 'default'}
                      variant={lens.isActive ? 'filled' : 'outlined'}
                    />
                    <IconButton size="small" onClick={(event) => openLensMenu(event, lens)} aria-label="lens actions">
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 1 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>Category</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800], textAlign: 'right' }}>
                    {lens.category}
                  </Typography>

                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>Price</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800], textAlign: 'right' }}>
                    {typeof lens.basePrice === 'number' ? formatCurrency(lens.basePrice) : '-'}
                  </Typography>

                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>Stock</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800], textAlign: 'right' }}>
                    {typeof lens.stockQuantity === 'number' ? lens.stockQuantity : '-'}
                  </Typography>

                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>Featured</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800], textAlign: 'right' }}>
                    {lens.isFeatured === true ? 'Yes' : lens.isFeatured === false ? 'No' : '-'}
                  </Typography>

                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>Progressive</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800], textAlign: 'right' }}>
                    {(lens.category === 'PROGRESSIVE') ? lens.progressiveType || 'Yes' : 'No'}
                  </Typography>

                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>Updated</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800], textAlign: 'right' }}>
                    {new Date(lens.updatedAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {filtered.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, gap: 2, flexWrap: 'wrap' }}>
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                Showing {startEntry}–{endEntry} of {filtered.length}
              </Typography>
            </Box>
          </Box>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            p: 2.5,
            mt: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                Usage Management
              </Typography>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                Create usage objects and attach default usage rules to selected lenses.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateUsageDialog}>
              Add Usage
            </Button>
          </Box>

          {usages.length === 0 ? (
            <Alert severity="info">No usage objects have been created yet.</Alert>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 1.5 }}>
              {usages.slice(0, 8).map((usage) => {
                const attachments = usageRuleAttachmentsByUsageId.get(usage.id) ?? [];
                const mappedLensNames = Array.from(new Set(attachments.map((item) => item.lensName))).filter(Boolean);

                return (
                  <Paper
                    key={usage.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      borderColor: theme.palette.custom.border.light,
                      bgcolor: usage.isActive ? 'transparent' : theme.palette.custom.neutral[50],
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }} noWrap>
                          {usage.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }} noWrap>
                          Usage rule settings
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={usage.isActive ? 'Active' : 'Inactive'}
                        color={usage.isActive ? 'success' : 'default'}
                        variant={usage.isActive ? 'filled' : 'outlined'}
                      />
                    </Box>

                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], minHeight: 36, mb: 1 }}>
                      {usage.description || 'No description'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                        {attachments.length} rule(s) • {mappedLensNames.length} lens(es)
                      </Typography>
                      <Button size="small" variant="text" onClick={(event) => openUsageMenu(event, usage)}>
                        Actions
                      </Button>
                    </Box>

                    {mappedLensNames.length > 0 ? (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                        {mappedLensNames.slice(0, 3).map((lensName) => (
                          <Chip key={`${usage.id}-${lensName}`} size="small" label={lensName} variant="outlined" />
                        ))}
                        {mappedLensNames.length > 3 && <Chip size="small" label={`+${mappedLensNames.length - 3} more`} variant="outlined" />}
                      </Box>
                    ) : (
                      <Typography sx={{ mt: 1, fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                        No lens usage rule linked yet.
                      </Typography>
                    )}
                  </Paper>
                );
              })}
              {usages.length > 8 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette.custom.neutral[500],
                  }}
                >
                  +{usages.length - 8} more
                </Paper>
              )}
            </Box>
          )}
        </Paper>

        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={closeLensMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={openEditLensPage}>Edit</MenuItem>
          <MenuItem onClick={openLensDetails}>Details</MenuItem>
          <MenuItem
            disabled={!selectedLens || updatingId === selectedLens.id}
            onClick={() => {
              if (!selectedLens) return;
              closeLensMenu();
              handleToggleLensStatus(selectedLens);
            }}
          >
            {updatingId && selectedLens && updatingId === selectedLens.id ? 'Updating...' : selectedLens?.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={usageMenuAnchorEl}
          open={usageMenuOpen}
          onClose={closeUsageMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem
            onClick={() => {
              if (!selectedUsage) return;
              closeUsageMenu();
              openEditUsageDialog(selectedUsage);
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            disabled={!selectedUsage || usageSubmitting}
            onClick={() => {
              if (!selectedUsage) return;
              closeUsageMenu();
              handleToggleUsageStatus(selectedUsage);
            }}
          >
            {selectedUsage?.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        </Menu>

        <Dialog open={usageDialogOpen} onClose={closeUsageDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {usageDialogMode === 'edit' ? 'Edit Usage' : 'Create Usage'}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Usage objects are shared. When you select lenses here, the same usage rule will be attached to each lens.
            </Alert>

            {usageDialogMode === 'edit' && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Linked Usage Rules</Typography>
                {selectedUsageRuleAttachments.length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                    No linked usage rules yet.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedUsageRuleAttachments.map((rule) => (
                      <Box
                        key={`${rule.lensId}-${selectedUsage?.id}`}
                        sx={{
                          border: `1px solid ${theme.palette.custom.border.light}`,
                          borderRadius: 1.5,
                          p: 1.25,
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' },
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{rule.lensName}</Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>
                          Allow Tint: {String(rule.allowTint ?? true)}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>
                          Allow Progressive: {String(rule.allowProgressive ?? true)}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>
                          Min Adj: {String(rule.minPriceAdjustment ?? 0)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  required
                  label={
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      Usage Name
                      <Tooltip title="Use a clear, customer-friendly name for this usage so customers can recognize it quickly.">
                        <InfoOutlined fontSize="inherit" sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                      </Tooltip>
                    </Box>
                  }
                  value={usageForm.name}
                  onChange={(e) => setUsageForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label={
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      Description
                      <Tooltip title="Add a short explanation for customers. Keep it focused on when this usage should be applied.">
                        <InfoOutlined fontSize="inherit" sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                      </Tooltip>
                    </Box>
                  }
                  value={usageForm.description}
                  onChange={(e) => setUsageForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                <FormControl fullWidth>
                  <Box sx={{ mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography component="span" sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>
                      Attach to Lenses
                    </Typography>
                    <Tooltip title="Choose the lenses that should use this default configuration. The same rule set will be attached to each selected lens.">
                      <InfoOutlined fontSize="small" sx={{ color: theme.palette.custom.neutral[400] }} />
                    </Tooltip>
                  </Box>
                  <Select
                    multiple
                    value={usageForm.selectedLensIds}
                    onChange={(e) =>
                      setUsageForm((prev) => ({
                        ...prev,
                        selectedLensIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                      }))
                    }
                    renderValue={(selected) => {
                      const selectedIds = selected as string[];
                      if (selectedIds.length === 0) return 'No lens selected';
                      return `${selectedIds.length} lens(es) selected`;
                    }}
                    MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                  >
                    {lensOptions.map((lens) => (
                      <MenuItem key={lens.id} value={lens.id}>
                        <Checkbox checked={usageForm.selectedLensIds.includes(lens.id)} />
                        <ListItemText primary={lens.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedLensChips.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Selected Lenses</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {selectedLensChips.map((chip) => (
                        <Chip
                          key={chip.id}
                          label={chip.label}
                          size="small"
                          onDelete={() =>
                            setUsageForm((prev) => ({
                              ...prev,
                              selectedLensIds: prev.selectedLensIds.filter((id) => id !== chip.id),
                            }))
                          }
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Tooltip title="Inactive usage objects stay saved but are hidden from normal selection and rule assignment.">
                        <Switch
                          checked={usageForm.isActive}
                          onChange={(e) => setUsageForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                        />
                      </Tooltip>
                    }
                    label="Active"
                  />
                  <FormControlLabel
                    control={
                      <Tooltip title="Enable this when the usage does not require a prescription step in lens configuration.">
                        <Switch
                          checked={usageForm.isNonPrescription}
                          onChange={(e) => setUsageForm((prev) => ({ ...prev, isNonPrescription: e.target.checked }))}
                        />
                      </Tooltip>
                    }
                    label="Non-prescription"
                  />
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                    {usageForm.selectedLensIds.length} lens(es) selected
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Default Usage Rule
                    <Tooltip title="These values are copied into the lens usage rules created for each selected lens.">
                      <InfoOutlined fontSize="inherit" sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                    </Tooltip>
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                    These values will be copied into each selected lens usage rule.
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
                    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                      <FormControlLabel
                        control={
                          <Tooltip title="Allow customers to choose a tint option when this usage is applied.">
                            <Switch
                              checked={usageForm.allowTint}
                              onChange={(e) => setUsageForm((prev) => ({ ...prev, allowTint: e.target.checked }))}
                            />
                          </Tooltip>
                        }
                        label="Allow Tint"
                      />
                    </Box>
                    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                      <FormControlLabel
                        control={
                          <Tooltip title="Allow this usage to be used with progressive lens options.">
                            <Switch
                              checked={usageForm.allowProgressive}
                              onChange={(e) => setUsageForm((prev) => ({ ...prev, allowProgressive: e.target.checked }))}
                            />
                          </Tooltip>
                        }
                        label="Allow Progressive"
                      />
                    </Box>
                    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                      <TextField
                        fullWidth
                        type="text"
                        label={
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            Min Price Adjustment
                            <Tooltip title="Set the minimum price adjustment allowed for usage rules linked to the selected lenses.">
                              <InfoOutlined fontSize="inherit" sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                            </Tooltip>
                          </Box>
                        }
                        value={usageForm.minPriceAdjustment}
                        onChange={(e) => setUsageForm((prev) => ({ ...prev, minPriceAdjustment: e.target.value }))}
                        inputProps={{ inputMode: 'decimal' }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={closeUsageDialog} disabled={usageSubmitting}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreateUsage} disabled={usageSubmitting || !usageForm.name.trim()}>
              {usageSubmitting ? 'Saving...' : usageDialogMode === 'edit' ? 'Save Changes' : 'Create Usage'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default LensProductPage;
