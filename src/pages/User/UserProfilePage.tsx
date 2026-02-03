// ============================================
// USER PROFILE PAGE - Trang hiển thị và chỉnh sửa thông tin User
// Design đồng bộ với ShopProfilePage
// ============================================

import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Avatar,
    Button,
    Tabs,
    Tab,
    Grid,
    TextField,
    InputAdornment,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip,
    Badge,
    Skeleton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    ArrowBack,
    Edit,
    Person,
    Email,
    CalendarMonth,
    Verified,
    CameraAlt,
    Lock,
    Google,
    Visibility,
    VisibilityOff,
    CheckCircle,
    Store,
    ShoppingBag,
    Star,
    Settings,
    Security,
    LinkOff,
    Link as LinkIcon,
    Save,
    Close,
    Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../layouts/LayoutContext';
import {
    AuthProvider,
    type ChangePasswordRequest,
    type UserProfileResponse,
    type UserResponse,
    type UserStats
} from "@/models/User.ts";
import userApi from "@/api/service/userApi.ts";

// ==================== COMPONENT ====================

const UserProfilePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { setShowNavbar, setShowFooter } = useLayout();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ========== DATA STATES ==========
    const [user, setUser] = useState<UserResponse | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ========== UI STATES ==========
    const [activeTab, setActiveTab] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editedFullName, setEditedFullName] = useState('');
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'info' | 'warning',
    });

    // ========== FETCH USER PROFILE ==========
    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await userApi.getMyProfile();
            console.log('User profile response LOGIN PAGE:', response.data);
            if (response) {
                setUser(response.data);
                // setEditedFullName(response || '');
            } else {
                setError('Failed to fetch user profile');
            }
        } catch (err) {
            setError('Failed to fetch user profile');
            console.error('Error fetching user profile:', err);
        } finally {
            setLoading(false);
        }
    };

    // ========== FETCH USER STATS ==========
    const fetchUserStats = async () => {
        try {
            // const response = await userApi.getMyStats();

            // if (response.status === 200 && response.data) {
            //     setStats(response.data);
            // }

            setStats(mockStats); // Remove this line when API is ready
        } catch (err) {
            console.error('Error fetching user stats:', err);
        }
    };

    // ========== UPDATE PROFILE ==========
    const updateProfile = async (data: { fullName: string }): Promise<boolean> => {
        try {
            setUpdating(true);

            const response = await userApi.updateProfile(data);

            if (response.status == 200) {
                setUser(prev => prev ? { ...prev, fullName: data.fullName } : null);
                return true;
            } else {
                setSnackbar({
                    open: true,
                    message: response.message || 'Failed to update profile',
                    severity: 'error',
                });
                return false;
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to update profile',
                severity: 'error',
            });
            return false;
        } finally {
            setUpdating(false);
        }
        return false;
    };

    // ========== UPLOAD AVATAR ==========
    const uploadAvatar = async (file: File): Promise<boolean> => {
        try {
            setUpdating(true);

            const response = await userApi.uploadAvatar(file);

            if (response.success && response.data) {
                setUser(prev => prev ? { ...prev, avatarUrl: response.data?.avatarUrl } : null);
                return true;
            } else {
                setSnackbar({
                    open: true,
                    message: response.message || 'Failed to upload avatar',
                    severity: 'error',
                });
                return false;
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to upload avatar',
                severity: 'error',
            });
            return false;
        } finally {
            setUpdating(false);
        }
    };

    // ========== CHANGE PASSWORD ==========
    const changePasswordApi = async (data: ChangePasswordRequest): Promise<boolean> => {
        try {
            setUpdating(true);

            const response: any = await userApi.changePassword(data);

            if (response.status == 200) {
                return true;
            } else {
                console.log('Change password response:', response);
                setSnackbar({
                    open: true,
                    message: response.errors?.[0] || 'Failed to change password',
                    severity: 'error',
                });
                return false;
            }
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.errors?.[0] || 'Failed to change password',
                severity: 'error',
            });
            return false;
        } finally {
            setUpdating(false);
        }
    };

    // ========== UNLINK GOOGLE ==========
    const unlinkGoogleApi = async (): Promise<boolean> => {
        // try {
        //     setUpdating(true);

        //     const response = await userApi.unlinkGoogle();

        //     if (response.status === 200) {
        //         // Refresh user data
        //         await fetchUserProfile();
        //         return true;
        //     } else {
        //         setSnackbar({
        //             open: true,
        //             message: response.message || 'Failed to unlink Google',
        //             severity: 'error',
        //         });
        //         return false;
        //     }
        // } catch (err) {
        //     setSnackbar({
        //         open: true,
        //         message: 'Failed to unlink Google',
        //         severity: 'error',
        //     });
        //     return false;
        // } finally {
        //     setUpdating(false);
        // }
        return false;
    };

    // ========== EFFECTS ==========
    useEffect(() => {
        setShowNavbar(false);
        setShowFooter(false);
        return () => {
            setShowNavbar(true);
            setShowFooter(true);
        };
    }, [setShowNavbar, setShowFooter]);

    // Fetch data on mount
    useEffect(() => {
        fetchUserProfile();
        fetchUserStats();
    }, []);

    // Update editedFullName when user data changes
    useEffect(() => {
        if (user?.fullName) {
            setEditedFullName(user.fullName);
        }
    }, [user?.fullName]);

    // ========== HELPERS ==========
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const hasGoogleLinked = user?.authProviders.some(
        (p) => p.provider === AuthProvider.GOOGLE
    );

    const hasLocalAccount = user?.authProviders.some(
        (p) => p.provider === AuthProvider.EMAIL
    );

    // ========== HANDLERS ==========
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file
            if (!file.type.startsWith('image/')) {
                setSnackbar({
                    open: true,
                    message: 'Please select an image file',
                    severity: 'error',
                });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setSnackbar({
                    open: true,
                    message: 'Image size must be less than 5MB',
                    severity: 'error',
                });
                return;
            }

            const success = await uploadAvatar(file);
            if (success) {
                setSnackbar({
                    open: true,
                    message: 'Avatar updated successfully',
                    severity: 'success',
                });
            }
        }
    };

    const handleSaveProfile = async () => {
        if (!editedFullName.trim()) {
            setSnackbar({
                open: true,
                message: 'Full name cannot be empty',
                severity: 'error',
            });
            return;
        }

        const success = await updateProfile({ fullName: editedFullName });
        if (success) {
            setIsEditing(false);
            setSnackbar({
                open: true,
                message: 'Profile updated successfully',
                severity: 'success',
            });
        }
    };

    const handleCancelEdit = () => {
        setEditedFullName(user?.fullName || '');
        setIsEditing(false);
    };

    const handleChangePassword = async () => {
        // Validation
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setSnackbar({
                open: true,
                message: 'Please fill all password fields',
                severity: 'error',
            });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setSnackbar({
                open: true,
                message: 'New passwords do not match',
                severity: 'error',
            });
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setSnackbar({
                open: true,
                message: 'Password must be at least 8 characters',
                severity: 'error',
            });
            return;
        }

        const success = await changePasswordApi(passwordForm);
        if (success) {
            setShowPasswordDialog(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setSnackbar({
                open: true,
                message: 'Password changed successfully',
                severity: 'success',
            });
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!hasLocalAccount) {
            setSnackbar({
                open: true,
                message: 'You need to set a password before unlinking Google',
                severity: 'warning',
            });
            return;
        }

        const success = await unlinkGoogleApi();
        if (success) {
            setSnackbar({
                open: true,
                message: 'Google account unlinked',
                severity: 'success',
            });
        }
    };


    const mockStats: UserStats = {
        totalOrders: 125,
        totalSpent: 25430000,
        totalReviews: 45,
        memberSince: '2021-03-15',
    };
    // ========== STAT CARD COMPONENT ==========
    const StatCard = ({
        icon,
        label,
        value,
        color,
    }: {
        icon: React.ReactNode;
        label: string;
        value: string | number;
        color: string;
    }) => (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: theme.palette.custom.border.main,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${color}20`,
                    }}
                >
                    {icon}
                </Box>
                <Box>
                    <Typography
                        sx={{
                            fontSize: 12,
                            color: theme.palette.custom.neutral[500],
                            mb: 0.5,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: theme.palette.custom.neutral[800],
                        }}
                    >
                        {value}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );

    // ========== ERROR STATE ==========
    if (error && !user) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
                <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={fetchUserProfile}>
                                Retry
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                </Box>
            </Box>
        );
    }

    // ========== LOADING STATE ==========
    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
                <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 3 }} />
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                            </Grid>
                        ))}
                    </Grid>
                    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                </Box>
            </Box>
        );
    }

    // ========== MAIN RENDER ==========
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
            {/* Hidden file input for avatar upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
            />

            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
                {/* ==================== HEADER ==================== */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}
                        >
                            My Profile
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                            Manage your personal information and settings
                        </Typography>
                    </Box>
                    {!isEditing ? (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </Button>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<Close />}
                                onClick={handleCancelEdit}
                                color="inherit"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={updating ? <CircularProgress size={18} color="inherit" /> : <Save />}
                                onClick={handleSaveProfile}
                                disabled={updating}
                            >
                                Save Changes
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* ==================== PROFILE HEADER CARD ==================== */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.custom.border.light}`,
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                        {/* Avatar Section */}
                        <Box sx={{ position: 'relative' }}>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    <Tooltip title="Change Avatar">
                                        <IconButton
                                            size="small"
                                            onClick={handleAvatarClick}
                                            sx={{
                                                bgcolor: theme.palette.primary.main,
                                                color: 'white',
                                                width: 32,
                                                height: 32,
                                                '&:hover': {
                                                    bgcolor: theme.palette.primary.dark,
                                                },
                                            }}
                                        >
                                            <CameraAlt sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                }
                            >
                                <Avatar
                                    src={user?.avatarUrl || undefined}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        bgcolor: theme.palette.custom.neutral[200],
                                        fontSize: 48,
                                        border: `4px solid ${theme.palette.background.paper}`,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    {user?.fullName || user?.username?.charAt(0) || <Person sx={{ fontSize: 56 }} />}
                                </Avatar>
                            </Badge>
                        </Box>

                        {/* User Info Section */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {isEditing ? (
                                    <TextField
                                        value={editedFullName}
                                        onChange={(e) => setEditedFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                fontSize: 24,
                                                fontWeight: 700,
                                            },
                                        }}
                                    />
                                ) : (
                                    <Typography
                                        sx={{
                                            fontSize: 24,
                                            fontWeight: 700,
                                            color: theme.palette.custom.neutral[800],
                                        }}
                                    >
                                        {user?.fullName || user?.username}
                                    </Typography>
                                )}
                                {user?.enabled && (
                                    <Verified
                                        sx={{ fontSize: 24, color: theme.palette.custom.status.info.main }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        color: theme.palette.custom.neutral[600],
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}
                                >
                                    <Person sx={{ fontSize: 16 }} />@{user?.username}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        color: theme.palette.custom.neutral[600],
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}
                                >
                                    <Email sx={{ fontSize: 16 }} />
                                    {user?.email}
                                </Typography>
                                {user?.roles.map((role) => (
                                    <Chip
                                        key={role.id}
                                        label={role.name}
                                        size="small"
                                        sx={{
                                            bgcolor: theme.palette.custom.status.info.light,
                                            color: theme.palette.custom.status.info.main,
                                            fontWeight: 500,
                                        }}
                                    />
                                ))}
                            </Box>

                            {/* Connected Accounts */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                                    Connected:
                                </Typography>
                                {hasGoogleLinked && (
                                    <Chip
                                        icon={<Google sx={{ fontSize: 16 }} />}
                                        label="Google"
                                        size="small"
                                        sx={{
                                            bgcolor: '#FEF3F2',
                                            color: '#DB4437',
                                            fontWeight: 500,
                                            '& .MuiChip-icon': { color: '#DB4437' },
                                        }}
                                    />
                                )}
                                {hasLocalAccount && (
                                    <Chip
                                        icon={<Lock sx={{ fontSize: 16 }} />}
                                        label="Password"
                                        size="small"
                                        sx={{
                                            bgcolor: theme.palette.custom.status.success.light,
                                            color: theme.palette.custom.status.success.main,
                                            fontWeight: 500,
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>

                        {/* Right side info */}
                        <Box sx={{ textAlign: 'right', minWidth: 200 }}>
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    color: theme.palette.custom.neutral[500],
                                    mb: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: 0.5,
                                }}
                            >
                                <CalendarMonth sx={{ fontSize: 14 }} />
                                Member since {user?.createdAt && formatDate(user.createdAt)}
                            </Typography>
                            {user?.shop && (
                                <Chip
                                    icon={<Store sx={{ fontSize: 14 }} />}
                                    label={user.shop.shopName}
                                    size="small"
                                    onClick={() => navigate('/shop/profile')}
                                    sx={{
                                        bgcolor: theme.palette.custom.status.warning.light,
                                        color: theme.palette.custom.status.warning.main,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        mt: 1,
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Paper>

                {/* ==================== STATS CARDS ==================== */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            icon={
                                <ShoppingBag
                                    sx={{ fontSize: 24, color: theme.palette.custom.status.info.main }}
                                />
                            }
                            label="Total Orders"
                            value={stats?.totalOrders || 0}
                            color={theme.palette.custom.status.info.main}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            icon={
                                <Typography
                                    sx={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: theme.palette.custom.status.success.main,
                                    }}
                                >
                                    ₫
                                </Typography>
                            }
                            label="Total Spent"
                            value={formatCurrency(stats?.totalSpent || 0)}
                            color={theme.palette.custom.status.success.main}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            icon={
                                <Star
                                    sx={{ fontSize: 24, color: theme.palette.custom.status.warning.main }}
                                />
                            }
                            label="Reviews Given"
                            value={stats?.totalReviews || 0}
                            color={theme.palette.custom.status.warning.main}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            icon={
                                <CalendarMonth
                                    sx={{ fontSize: 24, color: theme.palette.custom.status.rose?.main || '#E11D48' }}
                                />
                            }
                            label="Member Since"
                            value={stats?.memberSince ? formatDate(stats.memberSince) : '-'}
                            color={theme.palette.custom.status.rose?.main || '#E11D48'}
                        />
                    </Grid>
                </Grid>

                {/* ==================== TABS CONTENT ==================== */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.custom.border.light}`,
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            sx={{
                                px: 2,
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: 14,
                                },
                            }}
                        >
                            <Tab icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" label="Personal Info" />
                            <Tab icon={<Security sx={{ fontSize: 18 }} />} iconPosition="start" label="Security" />
                            <Tab icon={<Settings sx={{ fontSize: 18 }} />} iconPosition="start" label="Settings" />
                        </Tabs>
                    </Box>

                    {/* ========== TAB 0: Personal Info ========== */}
                    {activeTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: theme.palette.custom.neutral[800],
                                            mb: 2,
                                        }}
                                    >
                                        Account Information
                                    </Typography>

                                    <Box sx={{ mb: 2.5 }}>
                                        <Typography
                                            sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}
                                        >
                                            USERNAME
                                        </Typography>
                                        <TextField
                                            value={user?.username || ''}
                                            disabled
                                            fullWidth
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Person sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText="Username cannot be changed"
                                        />
                                    </Box>

                                    <Box sx={{ mb: 2.5 }}>
                                        <Typography
                                            sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}
                                        >
                                            EMAIL ADDRESS
                                        </Typography>
                                        <TextField
                                            value={user?.email || ''}
                                            disabled
                                            fullWidth
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Email sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <CheckCircle
                                                            sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }}
                                                        />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText="Email is verified"
                                        />
                                    </Box>

                                    <Box>
                                        <Typography
                                            sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}
                                        >
                                            FULL NAME
                                        </Typography>
                                        <TextField
                                            value={isEditing ? editedFullName : (user?.fullName || '')}
                                            onChange={(e) => setEditedFullName(e.target.value)}
                                            disabled={!isEditing}
                                            fullWidth
                                            size="small"
                                            placeholder="Enter your full name"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Person sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: theme.palette.custom.neutral[800],
                                            mb: 2,
                                        }}
                                    >
                                        Shop Information
                                    </Typography>

                                    {user?.shop ? (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: `1px solid ${theme.palette.custom.border.light}`,
                                                bgcolor: theme.palette.custom.neutral[50],
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    src={user.shop.shopLogo || undefined}
                                                    variant="rounded"
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        bgcolor: theme.palette.custom.neutral[200],
                                                    }}
                                                >
                                                    <Store />
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: 16,
                                                            fontWeight: 600,
                                                            color: theme.palette.custom.neutral[800],
                                                        }}
                                                    >
                                                        {user.shop.shopName}
                                                    </Typography>
                                                    <Typography
                                                        sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}
                                                    >
                                                        You are the owner of this shop
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => navigate('/shop/profile')}
                                                >
                                                    View Shop
                                                </Button>
                                            </Box>
                                        </Paper>
                                    ) : (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: 2,
                                                border: `1px dashed ${theme.palette.custom.border.main}`,
                                                textAlign: 'center',
                                                bgcolor: theme.palette.custom.neutral[50],
                                            }}
                                        >
                                            <Store
                                                sx={{
                                                    fontSize: 48,
                                                    color: theme.palette.custom.neutral[300],
                                                    mb: 1,
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    fontSize: 14,
                                                    color: theme.palette.custom.neutral[500],
                                                    mb: 2,
                                                }}
                                            >
                                                You don't have a shop yet
                                            </Typography>
                                            <Button variant="contained" startIcon={<Store />}>
                                                Create Shop
                                            </Button>
                                        </Paper>
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* ========== TAB 1: Security ========== */}
                    {activeTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: theme.palette.custom.neutral[800],
                                            mb: 2,
                                        }}
                                    >
                                        Password
                                    </Typography>

                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            border: `1px solid ${theme.palette.custom.border.light}`,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: theme.palette.custom.status.success.light,
                                                    }}
                                                >
                                                    <Lock sx={{ color: theme.palette.custom.status.success.main }} />
                                                </Box>
                                                <Box>
                                                    <Typography
                                                        sx={{
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: theme.palette.custom.neutral[800],
                                                        }}
                                                    >
                                                        Password
                                                    </Typography>
                                                    <Typography
                                                        sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}
                                                    >
                                                        {hasLocalAccount
                                                            ? 'Password is set'
                                                            : 'Set a password to login without Google'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => setShowPasswordDialog(true)}
                                            >
                                                {hasLocalAccount ? 'Change' : 'Set Password'}
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: theme.palette.custom.neutral[800],
                                            mb: 2,
                                        }}
                                    >
                                        Connected Accounts
                                    </Typography>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {/* Google Account */}
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: `1px solid ${theme.palette.custom.border.light}`,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box
                                                        sx={{
                                                            width: 44,
                                                            height: 44,
                                                            borderRadius: 2,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: '#FEF3F2',
                                                        }}
                                                    >
                                                        <Google sx={{ color: '#DB4437' }} />
                                                    </Box>
                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontSize: 14,
                                                                fontWeight: 600,
                                                                color: theme.palette.custom.neutral[800],
                                                            }}
                                                        >
                                                            Google
                                                        </Typography>
                                                        <Typography
                                                            sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}
                                                        >
                                                            {hasGoogleLinked ? 'Connected' : 'Not connected'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {hasGoogleLinked ? (
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<LinkOff />}
                                                        onClick={handleUnlinkGoogle}
                                                        disabled={updating}
                                                    >
                                                        Unlink
                                                    </Button>
                                                ) : (
                                                    <Button variant="outlined" size="small" startIcon={<LinkIcon />}>
                                                        Connect
                                                    </Button>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* Danger Zone */}
                            <Typography
                                sx={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: theme.palette.custom.status.error.main,
                                    mb: 2,
                                }}
                            >
                                Danger Zone
                            </Typography>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.custom.status.error.light}`,
                                    bgcolor: '#FEF2F2',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: theme.palette.custom.status.error.main,
                                            }}
                                        >
                                            Delete Account
                                        </Typography>
                                        <Typography
                                            sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}
                                        >
                                            Once deleted, your account cannot be recovered
                                        </Typography>
                                    </Box>
                                    <Button variant="outlined" color="error" size="small" startIcon={<Delete />}>
                                        Delete Account
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    )}

                    {/* ========== TAB 2: Settings ========== */}
                    {activeTab === 2 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Settings
                                sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }}
                            />
                            <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }}>
                                More settings coming soon
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* ==================== PASSWORD DIALOG ==================== */}
            <Dialog
                open={showPasswordDialog}
                onClose={() => setShowPasswordDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>
                    {hasLocalAccount ? 'Change Password' : 'Set Password'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        {hasLocalAccount && (
                            <TextField
                                label="Current Password"
                                type={showPassword.current ? 'text' : 'password'}
                                fullWidth
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                                }
                                sx={{ mb: 2 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    setShowPassword({ ...showPassword, current: !showPassword.current })
                                                }
                                                edge="end"
                                            >
                                                {showPassword.current ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                        <TextField
                            label="New Password"
                            type={showPassword.new ? 'text' : 'password'}
                            fullWidth
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            sx={{ mb: 2 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowPassword({ ...showPassword, new: !showPassword.new })
                                            }
                                            edge="end"
                                        >
                                            {showPassword.new ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            helperText="At least 8 characters"
                        />
                        <TextField
                            label="Confirm New Password"
                            type={showPassword.confirm ? 'text' : 'password'}
                            fullWidth
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                                            }
                                            edge="end"
                                        >
                                            {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShowPasswordDialog(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={updating}
                        startIcon={updating && <CircularProgress size={18} color="inherit" />}
                    >
                        {hasLocalAccount ? 'Change Password' : 'Set Password'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ==================== SNACKBAR ==================== */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserProfilePage;