import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Dashboard,
  Inventory,
  ShoppingCart,
  AccountBalance,
  StorefrontOutlined,
  Settings,
  HelpCenter,
  Store,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

interface ShopOwnerSidebarProps {
  activeMenu?: string;
  shopName?: string;
  shopLogo?: string;
  ownerName?: string;
  ownerEmail?: string;
}

export const ShopOwnerSidebar = ({
  activeMenu,
  shopName,
  shopLogo,
  ownerName,
  ownerEmail,
}: ShopOwnerSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const menuItems = [
    { icon: <Dashboard />, label: 'Dashboard', path: PAGE_ENDPOINTS.SHOP.DASHBOARD },
    { icon: <StorefrontOutlined />, label: 'Shop Profile', path: PAGE_ENDPOINTS.SHOP.EDIT_PROFILE },
    { icon: <Inventory />, label: 'Products', path: '/shop/products' },
    { icon: <ShoppingCart />, label: 'Orders', path: '/shop/orders' },
    { icon: <AccountBalance />, label: 'Bank Accounts', path: PAGE_ENDPOINTS.SHOP.BANK_ACCOUNTS },
  ];

  const isActive = (path: string) => {
    return activeMenu === path || location.pathname === path;
  };

  const bottomMenuItems = [
    { icon: <Settings />, label: 'Settings', path: '/shop/settings' },
    { icon: <HelpCenter />, label: 'Help Center', path: '/shop/help' },
  ];

  return (
    <Box
      sx={{
        width: 240,
        minHeight: '100vh',
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
      <List sx={{ flex: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.label}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              backgroundColor: isActive(item.path)
                ? theme.palette.custom.neutral[100]
                : 'transparent',
              '&:hover': {
                backgroundColor: theme.palette.custom.neutral[100],
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: theme.palette.text.secondary }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: isActive(item.path) ? 600 : 500,
                color: theme.palette.text.primary,
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* Bottom Menu */}
      <List sx={{ px: 1 }}>
        {bottomMenuItems.map((item) => (
          <ListItemButton
            key={item.label}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                backgroundColor: theme.palette.custom.neutral[100],
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: theme.palette.text.secondary }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 500,
                color: theme.palette.text.primary,
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* User Profile */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
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
        <ExpandMore sx={{ color: theme.palette.text.secondary }} />
      </Box>
    </Box>
  );
};
