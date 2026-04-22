import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Dashboard,
  LocalShipping,
  Inventory,
  AccountBalance,
  Widgets,
  People,
  Notifications,
  Message,
  Settings,
  HelpCenter,
  ExpandLess,
  ExpandMore,
  AdminPanelSettings,
  CardTravel,
  Logout,
  ShoppingCart,
  AssignmentReturn,
  VerifiedUser,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { logOut } from '@/auth/Reducer';

interface SidebarProps {
  activeMenu?: string;
}

export const Sidebar = ({ activeMenu }: SidebarProps) => {
  const [trackingOpen, setTrackingOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);
  const [transactionsOpen, setTransactionsOpen] = useState(true);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, dispatch } = useAuth();

  const handleLogout = () => {
    setProfileAnchorEl(null);
    dispatch(logOut());
    navigate('/');
  };

  const menuItems = [
    { icon: <Dashboard />, label: 'Dashboard', path: PAGE_ENDPOINTS.DASHBOARD },
    {
      icon: <LocalShipping />,
      label: 'Tracking',
      path: '/tracking',
      key: 'tracking',
      subItems: [
        { label: 'Shops', path: PAGE_ENDPOINTS.TRACKING.SHOPS },
      ],
    },
    {
      icon: <AdminPanelSettings />,
      label: 'Admin',
      path: '/admin',
      key: 'admin',
      subItems: [
        { label: 'Shop Approval', path: PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL },
        { label: 'User Management', path: PAGE_ENDPOINTS.ADMIN.USER_MANAGEMENT },
        // ── NEW: product verification queue ──
        { label: 'Product Verification', path: PAGE_ENDPOINTS.ADMIN.VERIFY_PRODUCT },
      ],
    },
    {
      icon: <ShoppingCart />,
      label: 'Transactions',
      path: '/transactions',
      key: 'transactions',
      subItems: [
        { label: 'Orders', path: PAGE_ENDPOINTS.ADMIN.ORDERS },
        { label: 'Refunds', path: PAGE_ENDPOINTS.ADMIN.REFUNDS },
        { label: 'Warranties', path: PAGE_ENDPOINTS.ADMIN.WARRANTIES },
        { label: 'Finance', path: PAGE_ENDPOINTS.ADMIN.TRANSACTIONS },
      ],
    },
    { icon: <AccountBalance />, label: 'Cashflow', path: '/cashflow' },
    { icon: <Widgets />, label: 'Unit', path: '/unit' },
    { icon: <People />, label: 'Customers', path: '/customers' },
    { icon: <Notifications />, label: 'Notification', path: '/notification' },
    { icon: <Message />, label: 'Message', path: '/message' },
  ];

  const isActive = (path: string) => {
    return activeMenu === path || location.pathname === path;
  };

  const bottomMenuItems = [
    { icon: <Settings />, label: 'Settings', path: '/admin/settings' },
    { icon: <HelpCenter />, label: 'Help Center', path: '/help' },
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
          <LocalShipping sx={{ color: theme.palette.primary.contrastText, fontSize: 20 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>GLASSIFY</Typography>
      </Box>

      {/* Main Menu */}
      <List sx={{ flex: 1, px: 1, overflowY: 'auto', minHeight: 0, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {menuItems.map((item) => {
          const isMenuOpen =
            item.key === 'tracking' ? trackingOpen
            : item.key === 'admin' ? adminOpen
            : item.key === 'transactions' ? transactionsOpen
            : false;
          const toggleMenu = () => {
            if (item.key === 'tracking') setTrackingOpen(!trackingOpen);
            else if (item.key === 'admin') setAdminOpen(!adminOpen);
            else if (item.key === 'transactions') setTransactionsOpen(!transactionsOpen);
          };

          return (
            <Box key={item.label}>
              <ListItemButton
                onClick={() => {
                  if (item.subItems) {
                    toggleMenu();
                  } else {
                    navigate(item.path);
                  }
                }}
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
                {item.subItems &&
                  (isMenuOpen ? (
                    <ExpandLess sx={{ color: theme.palette.text.secondary }} />
                  ) : (
                    <ExpandMore sx={{ color: theme.palette.text.secondary }} />
                  ))}
              </ListItemButton>

              {item.subItems && (
                <Collapse in={isMenuOpen} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.label}
                        onClick={() => navigate(subItem.path)}
                        sx={{
                          pl: 6,
                          py: 0.75,
                          borderRadius: 2,
                          backgroundColor: isActive(subItem.path)
                            ? theme.palette.custom.neutral[100]
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: theme.palette.custom.neutral[100],
                          },
                        }}
                      >
                        <ListItemText
                          primary={subItem.label}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: isActive(subItem.path) ? 600 : 400,
                            color: isActive(subItem.path)
                              ? theme.palette.custom.status.black.main
                              : theme.palette.text.secondary,
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>

      {/* Bottom Menu */}
      <List sx={{ px: 1 }}>
        {bottomMenuItems.map((item) => (
          <ListItemButton
            key={item.label}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              backgroundColor: isActive(item.path) ? theme.palette.custom.neutral[100] : 'transparent',
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
        onClick={(e) => setProfileAnchorEl(e.currentTarget)}
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: theme.palette.custom.neutral[50] },
        }}
      >
        <Avatar
          sx={{ width: 36, height: 36, bgcolor: theme.palette.custom.neutral[200] }}
          src={user?.avatarUrl || ''}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username || 'User'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || ''}
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
        onClose={() => setProfileAnchorEl(null)}
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