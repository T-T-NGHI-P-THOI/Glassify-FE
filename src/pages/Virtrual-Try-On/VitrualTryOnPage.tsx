import { Box, Paper, Typography } from "@mui/material";
import Webcam from "react-webcam";
import { useEffect, useRef } from "react";
import { FaceLandmarkerService } from "@/services/FaceLandmarkerService";
import { ThreeJsService } from "@/services/ThreeJsService";


const VirtualTryOnPage = () => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const init = async () => {
            const video = webcamRef.current?.video;
            const canvas = canvasRef.current;

            if (!video || !canvas) return;

            const faceEngine = new FaceLandmarkerService();
            const threeJsService = new ThreeJsService();

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => resolve();
            });

            console.log("1. Initalize threeJs")
            await threeJsService.initalizeThreeJs(video, canvas);

            console.log("2. Initalize Engine")
            await faceEngine.initializeEngine();

            // 👇 CONNECT THEM
            faceEngine.setThreeObjects(
                threeJsService.glassesObj!,
                threeJsService.faceObj!
            );

            console.log("Glasses Obj: ", threeJsService.glassesObj)

            // console.log("3. Start prediction")
            faceEngine.scheduleNextPrediction(video);
        };

        init();
    }, []);


    return (
        <Box
            sx={{
                height: "100vh",
                bgcolor: "#121212",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Paper sx={{ p: 3, bgcolor: "#1e1e1e" }}>
                <Typography variant="h5" mb={2}>
                    FaceLandmarker (New API)
                </Typography>

                <Box sx={{ position: "relative" }}>
                    <Webcam
                        ref={webcamRef}
                        mirrored={false}
                        audio={false}
                        style={{ width: 640, height: 480, opacity: 0 }}
                    />

                    <canvas
                        ref={canvasRef}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 1280,
                            height: 960,
                            pointerEvents: "none",
                        }}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default VirtualTryOnPage;