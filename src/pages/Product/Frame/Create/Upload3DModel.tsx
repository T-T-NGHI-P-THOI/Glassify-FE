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
    applyTexture: (file: File) => void;
}

interface Upload3DModelPageProps {
    variantId?: string;
    initialFile?: Model3DFile | null;
    onUploaded?: (modelUrl: string, file: Model3DFile | null) => void;
    readOnly?: boolean;
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
    ({ variantId, initialFile, onUploaded, readOnly = false }, ref) => {
        const theme = useTheme();

        const [modelFile, setModelFile] = useState<Model3DFile | null>(initialFile ?? null);
        const [error, setError] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);

        const canvasRef = useRef<HTMLCanvasElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const cleanupRef = useRef<(() => void) | null>(null);
        const threeServiceRef = useRef<ThreeJsService | null>(null);

        // ── Three.js viewer ──────────────────────────────────────────────
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
                threeServiceRef.current = null;
            };
        }, [modelFile]);

        // ── File handlers ─────────────────────────────────────────────────

        const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (readOnly) return;

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
            threeServiceRef.current = null;

            const model3dFile: Model3DFile = {
                name: file.name,
                size: file.size,
                type: file.type,
                file,
            };

            setModelFile(model3dFile);
            onUploaded?.('', model3dFile);
            e.target.value = '';
        };

        const handleRemoveFile = () => {
            if (readOnly) return;

            cleanupRef.current?.();
            threeServiceRef.current = null;
            setModelFile(null);
            setError(null);
            onUploaded?.('', null);
        };

        // ── Submit ───────────────────────────────────────────────────────

        const handleSubmit = async () => {
            if (readOnly) return;

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
            applyTexture: (file: File) => {
                const service = threeServiceRef.current;
                if (service?.viewerModel) {
                    service.applyTextureToModel(service.viewerModel, file);
                }
            },
        }));

        // ── Render ───────────────────────────────────────────────────────

        return (
            <Box>
                <input
                    type="file"
                    id="model-3d-upload"
                    accept={ACCEPTED_EXTENSIONS.join(',')}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    disabled={readOnly} // ✅
                />

                {/* Upload area */}
                {!modelFile && !readOnly && (
                    <label htmlFor="model-3d-upload">
                        <UploadArea>
                            <CloudUpload sx={{ fontSize: 48, mb: 2 }} />
                            <Typography>Upload 3D model</Typography>
                        </UploadArea>
                    </label>
                )}

                {error && (
                    <Typography color="error" fontSize={12} mt={1}>
                        {error}
                    </Typography>
                )}

                {modelFile && (
                    <Box>
                        {!readOnly ? (
                            <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <InsertDriveFile />

                                <Box flex={1}>
                                    <Typography noWrap>{modelFile.name}</Typography>
                                    <Typography fontSize={12}>
                                        {formatFileSize(modelFile.size)}
                                    </Typography>
                                </Box>

                                <label htmlFor="model-3d-upload">
                                    <Button component="span" size="small" startIcon={<Refresh />}>
                                        Replace
                                    </Button>
                                </label>

                                <IconButton onClick={handleRemoveFile}>
                                    <Delete />
                                </IconButton>
                            </Paper>
                        ) : (<></>)
                        }

                        {/* Viewer */}
                        <Box
                            ref={containerRef}
                            sx={{ height: 420, border: '1px solid #ccc', borderRadius: 2 }}
                        >
                            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                        </Box>
                    </Box>
                )
                }

                {loading && (
                    <Box mt={2} display="flex" gap={1}>
                        <CircularProgress size={20} />
                        <Typography>Uploading...</Typography>
                    </Box>
                )}
            </Box >
        );
    }
);

Upload3DModelPage.displayName = 'Upload3DModelPage';

export default Upload3DModelPage;