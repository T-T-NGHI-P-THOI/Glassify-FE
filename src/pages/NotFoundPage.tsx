import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const NotFoundPage = () => {
    const navigate = useNavigate();
    useLayoutConfig({ showNavbar: true, showFooter: true });

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f9fafb',
                gap: 3,
                px: 2,
            }}
        >
            <Typography
                variant="h1"
                sx={{ fontSize: { xs: '6rem', md: '10rem' }, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}
            >
                404
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                Page Not Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', textAlign: 'center', maxWidth: 400 }}>
                The page you're looking for doesn't exist or has been moved.
            </Typography>
            <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/')}
                sx={{ mt: 1, borderRadius: 2, textTransform: 'none', px: 4 }}
            >
                Back to Home
            </Button>
        </Box>
    );
};

export default NotFoundPage;
