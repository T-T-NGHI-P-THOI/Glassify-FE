import {
    Box, Typography, Paper, Chip, IconButton, Avatar, Button,
    Dialog, DialogTitle, DialogContent,
    TextField, MenuItem, Grid, Divider, CircularProgress,
    Tooltip, InputAdornment, Pagination, FormControl, Select,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    CheckCircle, Cancel, Visibility, Store,
    Close, Search, Refresh, ShieldOutlined,
    VerifiedUser, Schedule,
    Inventory2, ViewInAr, Collections,
    Star,
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useVerification } from '@/hooks/useVerification';
import type {
    ProductVerificationItem,
    VerificationStatus,
    ProductType,
    FrameVariantInfo,
    AccessoryVariantInfo,
    FrameGroupInfo,
    VerifyPayload,
} from '@/types/verifications';
import { REJECT_REASONS } from '@/types/verifications';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import type { ShopDetailResponse } from '@/models/Shop';
import ProductAPI from '@/api/product-api';
import { shopApi } from '@/api/shopApi';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { useAuth } from '@/hooks/useAuth';

// ─── Styled chips ─────────────────────────────────────────────────────────────

const StatusChip = styled(Chip)<{ vstatus: VerificationStatus }>(({ vstatus }) => ({
    height: 22, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', borderRadius: 4,
    ...(vstatus === 'PENDING' && { background: '#FEF3C7', color: '#92400E' }),
    ...(vstatus === 'APPROVED' && { background: '#D1FAE5', color: '#065F46' }),
    ...(vstatus === 'REJECTED' && { background: '#FEE2E2', color: '#991B1B' }),
}));

