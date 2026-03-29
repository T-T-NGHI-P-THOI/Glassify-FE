import {
    Dialog,
    DialogContent,
    DialogTitle,
    Box,
    Typography,
    Grid,
    Chip,
    Divider,
    IconButton,
    Avatar,
    Paper,
    Switch,
    FormControlLabel,
    Backdrop,
} from '@mui/material';
import {
    Close,
    ViewModule as ViewModuleIcon,
    ViewInAr as ViewInArIcon,
    Palette as PaletteIcon,
    Straighten as StraightenIcon,
    Inventory as InventoryIcon,
    LocalAtm as PriceIcon,
    Collections as CollectionsIcon,
    CheckCircle,
    Cancel,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useState, useRef, useEffect } from 'react';
import type { CreateFrameVariantFormData } from '../Create/CreateFrameVariantPage';
import { ThreeJsService } from '@/services/ThreeJsService';
import type { Model3DFile } from '../Create/Upload3DModel';
import ProductAPI from '@/api/product-api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FrameVariantDetailDialogProps {
    open: boolean;
    onClose: () => void;
    variant: CreateFrameVariantFormData & {
        id?: string;
        productId?: string;
        createdAt?: string;
    };
    modelFile?: Model3DFile | null;
    vrEnabled?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatPrice = (val: string | number) => {
    const n = Number(val);
    if (!n) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ color: theme.palette.primary.main, display: 'flex' }}>{icon}</Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                {label}
            </Typography>
        </Box>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], minWidth: 140 }}>
                {label}
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
                {typeof value === 'string' || typeof value === 'number' ? (
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {value || '—'}
                    </Typography>
                ) : (
                    value
                )}
            </Box>
        </Box>
    );
}

function BoolBadge({ value }: { value: boolean }) {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {value
                ? <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
                : <Cancel sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />}
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: value ? theme.palette.success.main : theme.palette.custom.neutral[400] }}>
                {value ? 'Yes' : 'No'}
            </Typography>
        </Box>
    );
}

