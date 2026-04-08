import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { FaceLandmarkerService } from "../../../services/FaceLandmarkerService";
import { ThreeJsService } from "../../../services/ThreeJsService";
import { analyzeFaceShape, type FaceAnalysisResult } from "../../../services/FaceShapeAnalyzer";
import { AgeDetectionService, type AgeGenderResult } from "../../../services/AgeDetectionService";
import { T, type TextureVariant } from "./TryOnTypes";

type Status = "idle" | "loading" | "done" | "error";
type LoadingStep =
    | null
    | "init_engine"
    | "init_three"
    | "load_texture"
    | "detect_face"
    | "detect_age";

interface VideoTryOnProps {
    frameGroupId: string;
    activeTexture: TextureVariant | null;
    isTryOn: boolean; // true = skip face analysis; false = skip Three.js/glasses
    onAnalysisReady: (result: FaceAnalysisResult) => void;
    onAgeReady: (result: AgeGenderResult) => void;
    onReload: () => void;
}

const VideoTryOn = ({
    frameGroupId,
    activeTexture,
    isTryOn,
    onAnalysisReady,
    onAgeReady,
    onReload,
}: VideoTryOnProps) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const faceEngineRef = useRef<FaceLandmarkerService | null>(null);
    const threeRef = useRef<ThreeJsService | null>(null);
    const ageServiceRef = useRef<AgeDetectionService | null>(null);

    const hasAnalyzedRef = useRef(false);
    const ageThrottleRef = useRef(0);
    const AGE_INTERVAL_MS = 4000;

    const [status, setStatus] = useState<Status>("idle");
    const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);

    // ── Age detection throttled (chỉ khi recommend mode) ──
    const detectAge = useCallback(async (video: HTMLVideoElement) => {
        if (isTryOn) return;
        const now = performance.now();
        if (now - ageThrottleRef.current < AGE_INTERVAL_MS) return;
        ageThrottleRef.current = now;
        const svc = ageServiceRef.current;
        if (!svc) return;
        const result = await svc.detectFromVideo(video);
        if (result) onAgeReady(result);
    }, [onAgeReady, isTryOn]);

    // ── Init ──
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            setStatus("loading");
            setLoadingStep("init_engine");

            const video = webcamRef.current?.video;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            try {
                // ── Chờ video sẵn sàng ──
                await new Promise<void>((resolve) => {
                    if (video.readyState >= 2) return resolve();
                    video.onloadeddata = () => resolve();
                });
                if (cancelled) return;

                // ── Face engine (luôn cần để positioning glasses hoặc analysis) ──
                const faceEngine = new FaceLandmarkerService();
                faceEngineRef.current = faceEngine;

                if (isTryOn) {
                    // ════════════════════════════════════════════
                    // TRY-ON MODE: Three.js + glasses, skip analysis
                    // ════════════════════════════════════════════

                    const threeJsService = new ThreeJsService();
                    threeRef.current = threeJsService;

                    // ── Init ThreeJS ──
                    setLoadingStep("init_three");
                    await threeJsService.initalizeThreeJs(video, canvas, frameGroupId);

                    // ── Apply initial texture ──
                    if (activeTexture?.url && threeJsService.glassesObj) {
                        setLoadingStep("load_texture");
                        await threeJsService.applyTextureFromUrl(threeJsService.glassesObj, activeTexture.url).catch(console.error);
                    }

                    // ── Init Face Engine ──
                    setLoadingStep("init_engine");
                    await faceEngine.initializeEngine();
                    if (threeJsService.glassesObj && threeJsService.faceObj) {
                        faceEngine.setThreeObjects(threeJsService.glassesObj, threeJsService.faceObj);
                    }

                    // Landmark callback: chỉ dùng để drive glasses, skip analysis
                    faceEngine.onLandmarksDetected = () => {
                        // no-op: Three.js handles rendering internally
                    };

                } else {
                    // ════════════════════════════════════════════
                    // RECOMMEND MODE: face analysis only, skip Three.js
                    // ════════════════════════════════════════════

                    const threeJsService = new ThreeJsService();
                    threeRef.current = threeJsService;

                    // ── Init ThreeJS ──
                    setLoadingStep("init_three");
                    await threeJsService.initalizeThreeJs(video, canvas, frameGroupId, false);

                    // Age service — load in background
                    const ageSvc = new AgeDetectionService();
                    ageServiceRef.current = ageSvc;
                    ageSvc.loadModels().catch(console.error);

                    // ── Init Face Engine ──
                    setLoadingStep("init_engine");
                    await faceEngine.initializeEngine();

                    hasAnalyzedRef.current = false;

                    faceEngine.onLandmarksDetected = (landmarks, width, height) => {
                        console.log(landmarks, width, height)
                        setLoadingStep("detect_face");
                        detectAge(video);

                        if (hasAnalyzedRef.current) return;
                        hasAnalyzedRef.current = true;

                        const result = analyzeFaceShape(landmarks, width, height);
                        onAnalysisReady(result);
                        setLoadingStep("detect_age");
                    };
                }

                faceEngine.scheduleNextPrediction(video);
                setStatus("done");
                setLoadingStep(null);

            } catch (err) {
                console.error("VideoTryOn init error:", err);
                setStatus("error");
                setLoadingStep(null);
            }
        };

        init();

        return () => {
            cancelled = true;
        };
    }, [activeTexture, isTryOn]);

    // ── Update texture dynamically (chỉ khi try-on mode) ──
    useEffect(() => {
        if (!isTryOn) return;
        const updateTexture = async () => {
            const three = threeRef.current;
            if (!three || !three.glassesObj || !activeTexture?.url) return;

            try {
                setLoadingStep("load_texture");
                await three.applyTextureFromUrl(three.glassesObj, activeTexture.url);
                setLoadingStep(null);
            } catch (err) {
                console.error("Failed to update video texture:", err);
            }
        };

        updateTexture();
    }, [activeTexture, isTryOn]);

    // ── Reload ──
    const handleReload = useCallback(() => {
        hasAnalyzedRef.current = false;
        ageThrottleRef.current = 0;
        const video = webcamRef.current?.video;
        if (video && faceEngineRef.current) {
            faceEngineRef.current.scheduleNextPrediction(video);
        }
        onReload();
    }, [onReload]);

    return (
        <Box sx={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", bgcolor: "#000" }}>
            <Webcam
                ref={webcamRef}
                mirrored={false}
                audio={false}
                videoConstraints={{ facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }}
                style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity: 0, pointerEvents: "none" }}
            />

            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />

            {/* ── Loading Overlay ── */}
            {status === "loading" && (
                <Box sx={{
                    position: "absolute", inset: 0, bgcolor: "rgba(13,26,28,0.75)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                }}>
                    <CircularProgress size={38} sx={{ color: T.teal }} />
                    <Typography sx={{ fontFamily: T.fontSans, color: T.overlayTextMuted, fontSize: "0.82rem" }}>
                        {loadingStep === "init_engine" && "Loading AI engine…"}
                        {loadingStep === "init_three" && "Initializing 3D scene…"}
                        {loadingStep === "load_texture" && "Applying texture…"}
                        {loadingStep === "detect_face" && "Detecting landmarks…"}
                        {loadingStep === "detect_age" && "Analyzing age…"}
                        {!loadingStep && "Loading…"}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default VideoTryOn;