const TypeChip = styled(Chip)<{ ptype: ProductType }>(({ ptype }) => ({
    height: 20, fontSize: 10, fontWeight: 600, borderRadius: 3,
    ...(ptype === 'FRAME' && { background: '#EFF6FF', color: '#1D4ED8' }),
    ...(ptype === 'ACCESSORY' && { background: '#F3E8FF', color: '#7C3AED' }),
    ...(ptype === 'LENSES' && { background: '#ECFDF5', color: '#047857' }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const isFrame = (item: ProductVerificationItem): item is ProductVerificationItem & {
    variantInfo: FrameVariantInfo; groupInfo: FrameGroupInfo;
} => item.productType === 'FRAME';

// ─── Product Detail Dialog ────────────────────────────────────────────────────
function ProductDetailDialog({
    open, onClose, item,
}: { open: boolean; onClose: () => void; item: ProductVerificationItem }) {

    const theme = useTheme();
    const [imgIdx, setImgIdx] = useState(0);

    const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 0.75
        }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', minWidth: 160 }}>
                {label}
            </Typography>
            {typeof value === 'string'
                ? <Typography sx={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{value || '—'}</Typography>
                : value}
        </Box>
    );

    const SectionLabel = ({ title }: { title: string }) => (
        <Typography sx={{
            fontSize: 11,
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            mb: 1.5,
            mt: 2
        }}>
            {title}
        </Typography>
    );

    const isFrame = item.productType === 'FRAME';

    useEffect(() => {
        if (open) setImgIdx(0);
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TypeChip label={item.productType} ptype={item.productType} />
                    {item.verificationType === 'UPDATE' && (
                        <Chip label="Update Request" size="small"
                            sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: '#FEF3C7', color: '#92400E' }}
                        />
                    )}
                    <Typography fontWeight={700} fontSize={16}>
                        {item.productName}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}>
                    <Close fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2.5 }}>
                <Grid container spacing={3}>

                    {/* LEFT */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: 220,
                            position: 'relative',
                            bgcolor: '#F1F5F9',
                            border: `1px solid ${theme.palette.divider}`
                        }}>
                            {item.productImages?.length > 0 ? (
                                <Box component="img"
                                    src={item.productImages[imgIdx]}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Collections sx={{ fontSize: 40, color: '#CBD5E1' }} />
                                </Box>
                            )}

                            {item.productImages?.length > 1 && (
                                <>
                                    <Box onClick={() => setImgIdx(p => (p - 1 + item.productImages.length) % item.productImages.length)}
                                        sx={navBtnLeft}>
                                        ‹
                                    </Box>
                                    <Box onClick={() => setImgIdx(p => (p + 1) % item.productImages.length)}
                                        sx={navBtnRight}>
                                        ›
                                    </Box>
                                </>
                            )}
                        </Box>

                        {/* thumbnails */}
                        {item.productImages?.length > 1 && (
                            <Box sx={{ display: 'flex', gap: 0.75, mt: 1 }}>
                                {item.productImages.slice(0, 4).map((img, i) => (
                                    <Box key={i} component="img"
                                        src={img}
                                        onClick={() => setImgIdx(i)}
                                        sx={{
                                            width: 56,
                                            height: 44,
                                            objectFit: 'cover',
                                            borderRadius: 1.5,
                                            cursor: 'pointer',
                                            border: i === imgIdx
                                                ? `2px solid ${theme.palette.primary.main}`
                                                : `1px solid ${theme.palette.divider}`
                                        }}
                                    />
                                ))}
                            </Box>
                        )}

                        {/* pricing */}
                        <Paper elevation={0} sx={card}>
                            <SectionLabel title="Pricing & Stock" />
                            <Row label="Base Price" value={formatPrice(item.basePrice)} />
                            <Row label="Cost Price" value={formatPrice(item.costPrice)} />
                            <Row label="Stock" value={`${item.stockQuantity} units`} />
                            <Row label="SKU" value={item.sku ?? '—'} />
                        </Paper>
                    </Grid>

                    {/* RIGHT */}
                    <Grid size={{ xs: 12, md: 7 }}>

                        {/* FRAME */}
                        {isFrame && item.frameGroupResponse && item.frameVariantResponse && (
                            <>
                                <Paper elevation={0} sx={card}>
                                    <SectionLabel title="Frame Group" />
                                    <Row label="Name" value={item.frameGroupResponse.frameName} />
                                    <Row label="Shape" value={item.frameGroupResponse.frameShape} />
                                    <Row label="Structure" value={item.frameGroupResponse.frameStructure} />
                                    <Row label="Material" value={item.frameGroupResponse.frameMaterial} />
                                    <Row label="Gender" value={item.frameGroupResponse.genderTarget} />
                                    <Row label="Age" value={item.frameGroupResponse.ageGroup} />
                                </Paper>

                                <Paper elevation={0} sx={card}>
                                    <SectionLabel title="Frame Variant" />

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Box sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            bgcolor: item.frameVariantResponse.colorHex
                                        }} />
                                        <Typography fontWeight={600}>
                                            {item.frameVariantResponse.colorName}
                                        </Typography>
                                    </Box>

                                    <Row label="Size" value={item.frameVariantResponse.size} />
                                    <Row label="Frame Width" value={`${item.frameVariantResponse.frameWidthMm} mm`} />
                                    <Row label="Lens"
                                        value={`${item.frameVariantResponse.lensWidthMm} x ${item.frameVariantResponse.lensHeightMm} mm`} />
                                    <Row label="Bridge" value={`${item.frameVariantResponse.bridgeWidthMm} mm`} />
                                    <Row label="Temple" value={`${item.frameVariantResponse.templeLengthMm} mm`} />
                                    <Row label="Stock" value={item.frameVariantResponse.qtyAvailable} />
                                </Paper>
                            </>
                        )}

                        {/* ACCESSORY */}
                        {!isFrame && item.accessoryResponse && item.accessoryVariantResponse && (
                            <>
                                <Paper elevation={0} sx={card}>
                                    <SectionLabel title="Accessory" />
                                    <Row label="Name" value={item.accessoryResponse.name} />
                                    <Row label="Type" value={item.accessoryResponse.type} />
                                    <Row label="Description" value={item.accessoryResponse.description ?? '—'} />
                                </Paper>

                                <Paper elevation={0} sx={card}>
                                    <SectionLabel title="Accessory Variant" />
                                    <Row label="Name" value={item.accessoryVariantResponse.name} />

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {item.accessoryVariantResponse.colorHex && (
                                            <Box sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: '50%',
                                                bgcolor: item.accessoryVariantResponse.colorHex
                                            }} />
                                        )}
                                        <Typography fontWeight={600}>
                                            {item.accessoryVariantResponse.color}
                                        </Typography>
                                    </Box>

                                    <Row label="Size" value={item.accessoryVariantResponse.size ?? '—'} />
                                </Paper>
                            </>
                        )}

                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}