// ─── Image lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({ images, open, initialIndex = 0, onClose }: {
    images: { preview?: string; name: string }[];
    open: boolean;
    initialIndex?: number;
    onClose: () => void;
}) {
    const [current, setCurrent] = useState(initialIndex);

    useEffect(() => { if (open) setCurrent(initialIndex); }, [open, initialIndex]);

    useEffect(() => {
        if (!open) return;
        const fn = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') setCurrent(i => (i - 1 + images.length) % images.length);
            else if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % images.length);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [open, images.length, onClose]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth={false}
            slots={{ backdrop: Backdrop }}
            slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.9)' } } }}
            PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible', m: 0 } }}
        >
            <DialogContent sx={{ p: 0, overflow: 'visible', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={onClose} sx={{ position: 'fixed', top: 16, right: 16, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, zIndex: 10 }}>
                    <Close />
                </IconButton>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {images.length > 1 && (
                        <IconButton onClick={() => setCurrent(i => (i - 1 + images.length) % images.length)}
                            sx={{ position: 'absolute', left: -56, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                            ‹
                        </IconButton>
                    )}
                    <Box component="img" src={images[current]?.preview} alt={images[current]?.name}
                        sx={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 2, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
                    {images.length > 1 && (
                        <IconButton onClick={() => setCurrent(i => (i + 1) % images.length)}
                            sx={{ position: 'absolute', right: -56, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                            ›
                        </IconButton>
                    )}
                </Box>
                {images.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {images.map((_, i) => (
                            <Box key={i} onClick={() => setCurrent(i)}
                                sx={{ width: i === current ? 20 : 8, height: 8, borderRadius: 4, bgcolor: i === current ? '#fff' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.2s' }} />
                        ))}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export default function FrameVariantDetailDialog({
    open, onClose, variant, modelFile, vrEnabled,
}: FrameVariantDetailDialogProps) {
    const theme = useTheme();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [images, setImages] = useState<string[]>([])

    // 3D viewer
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!open || !modelFile?.file) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        let initialized = false;
        const startViewer = (w: number, h: number) => {
            if (initialized || w === 0 || h === 0) return;
            initialized = true;
            canvas.width = w;
            canvas.height = h;
            const service = new ThreeJsService();
            cleanupRef.current = service.initializeThreeDViewer(canvas, modelFile.file);
            if (variant.textureFile?.file) {
                setTimeout(() => {
                    if (service.viewerModel) service.applyTextureToModel(service.viewerModel, variant.textureFile!.file);
                }, 1500);
            }
        };

        const { offsetWidth, offsetHeight } = container;
        if (offsetWidth > 0 && offsetHeight > 0) {
            startViewer(offsetWidth, offsetHeight);
        } else {
            const obs = new ResizeObserver(entries => {
                const { inlineSize: w, blockSize: h } = entries[0].contentBoxSize[0];
                startViewer(Math.round(w), Math.round(h));
                if (initialized) obs.disconnect();
            });
            obs.observe(container);
            return () => { obs.disconnect(); cleanupRef.current?.(); };
        }
        return () => { cleanupRef.current?.(); cleanupRef.current = null; };
    }, [open, modelFile]);

    const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '90vh',
                    },
                }}
            >
                {/* ── Header ── */}
                <DialogTitle
                    sx={{
                        px: 3,
                        py: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ViewModuleIcon sx={{ color: theme.palette.primary.main }} />
                        <Box>
                            <Typography sx={{ fontSize: 17, fontWeight: 700, color: theme.palette.custom.neutral[900] }}>
                                {variant.colorName || 'Variant Detail'}
                            </Typography>
                            {variant.id && (
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], fontFamily: 'monospace' }}>
                                    ID: {variant.id}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Size chip */}
                        {variant.size && (
                            <Chip
                                label={variant.size}
                                size="small"
                                sx={{
                                    height: 22,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    bgcolor: theme.palette.primary.main + '15',
                                    color: theme.palette.primary.main,
                                    border: 'none',
                                }}
                            />
                        )}
                        {/* Color swatch */}
                        {variant.colorHex && (
                            <Box sx={{
                                width: 22, height: 22, borderRadius: '50%',
                                bgcolor: variant.colorHex,
                                border: `2px solid ${theme.palette.custom.border.light}`,
                                flexShrink: 0,
                            }} />
                        )}
                        <IconButton size="small" onClick={onClose}
                            sx={{ color: theme.palette.custom.neutral[500] }}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ px: 3, py: 3 }}>
                    <Grid container spacing={3}>

                        {/* ── LEFT column ── */}
                        <Grid size={{ xs: 12, md: 7 }}>

                            {/* Color & Size */}
                            <SectionTitle icon={<PaletteIcon fontSize="small" />} label="Color & Identity" />
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, mb: 3 }}>
                                <InfoRow label="Color Name" value={variant.colorName} />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow
                                    label="Color Hex"
                                    value={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: variant.colorHex, border: `1px solid ${theme.palette.custom.border.light}` }} />
                                            <Typography sx={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace' }}>{variant.colorHex}</Typography>
                                        </Box>
                                    }
                                />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow label="Size" value={variant.size} />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow label="Featured" value={<BoolBadge value={variant.isFeatured} />} />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow label="Returnable" value={<BoolBadge value={variant.isReturnable} />} />
                            </Paper>

                            {/* Dimensions */}
                            <SectionTitle icon={<StraightenIcon fontSize="small" />} label="Frame Dimensions (mm)" />
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, mb: 3 }}>
                                {[
                                    { label: 'Frame Width', val: variant.frameWidthMm },
                                    { label: 'Lens Width', val: variant.lensWidthMm },
                                    { label: 'Lens Height', val: variant.lensHeightMm },
                                    { label: 'Bridge Width', val: variant.bridgeWidthMm },
                                    { label: 'Temple Length', val: variant.templeLengthMm },
                                ].map(({ label, val }, i, arr) => (
                                    <Box key={label}>
                                        <InfoRow label={label} value={val ? `${val} mm` : '—'} />
                                        {i < arr.length - 1 && <Divider sx={{ my: 0.5 }} />}
                                    </Box>
                                ))}
                            </Paper>

                            {/* Inventory & Pricing */}
                            <SectionTitle icon={<InventoryIcon fontSize="small" />} label="Inventory & Pricing" />
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, mb: 3 }}>
                                <InfoRow label="Stock" value={variant.stock ? `${variant.stock} units` : '—'} />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow label="Stock Threshold" value={variant.stockThreshold ? `${variant.stockThreshold} units` : '—'} />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow label="Warranty" value={variant.warrantyMonths ? `${variant.warrantyMonths} months` : '—'} />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow label="Cost Price" value={formatPrice(variant.costPrice)} />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow
                                    label="Base Price"
                                    value={
                                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.primary.main }}>
                                            {formatPrice(variant.basePrice)}
                                        </Typography>
                                    }
                                />
                                <Divider sx={{ my: 0.5 }} />
                                <InfoRow
                                    label="Compare At Price"
                                    value={
                                        variant.compareAtPrice ? (
                                            <Typography sx={{ fontSize: 13, fontWeight: 500, textDecoration: 'line-through', color: theme.palette.custom.neutral[400] }}>
                                                {formatPrice(variant.compareAtPrice)}
                                            </Typography>
                                        ) : '—'
                                    }
                                />
                            </Paper>
                        </Grid>

                        {/* ── RIGHT column ── */}
                        <Grid size={{ xs: 12, md: 5 }}>

                            {/* Product Images */}
                            <SectionTitle icon={<CollectionsIcon fontSize="small" />} label="Product Images" />
                            {variant.images.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center', color: theme.palette.custom.neutral[400], border: `1px dashed ${theme.palette.custom.border.light}`, borderRadius: 2, mb: 3 }}>
                                    <CollectionsIcon sx={{ fontSize: 32, mb: 1, opacity: 0.4 }} />
                                    <Typography sx={{ fontSize: 13 }}>No images uploaded</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ mb: 3 }}>
                                    {/* Main preview */}
                                    <Box
                                        onClick={() => openLightbox(0)}
                                        sx={{
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            mb: 1.5,
                                            border: `1px solid ${theme.palette.custom.border.light}`,
                                            height: 200,
                                            position: 'relative',
                                            '&:hover .overlay': { opacity: 1 },
                                        }}
                                    >
                                        <Box component="img" src={variant.images[0].preview}
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <Box className="overlay" sx={{
                                            position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.3)',
                                            opacity: 0, transition: 'opacity 0.2s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>View</Typography>
                                        </Box>
                                    </Box>

                                    {/* Thumbnails */}
                                    {variant.images.length > 1 && (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {variant.images.slice(1).map((img, i) => (
                                                <Box
                                                    key={i}
                                                    onClick={() => openLightbox(i + 1)}
                                                    sx={{
                                                        flex: 1, height: 64, borderRadius: 1.5, overflow: 'hidden',
                                                        cursor: 'pointer', border: `1px solid ${theme.palette.custom.border.light}`,
                                                        position: 'relative',
                                                        '&:hover .overlay': { opacity: 1 },
                                                    }}
                                                >
                                                    <Box component="img" src={img.preview}
                                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <Box className="overlay" sx={{
                                                        position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.3)',
                                                        opacity: 0, transition: 'opacity 0.2s',
                                                    }} />
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Texture */}
                            <SectionTitle icon={<ViewInArIcon fontSize="small" />} label="Texture Map" />
                            {!variant.textureFile ? (
                                <Box sx={{ py: 3, textAlign: 'center', color: theme.palette.custom.neutral[400], border: `1px dashed ${theme.palette.custom.border.light}`, borderRadius: 2, mb: 3 }}>
                                    <Typography sx={{ fontSize: 13 }}>No texture uploaded</Typography>
                                </Box>
                            ) : (
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box component="img" src={variant.textureFile.preview}
                                        sx={{ width: 52, height: 52, borderRadius: 1, objectFit: 'cover', border: `1px solid ${theme.palette.custom.border.light}`, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: theme.palette.custom.neutral[800] }}>
                                            {variant.textureFile.name}
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                                            {formatFileSize(variant.textureFile.size)}
                                        </Typography>
                                    </Box>
                                </Paper>
                            )}

                            {/* 3D Viewer */}
                            {vrEnabled && modelFile?.file && (
                                <>
                                    <SectionTitle icon={<ViewInArIcon fontSize="small" />} label="3D Preview" />
                                    <Box
                                        ref={containerRef}
                                        sx={{
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            border: `1px solid ${theme.palette.custom.border.light}`,
                                            position: 'relative',
                                            width: '100%',
                                            height: 260,
                                        }}
                                    >
                                        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                                        <Box sx={{
                                            position: 'absolute', bottom: 10, right: 12,
                                            bgcolor: 'rgba(0,0,0,0.45)', borderRadius: 1, px: 1.5, py: 0.5, pointerEvents: 'none',
                                        }}>
                                            <Typography sx={{ fontSize: 11, color: '#fff' }}>Drag · Scroll to zoom</Typography>
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>

            {/* Image lightbox */}
            <ImageLightbox
                images={variant.images}
                open={lightboxOpen}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
}