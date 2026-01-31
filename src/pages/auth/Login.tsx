import {
    Box,
    Button,
    TextField,
    Typography,
    InputAdornment,
    IconButton,
    CircularProgress,
    Alert,
    MenuItem,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    EmailOutlined,
    LockOutlined,
    PersonOutline,
    PhoneOutlined,
    BadgeOutlined,
    ArrowForward,
    ArrowBack,
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { LoginRequest } from '@/models/Auth.ts';
import { TokenManager } from '@/api/axios.config.ts';
import { authApi } from '@/api/service/authApi.ts';
import { useLayout } from '@/layouts/LayoutContext.tsx';
import {useLayoutConfig} from "@/hooks/useLayoutConfig.ts";
import {AuthActionType} from "@/types/auth-action-type.enum.ts";
import {initialize, logIn} from "@/auth/Reducer.ts";

/* ══════════════════════════════════════════════════
   THEME — extracted from admin page's palette
   ══════════════════════════════════════════════════ */
const t = {
    // Neutrals (from theme.palette.custom.neutral)
    n50:  '#F8FAFC',
    n100: '#F1F5F9',
    n200: '#E2E8F0',
    n300: '#CBD5E1',
    n400: '#94A3B8',
    n500: '#64748B',
    n600: '#475569',
    n700: '#334155',
    n800: '#1E293B',
    n900: '#0F172A',

    // Status colors (from theme.palette.custom.status)
    successMain:  '#22C55E',
    successLight: '#F0FDF4',
    errorMain:    '#EF4444',
    errorLight:   '#FEF2F2',
    warningMain:  '#F59E0B',
    warningLight: '#FFFBEB',
    infoMain:     '#3B82F6',
    infoLight:    '#EFF6FF',
    pinkMain:     '#EC4899',
    pinkLight:    '#FDF2F8',

    // Borders (from theme.palette.custom.border)
    borderLight: '#E2E8F0',
    borderMain:  '#CBD5E1',

    // Brand accent — derived from the admin page's primary tones
    accent:      '#3B82F6',
    accentDark:  '#2563EB',
    accentLight: '#DBEAFE',
};

/* ══════════════════════════════════════════════════
   KEYFRAMES (injected once)
   ══════════════════════════════════════════════════ */
const STYLE_ID = 'auth-page-keyframes';
const injectKeyframes = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

    @keyframes authFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes authFloat {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes authPulse {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 0.7; }
    }
  `;
    document.head.appendChild(style);
};

/* ══════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════ */
const AuthPage = () => {
    useLayoutConfig({ showNavbar: false, showFooter: false });


    // const { setShowNavbar, setShowFooter } = useLayout();
    const navigate = useNavigate();
    const { isInitialized,    // boolean — app đã check token xong chưa
        isAuthenticated,  // boolean — user đã đăng nhập chưa
        dispatch,  } = useAuth();

    /* ── state ── */
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string[] | null>([]);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Login form
    const [loginData, setLoginData] = useState<LoginRequest>({
        usernameOrEmail: '',
        password: '',
    });

    // Register form
    const [registerData, setRegisterData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        gender: '',
    });

    useEffect(() => {
        injectKeyframes();
    }, []);

    // useEffect(() => {
    //     if (isInitialized && isAuthenticated) {
    //         navigate('/dashboard');
    //     }
    // }, [isInitialized, isAuthenticated, navigate]);

    /* ── handlers ── */
    const handleLoginChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleRegisterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRegisterData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const switchMode = useCallback(() => {
        setIsRegister((prev) => !prev);
        setError(null);
        setSuccessMsg(null);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await authApi.login(loginData);
            // @ts-ignore
            const accessToken = result.data.accessToken;
            console.log(result)
            TokenManager.setTokens(accessToken, '');

            // @ts-ignore
            const userData = result.data.user;

            navigate('/dashboard');

            dispatch(logIn({isInitialized: true, isAuthenticated: false, user: userData }));

        } catch (err: any) {
            const msgs: string[] =
                err.errors ||
                'Login failed. Please try again.';
            setError(msgs);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (registerData.password !== registerData.confirmPassword) {
            // @ts-ignore
            setError(prev => [...prev, "Passwords do not match"]);
            setLoading(false);
            return;
        }

        try {
            // Replace with your actual register API call:
            // await authApi.register(registerData);
            setSuccessMsg('Account created successfully! Please sign in.');
            setTimeout(() => {
                setIsRegister(false);
                setSuccessMsg(null);
            }, 1000);
        } catch (err: any) {
            const msgs: string[] =
                err.errors ||
                ['Registration failed. Please try again.'];
            setError(msgs);
        } finally {
            setLoading(false);
        }
    };

    /* ── shared input sx ── */
    const inputSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            fontSize: '0.9rem',
            backgroundColor: '#fff',
            transition: 'all 0.2s ease',
            '& fieldset': {
                borderColor: t.borderLight,
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            },
            '&:hover fieldset': { borderColor: t.borderMain },
            '&.Mui-focused fieldset': {
                borderColor: t.accent,
                boxShadow: `0 0 0 3px ${t.accentLight}`,
            },
        },
        '& .MuiInputLabel-root': {
            fontSize: '0.85rem',
            color: t.n500,
            '&.Mui-focused': { color: t.accent },
        },
        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
            color: t.n400,
            fontSize: '1.15rem',
        },
    };

    /* ══════════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════════ */
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"DM Sans", sans-serif',
                background: `
          linear-gradient(135deg, ${t.n50} 0%, ${t.accentLight} 50%, ${t.n100} 100%)
        `,
                position: 'relative',
                overflow: 'hidden',
                p: 2,
            }}
        >
            {/* ── Background decorations ── */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${t.accent}15, transparent 70%)`,
                    top: '-10%',
                    right: '-5%',
                    animation: 'authPulse 6s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${t.pinkMain}10, transparent 70%)`,
                    bottom: '-8%',
                    left: '-3%',
                    animation: 'authPulse 8s ease-in-out infinite 2s',
                    pointerEvents: 'none',
                }}
            />

            {/* ═══════ MAIN CONTAINER ═══════ */}
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 920,
                    minHeight: 560,
                    display: 'flex',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08), 0 4px 16px rgba(15, 23, 42, 0.04)',
                    border: `1px solid ${t.borderLight}`,
                    position: 'relative',
                    animation: 'authFadeIn 0.6s ease-out',
                    bgcolor: '#fff',
                }}
            >
                {/* ─────────────────────────────────
            OVERLAY PANEL (slides left ↔ right)
            ───────────────────────────────── */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '45%',
                        zIndex: 10,
                        transition: 'transform 0.65s cubic-bezier(0.68, -0.15, 0.27, 1.15)',
                        transform: isRegister ? 'translateX(122.2%)' : 'translateX(0)',
                    }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(160deg, ${t.n800} 0%, ${t.n900} 100%)`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 5,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Decorative shapes inside the panel */}
                        <Box
                            sx={{
                                position: 'absolute',
                                width: 200,
                                height: 200,
                                borderRadius: '50%',
                                border: `1px solid rgba(255,255,255,0.06)`,
                                top: -40,
                                right: -60,
                                animation: 'authFloat 7s ease-in-out infinite',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                border: `1px solid rgba(255,255,255,0.04)`,
                                bottom: 40,
                                left: -30,
                                animation: 'authFloat 5s ease-in-out infinite 1s',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                width: 60,
                                height: 60,
                                borderRadius: '12px',
                                background: `rgba(59, 130, 246, 0.12)`,
                                top: '20%',
                                left: '15%',
                                transform: 'rotate(45deg)',
                                animation: 'authFloat 9s ease-in-out infinite 0.5s',
                            }}
                        />

                        {/* ── Panel content ── */}
                        <Box
                            sx={{
                                position: 'relative',
                                zIndex: 2,
                                textAlign: 'center',
                                transition: 'opacity 0.3s ease 0.25s',
                            }}
                        >
                            {/* Logo */}
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: '14px',
                                    background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 3,
                                    boxShadow: `0 4px 20px rgba(59, 130, 246, 0.3)`,
                                }}
                            >
                                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem' }}>
                                    G
                                </Typography>
                            </Box>

                            <Typography
                                sx={{
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '1.6rem',
                                    mb: 1.5,
                                    letterSpacing: '-0.02em',
                                    fontFamily: '"DM Sans", sans-serif',
                                }}
                            >
                                {isRegister ? 'Already have an account?' : 'New here?'}
                            </Typography>

                            <Typography
                                sx={{
                                    color: 'rgba(255,255,255,0.55)',
                                    fontSize: '0.88rem',
                                    lineHeight: 1.6,
                                    mb: 4,
                                    maxWidth: 260,
                                    mx: 'auto',
                                }}
                            >
                                {isRegister
                                    ? 'Sign in with your existing account to continue managing your store.'
                                    : 'Create an account and start your journey with Glassify today.'}
                            </Typography>

                            <Button
                                onClick={switchMode}
                                variant="outlined"
                                endIcon={isRegister ? <ArrowBack sx={{ fontSize: '18px !important' }} /> : <ArrowForward sx={{ fontSize: '18px !important' }} />}
                                sx={{
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    px: 3.5,
                                    py: 1.1,
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    fontFamily: '"DM Sans", sans-serif',
                                    transition: 'all 0.25s ease',
                                    '&:hover': {
                                        borderColor: 'rgba(255,255,255,0.4)',
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                    },
                                }}
                            >
                                {isRegister ? 'Sign In' : 'Create Account'}
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* ─────────────────────────────────
            LEFT SIDE — LOGIN FORM
            ───────────────────────────────── */}
                <Box
                    sx={{
                        width: '55%',
                        ml: '45%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 3, sm: 5 },
                        transition: 'opacity 0.35s ease, transform 0.35s ease',
                        opacity: isRegister ? 0 : 1,
                        transform: isRegister ? 'scale(0.95)' : 'scale(1)',
                        pointerEvents: isRegister ? 'none' : 'auto',
                        position: isRegister ? 'absolute' : 'relative',
                    }}
                >
                    <Box
                        component="form"
                        onSubmit={handleLogin}
                        sx={{ width: '100%', maxWidth: 360 }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: '1.55rem',
                                color: t.n800,
                                mb: 0.5,
                                letterSpacing: '-0.02em',
                                fontFamily: '"DM Sans", sans-serif',
                            }}
                        >
                            Welcome back
                        </Typography>
                        <Typography sx={{ color: t.n500, fontSize: '0.88rem', mb: 3.5 }}>
                            Enter your credentials to access your account
                        </Typography>

                        {/* Error */}
                        {!isRegister && error && error.length > 0 && (
                            <Alert
                                severity="error"
                                onClose={() => setError(null)}
                                sx={{
                                    mb: 2.5,
                                    borderRadius: '10px',
                                    bgcolor: t.errorLight,
                                    border: `1px solid ${t.errorMain}20`,
                                    fontSize: '0.83rem',
                                    '& .MuiAlert-icon': { color: t.errorMain },
                                }}
                            >
                                {error.map((msg, i) => (
                                    <div key={i}>{msg}</div>
                                ))}
                            </Alert>
                        )}

                        <TextField
                            label="Email or Username"
                            name="usernameOrEmail"
                            fullWidth
                            value={loginData.usernameOrEmail}
                            onChange={handleLoginChange}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailOutlined />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2, ...inputSx }}
                        />

                        <TextField
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            value={loginData.password}
                            onChange={handleLoginChange}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{ color: t.n400 }}
                                            size="small"
                                        >
                                            {showPassword ? <VisibilityOff sx={{ fontSize: '1.1rem' }} /> : <Visibility sx={{ fontSize: '1.1rem' }} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 1, ...inputSx }}
                        />

                        <Box sx={{ textAlign: 'right', mb: 3 }}>
                            <Typography
                                component="span"
                                onClick={() => navigate('/forgot-password')}
                                sx={{
                                    color: t.accent,
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                Forgot password?
                            </Typography>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            disableElevation
                            sx={{
                                py: 1.4,
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontFamily: '"DM Sans", sans-serif',
                                background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
                                boxShadow: `0 4px 16px rgba(59, 130, 246, 0.25)`,
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${t.accentDark}, ${t.n800})`,
                                    boxShadow: `0 6px 24px rgba(59, 130, 246, 0.35)`,
                                    transform: 'translateY(-1px)',
                                },
                                '&:active': { transform: 'translateY(0)' },
                                '&.Mui-disabled': {
                                    background: t.n200,
                                    color: t.n400,
                                },
                            }}
                        >
                            {loading && !isRegister ? (
                                <CircularProgress size={22} sx={{ color: '#fff' }} />
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </Box>
                </Box>

                {/* ─────────────────────────────────
            RIGHT SIDE — REGISTER FORM
            ───────────────────────────────── */}
                <Box
                    sx={{
                        width: '55%',
                        position: isRegister ? 'relative' : 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 3, sm: 5 },
                        transition: 'opacity 0.35s ease, transform 0.35s ease',
                        opacity: isRegister ? 1 : 0,
                        transform: isRegister ? 'scale(1)' : 'scale(0.95)',
                        pointerEvents: isRegister ? 'auto' : 'none',
                    }}
                >
                    <Box
                        component="form"
                        onSubmit={handleRegister}
                        sx={{ width: '100%', maxWidth: 380 }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: '1.55rem',
                                color: t.n800,
                                mb: 0.5,
                                letterSpacing: '-0.02em',
                                fontFamily: '"DM Sans", sans-serif',
                            }}
                        >
                            Create account
                        </Typography>
                        <Typography sx={{ color: t.n500, fontSize: '0.88rem', mb: 3 }}>
                            Fill in your details to get started
                        </Typography>

                        {/* Error */}
                        {isRegister && error && (
                            <Alert
                                severity="error"
                                onClose={() => setError(null)}
                                sx={{
                                    mb: 2,
                                    borderRadius: '10px',
                                    bgcolor: t.errorLight,
                                    border: `1px solid ${t.errorMain}20`,
                                    fontSize: '0.83rem',
                                    '& .MuiAlert-icon': { color: t.errorMain },
                                }}
                            >
                                {error.length > 0 && (
                                    <Typography color="error" variant="body2">
                                        {error.map((msg, i) => (
                                            <div key={i}>{msg}</div>
                                        ))}
                                    </Typography>
                                )}


                            </Alert>
                        )}

                        {/* Success */}
                        {successMsg && (
                            <Alert
                                severity="success"
                                sx={{
                                    mb: 2,
                                    borderRadius: '10px',
                                    bgcolor: t.successLight,
                                    border: `1px solid ${t.successMain}20`,
                                    fontSize: '0.83rem',
                                    '& .MuiAlert-icon': { color: t.successMain },
                                }}
                            >
                                {successMsg}
                            </Alert>
                        )}

                        {/* Row: Full Name + Gender */}
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                            <TextField
                                label="Full Name"
                                name="fullName"
                                fullWidth
                                value={registerData.fullName}
                                onChange={handleRegisterChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonOutline />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                            />
                            <TextField
                                label="Gender"
                                name="gender"
                                select
                                value={registerData.gender}
                                onChange={handleRegisterChange}
                                disabled={loading}
                                sx={{ minWidth: 130, ...inputSx }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BadgeOutlined />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </TextField>
                        </Box>

                        {/* Row: Email + Phone */}
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                fullWidth
                                value={registerData.email}
                                onChange={handleRegisterChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailOutlined />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                            />
                            <TextField
                                label="Phone"
                                name="phone"
                                fullWidth
                                value={registerData.phone}
                                onChange={handleRegisterChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PhoneOutlined />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                            />
                        </Box>

                        {/* Password */}
                        <TextField
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{ color: t.n400 }}
                                            size="small"
                                        >
                                            {showPassword ? <VisibilityOff sx={{ fontSize: '1.1rem' }} /> : <Visibility sx={{ fontSize: '1.1rem' }} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 1.5, ...inputSx }}
                        />

                        {/* Confirm Password */}
                        <TextField
                            label="Confirm Password"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            fullWidth
                            value={registerData.confirmPassword}
                            onChange={handleRegisterChange}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                            sx={{ color: t.n400 }}
                                            size="small"
                                        >
                                            {showConfirmPassword ? <VisibilityOff sx={{ fontSize: '1.1rem' }} /> : <Visibility sx={{ fontSize: '1.1rem' }} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 3, ...inputSx }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            disableElevation
                            sx={{
                                py: 1.4,
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontFamily: '"DM Sans", sans-serif',
                                background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
                                boxShadow: `0 4px 16px rgba(59, 130, 246, 0.25)`,
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${t.accentDark}, ${t.n800})`,
                                    boxShadow: `0 6px 24px rgba(59, 130, 246, 0.35)`,
                                    transform: 'translateY(-1px)',
                                },
                                '&:active': { transform: 'translateY(0)' },
                                '&.Mui-disabled': {
                                    background: t.n200,
                                    color: t.n400,
                                },
                            }}
                        >
                            {loading && isRegister ? (
                                <CircularProgress size={22} sx={{ color: '#fff' }} />
                            ) : (
                                'Create Account'
                            )}
                        </Button>

                        <Typography
                            sx={{
                                textAlign: 'center',
                                mt: 2.5,
                                color: t.n500,
                                fontSize: '0.78rem',
                            }}
                        >
                            By creating an account, you agree to our{' '}
                            <Box
                                component="span"
                                sx={{ color: t.accent, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                                Terms
                            </Box>{' '}
                            &{' '}
                            <Box
                                component="span"
                                sx={{ color: t.accent, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                                Privacy Policy
                            </Box>
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default AuthPage;