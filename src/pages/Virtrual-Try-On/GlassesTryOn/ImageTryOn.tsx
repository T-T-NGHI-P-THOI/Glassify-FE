import { Box, Typography, CircularProgress } from "@mui/material";
import { useState, useRef, useCallback, useEffect } from "react";
import { ImageFaceLandmarkerService } from "../../../services/FaceLandmarkerService";
import { CANVAS_HEIGHT, CANVAS_WIDTH, ThreeJsService } from "../../../services/ThreeJsService";
import { analyzeFaceShape, type FaceAnalysisResult } from "../../../services/FaceShapeAnalyzer";
import { AgeDetectionService, type AgeGenderResult } from "../../../services/AgeDetectionService";
import { T, type TextureVariant } from "./TryOnTypes";
import { analyzeFengShui, type FengShuiResult } from "@/services/FengShuiAnalyzer";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "done" | "no_face" | "error";
type LoadingStep =
    | null
    | "init_engine"
    | "init_three"
    | "load_model"
    | "load_texture"
    | "detect_face"
    | "detect_age";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageTryOnProps {
    frameGroupId: string;
    activeTexture: TextureVariant | null;
    isTryOn: boolean; // true = skip face analysis; false = skip Three.js/glasses
    onAnalysisReady: (result: FaceAnalysisResult) => void;
    onFengShuiReady: (result: FengShuiResult) => void;
    onAgeReady: (result: AgeGenderResult) => void;
    reloadSignal: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ImageTryOn = ({
    frameGroupId,
    activeTexture,
    isTryOn,
    onAnalysisReady,
    onFengShuiReady,
    onAgeReady,
    reloadSignal,
}: ImageTryOnProps) => {
    const [status, setStatus] = useState<Status>("idle");
    const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
    const [dragging, setDragging] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const faceEngineRef = useRef<ImageFaceLandmarkerService | null>(null);
    const threeRef = useRef<ThreeJsService | null>(null);
    const ageServiceRef = useRef<AgeDetectionService | null>(null);
    const prevUrlRef = useRef<string | null>(null);

    // ── Init age service (chỉ khi recommend mode) ──
    useEffect(() => {
        if (isTryOn) return;
        const ageSvc = new AgeDetectionService();
        ageServiceRef.current = ageSvc;
        ageSvc.loadModels().catch(console.error);
    }, [isTryOn]);

    // ── Reload signal → reset to idle ──
    useEffect(() => {
        if (reloadSignal === 0) return;
        setStatus("idle");
        setLoadingStep(null);
        if (prevUrlRef.current) {
            URL.revokeObjectURL(prevUrlRef.current);
            prevUrlRef.current = null;
        }
    }, [reloadSignal]);

    // ── Update texture dynamically (chỉ khi try-on mode) ──
    useEffect(() => {
        if (!isTryOn) return;
        const updateTexture = async () => {
            const three = threeRef.current;
            if (!three || !three.glassesObj || !activeTexture?.url || status !== "done") return;

            try {
                setLoadingStep("load_texture");
                await three.applyTextureFromUrl(three.glassesObj, activeTexture.url);
                three.renderOnce?.();
            } catch (err) {
                console.error("Failed to update texture:", err);
            } finally {
                setLoadingStep(null);
            }
        };
        updateTexture();
    }, [activeTexture, status, isTryOn]);

    // ── Process uploaded image ──
    const processImage = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) return;

        setStatus("loading");
        setLoadingStep("init_engine");

        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        const url = URL.createObjectURL(file);
        prevUrlRef.current = url;

        try {
            const img = new Image();
            img.src = url;
            await new Promise<void>((res, rej) => {
                img.onload = () => res();
                img.onerror = () => rej(new Error("Image load failed"));
            });

            const canvas = canvasRef.current;

            if (!canvas) return;

            // ── 1. Init AI engine ──
            if (!faceEngineRef.current) {
                const engine = new ImageFaceLandmarkerService();
                await engine.initializeEngine();
                faceEngineRef.current = engine;
            }

            if (isTryOn) {
                // ════════════════════════════════════════════
                // TRY-ON MODE: Three.js + glasses, skip analysis
                // ════════════════════════════════════════════

                // ── 2. Init Three.js scene ──
                setLoadingStep("init_three");
                const threeService = new ThreeJsService();
                threeRef.current = threeService;
                await threeService.initializeWithImage(img, canvas, frameGroupId);

                if (threeService.glassesObj && threeService.faceObj) {
                    faceEngineRef.current.setThreeObjects(threeService.glassesObj, threeService.faceObj);
                }

                // ── 3. Load texture ──
                if (activeTexture?.url && threeService.glassesObj) {
                    setLoadingStep("load_texture");
                    try {
                        await threeService.applyTextureFromUrl(threeService.glassesObj, activeTexture.url);
                    } catch (e) {
                        console.warn("Texture load failed, using default.");
                    }
                }

                // ── 4. Detect landmarks (for glasses positioning only) ──
                setLoadingStep("detect_face");
                const { found } = await faceEngineRef.current.detectAndApply(img, true);

                threeService.renderOnce();
                setStatus(found ? "done" : "no_face");

            } else {
                // ════════════════════════════════════════════
                // RECOMMEND MODE: face analysis only, skip Three.js
                // ════════════════════════════════════════════

                // ── 2. Vẽ ảnh lên canvas để user thấy ──

                const dpr = Math.min(window.devicePixelRatio || 1, 2);

                const vw = img.naturalWidth;
                const vh = img.naturalHeight;

                // 👇 size hiển thị (CSS)
                const displayWidth = CANVAS_WIDTH;
                const displayHeight = CANVAS_HEIGHT;

                // 👇 set resolution thật (quan trọng)
                canvas.width = displayWidth * dpr;
                canvas.height = displayHeight * dpr;

                // 👇 giữ size hiển thị
                canvas.style.width = displayWidth + "px";
                canvas.style.height = displayHeight + "px";

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                // 👇 scale context theo DPR
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                // ===== FIT IMAGE =====
                const imgRatio = vw / vh;
                const canvasRatio = displayWidth / displayHeight;

                let drawWidth: number;
                let drawHeight: number;

                if (imgRatio > canvasRatio) {
                    // ảnh rộng hơn
                    drawWidth = displayWidth;
                    drawHeight = displayWidth / imgRatio;
                } else {
                    // ảnh cao hơn (portrait)
                    drawHeight = displayHeight;
                    drawWidth = displayHeight * imgRatio;
                }

                // ===== CENTER =====
                const offsetX = (displayWidth - drawWidth) / 2;
                const offsetY = (displayHeight - drawHeight) / 2;

                // ===== DRAW =====
                ctx.clearRect(0, 0, displayWidth, displayHeight);
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                // ── 3. Detect landmarks ──
                // Không gọi setThreeObjects nên detectAndApply chỉ detect, không drive glasses
                setLoadingStep("detect_face");
                const { found, landmarks } = await faceEngineRef.current.detectAndApply(img, false);

                if (found && landmarks) {
                    const result = analyzeFaceShape(landmarks, img.naturalWidth, img.naturalHeight);
                    onAnalysisReady(result);

                    const fengShui = analyzeFengShui(
                        landmarks,
                        img.naturalWidth,
                        img.naturalHeight,
                        result.shape,
                        result.measurements
                    );
                    onFengShuiReady(fengShui);

                    // ── 3. Age detection ──
                    setLoadingStep("detect_age");
                    const ageSvc = ageServiceRef.current;
                    if (ageSvc) {
                        const ageRes = await ageSvc.detectFromImage(img);
                        if (ageRes) onAgeReady(ageRes);
                    }

                    console.log("Result: ", result)
                }

                setStatus(found ? "done" : "no_face");
            }

            setLoadingStep(null);
        } catch (err) {
            console.error("Processing error:", err);
            setStatus("error");
            setLoadingStep(null);
        }
    }, [onAnalysisReady, onFengShuiReady, onAgeReady, frameGroupId, activeTexture, isTryOn]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processImage(file);
        e.target.value = "";
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processImage(file);
    };

    const showDropZone = status === "idle";
    const showProcessing = status === "loading";

    return (
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Drop zone */}
            {showDropZone && (
                <Box
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    sx={{
                        position: "absolute", inset: 0,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 1.5, cursor: "pointer",
                        border: `2px dashed ${dragging ? T.teal : T.overlayBorder}`,
                        bgcolor: dragging ? "rgba(0,100,112,0.12)" : "transparent",
                        transition: "all 0.2s",
                        "&:hover": {
                            borderColor: T.teal,
                            bgcolor: "rgba(0,100,112,0.08)",
                        },
                    }}
                >
                    <Box sx={{
                        width: 56, height: 56, borderRadius: "50%",
                        border: `1.5px solid ${dragging ? T.teal : T.overlayBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: dragging ? T.teal : T.overlayTextMuted,
                        transition: "all 0.2s",
                    }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </Box>
                    <Typography sx={{ fontFamily: T.fontSans, color: T.overlayText, fontSize: "0.9rem", fontWeight: 500 }}>
                        Drop photo here
                    </Typography>
                    <Typography sx={{ fontFamily: T.fontSans, color: T.overlayTextMuted, fontSize: "0.76rem" }}>
                        or click to upload · JPG, PNG, WEBP
                    </Typography>
                </Box>
            )}

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    margin: '0 auto',
                    display: showDropZone ? "none" : "block",
                    width: "100%", height: "100%", objectFit: "cover",
                }}
            />

            {/* Processing overlay */}
            {showProcessing && (
                <Box sx={{
                    position: "absolute", inset: 0,
                    bgcolor: "rgba(13,26,28,0.75)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 2,
                }}>
                    <CircularProgress size={38} sx={{ color: T.teal }} />
                    <Typography sx={{ fontFamily: T.fontSans, color: T.overlayTextMuted, fontSize: "0.82rem" }}>
                        {loadingStep === "init_engine" && "Loading AI engine…"}
                        {loadingStep === "init_three" && "Initializing 3D scene…"}
                        {loadingStep === "load_model" && "Loading 3D model…"}
                        {loadingStep === "load_texture" && "Applying texture…"}
                        {loadingStep === "detect_face" && "Detecting landmarks…"}
                        {loadingStep === "detect_age" && "Analyzing age…"}
                    </Typography>
                </Box>
            )}

            {/* Status pill */}
            {(status === "no_face" || status === "error") && (
                <Box sx={{
                    position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)",
                    bgcolor: T.overlayBg, border: `1px solid ${T.overlayBorder}`,
                    borderRadius: "20px", px: 2, py: 0.7,
                    display: "flex", alignItems: "center", gap: 0.8, whiteSpace: "nowrap",
                }}>
                    <Box sx={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        bgcolor: status === "no_face" ? "#f59e0b" : "#ef4444",
                    }} />
                    <Typography sx={{ fontFamily: T.fontSans, fontSize: "0.75rem", color: status === "no_face" ? "#fbbf24" : "#f87171" }}>
                        {status === "no_face" ? "No face detected" : "Something went wrong"}
                    </Typography>
                </Box>
            )}

            {/* Download button — chỉ hiện khi try-on mode */}
            {status === "done" && isTryOn && (
                <Box
                    component="button"
                    onClick={() => {
                        const c = canvasRef.current;
                        if (!c) return;
                        const a = document.createElement("a");
                        a.download = "tryon-result.png";
                        a.href = c.toDataURL("image/png");
                        a.click();
                    }}
                    sx={{
                        position: "absolute", top: 56, right: 14,
                        border: "none", borderRadius: "20px",
                        bgcolor: T.teal, color: "#fff",
                        fontFamily: T.fontSans, fontWeight: 600, fontSize: "0.72rem",
                        px: 1.8, py: 0.6, cursor: "pointer",
                        "&:hover": { bgcolor: "#005560" },
                        display: "flex", alignItems: "center", gap: 0.6,
                    }}
                >
                    Download
                </Box>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
        </Box>
    );
};

export default ImageTryOn;