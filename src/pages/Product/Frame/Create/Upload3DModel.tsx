import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Paper,
    Typography,
    useTheme,
} from '@mui/material';
import { CloudUpload, Delete, InsertDriveFile, Refresh } from '@mui/icons-material';
import {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react';
import { UploadArea } from './CreateFrameVariantPage';
import { ThreeJsService } from '@/services/ThreeJsService';
import ProductAPI from '@/api/product-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Model3DFile {
    name: string;
    size: number;
    type: string;
    file: File;
}

export interface Upload3DModelPageRef {
    submit: () => Promise<void>;
    /** Apply texture file vào model đang chạy trong viewer */
    applyTexture: (file: File) => void;
}

interface Upload3DModelPageProps {
    variantId?: string;
    initialFile?: Model3DFile | null;
    onUploaded?: (modelUrl: string, file: Model3DFile) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_EXTENSIONS = ['.gltf', '.glb', '.obj', '.fbx', '.stl'];
const MAX_SIZE_MB = 20;

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const isValidExtension = (filename: string) =>
    ACCEPTED_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));

// ─── Component ────────────────────────────────────────────────────────────────

const Upload3DModelPage = forwardRef<Upload3DModelPageRef, Upload3DModelPageProps>(
    ({ variantId, initialFile, onUploaded }, ref) => {
        const theme = useTheme();

        const [modelFile, setModelFile] = useState<Model3DFile | null>(initialFile ?? null);
        const [error, setError] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);

        const canvasRef = useRef<HTMLCanvasElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const cleanupRef = useRef<(() => void) | null>(null);
        const threeServiceRef = useRef<ThreeJsService | null>(null);

        // ── Khởi Three.js viewer ──────────────────────────────────────────────
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

                const threeJsService = new ThreeJsService();
                threeServiceRef.current = threeJsService;
                cleanupRef.current = threeJsService.initializeThreeDViewer(canvas, modelFile.file);
            };

            const { offsetWidth, offsetHeight } = container;
            if (offsetWidth > 0 && offsetHeight > 0) {
                startViewer(offsetWidth, offsetHeight);
                return () => {
                    cleanupRef.current?.();
                    cleanupRef.current = null;
                    threeServiceRef.current = null;
                };
            }

            const observer = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const { inlineSize: w, blockSize: h } = entry.contentBoxSize[0];
                    startViewer(Math.round(w), Math.round(h));
                    if (initialized) {
                        observer.disconnect();
                        break;
                    }
                }
            });
            observer.observe(container);

            return () => {
                observer.disconnect();
                cleanupRef.current?.();
                cleanupRef.current = null;
                threeServiceRef.current = null;
            };
        }, [modelFile]);

        // ── File handlers ─────────────────────────────────────────────────────

        const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];

            if (!isValidExtension(file.name)) {
                setError(`Invalid file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`);
                e.target.value = '';
                return;
            }

            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                setError(`File too large. Max ${MAX_SIZE_MB} MB`);
                e.target.value = '';
                return;
            }

            setError(null);
            cleanupRef.current?.();
            cleanupRef.current = null;
            threeServiceRef.current = null;

            const model3dFile: Model3DFile = { name: file.name, size: file.size, type: file.type, file };
            setModelFile(model3dFile);
            onUploaded?.('', model3dFile);
            e.target.value = '';
        };

        const handleRemoveFile = () => {
            cleanupRef.current?.();
            cleanupRef.current = null;
            threeServiceRef.current = null;
            setModelFile(null);
            setError(null);
            onUploaded?.('', null as any); 
        };

        // ── Submit ────────────────────────────────────────────────────────────

        const handleSubmit = async () => {
            if (!modelFile) {
                setError('Please upload a 3D model file');
                throw new Error('Validation failed');
            }

            setLoading(true);
            try {
                const payload = new FormData();
                payload.append('frameVariantId', variantId ?? '');
                payload.append('file', modelFile.file);

                const response = await ProductAPI.upload3DModelFile(payload);
                onUploaded?.(response.modelUrl, modelFile);
            } finally {
                setLoading(false);
            }
        };

        useImperativeHandle(ref, () => ({
            submit: handleSubmit,
            // ✅ Expose applyTexture — CreateFrameVariantPage gọi khi user upload texture
            applyTexture: (file: File) => {
                const service = threeServiceRef.current;
                if (service?.viewerModel) {
                    service.applyTextureToModel(service.viewerModel, file);
                }
            },
        }));

        // ── Render ────────────────────────────────────────────────────────────

        return (
            <Box>
                <input
                    type="file"
                    id="model-3d-upload"
                    accept={ACCEPTED_EXTENSIONS.join(',')}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                />

                {!modelFile && (
                    <label htmlFor="model-3d-upload">
                        <UploadArea sx={error ? { borderColor: theme.palette.error.main } : {}}>
                            <CloudUpload
                                sx={{ fontSize: 48, color: theme.palette.custom.neutral[400], mb: 2 }}
                            />
                            <Typography
                                sx={{
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: theme.palette.custom.neutral[700],
                                    mb: 1,
                                }}
                            >
                                Drag and drop file here or click to browse
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                                {ACCEPTED_EXTENSIONS.join(', ')} up to {MAX_SIZE_MB} MB
                            </Typography>
                        </UploadArea>
                    </label>
                )}

                {error && (
                    <Typography color="error" fontSize={12} sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}

                {modelFile && (
                    <Box>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                mb: 2,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.custom.border.light}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 1,
                                    bgcolor: theme.palette.custom.neutral[100],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <InsertDriveFile sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: theme.palette.custom.neutral[800],
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {modelFile.name}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                                    {formatFileSize(modelFile.size)}
                                </Typography>
                            </Box>

                            <label htmlFor="model-3d-upload" style={{ cursor: 'pointer' }}>
                                <Button
                                    component="span"
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Refresh sx={{ fontSize: 16 }} />}
                                    sx={{ fontSize: 13, textTransform: 'none', mr: 1 }}
                                >
                                    Replace
                                </Button>
                            </label>

                            <IconButton
                                size="small"
                                onClick={handleRemoveFile}
                                sx={{ color: theme.palette.custom.status.error.main }}
                            >
                                <Delete />
                            </IconButton>
                        </Paper>

                        <Box
                            ref={containerRef}
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: `1px solid ${theme.palette.custom.border.light}`,
                                position: 'relative',
                                width: '100%',
                                height: 420,
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                style={{ width: '100%', height: '100%', display: 'block' }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 12,
                                    right: 14,
                                    bgcolor: 'rgba(0,0,0,0.45)',
                                    borderRadius: 1,
                                    px: 1.5,
                                    py: 0.5,
                                    pointerEvents: 'none',
                                }}
                            >
                                <Typography sx={{ fontSize: 11, color: '#fff' }}>
                                    Drag to rotate · Scroll to zoom
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                        <CircularProgress size={20} />
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                            Uploading 3D model…
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }
);

Upload3DModelPage.displayName = 'Upload3DModelPage';

export default Upload3DModelPage;