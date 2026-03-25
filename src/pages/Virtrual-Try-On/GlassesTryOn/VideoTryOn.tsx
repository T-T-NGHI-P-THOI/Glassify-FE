import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { FaceLandmarkerService } from "@/services/FaceLandmarkerService";
import { ThreeJsService } from "@/services/ThreeJsService";
import { analyzeFaceShape, type FaceAnalysisResult } from "@/services/FaceShapeAnalyzer";
import { AgeDetectionService, type AgeGenderResult } from "@/services/AgeDetectionService";
import { T, type TextureVariant } from "./TryOnTypes";
import { frameGroup } from "three/src/nodes/TSL.js";

// ─── Props ────────────────────────────────────────────────────────────────────

interface VideoTryOnProps {
    frameGroupId: string;
    /** Active texture variant to apply to the glasses model */
    activeTexture: TextureVariant | null;
    /** Called once face landmarks are detected and shape is analyzed */
    onAnalysisReady: (result: FaceAnalysisResult) => void;
    /** Called when age/gender is detected */
    onAgeReady: (result: AgeGenderResult) => void;
    /** Called when the user clicks Reload */
    onReload: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const VideoTryOn = ({ frameGroupId, activeTexture, onAnalysisReady, onAgeReady, onReload }: VideoTryOnProps) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const faceEngineRef = useRef<FaceLandmarkerService | null>(null);
    const threeRef = useRef<ThreeJsService | null>(null);
    const ageServiceRef = useRef<AgeDetectionService | null>(null);

    const hasAnalyzedRef = useRef(false);
    const ageThrottleRef = useRef(0);
    const AGE_INTERVAL_MS = 4000;

    // ── Age detection (throttled) ──
    const detectAge = useCallback(async (video: HTMLVideoElement) => {
        const now = performance.now();
        if (now - ageThrottleRef.current < AGE_INTERVAL_MS) return;
        ageThrottleRef.current = now;
        const svc = ageServiceRef.current;
        if (!svc) return;
        const result = await svc.detectFromVideo(video);
        if (result) onAgeReady(result);
    }, [onAgeReady]);

    // ── Init ──
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            const video = webcamRef.current?.video;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            // Age service — load in background
            const ageSvc = new AgeDetectionService();
            ageServiceRef.current = ageSvc;
            ageSvc.loadModels().catch(console.error);

            // Face engine
            const faceEngine = new FaceLandmarkerService();
            faceEngineRef.current = faceEngine;

            const threeJsService = new ThreeJsService();
            threeRef.current = threeJsService;

            await new Promise<void>((resolve) => {
                if (video.readyState >= 1) return resolve();
                video.onloadedmetadata = () => resolve();
            });
            if (cancelled) return;

            await threeJsService.initalizeThreeJs(video, canvas, frameGroupId);
            await faceEngine.initializeEngine();
            faceEngine.setThreeObjects(threeJsService.glassesObj!, threeJsService.faceObj!);

            hasAnalyzedRef.current = false;

            faceEngine.onLandmarksDetected = (landmarks, width, height) => {
                detectAge(video);
                if (hasAnalyzedRef.current) return;
                hasAnalyzedRef.current = true;
                const result = analyzeFaceShape(landmarks, width, height);
                onAnalysisReady(result);
            };

            faceEngine.scheduleNextPrediction(video);
        };

        init().catch(console.error);
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Apply texture when changed ──
    useEffect(() => {
        if (!activeTexture || !threeRef.current) return;
        const three = threeRef.current;
        // Adapt to your ThreeJsService API:
        if (typeof (three as any).applyTexture === "function") {
            (three as any).applyTexture(activeTexture.texturePath);
        }
    }, [activeTexture]);

    // ── Reload: restart prediction loop ──
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
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Hidden webcam feed */}
            <Webcam
                ref={webcamRef}
                mirrored={false}
                audio={false}
                style={{
                    position: "absolute",
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    opacity: 0,
                    pointerEvents: "none",
                }}
            />

            {/* Three.js output canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />
        </Box>
    );
};

export default VideoTryOn;