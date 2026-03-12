import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  TextField,
  Badge,
  Button,
  Container,
  InputAdornment,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import {
  Search,
  ShoppingCart,
  Person,
  Favorite,
  Help,
  AccountCircle,
  Store,
  AddBusiness,
  Logout,
  Receipt,
  VerifiedUser,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { logOut } from '@/auth/Reducer';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopApi } from '@/api/shopApi';
import type { ShopDetailResponse } from '@/models/Shop';
import { useLayout } from '@/layouts/LayoutContext';

export const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [myShop, setMyShop] = useState<ShopDetailResponse | null>(null);
  const navigate = useNavigate();
  const { itemCount, isAnimating } = useCart();
  const { isAuthenticated, user, dispatch } = useAuth();
  const { showNavCategories } = useLayout();

  useEffect(() => {
    if (!isAuthenticated) {
      setMyShop(null);
      return;
    }
    shopApi.getMyShops().then((res) => {
      const shops = res.data;
      setMyShop(Array.isArray(shops) && shops.length > 0 ? shops[0] : null);
    }).catch(() => setMyShop(null));
  }, [isAuthenticated]);

  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    dispatch(logOut());
    navigate('/');
  };

  const displayName = user?.username || '';

  const mainCategories = [
    { label: 'Eyeglasses', path: '/products', category: 'Eyeglasses' },
    { label: 'Sunglasses', path: '/products', category: 'Sunglasses' },
    { label: 'Lenses', path: '/lens', category: null },
    { label: 'Sports', path: '/sports', category: null },
    { label: 'Collabs & Partners', path: '/collabs', category: null },
    { label: '✨ Discover', path: '/discover', special: true, category: null },
    { label: '🏷️ Sale', path: '/sale', special: true, category: null },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (item: typeof mainCategories[0]) => {
    if (item.category) {
      navigate(`${item.path}?category=${encodeURIComponent(item.category)}`);
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          color: "#000000",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Container maxWidth="xl">
          {/* Top Toolbar */}
          <Toolbar
            sx={{
              justifyContent: "space-between",
              py: 1.5,
              minHeight: "70px !important",
            }}
          >
            {/* Logo */}
            <Box
              onClick={() => navigate('/')}
              sx={{
                fontWeight: 800,
                fontSize: "25px",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              GLASSIFY
            </Box>

            {/* Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                flexGrow: 1,
                maxWidth: 500,
                mx: 4,
                display: { xs: "none", md: "block" },
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search glasses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#6b7280", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" sx={{ p: "6px" }}>
                        <Search sx={{ color: "#6b7280", fontSize: 20 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "24px",
                    backgroundColor: "#f9fafb",
                    "& fieldset": {
                      borderColor: "#e5e7eb",
                    },
                    "&:hover fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#ffffff",
                      borderWidth: "1px",
                    },
                  },
                }}
              />
            </Box>

            {/* Right Icons */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {isAuthenticated && user ? (
                <>
                  <Box
                    onClick={handleUserMenuOpen}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      color: "#1f2937",
                      borderRadius: 2,
                      px: 1,
                      py: 0.5,
                      "&:hover": { backgroundColor: "#f3f4f6" },
                    }}
                  >
                    <Avatar
                      src={user.avatarUrl}
                      alt={displayName}
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: "0.9rem",
                        border: "2.5px solid #f97316",
                        boxShadow: "0 0 0 2px #fff, 0 0 0 4px #f97316",
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ fontSize: "0.8rem", fontWeight: 500, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Hi, {displayName}
                    </Box>
                  </Box>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleUserMenuClose}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" } } }}
                  >
                    <MenuItem onClick={() => { handleUserMenuClose(); navigate(PAGE_ENDPOINTS.USER.PROFILE); }} sx={{ gap: 1.5, py: 1.25 }}>
                      <AccountCircle fontSize="small" sx={{ color: "#6b7280" }} />
                      <Typography variant="body2">View my profile</Typography>
                    </MenuItem>

                    <MenuItem onClick={() => { handleUserMenuClose(); navigate(PAGE_ENDPOINTS.ORDER.MY_ORDERS); }} sx={{ gap: 1.5, py: 1.25 }}>
                      <Receipt fontSize="small" sx={{ color: "#6b7280" }} />
                      <Typography variant="body2">View my orders</Typography>
                    </MenuItem>

                    <MenuItem onClick={() => { handleUserMenuClose(); navigate(PAGE_ENDPOINTS.WARRANTY.MAIN); }} sx={{ gap: 1.5, py: 1.25 }}>
                      <VerifiedUser fontSize="small" sx={{ color: "#6b7280" }} />
                      <Typography variant="body2">My warranty</Typography>
                    </MenuItem>

                    {myShop ? (
                      <MenuItem onClick={() => { handleUserMenuClose(); navigate(PAGE_ENDPOINTS.SHOP.DASHBOARD); }} sx={{ gap: 1.5, py: 1.25 }}>
                        <Store fontSize="small" sx={{ color: "#6b7280" }} />
                        <Typography variant="body2">View my shop</Typography>
                      </MenuItem>
                    ) : (
                      <MenuItem onClick={() => { handleUserMenuClose(); navigate(PAGE_ENDPOINTS.SHOP.REGISTER); }} sx={{ gap: 1.5, py: 1.25 }}>
                        <AddBusiness fontSize="small" sx={{ color: "#6b7280" }} />
                        <Typography variant="body2">Become a shop owner</Typography>
                      </MenuItem>
                    )}

                    <Divider />

                    <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.25, color: "#dc2626" }}>
                      <Logout fontSize="small" />
                      <Typography variant="body2">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <IconButton
                  size="small"
                  component={Link}
                  to="/login"
                  sx={{
                    flexDirection: "column",
                    color: "#1f2937",
                    borderRadius: 1,
                  }}
                >
                  <Person sx={{ fontSize: 24 }} />
                  <Box sx={{ fontSize: "0.7rem", mt: 0.25 }}>Login</Box>
                </IconButton>
              )}

              <IconButton
                size="small"
                sx={{
                  flexDirection: "column",
                  color: "#1f2937",
                  borderRadius: 1,
                }}
              >
                <Favorite sx={{ fontSize: 24 }} />
                <Box sx={{ fontSize: "0.7rem", mt: 0.25 }}>Favorites</Box>
              </IconButton>

              <IconButton
                size="small"
                sx={{
                  flexDirection: "column",
                  color: "#1f2937",
                  borderRadius: 1,
                }}
              >
                <Help sx={{ fontSize: 24 }} />
                <Box sx={{ fontSize: "0.7rem", mt: 0.25 }}>Help</Box>
              </IconButton>

              <IconButton
                size="small"
                onClick={() => navigate('/cart')}
                sx={{
                  flexDirection: "column",
                  color: "#1f2937",
                  borderRadius: 1,
                }}
              >
                <Badge
                  badgeContent={itemCount}
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "#dc2626",
                      animation: isAnimating ? 'cartBounce 0.6s ease-out' : 'none',
                      '@keyframes cartBounce': {
                        '0%': { transform: 'scale(1) translate(50%, -50%)' },
                        '30%': { transform: 'scale(1.6) translate(50%, -50%)' },
                        '50%': { transform: 'scale(0.8) translate(50%, -50%)' },
                        '70%': { transform: 'scale(1.2) translate(50%, -50%)' },
                        '100%': { transform: 'scale(1) translate(50%, -50%)' },
                      },
                    },
                  }}
                >
                  <ShoppingCart sx={{
                    fontSize: 24,
                    animation: isAnimating ? 'cartShake 0.5s ease-in-out' : 'none',
                    '@keyframes cartShake': {
                      '0%': { transform: 'rotate(0deg)' },
                      '25%': { transform: 'rotate(-12deg)' },
                      '50%': { transform: 'rotate(12deg)' },
                      '75%': { transform: 'rotate(-5deg)' },
                      '100%': { transform: 'rotate(0deg)' },
                    },
                  }} />
                </Badge>
                <Box sx={{ fontSize: "0.7rem", mt: 0.25 }}>Cart</Box>
              </IconButton>
            </Box>
          </Toolbar>

          {/* Main Navigation */}
          {showNavCategories && (
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
                gap: 0.5,
                py: 1,
                borderTop: "1px solid #e5e7eb",
              }}
            >
              {mainCategories.map((item) => (
                <Button
                  key={item.path + item.label}
                  onClick={() => handleCategoryClick(item)}
                  sx={{
                    backgroundColor: "transparent",
                    color: item.special ? "#000000" : "#000000",
                    fontWeight: item.special ? 600 : 500,
                    px: 2,
                    py: 0.75,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    boxShadow: "none",
                    ":hover": {
                      boxShadow: "none",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "20px",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Mobile Search */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: { xs: "block", md: "none" },
              pb: 2,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search glasses"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "24px",
                  backgroundColor: "#f9fafb",
                },
              }}
            />
          </Box>
        </Container>
      </AppBar>
    </>
  );
};
