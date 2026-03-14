import {
    Box,
    Typography,
    Paper,
    Divider,
    Grid,
    Avatar,
    Chip,
    useTheme,
} from '@mui/material';
import {
    Store,
    CheckCircle,
    InsertDriveFile,
} from '@mui/icons-material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useEffect, useRef } from 'react';
import { ThreeJsService } from '@/services/ThreeJsService';
import type { CreateFrameFormData } from './CreateFrameGroupPage';
import type { CreateFrameVariantFormData } from './CreateFrameVariantPage';
import type { Model3DFile } from './Upload3DModel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewFramePageProps {
    groupData: Partial<CreateFrameFormData>;
    variantData: Partial<CreateFrameVariantFormData>;
    modelFile: Model3DFile | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatLabel = (val: string) =>
    val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatCurrency = (val: string) =>
    val ? Number(val).toLocaleString('vi-VN') + ' ₫' : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => {
    const theme = useTheme();
    return (
        <Typography
            sx={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.palette.custom.neutral[800],
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
            }}
        >
            {icon}
            {title}
        </Typography>
    );
};

const InfoRow = ({ label, value }: { label: string; value?: string | React.ReactNode }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, alignItems: 'center' }}>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], minWidth: 160 }}>
                {label}
            </Typography>
            <Typography
                sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: theme.palette.custom.neutral[800],
                    textAlign: 'right',
                }}
            >
                {value || '—'}
            </Typography>
        </Box>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

