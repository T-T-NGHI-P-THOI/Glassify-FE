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
    MenuItem,
    Select,
    FormControl,
    InputLabel,
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
    Phone,
    LocationOn,
    Add as AddIcon,
    HomeOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import {
    AuthProvider,
    type ChangePasswordRequest,
    type UserResponse,
    type UserStats
} from "@/models/User.ts";
import userApi from "@/api/service/userApi.ts";
import { shopApi } from '@/api/shopApi';
import type { ShopDetailResponse } from '@/models/Shop';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { AutoAwesome } from '@mui/icons-material';
import { RecommendationsTabContent } from './RecommendationTab';
import type { UserRecommendationResponse } from '@/models/Recommendation';
import { userAddressApi, type UserAddressResponse, type UserAddressRequest } from '@/api/user-address-api';

// ==================== COMPONENT ====================

const UserProfilePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ========== DATA STATES ==========
    const [user, setUser] = useState<UserResponse | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [shopDetail, setShopDetail] = useState<ShopDetailResponse | null>(null);
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

    // ========== ADDRESS STATES ==========
    const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [addressDialog, setAddressDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data: UserAddressResponse | null }>({
        open: false, mode: 'create', data: null,
    });
    const [addressForm, setAddressForm] = useState<UserAddressRequest>({
        label: '', recipientName: '', recipientPhone: '',
        addressLine1: '', addressLine2: '', ward: '', district: '', city: '',
        postalCode: '', isDefault: false,
        ghnProvinceId: 0, ghnDistrictId: 0, ghnWardCode: '',
    });
    const [savingAddress, setSavingAddress] = useState(false);
    const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

    // ========== RECOMMENDATIONS ==========
    const [recommendations, setRecommendations] = useState<UserRecommendationResponse[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(false);

    const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
            const res = await userApi.getMyRecommendations();
            setRecommendations(res.data ?? []);
        } catch { setRecommendations([]); }
        finally { setLoadingRecs(false); }
    };

    // ========== FETCH ADDRESSES ==========
    const fetchAddresses = async () => {
        setLoadingAddresses(true);
        try {
            const res = await userAddressApi.getAll();
            setAddresses(res.data ?? []);
        } catch { setAddresses([]); }
        finally { setLoadingAddresses(false); }
    };

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
            const response = await userApi.getMyStats();
            if (response.data) {
                setStats({
                    totalOrders: response.data.totalOrders,
                    totalSpent: Number(response.data.totalSpent),
                    totalReviews: response.data.totalReviews,
                    memberSince: response.data.memberSince,
                });
            }
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

    // ========== HANDLE RECOMMENDATION ==========

    const handleDeleteRecommendation = async (id: string) => {
        await userApi.deleteRecommendation(id);
        setRecommendations(prev => prev.filter(r => r.id !== id));
        setSnackbar({ open: true, message: 'Recommendation deleted', severity: 'success' });
    };

    const handleUpdateRecommendationName = async (id: string, name: string) => {
        await userApi.updateRecommendationName(id, name);
        setRecommendations(prev => prev.map(r => r.id === id ? { ...r, name } : r));
        setSnackbar({ open: true, message: 'Name updated', severity: 'success' });
    };

    // ========== EFFECTS ==========
    // Disable navbar and footer
    useLayoutConfig({ showNavbar: false, showFooter: false });

    // Fetch data on mount
    useEffect(() => {
        fetchUserProfile();
        fetchUserStats();
        fetchRecommendations();
        fetchAddresses();
        shopApi.getMyShops().then((res) => {
            const shops = res.data;
            setShopDetail(Array.isArray(shops) && shops.length > 0 ? shops[0] : null);
        }).catch(() => setShopDetail(null));
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


    // ========== ADDRESS HANDLERS ==========
    const openCreateAddress = () => {
        setAddressForm({ label: '', recipientName: '', recipientPhone: '', addressLine1: '', addressLine2: '', ward: '', district: '', city: '', postalCode: '', isDefault: false, ghnProvinceId: 0, ghnDistrictId: 0, ghnWardCode: '' });
        setAddressDialog({ open: true, mode: 'create', data: null });
    };

    const openEditAddress = (addr: UserAddressResponse) => {
        setAddressForm({ label: addr.label, recipientName: addr.recipientName, recipientPhone: addr.recipientPhone, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 ?? '', ward: addr.ward, district: addr.district, city: addr.city, postalCode: addr.postalCode ?? '', isDefault: addr.isDefault, ghnProvinceId: addr.ghnProvinceId, ghnDistrictId: addr.ghnDistrictId, ghnWardCode: addr.ghnWardCode });
        setAddressDialog({ open: true, mode: 'edit', data: addr });
    };

    const handleSaveAddress = async () => {
        if (!addressForm.recipientName.trim() || !addressForm.recipientPhone.trim() || !addressForm.addressLine1.trim() || !addressForm.city.trim()) {
            setSnackbar({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
            return;
        }
        setSavingAddress(true);
        try {
            if (addressDialog.mode === 'create') {
                await userAddressApi.create(addressForm);
                setSnackbar({ open: true, message: 'Address added successfully.', severity: 'success' });
            } else {
                await userAddressApi.update(addressDialog.data!.id, addressForm);
                setSnackbar({ open: true, message: 'Address updated successfully.', severity: 'success' });
            }
            await fetchAddresses();
            setAddressDialog({ open: false, mode: 'create', data: null });
        } catch {
            setSnackbar({ open: true, message: 'Failed to save address. Please try again.', severity: 'error' });
        } finally { setSavingAddress(false); }
    };

    const handleDeleteAddress = async (id: string) => {
        setDeletingAddressId(id);
        try {
            await userAddressApi.delete(id);
            setSnackbar({ open: true, message: 'Address deleted.', severity: 'success' });
            await fetchAddresses();
        } catch {
            setSnackbar({ open: true, message: 'Failed to delete address.', severity: 'error' });
        } finally { setDeletingAddressId(null); }
    };

    const handleSetDefault = async (id: string) => {
        setSettingDefaultId(id);
        try {
            await userAddressApi.setDefault(id);
            setSnackbar({ open: true, message: 'Default address updated.', severity: 'success' });
            await fetchAddresses();
        } catch {
            setSnackbar({ open: true, message: 'Failed to update default address.', severity: 'error' });
        } finally { setSettingDefaultId(null); }
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
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                },
            }}
        >
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${color}18`,
                    mx: 'auto',
                    mb: 1,
                }}
            >
                {icon}
            </Box>
            <Typography
                sx={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: theme.palette.custom.neutral[800],
                    lineHeight: 1.2,
                    mb: 0.25,
                }}
            >
                {value}
            </Typography>
            <Typography
                sx={{
                    fontSize: 11,
                    color: theme.palette.custom.neutral[500],
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    fontWeight: 500,
                }}
            >
                {label}
            </Typography>
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
                                        key={role}
                                        label={role}
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
                    <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                        <StatCard
                            icon={
                                <ShoppingBag
                                    sx={{ fontSize: 20, color: theme.palette.custom.status.info.main }}
                                />
                            }
                            label="Total Orders"
                            value={stats?.totalOrders || 0}
                            color={theme.palette.custom.status.info.main}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                        <StatCard
                            icon={
                                <Star
                                    sx={{ fontSize: 20, color: theme.palette.custom.status.warning.main }}
                                />
                            }
                            label="Reviews Given"
                            value={stats?.totalReviews || 0}
                            color={theme.palette.custom.status.warning.main}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                        <StatCard
                            icon={
                                <CalendarMonth
                                    sx={{ fontSize: 20, color: theme.palette.custom.status.rose?.main || '#E11D48' }}
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
                            <Tab icon={<HomeOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Addresses" />
                            <Tab icon={<AutoAwesome sx={{ fontSize: 18 }} />} iconPosition="start" label="Recommendation" />
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

                                    {shopDetail ? (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 2,
                                                border: `1px solid ${theme.palette.custom.border.light}`,
                                                bgcolor: theme.palette.custom.neutral[50],
                                            }}
                                        >
                                            {/* Header: logo + name + status */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                <Avatar
                                                    src={shopDetail.logoUrl || undefined}
                                                    variant="rounded"
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        bgcolor: theme.palette.custom.neutral[200],
                                                    }}
                                                >
                                                    <Store />
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                                                        {shopDetail.shopName}
                                                    </Typography>
                                                    <Chip
                                                        label={shopDetail.status}
                                                        size="small"
                                                        sx={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            bgcolor: shopDetail.status === 'ACTIVE'
                                                                ? theme.palette.custom.status.success.light
                                                                : shopDetail.status === 'PENDING'
                                                                    ? theme.palette.custom.status.warning.light
                                                                    : theme.palette.custom.status.error?.light || '#fee2e2',
                                                            color: shopDetail.status === 'ACTIVE'
                                                                ? theme.palette.custom.status.success.main
                                                                : shopDetail.status === 'PENDING'
                                                                    ? theme.palette.custom.status.warning.main
                                                                    : theme.palette.custom.status.error?.main || '#dc2626',
                                                        }}
                                                    />
                                                </Box>
                                            </Box>

                                            {/* Info rows */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                                {[
                                                    { icon: <Email sx={{ fontSize: 15 }} />, value: shopDetail.email },
                                                    { icon: <Phone sx={{ fontSize: 15 }} />, value: shopDetail.phone },
                                                    { icon: <LocationOn sx={{ fontSize: 15 }} />, value: shopDetail.address + (shopDetail.city ? `, ${shopDetail.city}` : '') },
                                                    { icon: <Star sx={{ fontSize: 15 }} />, value: shopDetail.avgRating != null ? `${shopDetail.avgRating.toFixed(1)} / 5.0` : 'No rating yet' },
                                                ].map((row, i) => (
                                                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                        <Box sx={{ color: theme.palette.custom.neutral[400], mt: 0.15 }}>{row.icon}</Box>
                                                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>{row.value}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                onClick={() => navigate(PAGE_ENDPOINTS.SHOP.DASHBOARD)}
                                            >
                                                View more details
                                            </Button>
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
                                            <Button
                                                variant="contained"
                                                startIcon={<Store />}
                                                onClick={() => navigate(PAGE_ENDPOINTS.SHOP.REGISTER)}
                                            >
                                                Register Shop
                                            </Button>
                                        </Paper>
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* ========== TAB 1: Addresses ========== */}
                    {activeTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box>
                                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                        Shipping Addresses
                                    </Typography>
                                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.5 }}>
                                        Manage your delivery addresses
                                    </Typography>
                                </Box>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateAddress} size="small">
                                    Add Address
                                </Button>
                            </Box>

                            {loadingAddresses ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
                            ) : addresses.length === 0 ? (
                                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: `1px dashed ${theme.palette.custom.border.main}` }}>
                                    <LocationOn sx={{ fontSize: 52, color: theme.palette.custom.neutral[300], mb: 1 }} />
                                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[600], mb: 1 }}>No addresses yet</Typography>
                                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mb: 3 }}>Add a shipping address to make checkout faster</Typography>
                                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateAddress}>Add Your First Address</Button>
                                </Paper>
                            ) : (
                                <Grid container spacing={2}>
                                    {addresses.map(addr => (
                                        <Grid size={{ xs: 12, md: 6 }} key={addr.id}>
                                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1.5px solid ${addr.isDefault ? theme.palette.primary.main : theme.palette.custom.border.light}`, position: 'relative', transition: 'all 0.2s', '&:hover': { borderColor: theme.palette.primary.main, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' } }}>
                                                {addr.isDefault && (
                                                    <Chip label="Default" size="small" color="primary" sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 600, fontSize: 11 }} />
                                                )}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <HomeOutlined sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5 }}>{addr.label}</Typography>
                                                </Box>
                                                <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>{addr.recipientName}</Typography>
                                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600], mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Phone sx={{ fontSize: 14 }} />{addr.recipientPhone}
                                                </Typography>
                                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600], display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                                    <LocationOn sx={{ fontSize: 14, mt: 0.2, flexShrink: 0 }} />
                                                    {[addr.addressLine1, addr.addressLine2, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                                                </Typography>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    {!addr.isDefault && (
                                                        <Button size="small" variant="outlined" onClick={() => handleSetDefault(addr.id)} disabled={settingDefaultId === addr.id}
                                                            startIcon={settingDefaultId === addr.id ? <CircularProgress size={12} /> : <CheckCircle sx={{ fontSize: 14 }} />}>
                                                            Set Default
                                                        </Button>
                                                    )}
                                                    <Button size="small" variant="outlined" onClick={() => openEditAddress(addr)} startIcon={<Edit sx={{ fontSize: 14 }} />}>Edit</Button>
                                                    <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteAddress(addr.id)} disabled={deletingAddressId === addr.id}
                                                        startIcon={deletingAddressId === addr.id ? <CircularProgress size={12} color="error" /> : <Delete sx={{ fontSize: 14 }} />}>
                                                        Delete
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <RecommendationsTabContent
                            recommendations={recommendations}
                            loading={loadingRecs}
                            onDeleteRecommendation={handleDeleteRecommendation}
                            onUpdateRecommendationName={handleUpdateRecommendationName}
                        />
                    )}

                    {/* ========== TAB 3: Security ========== */}
                    {activeTab === 3 && (
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

                    {/* ========== TAB 4: Settings ========== */}
                    {activeTab === 4 && (
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

            {/* ========== ADDRESS DIALOG ========== */}
            <Dialog open={addressDialog.open} onClose={() => setAddressDialog(d => ({ ...d, open: false }))} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    {addressDialog.mode === 'create' ? 'Add New Address' : 'Edit Address'}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Label" placeholder="e.g. Home, Office" value={addressForm.label} onChange={e => setAddressForm(f => ({ ...f, label: e.target.value }))} fullWidth size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Recipient Name *" value={addressForm.recipientName} onChange={e => setAddressForm(f => ({ ...f, recipientName: e.target.value }))} fullWidth size="small" required />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Phone Number *" value={addressForm.recipientPhone} onChange={e => setAddressForm(f => ({ ...f, recipientPhone: e.target.value }))} fullWidth size="small" required />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField label="Address Line 1 *" placeholder="Street, house number..." value={addressForm.addressLine1} onChange={e => setAddressForm(f => ({ ...f, addressLine1: e.target.value }))} fullWidth size="small" required />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField label="Address Line 2" placeholder="Apartment, suite, floor (optional)" value={addressForm.addressLine2} onChange={e => setAddressForm(f => ({ ...f, addressLine2: e.target.value }))} fullWidth size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField label="Ward *" value={addressForm.ward} onChange={e => setAddressForm(f => ({ ...f, ward: e.target.value }))} fullWidth size="small" required />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField label="District *" value={addressForm.district} onChange={e => setAddressForm(f => ({ ...f, district: e.target.value }))} fullWidth size="small" required />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField label="City / Province *" value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} fullWidth size="small" required />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Postal Code" value={addressForm.postalCode} onChange={e => setAddressForm(f => ({ ...f, postalCode: e.target.value }))} fullWidth size="small" />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <input type="checkbox" id="isDefault" checked={!!addressForm.isDefault} onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                                <Typography component="label" htmlFor="isDefault" sx={{ fontSize: 13, color: theme.palette.custom.neutral[600], cursor: 'pointer' }}>Set as default shipping address</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setAddressDialog(d => ({ ...d, open: false }))} color="inherit" disabled={savingAddress}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveAddress} disabled={savingAddress}
                        startIcon={savingAddress ? <CircularProgress size={16} color="inherit" /> : <Save />}>
                        {addressDialog.mode === 'create' ? 'Add Address' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ========== SNACKBAR ========== */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserProfilePage;