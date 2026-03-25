import { Box, Typography, CircularProgress } from "@mui/material";
import { useState, useRef, useCallback, useEffect } from "react";
import { ImageFaceLandmarkerService } from "../../../services/FaceLandmarkerService";
import { ThreeJsService } from "../../../services/ThreeJsService";
import { analyzeFaceShape, type FaceAnalysisResult } from "../../../services/FaceShapeAnalyzer";
import { AgeDetectionService, type AgeGenderResult } from "../../../services/AgeDetectionService";
import { T, type TextureVariant } from "./TryOnTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "done" | "no_face" | "error";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageTryOnProps {
    frameGroupId: string;
    activeTexture: TextureVariant | null;
    onAnalysisReady: (result: FaceAnalysisResult) => void;
    onAgeReady: (result: AgeGenderResult) => void;
    reloadSignal: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ImageTryOn = ({ frameGroupId, activeTexture, onAnalysisReady, onAgeReady, reloadSignal }: ImageTryOnProps) => {
    const [status, setStatus] = useState<Status>("idle");
    const [dragging, setDragging] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const faceEngineRef = useRef<ImageFaceLandmarkerService | null>(null);
    const threeRef = useRef<ThreeJsService | null>(null);
    const ageServiceRef = useRef<AgeDetectionService | null>(null);
    const prevUrlRef = useRef<string | null>(null);

    // ── Init age service ──
    useEffect(() => {
        const ageSvc = new AgeDetectionService();
        ageServiceRef.current = ageSvc;
        ageSvc.loadModels().catch(console.error);
    }, []);

    // ── Reload signal → reset to idle ──
    useEffect(() => {
        if (reloadSignal === 0) return;
        setStatus("idle");
        if (prevUrlRef.current) {
            URL.revokeObjectURL(prevUrlRef.current);
            prevUrlRef.current = null;
        }
        const canvas = canvasRef.current;
    }, [reloadSignal]);

    // ── Apply texture when changed ──
    useEffect(() => {
        if (!activeTexture || !threeRef.current) return;
        const three = threeRef.current;
        if (typeof (three as any).applyTexture === "function") {
            (three as any).applyTexture(activeTexture.texturePath);
        }
        if (typeof three.renderOnce === "function") {
            three.renderOnce();
        }
    }, [activeTexture]);

    // ── Process uploaded image ──
    const processImage = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) return;

        setStatus("loading");
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

            if (!faceEngineRef.current) {
                const engine = new ImageFaceLandmarkerService();
                await engine.initializeEngine();
                faceEngineRef.current = engine;
            }

            const threeService = new ThreeJsService();
            threeRef.current = threeService;
            await threeService.initializeWithImage(img, canvas, frameGroupId);
            faceEngineRef.current.setThreeObjects(threeService.glassesObj!, threeService.faceObj!);

            const { found, landmarks } = await faceEngineRef.current.detectAndApply(img);
            threeService.renderOnce();

            if (found && landmarks) {
                const result = analyzeFaceShape(landmarks, img.naturalWidth, img.naturalHeight);
                onAnalysisReady(result);

                const ageSvc = ageServiceRef.current;
                if (ageSvc) {
                    const ageRes = await ageSvc.detectFromImage(img);
                    if (ageRes) onAgeReady(ageRes);
                }
            }

            setStatus(found ? "done" : "no_face");
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    }, [onAnalysisReady, onAgeReady]);

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

            {/* ── Drop zone ── */}
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
                    {/* Icon circle */}
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

                    <Typography sx={{
                        fontFamily: T.fontSans,
                        color: T.overlayText,
                        fontSize: "0.9rem", fontWeight: 500,
                    }}>
                        Drop photo here
                    </Typography>
                    <Typography sx={{
                        fontFamily: T.fontSans,
                        color: T.overlayTextMuted,
                        fontSize: "0.76rem",
                    }}>
                        or click to upload · JPG, PNG, WEBP
                    </Typography>
                </Box>
            )}

            {/* ── Result canvas ── */}
            <canvas
                ref={canvasRef}
                style={{
                    display: showDropZone ? "none" : "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                }}
            />

            {/* ── Processing overlay ── */}
            {showProcessing && (
                <Box sx={{
                    position: "absolute", inset: 0,
                    bgcolor: "rgba(13,26,28,0.75)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 2,
                }}>
                    <CircularProgress size={38} sx={{ color: T.teal }} />
                    <Typography sx={{
                        fontFamily: T.fontSans,
                        color: T.overlayTextMuted,
                        fontSize: "0.82rem", letterSpacing: "0.04em",
                    }}>
                        Detecting face…
                    </Typography>
                </Box>
            )}

            {/* ── Status pill — sits below topbar (top: 56) ── */}
            {(status === "no_face" || status === "error") && (
                <Box sx={{
                    position: "absolute", top: 56, left: "50%",
                    transform: "translateX(-50%)",
                    bgcolor: T.overlayBg,
                    border: `1px solid ${T.overlayBorder}`,
                    borderRadius: "20px", px: 2, py: 0.7,
                    display: "flex", alignItems: "center", gap: 0.8,
                    whiteSpace: "nowrap",
                }}>
                    <Box sx={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        bgcolor: status === "no_face" ? "#f59e0b" : "#ef4444",
                    }} />
                    <Typography sx={{
                        fontFamily: T.fontSans, fontSize: "0.75rem",
                        color: status === "no_face" ? "#fbbf24" : "#f87171",
                    }}>
                        {status === "no_face"
                            ? "No face detected — try a clearer, front-facing photo"
                            : "Something went wrong — please try again"}
                    </Typography>
                </Box>
            )}

            {/* ── Download button — sits below topbar (top: 56) ── */}
            {status === "done" && (
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
                        border: "none", borderRadius: "50%",
                        bgcolor: T.teal, color: "#fff",
                        fontFamily: T.fontSans, fontWeight: 600, fontSize: "0.72rem",
                        px: 1.8, py: 0.6, cursor: "pointer",
                        transition: "background 0.2s",
                        "&:hover": { bgcolor: "#005560" },
                        display: "flex", alignItems: "center", gap: 0.6,
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </Box>
            )}

            {/* ── Hidden file input ── */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onFileChange}
            />
        </Box>
    );
};

export default ImageTryOn;