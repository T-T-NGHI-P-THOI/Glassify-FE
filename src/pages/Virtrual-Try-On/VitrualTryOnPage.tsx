import { Box, Paper, Typography } from "@mui/material";
import Webcam from "react-webcam";
import { useEffect, useRef, useState } from "react";
import { FaceLandmarkerService } from "@/services/FaceLandmarkerService";
import { ThreeJsService } from "@/services/ThreeJsService";
import { analyzeFaceShape, type FaceAnalysisResult } from "@/services/FaceShapeAnalyzer";
import { FaceShapeSuggestionPanel } from "./FaceShapeSuggestionPanel";

const VirtualTryOnPage = () => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [analysisResult, setAnalysisResult] = useState<FaceAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Throttle analysis — run at most once every 3 seconds
    // const lastAnalysisRef = useRef(0);
    const faceEngineRef = useRef<FaceLandmarkerService | null>(null);
    const hasAnalyzedRef = useRef(false);

    useEffect(() => {
        const init = async () => {
            const video = webcamRef.current?.video;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            const faceEngine = new FaceLandmarkerService();
            faceEngineRef.current = faceEngine;
            const threeJsService = new ThreeJsService();

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => resolve();
            });

            await threeJsService.initalizeThreeJs(video, canvas);
            await faceEngine.initializeEngine();

            faceEngine.setThreeObjects(
                threeJsService.glassesObj!,
                threeJsService.faceObj!
            );

            // Hook into landmark results for face analysis
            faceEngine.onLandmarksDetected = (landmarks, width, height) => {
                if (hasAnalyzedRef.current) return;  // ← chặn sau lần đầu
                hasAnalyzedRef.current = true;

                setIsAnalyzing(true);
                setTimeout(() => {
                    const result = analyzeFaceShape(landmarks, width, height);
                    setAnalysisResult(result);
                    setIsAnalyzing(false);
                }, 0);
            };

            faceEngine.scheduleNextPrediction(video);
        };

        init();
    }, []);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#0a0a0f",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                py: 6,
                px: 2,
                position: "relative",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,140,80,0.10) 0%, transparent 70%)",
                    pointerEvents: "none",
                },
            }}
        >
            {/* Title */}
            <Box sx={{ textAlign: "center", mb: 4, zIndex: 1 }}>
                <Typography sx={{
                    fontSize: { xs: "2rem", md: "2.8rem" },
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700, letterSpacing: "0.04em",
                    color: "#f0e6c8", lineHeight: 1.1,
                }}>
                    Live Try-On
                </Typography>
                <Typography sx={{
                    mt: 1, fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9rem", color: "rgba(240,230,200,0.4)",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                    Webcam · Real-time glasses overlay
                </Typography>
            </Box>

            {/* Camera canvas */}
            <Box sx={{ position: "relative", zIndex: 1 }}>
                <Webcam
                    ref={webcamRef}
                    mirrored={false}
                    audio={false}
                    style={{ width: 640, height: 480, opacity: 0, position: "absolute" }}
                />
                <canvas
                    ref={canvasRef}
                    style={{
                        width: 640,
                        borderRadius: 12,
                        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                        display: "block",
                    }}
                />
            </Box>

            {/* Face shape suggestion panel */}
            <Box sx={{ zIndex: 1, width: "100%", maxWidth: 640, display: "flex", justifyContent: "center" }}>
                <FaceShapeSuggestionPanel result={analysisResult} isAnalyzing={isAnalyzing} />
            </Box>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
            `}</style>
        </Box>
    );
};

export default VirtualTryOnPage;