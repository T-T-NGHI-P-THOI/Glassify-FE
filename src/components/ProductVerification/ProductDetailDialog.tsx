import {
    Box, Typography, Paper, Chip, IconButton, Avatar, Button,
    Dialog, DialogTitle, DialogContent,
    TextField, MenuItem, Grid, Divider, CircularProgress,
    Tooltip, InputAdornment, Pagination, FormControl, Select,
    Skeleton,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Close, Collections } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import type {
    ProductType,
    ProductVerificationItem,
} from '@/types/verifications';
import { ThreeJsService } from '@/services/ThreeJsService';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ProductAPI from '@/api/product-api';


const TypeChip = styled(Chip)<{ ptype: ProductType }>(({ ptype }) => ({
    height: 20, fontSize: 10, fontWeight: 600, borderRadius: 3,
    ...(ptype === 'FRAME' && { background: '#EFF6FF', color: '#1D4ED8' }),
    ...(ptype === 'ACCESSORY' && { background: '#F3E8FF', color: '#7C3AED' }),
    ...(ptype === 'LENSES' && { background: '#ECFDF5', color: '#047857' }),
}));

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    color: '#fff',
    zIndex: 1,
    userSelect: 'none',
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
    color: '#fff',
    zIndex: 1,
    userSelect: 'none',
};

