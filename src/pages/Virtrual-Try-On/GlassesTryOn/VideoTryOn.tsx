import { Box } from "@mui/material";
import { useEffect, useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { FaceLandmarkerService } from "../../../services/FaceLandmarkerService";
import { ThreeJsService } from "../../../services/ThreeJsService";
import { analyzeFaceShape, type FaceAnalysisResult } from "../../../services/FaceShapeAnalyzer";
import { AgeDetectionService, type AgeGenderResult } from "../../../services/AgeDetectionService";
import { T, type TextureVariant } from "./TryOnTypes";

// ─── Props ────────────────────────────────────────────────────────────────────

interface VideoTryOnProps {
    frameGroupId: string;
    activeTexture: TextureVariant | null;
    onAnalysisReady: (result: FaceAnalysisResult) => void;
    onAgeReady: (result: AgeGenderResult) => void;
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

            // Face engine & ThreeJS
            const faceEngine = new FaceLandmarkerService();
            faceEngineRef.current = faceEngine;

            const threeJsService = new ThreeJsService();
            threeRef.current = threeJsService;

            // Chờ video sẵn sàng
            await new Promise<void>((resolve) => {
                if (video.readyState >= 2) return resolve();
                video.onloadeddata = () => resolve();
            });
            
            if (cancelled) return;

            // 1. Khởi tạo ThreeJS
            await threeJsService.initalizeThreeJs(video, canvas, frameGroupId);
            
            // 2. Nạp texture ban đầu (nếu có) TRƯỚC khi bắt đầu loop
            if (activeTexture?.url && threeJsService.glassesObj) {
                await threeJsService.applyTextureFromUrl(threeJsService.glassesObj, activeTexture.url).catch(console.error);
            }

            // 3. Khởi tạo Face Engine
            await faceEngine.initializeEngine();
            if (threeJsService.glassesObj && threeJsService.faceObj) {
                faceEngine.setThreeObjects(threeJsService.glassesObj, threeJsService.faceObj);
            }

            hasAnalyzedRef.current = false;

            faceEngine.onLandmarksDetected = (landmarks, width, height) => {
                detectAge(video);
                if (hasAnalyzedRef.current) return;
                hasAnalyzedRef.current = true;
                const result = analyzeFaceShape(landmarks, width, height);
                onAnalysisReady(result);
            };

            // Bắt đầu vòng lặp dự đoán
            faceEngine.scheduleNextPrediction(video);
        };

        init().catch(console.error);
        
        return () => { 
            cancelled = true; 
            // Dọn dẹp loop nếu FaceEngine có hỗ trợ stop
            if (faceEngineRef.current) (faceEngineRef.current as any).stop?.();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Cập nhật texture khi người dùng chọn màu mới ──
    useEffect(() => {
        const updateTexture = async () => {
            const three = threeRef.current;
            if (!three || !three.glassesObj || !activeTexture?.url) return;

            try {
                // Sử dụng await để đảm bảo texture được nạp xong vào GPU
                // Trong Video mode, loop render sẽ tự động lấy texture mới ở frame tiếp theo
                await three.applyTextureFromUrl(three.glassesObj, activeTexture.url);
                console.log("Video Texture Updated:", activeTexture.url);
            } catch (err) {
                console.error("Failed to update video texture:", err);
            }
        };

        updateTexture();
    }, [activeTexture]);

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
                videoConstraints={{
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }}
                style={{
                    position: "absolute",
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    opacity: 0,
                    pointerEvents: "none",
                }}
            />

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