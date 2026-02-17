import ThreeDViewer from "@/components/custom/ThreeDViewer";
import { Store } from "@mui/icons-material";
import {
    Box,
    Typography,
    useTheme,
    CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";

const View3DModelPage = () => {
    const theme = useTheme();

    const [loading, setLoading] = useState(true);
    const [showModel, setShowModel] = useState(false);
    const [seconds, setSeconds] = useState(0);

    // Giả lập loading model (ví dụ API / tải GLTF)
    useEffect(() => {
        const fakeLoad = setTimeout(() => {
            setLoading(false); // load xong
        }, 1000); // giả sử load 3s

        return () => clearTimeout(fakeLoad);
    }, []);

    // Bộ đếm giây khi loading
    useEffect(() => {
        if (!loading) return;

        const timer = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [loading]);

    // Sau khi loading xong → đợi thêm 2s mới show model
    useEffect(() => {
        if (loading) return;

        setShowModel(true);

    }, [loading]);

    return (
        <Box>
            <Typography
                sx={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: theme.palette.custom.neutral[800],
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Store sx={{ color: theme.palette.primary.main }} />
                View 3D Model
            </Typography>

            {/* Loading */}
            {loading && (
                <Box
                    sx={{
                        height: '60vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <CircularProgress />
                        <Typography fontSize={14}>
                            Loading 3D model...
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                            {seconds}s elapsed
                        </Typography>
                    </Box>
                </Box>
            )}

            {!loading && showModel && <ThreeDViewer />}

        </Box>
    );
};

export default View3DModelPage;