const ReviewFramePage = ({ groupData, variantData, modelFile }: ReviewFramePageProps) => {
    const theme = useTheme();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    // ── Khởi Three.js viewer ─────────────────────────────────────────────────

    useEffect(() => {
        if (!modelFile) return;

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
        };

        const { offsetWidth, offsetHeight } = container;
        if (offsetWidth > 0 && offsetHeight > 0) {
            startViewer(offsetWidth, offsetHeight);
            return () => { cleanupRef.current?.(); cleanupRef.current = null; };
        }

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { inlineSize: w, blockSize: h } = entry.contentBoxSize[0];
                startViewer(Math.round(w), Math.round(h));
                if (initialized) { observer.disconnect(); break; }
            }
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            cleanupRef.current?.();
            cleanupRef.current = null;
        };
    }, [modelFile]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: theme.palette.custom.status.success.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CheckCircle sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                        Review & Submit
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                        Please review all information before submitting
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>

                {/* ── Left column ── */}
                <Grid size={{ xs: 12, md: 7 }}>

                    {/* ── Frame Info ── */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.custom.border.light}`,
                        }}
                    >
                        <SectionTitle
                            icon={<Store sx={{ color: theme.palette.primary.main, fontSize: 20 }} />}
                            title="Frame Information"
                        />
                        <Divider sx={{ mb: 2 }} />

                        <InfoRow label="Frame Name" value={groupData.frameName} />
                        <InfoRow label="Shape" value={groupData.frameShape ? formatLabel(groupData.frameShape) : undefined} />
                        <InfoRow label="Structure" value={groupData.frameStructure ? formatLabel(groupData.frameStructure) : undefined} />
                        <InfoRow label="Material" value={groupData.frameMaterial ? formatLabel(groupData.frameMaterial) : undefined} />
                        <InfoRow label="Gender Target" value={groupData.genderTarget ? formatLabel(groupData.genderTarget) : undefined} />
                        <InfoRow label="Age Group" value={groupData.ageGroup ? formatLabel(groupData.ageGroup) : undefined} />

                        {groupData.description && (
                            <Box sx={{ mt: 1.5 }}>
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 0.5 }}>
                                    Description
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        color: theme.palette.custom.neutral[700],
                                        bgcolor: theme.palette.custom.neutral[50],
                                        borderRadius: 1,
                                        p: 1.5,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {groupData.description}
                                </Typography>
                            </Box>
                        )}
                    </Paper>

                    {/* ── Variant Info ── */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.custom.border.light}`,
                        }}
                    >
                        <SectionTitle
                            icon={<ViewModuleIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />}
                            title="Frame Variant"
                        />
                        <Divider sx={{ mb: 2 }} />

                        {/* Color swatch + name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Box
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    bgcolor: variantData.colorHex || '#000',
                                    border: `2px solid ${theme.palette.custom.border.light}`,
                                    flexShrink: 0,
                                }}
                            />
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                {variantData.colorName || '—'}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                                {variantData.colorHex}
                            </Typography>
                            {variantData.size && (
                                <Chip
                                    label={variantData.size}
                                    size="small"
                                    sx={{
                                        ml: 'auto',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        bgcolor: theme.palette.primary.main,
                                        color: '#fff',
                                        height: 24,
                                    }}
                                />
                            )}
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Dimensions */}
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[500], mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Dimensions (mm)
                        </Typography>
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                            {[
                                ['Frame W', variantData.frameWidthMm],
                                ['Lens W', variantData.lensWidthMm],
                                ['Lens H', variantData.lensHeightMm],
                                ['Bridge', variantData.bridgeWidthMm],
                                ['Temple', variantData.templeLengthMm],
                            ].map(([label, val]) => (
                                <Grid key={label} size={{ xs: 4 }}>
                                    <Box
                                        sx={{
                                            bgcolor: theme.palette.custom.neutral[50],
                                            borderRadius: 1,
                                            p: 1,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                                            {label}
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                            {val || '—'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Features */}
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[500], mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Features
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {[
                                { label: 'Nose Pads', val: variantData.hasNosepads },
                                { label: 'Spring Hinge', val: variantData.hasSpringHinge },
                                { label: 'VR Enabled', val: variantData.vrEnabled },
                                { label: 'Returnable', val: variantData.isReturnable },
                            ].map(({ label, val }) => (
                                <Chip
                                    key={label}
                                    label={label}
                                    size="small"
                                    sx={{
                                        fontSize: 12,
                                        bgcolor: val
                                            ? theme.palette.custom.status.success.light
                                            : theme.palette.custom.neutral[100],
                                        color: val
                                            ? theme.palette.custom.status.success.main
                                            : theme.palette.custom.neutral[400],
                                        fontWeight: val ? 600 : 400,
                                    }}
                                />
                            ))}
                        </Box>

                        {/* Pricing & stock */}
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[500], mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Pricing & Inventory
                        </Typography>
                        <InfoRow label="Base Price" value={formatCurrency(variantData.basePrice || '')} />
                        <InfoRow label="Cost Price" value={formatCurrency(variantData.costPrice || '')} />
                        <InfoRow label="Compare At Price" value={formatCurrency(variantData.compareAtPrice || '')} />
                        <InfoRow label="Stock" value={variantData.stock ? variantData.stock + ' units' : undefined} />
                        <InfoRow label="Stock Threshold" value={variantData.stockThreshold ? variantData.stockThreshold + ' units' : undefined} />
                        <InfoRow label="Warranty" value={variantData.warrantyMonths ? variantData.warrantyMonths + ' months' : undefined} />
                    </Paper>
                </Grid>

                {/* ── Right column ── */}
                <Grid size={{ xs: 12, md: 5 }}>

                    {/* ── Product images ── */}
                    {(variantData.images?.length ?? 0) > 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.custom.border.light}`,
                            }}
                        >
                            <SectionTitle
                                icon={<ViewModuleIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />}
                                title="Product Images"
                            />
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={1.5}>
                                {variantData.images!.map((img, i) => (
                                    <Grid key={i} size={{ xs: 6 }}>
                                        <Avatar
                                            variant="rounded"
                                            src={img.preview}
                                            sx={{
                                                width: '100%',
                                                height: 110,
                                                borderRadius: 2,
                                                bgcolor: theme.palette.custom.neutral[100],
                                                border: `1px solid ${theme.palette.custom.border.light}`,
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    )}

                    {/* ── 3D Model viewer ── */}
                    {modelFile ? (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.custom.border.light}`,
                            }}
                        >
                            <SectionTitle
                                icon={<InsertDriveFile sx={{ color: theme.palette.primary.main, fontSize: 20 }} />}
                                title="3D Preview"
                            />
                            <Divider sx={{ mb: 2 }} />

                            <Box
                                ref={containerRef}
                                sx={{
                                    borderRadius: 1.5,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    width: '100%',
                                    height: 300,
                                    bgcolor: '#1a1a2e',
                                }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    style={{ width: '100%', height: '100%', display: 'block' }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 10,
                                        bgcolor: 'rgba(0,0,0,0.45)',
                                        borderRadius: 1,
                                        px: 1.5,
                                        py: 0.5,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <Typography sx={{ fontSize: 10, color: '#fff' }}>
                                        Drag to rotate · Scroll to zoom
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                border: `1px dashed ${theme.palette.custom.border.light}`,
                                textAlign: 'center',
                            }}
                        >
                            <InsertDriveFile sx={{ fontSize: 40, color: theme.palette.custom.neutral[300], mb: 1 }} />
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>
                                No 3D model uploaded
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReviewFramePage;