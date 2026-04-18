import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Pagination,
    FormControl,
    Select,
    MenuItem,
    CircularProgress,
    Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Search,
    Add,
    Inventory,
    Verified,
    Inventory2,
    Warehouse,
    RemoveShoppingCart,
    EditNote,
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
import AccessoryCard, { type Accessory } from './View/AccessoryCard';
import EditAccessoryDialog, { type EditAccessoryFormData } from './Edit/EditAccessoryDialog';
import DeleteConfirmDialog from './Delete/DeleteConfirmDialog';
import ViewAccessoryDialog from './View/ViewAccessoryDialog';
import ProductAPI from '@/api/product-api';

const LOW_STOCK_THRESHOLD = 10;

// ─── Main Page ────────────────────────────────────────────────────────────────

const AccessoryProductPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setShowNavbar, setShowFooter } = useLayout();

    const [shop, setShop] = useState<ShopDetailResponse | null>(null);
    const [accessories, setAccessories] = useState<Accessory[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(12);

    const [viewTarget, setViewTarget] = useState<Accessory | null>(null);
    const [editTarget, setEditTarget] = useState<Accessory | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Accessory | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        setShowNavbar(false);
        setShowFooter(false);
        return () => { setShowNavbar(true); setShowFooter(true); };
    }, [setShowNavbar, setShowFooter]);

    useEffect(() => {
        (async () => {
            try {
                const shopRes = await shopApi.getMyShops();
                const myShop = shopRes.data?.[0] ?? null;
                setShop(myShop);
                if (myShop?.id) {
                    const data = await ProductAPI.getAccessoriesFromShopId(myShop.id);
                    setAccessories(data ?? []);
                }
            } catch (err) {
                console.error('Failed to load accessories:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleRow = (id: string) =>
        setExpandedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const filtered = useMemo(() => {
        if (!search.trim()) return accessories;
        const q = search.toLowerCase();
        return accessories.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                a.type.toLowerCase().includes(q) ||
                a.variants.some(
                    (v) =>
                        v.color?.toLowerCase().includes(q) ||
                        v.size?.toLowerCase().includes(q)
                )
        );
    }, [accessories, search]);

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const startEntry = filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
    const endEntry = Math.min(page * rowsPerPage, filtered.length);
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const totalCount = accessories.length;
    console.log("Accessories: ", accessories)
    const activeCount = accessories.filter(a => a.variants.some(v => v.productResponse.isActive ?? true)).length;
    const inStockCount = accessories.filter(a => a.variants.some(v => (v.stock ?? v.productResponse?.stockQuantity ?? 0) > LOW_STOCK_THRESHOLD)).length;
    const outOfStockCount = accessories.filter(a => a.variants.length > 0 && a.variants.every(v => (v.stock ?? v.productResponse?.stockQuantity ?? 0) === 0)).length;
    const noVariantCount = accessories.filter(a => a.variants.length === 0).length;

    const stats = [
        { icon: <Inventory2 sx={{ color: theme.palette.custom.status.pink.main }} />, label: 'Total', value: totalCount, bgColor: theme.palette.custom.status.pink.light },
        { icon: <Verified sx={{ color: theme.palette.custom.status.success.main }} />, label: 'Active', value: activeCount, bgColor: theme.palette.custom.status.success.light },
        { icon: <Warehouse sx={{ color: theme.palette.custom.status.info.main }} />, label: 'In-stock', value: inStockCount, bgColor: theme.palette.custom.status.info.light },
        { icon: <RemoveShoppingCart sx={{ color: theme.palette.custom.status.error.main }} />, label: 'Out-of-stock', value: outOfStockCount, bgColor: theme.palette.custom.status.error.light },
        { icon: <EditNote sx={{ color: theme.palette.custom.status.warning.main }} />, label: 'No Variants', value: noVariantCount, bgColor: theme.palette.custom.status.warning.light },
    ];

    const handleEditSave = async (id: string, data: EditAccessoryFormData) => {
        setAccessories(prev =>
            prev.map(item => item.id === id ? { ...item, ...data } : item)
        );
        setEditTarget(prev => prev && prev.id === id ? { ...prev, ...data } : prev);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            // TODO: await AccessoryAPI.deleteAccessory(deleteTarget.id);
            setAccessories(prev => prev.filter(a => a.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteLoading(false);
        }
    };

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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                            Accessory Management
                        </Typography>
                        <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>
                            Quản lý và theo dõi thông tin phụ kiện có trong cửa hàng
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <CustomButton
                            variant="contained"
                            startIcon={<Add />}
                            sx={{ backgroundColor: theme.palette.primary.main, textTransform: 'none', fontWeight: 600 }}
                            onClick={() => navigate(PAGE_ENDPOINTS.SHOP.CREATE_ACCESSORY)}
                        >
                            Add Accessory
                        </CustomButton>
                    </Box>
                </Box>

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    {stats.map((stat) => (
                        <Paper
                            key={stat.label}
                            elevation={0}
                            sx={{
                                flex: 1, p: 2.5, borderRadius: 2,
                                border: `1px solid ${theme.palette.custom.border.light}`,
                                display: 'flex', alignItems: 'center', gap: 2,
                            }}
                        >
                            <Box sx={{
                                width: 48, height: 48, borderRadius: 2,
                                bgcolor: stat.bgColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
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
                        </Paper>
                    ))}
                </Box>

                {/* Toolbar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                            Accessory List
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                            · Click a card to expand variants
                        </Typography>
                    </Box>
                    <TextField
                        placeholder="Search accessories..."
                        size="small"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        sx={{ width: 280 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: theme.palette.custom.neutral[400], fontSize: 18 }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Card grid */}
                {paginated.length === 0 ? (
                    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.custom.border.light}`, borderRadius: 2, py: 8, textAlign: 'center' }}>
                        <Inventory sx={{ fontSize: 48, color: theme.palette.custom.neutral[300], mb: 1 }} />
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>No accessories found</Typography>
                    </Paper>
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 2,
                            alignItems: 'start',
                        }}
                    >
                        {paginated.map((acc) => (
                            <Box key={acc.id}>
                                <AccessoryCard
                                    accessory={acc}
                                    shopId={shop?.id || ''}
                                    isExpanded={expandedIds.has(acc.id)}
                                    onToggle={() => toggleRow(acc.id)}
                                    onEdit={() => setEditTarget(acc)}
                                    onDelete={() => setDeleteTarget(acc)}
                                    onPreview={() => setViewTarget(acc)}
                                    onViewAnalytics={() => { }}
                                    setAccessories={setAccessories}
                                />
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Pagination */}
                {filtered.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, px: 0.5 }}>
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
                                Showing {startEntry}–{endEntry} of {filtered.length}
                            </Typography>
                            <FormControl size="small">
                                <Select
                                    value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                                    sx={{ fontSize: 13, height: 32, borderRadius: 1.5, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border.light } }}
                                >
                                    {[12, 24, 48].map((n) => <MenuItem key={n} value={n}>Show {n}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Dialogs */}
            <ViewAccessoryDialog
                open={!!viewTarget}
                onClose={() => setViewTarget(null)}
                accessory={viewTarget}
            />
            <EditAccessoryDialog
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                onSave={handleEditSave}
                shopId={shop?.id}
                accessory={editTarget}
                loading={editLoading}
            />
            <DeleteConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                itemName={deleteTarget?.name}
                accessoryId={deleteTarget?.id}
            />
        </Box>
    );
};

export default AccessoryProductPage;