import { Box, Typography, CircularProgress } from "@mui/material";
import { useEffect, useRef, useState, useCallback } from "react";
import { ImageFaceLandmarkerService } from "@/services/FaceLandmarkerService";
import { ThreeJsService } from "@/services/ThreeJsService";
import { analyzeFaceShape, type FaceAnalysisResult } from "@/services/FaceShapeAnalyzer";
import { AgeDetectionService, type AgeGenderResult } from "@/services/AgeDetectionService";
import { FaceShapeSuggestionPanel } from "./FaceShapeSuggestionPanel";
import { AgeGenderBadge } from "./AgeGenderBadge";
import GlassesTryOnPopup from "./GlassesTryOn/GlassesTryOnPopup";

type Status = "idle" | "initializing" | "loading" | "done" | "no_face" | "error";

const ImageTryOnPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [status, setStatus] = useState<Status>("initializing");
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<FaceAnalysisResult | null>(null);
    const [ageResult, setAgeResult] = useState<AgeGenderResult | null>(null);
    const [isDetectingAge, setIsDetectingAge] = useState(false);

    const faceEngineRef = useRef<ImageFaceLandmarkerService | null>(null);
    const ageServiceRef = useRef<AgeDetectionService | null>(null);
    const prevUrlRef = useRef<string | null>(null);

    useEffect(() => {
        const engine = new ImageFaceLandmarkerService();
        faceEngineRef.current = engine;

        const ageSvc = new AgeDetectionService();
        ageServiceRef.current = ageSvc;

        // Init both engines in parallel
        Promise.all([
            engine.initializeEngine(),
            ageSvc.loadModels(),
        ])
            .then(() => setStatus("idle"))
            .catch(() => setStatus("error"));
    }, []);

    const processImage = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        if (!faceEngineRef.current) return;

        setStatus("loading");
        setAnalysisResult(null);
        setAgeResult(null);

        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        const url = URL.createObjectURL(file);
        prevUrlRef.current = url;
        setPreview(url);

        try {
            const img = new Image();
            img.src = url;
            await new Promise<void>((res, rej) => {
                img.onload = () => res();
                img.onerror = () => rej(new Error("Image load failed"));
            });

            const canvas = canvasRef.current!;
            const threeService = new ThreeJsService();
            await threeService.initializeWithImage(img, canvas);

            faceEngineRef.current!.setThreeObjects(
                threeService.glassesObj!,
                threeService.faceObj!
            );

            const { found, landmarks } = await faceEngineRef.current!.detectAndApply(img);
            threeService.renderOnce();

            if (found && landmarks) {
                const result = analyzeFaceShape(landmarks, img.naturalWidth, img.naturalHeight);
                setAnalysisResult(result);

                // Age detection (run after face found)
                setIsDetectingAge(true);
                const ageSvc = ageServiceRef.current;
                if (ageSvc) {
                    const ageRes = await ageSvc.detectFromImage(img);
                    if (ageRes) setAgeResult(ageRes);
                }
                setIsDetectingAge(false);
            }

            setStatus(found ? "done" : "no_face");
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    }, []);

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

    const openPicker = () => {
        if (status !== "initializing") fileInputRef.current?.click();
    };

    const isProcessing = status === "loading" || status === "initializing";

    return (
        <Box sx={{
            minHeight: "100vh", bgcolor: "#0a0a0f",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-start",
            px: 2, py: 6, position: "relative", overflow: "hidden",
            "&::before": {
                content: '""', position: "absolute", inset: 0,
                background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,140,80,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
            },
        }}>
            <Box sx={{ textAlign: "center", mb: 5, zIndex: 1 }}>
                <Typography sx={{
                    fontSize: { xs: "2rem", md: "3rem" }, fontFamily: "'Playfair Display', serif",
                    fontWeight: 700, letterSpacing: "0.04em", color: "#f0e6c8", lineHeight: 1.1,
                }}>Virtual Try-On</Typography>
                <Typography sx={{
                    mt: 1.5, fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem",
                    color: "rgba(240,230,200,0.45)", letterSpacing: "0.12em", textTransform: "uppercase",
                }}>Upload a photo · See glasses on you</Typography>
            </Box>

            <Box sx={{ position: "relative", width: { xs: "100%", sm: 640 }, maxWidth: 640, zIndex: 1 }}>
                {!preview && (
                    <Box
                        onClick={openPicker} onDrop={onDrop}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        sx={{
                            border: `2px dashed ${dragging ? "#c9a84c" : "rgba(201,168,76,0.35)"}`,
                            borderRadius: "16px", height: 380,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            cursor: status === "initializing" ? "wait" : "pointer",
                            transition: "all 0.25s ease",
                            bgcolor: dragging ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.02)",
                            "&:hover": { borderColor: "#c9a84c", bgcolor: "rgba(201,168,76,0.06)" },
                        }}
                    >
                        {status === "initializing" ? (
                            <>
                                <CircularProgress size={36} sx={{ color: "#c9a84c", mb: 2 }} />
                                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(240,230,200,0.5)", fontSize: "0.85rem" }}>
                                    Loading AI model…
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Box sx={{ width: 64, height: 64, borderRadius: "50%", border: "1.5px solid rgba(201,168,76,0.5)", display: "flex", alignItems: "center", justifyContent: "center", mb: 3, color: "#c9a84c" }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </Box>
                                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "#f0e6c8", fontWeight: 500, fontSize: "1rem", mb: 0.5 }}>
                                    Drop your photo here
                                </Typography>
                                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(240,230,200,0.4)", fontSize: "0.82rem" }}>
                                    or click to browse — JPG, PNG, WEBP
                                </Typography>
                            </>
                        )}
                    </Box>
                )}

                <canvas ref={canvasRef} style={{ display: preview ? "block" : "none", width: "100%", borderRadius: 12, boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }} />

                {isProcessing && preview && (
                    <Box sx={{ position: "absolute", inset: 0, borderRadius: "16px", bgcolor: "rgba(10,10,15,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, backdropFilter: "blur(6px)" }}>
                        <CircularProgress size={40} sx={{ color: "#c9a84c" }} />
                        <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(240,230,200,0.7)", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
                            Detecting face…
                        </Typography>
                    </Box>
                )}

                {status === "no_face" && <Box sx={{ textAlign: "center", mt: 2 }}><Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "#ffb74d", fontSize: "0.9rem" }}>No face detected. Try a clearer, front-facing photo.</Typography></Box>}
                {status === "error" && <Box sx={{ textAlign: "center", mt: 2 }}><Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "#e57373", fontSize: "0.9rem" }}>Something went wrong. Please try again.</Typography></Box>}
            </Box>

            <Box sx={{ mt: 4, display: "flex", gap: 2, zIndex: 1, flexWrap: "wrap", justifyContent: "center" }}>
                <Box component="button" onClick={openPicker} disabled={isProcessing}
                    sx={{ px: 3.5, py: 1.25, border: "1.5px solid rgba(201,168,76,0.6)", borderRadius: "8px", bgcolor: "transparent", color: "#c9a84c", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", letterSpacing: "0.08em", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1, transition: "all 0.2s", "&:hover:not(:disabled)": { bgcolor: "rgba(201,168,76,0.1)", borderColor: "#c9a84c" } }}>
                    {preview ? "Change Photo" : "Choose Photo"}
                </Box>
                {status === "done" && (
                    <Box component="button"
                        onClick={() => { const c = canvasRef.current; if (!c) return; const l = document.createElement("a"); l.download = "virtual-tryon.png"; l.href = c.toDataURL("image/png"); l.click(); }}
                        sx={{ px: 3.5, py: 1.25, border: "none", borderRadius: "8px", bgcolor: "#c9a84c", color: "#0a0a0f", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.88rem", letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s", "&:hover": { bgcolor: "#e0bf6a" } }}>
                        Download Result
                    </Box>
                )}
            </Box>

            {/* Age / Gender result strip */}
            {(ageResult || isDetectingAge) && (
                <Box sx={{
                    zIndex: 1, width: "100%", maxWidth: 640,
                    mt: 2,
                    px: 3, py: 2,
                    border: "1px solid rgba(201,168,76,0.18)",
                    borderRadius: "12px",
                    bgcolor: "rgba(255,255,255,0.025)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", gap: 2,
                }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: "50%",
                        border: "1px solid rgba(201,168,76,0.35)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#c9a84c", flexShrink: 0,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.68rem", textTransform: "uppercase",
                            letterSpacing: "0.14em", color: "rgba(240,230,200,0.35)", mb: 0.5,
                        }}>
                            Age & Gender Detection
                        </Typography>
                        <AgeGenderBadge result={ageResult} isDetecting={isDetectingAge} />
                    </Box>
                </Box>
            )}

            <Box sx={{ zIndex: 1, width: "100%", maxWidth: 640 }}>
                <FaceShapeSuggestionPanel result={analysisResult} />
            </Box>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
        </Box>
    );
};

export default ImageTryOnPage;