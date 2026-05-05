
import { Box, CircularProgress, Typography } from '@mui/material';

const Loading = () => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                background: 'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
            }}
        >
            <CircularProgress size={56} thickness={4} />
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={600} color="text.primary">
                    Loading
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Please wait while we prepare everything for you.
                </Typography>
            </Box>
        </Box>
    );
};

export default Loading;