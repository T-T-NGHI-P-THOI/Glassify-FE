import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	Box,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	Typography,
} from '@mui/material';
import { Close, ThreeSixty } from '@mui/icons-material';
import ProductAPI from '@/api/product-api';
import { ThreeJsService } from '@/services/ThreeJsService';

export interface Product3DVariantOption {
	id: string;
	variantId?: string;
	label: string;
	colorHex: string;
	textureUrl: string;
}

interface Product3DPreviewDialogProps {
	open: boolean;
	onClose: () => void;
	frameGroupId: string;
	variants: Product3DVariantOption[];
	activeVariantId: string | null;
	onChangeVariant: (variantId: string) => void;
}

const Product3DPreviewDialog: React.FC<Product3DPreviewDialogProps> = ({
	open,
	onClose,
	frameGroupId,
	variants,
	activeVariantId,
	onChangeVariant,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const cleanupRef = useRef<(() => void) | null>(null);
	const serviceRef = useRef<ThreeJsService | null>(null);
	const [modelLoading, setModelLoading] = useState(true);
	const [modelError, setModelError] = useState<string | null>(null);
	const [viewerInitToken, setViewerInitToken] = useState(0);

	const activeVariant = useMemo(
		() => variants.find((variant) => variant.id === activeVariantId) ?? null,
		[variants, activeVariantId]
	);

	useEffect(() => {
		if (open) return;
		setModelLoading(true);
		setModelError(null);
	}, [open]);

	useEffect(() => {
		if (!open || !frameGroupId || viewerInitToken === 0) return;

		let initialized = false;
		let cancelled = false;
		let loadCheckTimer: number | null = null;
		let refRetryTimer: number | null = null;

		const startViewer = async (w: number, h: number) => {
			if (initialized || w === 0 || h === 0) return;

			const viewerCanvas = canvasRef.current;
			if (!viewerCanvas) return;

			initialized = true;
			setModelLoading(true);
			setModelError(null);

			viewerCanvas.width = w;
			viewerCanvas.height = h;

			const service = new ThreeJsService();
			serviceRef.current = service;

			try {
				const modelBlob = await ProductAPI.getFrameGroupModel3D(frameGroupId);
				if (cancelled) return;

				const modelFile = new File([modelBlob], `frame-group-${frameGroupId}.glb`, {
					type: modelBlob.type || 'model/gltf-binary',
				});

				cleanupRef.current = service.initializeThreeDViewer(viewerCanvas, modelFile);

				let attempts = 0;
				const maxAttempts = 120;
				loadCheckTimer = window.setInterval(() => {
					attempts += 1;

					if (service.viewerModel) {
						setModelLoading(false);
						setModelError(null);
						if (loadCheckTimer) window.clearInterval(loadCheckTimer);
						loadCheckTimer = null;
						return;
					}

					if (attempts >= maxAttempts) {
						setModelLoading(false);
						setModelError('Unable to load 3D model for this frame.');
						if (loadCheckTimer) window.clearInterval(loadCheckTimer);
						loadCheckTimer = null;
					}
				}, 100);
			} catch (error) {
				console.error('Failed to fetch 3D model blob:', error);
				setModelLoading(false);
				setModelError('Unable to load 3D model for this frame.');
			}
		};

		const startWhenReady = (triesLeft: number) => {
			const container = containerRef.current;
			const canvas = canvasRef.current;

			if (!container || !canvas) {
				if (triesLeft <= 0) {
					setModelLoading(false);
					setModelError('3D viewer is not ready. Please reopen preview.');
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
					setModelError('Unable to load 3D model for this frame.');
				});
				return;
			}

			const observer = new ResizeObserver((entries) => {
				const size = entries[0]?.contentBoxSize?.[0];
				if (!size) return;
				startViewer(Math.round(size.inlineSize), Math.round(size.blockSize)).catch((error) => {
					console.error('Error starting 3D viewer:', error);
					setModelLoading(false);
					setModelError('Unable to load 3D model for this frame.');
				});
				if (initialized) observer.disconnect();
			});

			observer.observe(container);
			refRetryTimer = window.setTimeout(() => observer.disconnect(), 3000);
		};

		startWhenReady(20);

		return () => {
			cancelled = true;
			if (loadCheckTimer) window.clearInterval(loadCheckTimer);
			if (refRetryTimer) window.clearTimeout(refRetryTimer);
			cleanupRef.current?.();
			cleanupRef.current = null;
			serviceRef.current = null;
		};
	}, [open, frameGroupId, viewerInitToken]);

	useEffect(() => {
		if (!open || !activeVariant?.textureUrl) return;

		const service = serviceRef.current;
		if (!service) return;

		let attempts = 0;
		const maxAttempts = 30;

		const timer = window.setInterval(() => {
			attempts += 1;

			if (service.viewerModel) {
				service
					.applyTextureFromUrl(service.viewerModel, activeVariant.textureUrl)
					.catch((error) => {
						console.error('Failed to apply selected variant texture:', error);
					});
				window.clearInterval(timer);
				return;
			}

			if (attempts >= maxAttempts) {
				window.clearInterval(timer);
			}
		}, 120);

		return () => {
			window.clearInterval(timer);
		};
	}, [open, activeVariant]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="md"
			TransitionProps={{
				onEntered: () => {
					setViewerInitToken((prev) => prev + 1);
				},
			}}
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: 'hidden',
				},
			}}
		>
			<DialogTitle
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 2,
					px: 3,
					py: 2,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<ThreeSixty sx={{ color: 'primary.main' }} />
					<Typography sx={{ fontWeight: 700, fontSize: 18 }}>3D Preview</Typography>
				</Box>
				<IconButton size="small" onClick={onClose}>
					<Close fontSize="small" />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ px: 3, pb: 3, pt: 1.5 }}>
				<Box
					ref={containerRef}
					sx={{
						width: '100%',
						height: { xs: 320, md: 430 },
						borderRadius: 2,
						overflow: 'hidden',
						border: '1px solid',
						borderColor: 'custom.border.light',
						position: 'relative',
						bgcolor: '#1d1f24',
					}}
				>
					<canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

					{(modelLoading || modelError) && (
						<Box
							sx={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexDirection: 'column',
								gap: 1,
								bgcolor: 'rgba(0, 0, 0, 0.35)',
							}}
						>
							{modelLoading && <CircularProgress size={28} sx={{ color: '#fff' }} />}
							<Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
								{modelLoading ? 'Loading 3D model...' : modelError}
							</Typography>
						</Box>
					)}

					<Box
						sx={{
							position: 'absolute',
							right: 12,
							bottom: 12,
							px: 1.25,
							py: 0.5,
							borderRadius: 1,
							bgcolor: 'rgba(0, 0, 0, 0.45)',
							pointerEvents: 'none',
						}}
					>
						<Typography sx={{ color: '#fff', fontSize: 11 }}>
							Drag to rotate · Scroll to zoom
						</Typography>
					</Box>
				</Box>

				<Box sx={{ mt: 2.25 }}>
					<Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.25 }}>Variants</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						{variants.map((variant) => {
							const isActive = variant.id === activeVariantId;
							return (
								<Box
									key={variant.id}
									component="button"
									type="button"
									onClick={() => onChangeVariant(variant.id)}
									sx={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 0.75,
										px: 1.25,
										py: 0.7,
										borderRadius: 2,
										border: '1px solid',
										borderColor: isActive ? 'primary.main' : 'custom.border.light',
										bgcolor: isActive ? 'rgba(0, 100, 112, 0.08)' : '#fff',
										color: isActive ? 'primary.main' : 'custom.neutral.700',
										cursor: 'pointer',
										fontWeight: isActive ? 600 : 500,
										transition: 'all 0.15s ease',
										'&:hover': {
											borderColor: 'primary.main',
											bgcolor: 'rgba(0, 100, 112, 0.05)',
										},
									}}
								>
									<Box
										sx={{
											width: 14,
											height: 14,
											borderRadius: '50%',
											bgcolor: variant.colorHex,
											border: '1px solid rgba(0,0,0,0.2)',
											flexShrink: 0,
										}}
									/>
									<Typography
										sx={{
											fontSize: 12,
											fontWeight: isActive ? 600 : 500,
											maxWidth: 190,
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
										}}
									>
										{variant.label}
									</Typography>
								</Box>
							);
						})}
					</Box>
				</Box>
			</DialogContent>
		</Dialog>
	);
};

export default Product3DPreviewDialog;