/* styles */
const card = {
    mt: 2,
    p: 2,
    borderRadius: 2,
    bgcolor: '#F8FAFC',
    border: '1px solid #E2E8F0'
};

const navBtnLeft = {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    borderRadius: '50%',
    bgcolor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff'
};

const navBtnRight = {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    borderRadius: '50%',
    bgcolor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff'
};

// ─── Product Row Card ─────────────────────────────────────────────────────────

interface ProductRowCardProps {
    item: ProductVerificationItem;
    isVerifying: boolean;
    onVerify: (id: string, payload: VerifyPayload, onSuccess: () => void) => Promise<void>;
}

function ProductRowCard({ item, isVerifying, onVerify }: ProductRowCardProps) {
    const theme = useTheme();
    const [detailOpen, setDetailOpen] = useState(false);

    const frame = isFrame(item);
    const thumb = item.productImages[0] ?? null;

    const variantSummary = frame
        ? `${(item.variantInfo as FrameVariantInfo).colorName} · ${(item.variantInfo as FrameVariantInfo).size}`
        : `${(item.variantInfo as AccessoryVariantInfo).color ?? '—'} · ${(item.variantInfo as AccessoryVariantInfo).size ?? '—'}`;

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.07)', borderColor: '#CBD5E1' },
                    display: 'flex',
                    alignItems: 'stretch',
                }}
            >
                {/* Status left-edge strip */}
                <Box sx={{
                    width: 4, flexShrink: 0,
                    bgcolor: item.status === 'PENDING' ? '#F59E0B' : item.status === 'APPROVED' ? '#16A34A' : '#DC2626',
                }} />

                {/* Thumbnail */}
                <Box sx={{ width: 96, flexShrink: 0, bgcolor: '#F1F5F9', position: 'relative', overflow: 'hidden' }}>
                    {thumb ? (
                        <Box component="img" src={thumb} sx={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 88 }} />
                    ) : (
                        <Box sx={{ height: '100%', minHeight: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Inventory2 sx={{ fontSize: 28, color: '#CBD5E1' }} />
                        </Box>
                    )}
                    {/* UPDATE badge overlay */}
                    {item.verificationType === 'UPDATE' && (
                        <Box sx={{ position: 'absolute', bottom: 4, left: 4, bgcolor: '#F59E0B', color: '#fff', fontSize: 9, fontWeight: 700, px: 0.75, py: 0.25, borderRadius: 0.5 }}>
                            UPDATE
                        </Box>
                    )}
                </Box>

                {/* Main content row */}
                <Box sx={{ flex: 1, px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flexWrap: 'wrap' }}>

                    {/* Identity */}
                    <Box sx={{ flex: '0 0 240px', minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                            <TypeChip label={item.productType} ptype={item.productType} />
                            <StatusChip label={item.status} vstatus={item.status} />
                        </Box>
                        <Typography fontWeight={700} fontSize={14} noWrap title={item.productName}>
                            {item.productName}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                            {variantSummary}
                            {item.sku ? ` · ${item.sku}` : ''}
                        </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                    {/* Price + stock */}
                    <Box sx={{ flex: '0 0 150px' }}>
                        <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Price / Stock
                        </Typography>
                        <Typography fontWeight={700} fontSize={15} sx={{ color: theme.palette.primary.main }}>
                            {formatPrice(item.basePrice)}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                            {item.stockQuantity} units
                        </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                    {/* Shop */}
                    <Box sx={{ flex: '0 0 170px', minWidth: 0 }}>
                        <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Shop
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                            <Avatar src={item.shop.logoUrl} sx={{ width: 20, height: 20, fontSize: 10 }}>
                                {item.shop.shopName[0]}
                            </Avatar>
                            <Typography fontWeight={600} fontSize={13} noWrap>{item.shop.shopName}</Typography>
                        </Box>
                        <Typography fontSize={12} color="text.secondary" noWrap>{item.shop.city}</Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                    {/* Date */}
                    <Box sx={{ flex: '0 0 140px' }}>
                        <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Submitted
                        </Typography>
                        <Typography fontSize={13} fontWeight={500}>
                            {formatDate(item.submittedAt)}
                        </Typography>
                        {item.submissionCount > 1 && (
                            <Typography fontSize={11} color="#92400E">
                                Re-submission #{item.submissionCount}
                            </Typography>
                        )}
                    </Box>

                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: 0.75, ml: 'auto', flexShrink: 0 }}>
                        <Tooltip title="View product details">
                            <IconButton size="small" onClick={() => setDetailOpen(true)}
                                sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', '&:hover': { bgcolor: '#DBEAFE' }, borderRadius: 1.5, width: 32, height: 32 }}>
                                <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {/* Dialogs */}
            <ProductDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} item={item} />
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ShopProductVerificationPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [shop, setShop] = useState<ShopDetailResponse | null>(null);

    // ── Filter / pagination state (all server-side) ───────────────────────────
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<ProductType | 'ALL'>('ALL');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    // Reset to page 1 whenever filters change
    const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
    const handleStatusChange = (v: VerificationStatus | 'ALL') => { setStatusFilter(v); setPage(1); };
    const handleTypeChange = (v: ProductType | 'ALL') => { setTypeFilter(v); setPage(1); };

    // ── Layout ────────────────────────────────────────────────────────────────
    useLayoutConfig({ showNavbar: false, showFooter: false });

    // ── Data ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const shopRes = await shopApi.getMyShops();
                const myShop = shopRes.data?.[0] ?? null;
                setShop(myShop);
            } catch (err) {
                console.error('Failed to load shop', err);
            }
        })();
    }, []);

    const {
        items, totalElements, totalPages, loading, stats, statsLoading,
        verifyingId, verify, refresh,
    } = useVerification({
        status: statusFilter,
        productType: typeFilter,
        shopId: shop?.id,
        search,
        page,
        pageSize: PAGE_SIZE,
    });

    // ── Stat cards ────────────────────────────────────────────────────────────
    const statCards = [
        { label: 'Pending Review', value: stats.pending, color: '#F59E0B', bg: '#FFFBEB', icon: <Schedule /> },
        { label: 'Approved', value: stats.approved, color: '#16A34A', bg: '#F0FDF4', icon: <CheckCircle /> },
        { label: 'Rejected', value: stats.rejected, color: '#DC2626', bg: '#FEF2F2', icon: <Cancel /> },
        { label: 'Total', value: stats.total, color: '#6366F1', bg: '#EEF2FF', icon: <Inventory2 /> },
    ];

    const sidebarProps = {
        activeMenu: PAGE_ENDPOINTS.SHOP.PRODUCTS,
        shopName: shop?.shopName,
        shopLogo: shop?.logoUrl,
        ownerName: user?.fullName,
        ownerEmail: user?.email,
        ownerAvatar: user?.avatarUrl,
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
            <ShopOwnerSidebar {...sidebarProps} />

            <Box sx={{ flex: 1, p: 4, minWidth: 0, overflowX: 'hidden' }}>

                {/* ── Header ── */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <ShieldOutlined sx={{ fontSize: 28, color: '#0F172A' }} />
                            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.03em', color: '#0F172A' }}>
                                Product Verification
                            </Typography>
                            {stats.pending > 0 && (
                                <Chip
                                    label={`${stats.pending} pending`}
                                    size="small"
                                    sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: 12 }}
                                />
                            )}
                        </Box>
                        <Typography color="text.secondary" fontSize={14}>
                            Review and verify product submissions from shop owners
                        </Typography>
                    </Box>
                    <Tooltip title="Refresh">
                        <IconButton
                            onClick={refresh}
                            disabled={loading}
                            sx={{ bgcolor: '#fff', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
                        >
                            {loading ? <CircularProgress size={20} /> : <Refresh />}
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* ── Stat cards ── */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    {statCards.map(s => (
                        <Paper key={s.label} elevation={0}
                            sx={{ flex: 1, p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                {statsLoading ? <CircularProgress size={20} sx={{ color: s.color }} /> : s.icon}
                            </Box>
                            <Box>
                                <Typography fontSize={12} color="text.secondary" fontWeight={500}>{s.label}</Typography>
                                <Typography fontSize={24} fontWeight={800} sx={{ color: s.color }}>
                                    {statsLoading ? '—' : s.value}
                                </Typography>
                            </Box>
                        </Paper>
                    ))}
                </Box>

                {/* ── Toolbar ── */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Search product, shop, SKU..."
                        size="small"
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small">
                        <Select
                            value={statusFilter}
                            onChange={e => handleStatusChange(e.target.value as any)}
                            sx={{ borderRadius: 2, bgcolor: '#fff', fontSize: 13, minWidth: 140 }}
                        >
                            <MenuItem value="ALL">All Statuses</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                            <MenuItem value="APPROVED">Approved</MenuItem>
                            <MenuItem value="REJECTED">Rejected</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <Select
                            value={typeFilter}
                            onChange={e => handleTypeChange(e.target.value as any)}
                            sx={{ borderRadius: 2, bgcolor: '#fff', fontSize: 13, minWidth: 140 }}
                        >
                            <MenuItem value="ALL">All Types</MenuItem>
                            <MenuItem value="FRAME">Frame</MenuItem>
                            <MenuItem value="ACCESSORY">Accessory</MenuItem>
                            <MenuItem value="LENS">Lens</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography fontSize={13} color="text.secondary" sx={{ ml: 'auto' }}>
                        {loading ? '...' : `${totalElements} result${totalElements !== 1 ? 's' : ''}`}
                    </Typography>
                </Box>

                {/* ── List ── */}
                {loading ? (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <CircularProgress />
                        <Typography color="text.secondary" fontSize={14} sx={{ mt: 2 }}>Loading verifications...</Typography>
                    </Box>
                ) : items.length === 0 ? (
                    <Paper elevation={0} sx={{ py: 10, textAlign: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
                        <ShieldOutlined sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                        <Typography color="text.secondary" fontSize={14}>No products to verify</Typography>
                        {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                            <Button
                                size="small" variant="text"
                                onClick={() => { setSearch(''); setStatusFilter('ALL'); setTypeFilter('ALL'); setPage(1); }}
                                sx={{ mt: 1, textTransform: 'none', fontSize: 13 }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </Paper>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {items.map(item => (
                            <ProductRowCard
                                key={item.id}
                                item={item}
                                isVerifying={verifyingId === item.id}
                                onVerify={verify}
                            />
                        ))}
                    </Box>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
                        <Typography fontSize={13} color="text.secondary">
                            Page {page} of {totalPages} · {totalElements} total
                        </Typography>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, p) => setPage(p)}
                            shape="rounded"
                            size="small"
                            sx={{ '& .Mui-selected': { bgcolor: '#0F172A !important', color: '#fff' } }}
                        />
                    </Box>
                )}

            </Box>
        </Box>
    );
};

export default ShopProductVerificationPage;