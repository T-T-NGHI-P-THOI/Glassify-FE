import { Box, Typography, CircularProgress } from "@mui/material";
import { useEffect, useRef, useState, useCallback } from "react";
import { ImageFaceLandmarkerService } from "@/services/FaceLandmarkerService";
import { ThreeJsService } from "@/services/ThreeJsService";

type Status = "idle" | "initializing" | "loading" | "done" | "no_face" | "error";

const ImageTryOnPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [status, setStatus] = useState<Status>("initializing");
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const faceEngineRef = useRef<ImageFaceLandmarkerService | null>(null);
    const prevUrlRef = useRef<string | null>(null);

    // ── Init IMAGE-mode engine once on mount ──────────────────────────────
    useEffect(() => {
        const engine = new ImageFaceLandmarkerService();
        faceEngineRef.current = engine;

        engine.initializeEngine()
            .then(() => setStatus("idle"))
            .catch((err) => {
                console.error("Engine init failed:", err);
                setStatus("error");
            });
    }, []);

    // ── Process a static image file ───────────────────────────────────────
    const processImage = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        if (!faceEngineRef.current) return;

        setStatus("loading");

        // Revoke previous blob URL
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        const url = URL.createObjectURL(file);
        prevUrlRef.current = url;
        setPreview(url);

        try {
            // 1. Load HTMLImageElement
            const img = new Image();
            img.src = url;
            await new Promise<void>((res, rej) => {
                img.onload = () => res();
                img.onerror = () => rej(new Error("Image load failed"));
            });

            // 2. Init Three.js with the static image as background
            const canvas = canvasRef.current!;
            const threeService = new ThreeJsService();

            // initializeWithImage uses TextureLoader — no fake video needed
            await threeService.initializeWithImage(img, canvas);

            // 3. Wire the IMAGE-mode engine to the Three.js objects
            faceEngineRef.current!.setThreeObjects(
                threeService.glassesObj!,
                threeService.faceObj!
            );

            // 4. Single detectForImage call — places glasses in scene
            const found = await faceEngineRef.current!.detectAndApply(img);

            // 5. Render once to flush the updated scene to canvas
            threeService.renderOnce();

            setStatus(found ? "done" : "no_face");
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    }, []);

    // ── Event handlers ────────────────────────────────────────────────────
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

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#0a0a0f",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                py: 6,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,140,80,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                },
            }}
        >
            {/* Title */}
            <Box sx={{ textAlign: "center", mb: 5, zIndex: 1 }}>
                <Typography
                    sx={{
                        fontSize: { xs: "2rem", md: "3rem" },
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        color: "#f0e6c8",
                        lineHeight: 1.1,
                    }}
                >
                    Virtual Try-On
                </Typography>
                <Typography
                    sx={{
                        mt: 1.5,
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.95rem",
                        color: "rgba(240,230,200,0.45)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                    }}
                >
                    Upload a photo · See glasses on you
                </Typography>
            </Box>

            {/* Main area */}
            <Box sx={{ position: "relative", width: { xs: "100%", sm: 640 }, maxWidth: 640, zIndex: 1 }}>

                {/* Drop zone — shown before image is loaded */}
                {!preview && (
                    <Box
                        onClick={openPicker}
                        onDrop={onDrop}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        sx={{
                            border: `2px dashed ${dragging ? "#c9a84c" : "rgba(201,168,76,0.35)"}`,
                            borderRadius: "16px",
                            height: 380,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
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

                {/* Three.js canvas — image + glasses composited here */}
                <canvas
                    ref={canvasRef}
                    style={{
                        display: preview ? "block" : "none",
                        width: "100%",
                        borderRadius: 12,
                        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
                    }}
                />

                {/* Loading overlay */}
                {isProcessing && preview && (
                    <Box sx={{
                        position: "absolute", inset: 0, borderRadius: "16px",
                        bgcolor: "rgba(10,10,15,0.75)", display: "flex",
                        flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: 2, backdropFilter: "blur(6px)",
                    }}>
                        <CircularProgress size={40} sx={{ color: "#c9a84c" }} />
                        <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(240,230,200,0.7)", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
                            Detecting face…
                        </Typography>
                    </Box>
                )}

                {/* Status messages */}
                {status === "no_face" && (
                    <Box sx={{ textAlign: "center", mt: 2 }}>
                        <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "#ffb74d", fontSize: "0.9rem" }}>
                            No face detected. Try a clearer, front-facing photo.
                        </Typography>
                    </Box>
                )}
                {status === "error" && (
                    <Box sx={{ textAlign: "center", mt: 2 }}>
                        <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: "#e57373", fontSize: "0.9rem" }}>
                            Something went wrong. Please try again.
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Action buttons */}
            <Box sx={{ mt: 4, display: "flex", gap: 2, zIndex: 1, flexWrap: "wrap", justifyContent: "center" }}>
                <Box
                    component="button"
                    onClick={openPicker}
                    disabled={isProcessing}
                    sx={{
                        px: 3.5, py: 1.25,
                        border: "1.5px solid rgba(201,168,76,0.6)",
                        borderRadius: "8px", bgcolor: "transparent",
                        color: "#c9a84c", fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.88rem", letterSpacing: "0.08em",
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        opacity: isProcessing ? 0.5 : 1,
                        transition: "all 0.2s",
                        "&:hover:not(:disabled)": { bgcolor: "rgba(201,168,76,0.1)", borderColor: "#c9a84c" },
                    }}
                >
                    {preview ? "Change Photo" : "Choose Photo"}
                </Box>

                {status === "done" && (
                    <Box
                        component="button"
                        onClick={() => {
                            const canvas = canvasRef.current;
                            if (!canvas) return;
                            const link = document.createElement("a");
                            link.download = "virtual-tryon.png";
                            link.href = canvas.toDataURL("image/png");
                            link.click();
                        }}
                        sx={{
                            px: 3.5, py: 1.25, border: "none", borderRadius: "8px",
                            bgcolor: "#c9a84c", color: "#0a0a0f",
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                            fontSize: "0.88rem", letterSpacing: "0.08em",
                            cursor: "pointer", transition: "all 0.2s",
                            "&:hover": { bgcolor: "#e0bf6a" },
                        }}
                    >
                        Download Result
                    </Box>
                )}
            </Box>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
            `}</style>
        </Box>
    );
};

export default ImageTryOnPage;