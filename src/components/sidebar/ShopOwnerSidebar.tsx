import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Dashboard,
  Inventory,
  ShoppingCart,
  AccountBalance,
  AccountBalanceWallet,
  StorefrontOutlined,
  AssignmentReturn,
  Settings,
  HelpCenter,
  Store,
  ExpandMore,
  ExpandLess,
  PeopleAlt,
  Build,
  Logout,
} from '@mui/icons-material';
import { Collapse } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { logOut } from '@/auth/Reducer';
import { shopApi } from '@/api/shopApi';
import { Verified } from 'lucide-react';

interface ShopOwnerSidebarProps {
  activeMenu?: string;
  shopName?: string;
  shopLogo?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerAvatar?: string;
}

export const ShopOwnerSidebar = ({
  activeMenu,
  shopName: shopNameProp,
  shopLogo: shopLogoProp,
  ownerName,
  ownerEmail,
  ownerAvatar,
}: ShopOwnerSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { dispatch } = useAuth();
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [shopName, setShopName] = useState(shopNameProp);
  const [shopLogo, setShopLogo] = useState(shopLogoProp);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Products: location.pathname.startsWith('/shop/products') || activeMenu === PAGE_ENDPOINTS.SHOP.PRODUCTS || activeMenu === PAGE_ENDPOINTS.SHOP.PRODUCT_LENS,
    Warranty: location.pathname.startsWith('/shop/warranty') || activeMenu === PAGE_ENDPOINTS.SHOP.WARRANTY || activeMenu === PAGE_ENDPOINTS.SHOP.WARRANTY_POLICIES || activeMenu === PAGE_ENDPOINTS.SHOP.WARRANTY_ISSUE_TYPES,
  });

  useEffect(() => {
    if (shopNameProp) {
      setShopName(shopNameProp);
      setShopLogo(shopLogoProp);
      return;
    }
    shopApi.getMyShops().then((res) => {
      const s = res.data?.[0];
      if (s) {
        setShopName(s.shopName);
        setShopLogo(s.logoUrl ?? undefined);
      }
    }).catch(() => {});
  }, [shopNameProp, shopLogoProp]);

  const handleProfileMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(e.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    dispatch(logOut());
    navigate('/');
  };

  const TRANSITION = 'background-color 0.18s ease, color 0.18s ease, opacity 0.18s ease';

  useEffect(() => {
    if (location.pathname.startsWith('/shop/products')) {
      setExpandedGroups(prev => ({ ...prev, Products: true }));
    }
    if (location.pathname.startsWith('/shop/warranty')) {
      setExpandedGroups(prev => ({ ...prev, Warranty: true }));
    }
  }, [location.pathname]);

  interface SidebarMenuItem {
    icon: React.ReactNode;
    label: string;
    path?: string;
    children?: Array<{ label: string; path: string }>;
  }

  const menuItems: SidebarMenuItem[] = [
    { icon: <Dashboard />, label: 'Dashboard', path: PAGE_ENDPOINTS.SHOP.DASHBOARD },
    { icon: <StorefrontOutlined />, label: 'Shop Profile', path: PAGE_ENDPOINTS.SHOP.EDIT_PROFILE },
    {
      icon: <Inventory />,
      label: 'Products',
      children: [
        { label: 'Frame List', path: PAGE_ENDPOINTS.SHOP.PRODUCT_FRAME },
        { label: 'Lens List', path: PAGE_ENDPOINTS.SHOP.PRODUCT_LENS },
        { label: 'Accessory List', path: PAGE_ENDPOINTS.SHOP.PRODUCT_ACCESSORY }
      ],
    },
    { icon: <Verified />, label: 'Product Verification', path: PAGE_ENDPOINTS.SHOP.PRODUCT_VERIFICATION },
    { icon: <ShoppingCart />, label: 'Orders', path: '/shop/orders' },
    { icon: <AssignmentReturn />, label: 'Refund Review', path: PAGE_ENDPOINTS.SHOP.REFUND_REVIEW },
    { icon: <AccountBalance />, label: 'Bank Accounts', path: PAGE_ENDPOINTS.SHOP.BANK_ACCOUNTS },
    { icon: <AccountBalanceWallet />, label: 'Wallet', path: PAGE_ENDPOINTS.SHOP.WALLET },
    { icon: <PeopleAlt />, label: 'Staff', path: PAGE_ENDPOINTS.SHOP.STAFF },
    {
      icon: <Build />,
      label: 'Warranty',
      children: [
        { label: 'Warranty Claims', path: PAGE_ENDPOINTS.SHOP.WARRANTY },
        { label: 'Policies & Pricing', path: PAGE_ENDPOINTS.SHOP.WARRANTY_POLICIES },
        { label: 'Issue Types', path: PAGE_ENDPOINTS.SHOP.WARRANTY_ISSUE_TYPES },
      ],
    },
  ];

  const isActive = (path: string) => {
    return activeMenu === path || location.pathname === path;
  };

  const isGroupActive = (item: SidebarMenuItem) => {
    if (item.children) {
      return item.children.some(child => isActive(child.path));
    }
    return item.path ? isActive(item.path) : false;
  };

  const bottomMenuItems = [
    { icon: <Settings />, label: 'Settings', path: '/shop/settings' },
    { icon: <HelpCenter />, label: 'Help Center', path: '/shop/help' },
  ];

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            backgroundColor: theme.palette.primary.main,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Store sx={{ color: theme.palette.primary.contrastText, fontSize: 20 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>GLASSIFY</Typography>
      </Box>

      {/* Shop Info */}
      {shopName && (
        <Box
          sx={{
            mx: 1.5,
            mb: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: theme.palette.custom.neutral[50],
            border: `1px solid ${theme.palette.custom.border.light}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            variant="rounded"
            src={shopLogo}
            sx={{ width: 36, height: 36, bgcolor: theme.palette.custom.neutral[200] }}
          >
            <Store sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.palette.text.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {shopName}
            </Typography>
            <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.success.main, fontWeight: 500 }}>
              Shop Owner
            </Typography>
          </Box>
        </Box>
      )}

      {/* Main Menu */}
      <List sx={{ flex: 1, px: 1, overflowY: 'auto', minHeight: 0, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {menuItems.map((item) => {
          if (item.children) {
            const groupActive = isGroupActive(item);
            const isOpen = expandedGroups[item.label] || false;

            return (
              <Box key={item.label}>
                <ListItemButton
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [item.label]: !isOpen }))}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    transition: TRANSITION,
                    backgroundColor: groupActive ? theme.palette.custom.neutral[100] : 'transparent',
                    '&:hover': { backgroundColor: theme.palette.custom.neutral[100] },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      transition: TRANSITION,
                      color: groupActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        style: {
                          fontSize: 14,
                          fontWeight: groupActive ? 600 : 500,
                          color: groupActive ? theme.palette.primary.main : theme.palette.text.primary,
                          transition: TRANSITION,
                        },
                      },
                    }}
                  />
                  {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </ListItemButton>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.children.map((child) => {
                      const childActive = isActive(child.path);
                      return (
                        <ListItemButton
                          key={child.label}
                          onClick={() => navigate(child.path)}
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            ml: 1,
                            pl: 5,
                            transition: TRANSITION,
                            backgroundColor: childActive ? theme.palette.custom.neutral[100] : 'transparent',
                            '&:hover': { backgroundColor: theme.palette.custom.neutral[100] },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                style: {
                                  fontSize: 13,
                                  fontWeight: childActive ? 600 : 500,
                                  color: childActive ? theme.palette.primary.main : theme.palette.text.primary,
                                  transition: TRANSITION,
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          const active = item.path ? isActive(item.path) : false;
          return (
            <ListItemButton
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                transition: TRANSITION,
                backgroundColor: active ? theme.palette.custom.neutral[100] : 'transparent',
                '&:hover': { backgroundColor: theme.palette.custom.neutral[100] },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  transition: TRANSITION,
                  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    style: {
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      color: active ? theme.palette.primary.main : theme.palette.text.primary,
                      transition: TRANSITION,
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Bottom Menu */}
      <List sx={{ px: 1 }}>
        {bottomMenuItems.map((item) => (
          <ListItemButton
            key={item.label}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              transition: TRANSITION,
              '&:hover': { backgroundColor: theme.palette.custom.neutral[100] },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: theme.palette.text.secondary }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  style: { fontSize: 14, fontWeight: 500, color: theme.palette.text.primary },
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* User Profile */}
      <Box
        onClick={handleProfileMenuOpen}
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          transition: TRANSITION,
          '&:hover': { bgcolor: theme.palette.custom.neutral[100] },
        }}
      >
        <Avatar
          src={ownerAvatar}
          sx={{ width: 36, height: 36, bgcolor: theme.palette.custom.neutral[200] }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.palette.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ownerName || 'Shop Owner'}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: theme.palette.text.secondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ownerEmail || 'owner@email.com'}
          </Typography>
        </Box>
        <ExpandMore
          sx={{
            color: theme.palette.text.secondary,
            transition: 'transform 0.2s',
            transform: Boolean(profileAnchorEl) ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </Box>

      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', mb: 1 } } }}
      >
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.25, color: '#dc2626' }}>
          <Logout fontSize="small" />
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};