const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function ViewerOverlay({
    modelLoading,
    textureLoading,
    error,
}: {
    modelLoading: boolean;
    textureLoading: boolean;
    error: string | null;
}) {
    if (!modelLoading && !textureLoading && !error) return null;

    return (
        <Box sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            bgcolor: error
                ? 'rgba(254,242,242,0.92)'
                : 'rgba(241,245,249,0.88)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
            borderRadius: 2,
        }}>
            {error ? (
                <>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#FEE2E2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <ViewInArIcon sx={{ fontSize: 20, color: '#DC2626' }} />
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#DC2626', fontWeight: 600, textAlign: 'center', px: 2 }}>
                        {error}
                    </Typography>
                </>
            ) : (
                <>
                    {/* Spinner */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress
                            size={44}
                            thickness={3}
                            sx={{ color: '#6B7280' }} // gray-500
                        />
                        <Box sx={{
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {modelLoading
                                ? <ViewInArIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                                : <AutorenewIcon sx={{
                                    fontSize: 18,
                                    color: '#6B7280',
                                    animation: 'spin 1s linear infinite',
                                    '@keyframes spin': {
                                        from: { transform: 'rotate(0deg)' },
                                        to: { transform: 'rotate(360deg)' }
                                    },
                                }} />
                            }
                        </Box>
                    </Box>

                    {/* Status text */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                            {modelLoading ? 'Loading 3D Model…' : 'Applying Texture…'}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#9CA3AF', mt: 0.25 }}>
                            {modelLoading
                                ? 'Fetching geometry & materials'
                                : 'Painting surface colours'}
                        </Typography>
                    </Box>

                    {/* Dots */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {[0, 1, 2].map(i => (
                            <Box key={i} sx={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                bgcolor: '#9CA3AF', // gray-400
                                animation: 'bounce 1.2s ease-in-out infinite',
                                animationDelay: `${i * 0.2}s`,
                                '@keyframes bounce': {
                                    '0%, 80%, 100%': { transform: 'scale(0.7)', opacity: 0.5 },
                                    '40%': { transform: 'scale(1)', opacity: 1 },
                                },
                            }} />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
}
// ─── Product Detail Dialog ────────────────────────────────────────────────────
function ProductDetailDialog({
    open, onClose, item,
}: Readonly<{ open: boolean; onClose: () => void; item: ProductVerificationItem }>) {

    const theme = useTheme();
    const [imgIdx, setImgIdx] = useState(0);

    // 3D viewer state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const serviceRef = useRef<ThreeJsService | null>(null);

    const [modelLoading, setModelLoading] = useState(false);
    const [textureLoading, setTextureLoading] = useState(false);
    const [viewerError, setViewerError] = useState<string | null>(null);

    // Reset image index when dialog opens
    useEffect(() => {
        if (open) setImgIdx(0);
    }, [open]);

    // ── 3D model initialisation ────────────────────────────────────────────────
    useEffect(() => {
        if (!open || !item.frameGroupResponse?.modelUrl) return;

        // const container = containerRef.current;
        // console.log("Container: ", container)
        // if (!container || !canvas) return;

        let cancelled = false;
        let initialized = false;
        let refRetryTimer: number | null = null;
        let loadCheckTimer: number | null = null;

        const startViewer = async (w: number, h: number) => {
            if (initialized || w === 0 || h === 0) return;
            initialized = true;

            setModelLoading(true);
            setViewerError(null);
            initialized = true;

            const canvas = canvasRef.current;
            if (!canvas) return;

            canvas.width = w;
            canvas.height = h;

            const service = new ThreeJsService();
            serviceRef.current = service;

            try {
                const frameGroupId = item.frameGroupResponse.id;
                const modelBlob = await ProductAPI.getFrameGroupModel3D(frameGroupId);

                if (cancelled) return;

                const modelFile = new File(
                    [modelBlob],
                    `frame-group-${frameGroupId}.glb`,
                    { type: modelBlob.type || 'model/gltf-binary' },
                );

                service.initializeThreeDViewer(canvas, modelFile);
                service.renderOnce();

                // Apply texture if available
                let attempts = 0;
                const maxAttempts = 120;
                loadCheckTimer = window.setInterval(() => {
                    attempts += 1;

                    if (service.viewerModel) {
                        setModelLoading(false);
                        if (item.frameVariantResponse?.textureFile) {
                            setTextureLoading(true);

                            service
                                .applyTextureFromUrl(service.viewerModel, item.frameVariantResponse?.textureFile)
                                .catch((error) => {
                                    console.error('Failed to apply selected variant texture:', error);
                                })
                                .finally(() => {
                                    setTextureLoading(false);
                                });
                        }


                        if (loadCheckTimer) window.clearInterval(loadCheckTimer);
                        loadCheckTimer = null;
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        setModelLoading(false);
                        if (loadCheckTimer) window.clearInterval(loadCheckTimer);
                        loadCheckTimer = null;
                    }
                }, 100);
            } catch (err) {
                console.error('Failed to load 3D model:', err);
                if (!cancelled) setViewerError('Failed to load 3D model. Please try again.');
            } finally {
                if (!cancelled) setModelLoading(false);
            }
        };

        const startWhenReady = (triesLeft: number) => {
            const container = containerRef.current;
            const canvas = canvasRef.current;

            if (!container || !canvas) {
                if (triesLeft <= 0) {
                    setModelLoading(false);
                    return;
                }
                refRetryTimer = window.setTimeout(() => startWhenReady(triesLeft - 1), 80);
                return;
            }

            const { offsetWidth, offsetHeight } = container;
            if (offsetWidth > 0 && offsetHeight > 0) {
                startViewer(offsetWidth, offsetHeight).catch((error) => {
                    console.error('Error starting 3D viewer:', error);
                    setModelLoading(false);
                });
                return;
            }

            const observer = new ResizeObserver((entries) => {
                const size = entries[0]?.contentBoxSize?.[0];
                if (!size) return;
                startViewer(Math.round(size.inlineSize), Math.round(size.blockSize)).catch((error) => {
                    console.error('Error starting 3D viewer:', error);
                    setModelLoading(false);
                });
                if (initialized) observer.disconnect();
            });

            observer.observe(container);
            refRetryTimer = window.setTimeout(() => observer.disconnect(), 3000);
        };

        startWhenReady(20);

        return () => {
            cancelled = true;
            serviceRef.current = null;
            setModelLoading(false);
            setTextureLoading(false);
            setViewerError(null);
        };
    }, [open, item.frameGroupResponse?.modelUrl]);

    // ── Texture hot-swap when variant changes ──────────────────────────────────
    useEffect(() => {
        if (!open) return;

        const textureUrl = item.frameVariantResponse?.textureFile;
        if (!textureUrl) return;

        const service = serviceRef.current;
        if (!service) return;

        // Poll until the viewer model is ready (model may still be initialising)
        let attempts = 0;
        const MAX_ATTEMPTS = 30;

        const timer = window.setInterval(async () => {
            attempts += 1;

            const target = service.viewerModel ?? service.glassesObj;

            if (target) {
                window.clearInterval(timer);
                setTextureLoading(true);
                try {
                    await service.applyTextureFromUrl(target, textureUrl);
                    service.renderOnce?.();
                } catch (err) {
                    console.error('Failed to apply variant texture:', err);
                } finally {
                    setTextureLoading(false);
                }
                return;
            }

            if (attempts >= MAX_ATTEMPTS) {
                window.clearInterval(timer);
            }
        }, 120);

        return () => { window.clearInterval(timer); };
    }, [open, item.frameVariantResponse?.textureFile]);

    // ── Sub-components ─────────────────────────────────────────────────────────
    const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 0.75,
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
            mt: 2,
        }}>
            {title}
        </Typography>
    );

    const isFrame = item.productType === 'FRAME';

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 2,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TypeChip label={item.productType} ptype={item.productType} />
                    {item.verificationType === 'UPDATE' && (
                        <Chip
                            label="Update Request"
                            size="small"
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

                    {/* ── LEFT COLUMN ── */}
                    <Grid size={{ xs: 12, md: 5 }}>

                        {/* Image viewer */}
                        <Box sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: 220,
                            position: 'relative',
                            bgcolor: '#F1F5F9',
                            border: `1px solid ${theme.palette.divider}`,
                        }}>
                            {item.productImages?.length > 0 ? (
                                <Box
                                    component="img"
                                    src={item.productImages[imgIdx]}
                                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Collections sx={{ fontSize: 40, color: '#CBD5E1' }} />
                                </Box>
                            )}

                            {item.productImages?.length > 1 && (
                                <>
                                    <Box
                                        onClick={() => setImgIdx(p => (p - 1 + item.productImages.length) % item.productImages.length)}
                                        sx={navBtnLeft}
                                    >
                                        ‹
                                    </Box>
                                    <Box
                                        onClick={() => setImgIdx(p => (p + 1) % item.productImages.length)}
                                        sx={navBtnRight}
                                    >
                                        ›
                                    </Box>
                                </>
                            )}
                        </Box>

                        {/* Thumbnails */}
                        {item.productImages?.length > 1 && (
                            <Box sx={{ display: 'flex', gap: 0.75, mt: 1 }}>
                                {item.productImages.slice(0, 4).map((img, i) => (
                                    <Box
                                        key={i}
                                        component="img"
                                        src={img}
                                        onClick={() => setImgIdx(i)}
                                        sx={{
                                            width: 56,
                                            height: 44,
                                            objectFit: 'contain',
                                            borderRadius: 1.5,
                                            cursor: 'pointer',
                                            border: i === imgIdx
                                                ? `2px solid ${theme.palette.primary.main}`
                                                : `1px solid ${theme.palette.divider}`,
                                        }}
                                    />
                                ))}
                            </Box>
                        )}

                        {/* 3D Model Viewer */}
                        {item.frameGroupResponse?.modelUrl && (
                            <Box sx={{ mt: 2 }}>
                                {/* Header row */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <ViewInArIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                                        <Typography
                                            fontSize={11}
                                            fontWeight={700}
                                            color="text.secondary"
                                            sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
                                        >
                                            3D Preview
                                        </Typography>
                                    </Box>

                                    
                                    {viewerError && (
                                        <Chip
                                            size="small"
                                            label="Error"
                                            sx={{
                                                height: 20,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                bgcolor: '#FEE2E2',
                                                color: '#DC2626',
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Canvas container */}
                                <Box
                                    ref={containerRef}
                                    sx={{
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: `1px solid ${viewerError
                                            ? '#FECACA'
                                            : theme.palette.divider
                                            }`,
                                        position: 'relative',
                                        width: '100%',
                                        height: 240,
                                        bgcolor: '#F1F5F9',
                                        transition: 'border-color 0.2s',
                                    }}
                                >
                                    {/* The actual WebGL canvas — hidden behind overlay while loading */}
                                    <canvas
                                        ref={canvasRef}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'block',
                                            opacity: modelLoading ? 0 : 1,
                                            transition: 'opacity 0.4s ease',
                                        }}
                                    />

                                    {/* Loading / error overlay */}
                                    <ViewerOverlay
                                        modelLoading={modelLoading}
                                        textureLoading={textureLoading}
                                        error={viewerError}
                                    />

                                    {/* Hint label — only when fully loaded */}
                                    {!modelLoading && !textureLoading && !viewerError && (
                                        <Box sx={{
                                            position: 'absolute',
                                            bottom: 8,
                                            right: 10,
                                            bgcolor: 'rgba(0,0,0,0.45)',
                                            borderRadius: 1,
                                            px: 1.5,
                                            py: 0.5,
                                            pointerEvents: 'none',
                                        }}>
                                            <Typography sx={{ fontSize: 10, color: '#fff' }}>
                                                Drag to rotate · Scroll to zoom
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Pricing & Stock */}
                        <Paper elevation={0} sx={card}>
                            <SectionLabel title="Pricing & Stock" />
                            <Row label="Base Price" value={formatPrice(item.basePrice)} />
                            <Row label="Cost Price" value={formatPrice(item.costPrice)} />
                            <Row label="Stock" value={`${item.stockQuantity} units`} />
                            <Row label="SKU" value={item.sku ?? '—'} />
                        </Paper>
                    </Grid>

                    {/* ── RIGHT COLUMN ── */}
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
                                            bgcolor: item.frameVariantResponse.colorHex,
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
                                                bgcolor: item.accessoryVariantResponse.colorHex,
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

export default ProductDetailDialog;