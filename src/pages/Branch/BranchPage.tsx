import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TableSortLabel,
  Checkbox,
  Avatar,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Warehouse,
  Store,
  LocationOn,
  Phone,
  Person,
  MoreVert,
  Search,
  Add,
  Inventory,
  LocalShipping,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { CustomButton } from '@/components/custom';

type BranchType = 'HUB' | 'FEEDER';

interface Branch {
  branchId: number;
  branchName: string;
  branchCode: string;
  type: BranchType;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  managerId: number;
  managerName: string;
  managerAvatar: string;
  isActive: boolean;
  createdAt: string;
  // Stats
  totalInventory: number;
  pendingTransfers: number;
  totalStaff: number;
}

// Mock data for branches
const branchesData: Branch[] = [
  {
    branchId: 1,
    branchName: 'HCM - Quận 1 Hub',
    branchCode: 'HCM-Q1-HUB',
    type: 'HUB',
    address: '123 Nguyễn Huệ, Phường Bến Nghé',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    phone: '028-3823-4567',
    email: 'q1hub@glassify.vn',
    managerId: 101,
    managerName: 'Nguyễn Văn Minh',
    managerAvatar: '/avatars/manager1.jpg',
    isActive: true,
    createdAt: '2023-01-15T08:00:00',
    totalInventory: 1250,
    pendingTransfers: 5,
    totalStaff: 15,
  },
  {
    branchId: 2,
    branchName: 'HCM - Quận 7 Hub',
    branchCode: 'HCM-Q7-HUB',
    type: 'HUB',
    address: '456 Nguyễn Văn Linh, Phường Tân Phong',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 7',
    phone: '028-3773-8900',
    email: 'q7hub@glassify.vn',
    managerId: 102,
    managerName: 'Trần Thị Hoa',
    managerAvatar: '/avatars/manager2.jpg',
    isActive: true,
    createdAt: '2023-02-20T08:00:00',
    totalInventory: 980,
    pendingTransfers: 3,
    totalStaff: 12,
  },
  {
    branchId: 3,
    branchName: 'HCM - Thủ Đức',
    branchCode: 'HCM-TD-FD',
    type: 'FEEDER',
    address: '789 Võ Văn Ngân, Phường Linh Chiểu',
    city: 'TP. Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    phone: '028-3720-1234',
    email: 'thuduc@glassify.vn',
    managerId: 103,
    managerName: 'Lê Văn Cường',
    managerAvatar: '/avatars/manager3.jpg',
    isActive: true,
    createdAt: '2023-03-10T08:00:00',
    totalInventory: 450,
    pendingTransfers: 2,
    totalStaff: 8,
  },
  {
    branchId: 4,
    branchName: 'HCM - Bình Thạnh',
    branchCode: 'HCM-BT-FD',
    type: 'FEEDER',
    address: '321 Điện Biên Phủ, Phường 15',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận Bình Thạnh',
    phone: '028-3840-5678',
    email: 'binhthanh@glassify.vn',
    managerId: 104,
    managerName: 'Phạm Thị Dung',
    managerAvatar: '/avatars/manager4.jpg',
    isActive: true,
    createdAt: '2023-04-05T08:00:00',
    totalInventory: 380,
    pendingTransfers: 1,
    totalStaff: 6,
  },
  {
    branchId: 5,
    branchName: 'HCM - Tân Bình',
    branchCode: 'HCM-TB-FD',
    type: 'FEEDER',
    address: '654 Cộng Hòa, Phường 13',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận Tân Bình',
    phone: '028-3811-9012',
    email: 'tanbinh@glassify.vn',
    managerId: 105,
    managerName: 'Hoàng Văn Đức',
    managerAvatar: '/avatars/manager5.jpg',
    isActive: true,
    createdAt: '2023-05-15T08:00:00',
    totalInventory: 520,
    pendingTransfers: 4,
    totalStaff: 7,
  },
  {
    branchId: 6,
    branchName: 'HCM - Gò Vấp',
    branchCode: 'HCM-GV-FD',
    type: 'FEEDER',
    address: '987 Quang Trung, Phường 10',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận Gò Vấp',
    phone: '028-3894-3456',
    email: 'govap@glassify.vn',
    managerId: 106,
    managerName: 'Ngô Thị Hồng',
    managerAvatar: '/avatars/manager6.jpg',
    isActive: false,
    createdAt: '2023-06-20T08:00:00',
    totalInventory: 0,
    pendingTransfers: 0,
    totalStaff: 0,
  },
];

const BranchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { setShowNavbar, setShowFooter } = useLayout();

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const totalBranches = branchesData.length;
  const hubCount = branchesData.filter((b) => b.type === 'HUB').length;
  const feederCount = branchesData.filter((b) => b.type === 'FEEDER').length;
  const activeBranches = branchesData.filter((b) => b.isActive).length;

  const handleRowClick = (branchId: number) => {
    navigate(PAGE_ENDPOINTS.TRACKING.BRANCH_DETAIL.replace(':id', branchId.toString()));
  };

  const stats = [
    {
      icon: <Warehouse sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Total Branches',
      value: totalBranches.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
    {
      icon: <Store sx={{ color: theme.palette.custom.status.info.main }} />,
      label: 'Hub Branches',
      value: hubCount.toLocaleString(),
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <LocalShipping sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Feeder Branches',
      value: feederCount.toLocaleString(),
      bgColor: theme.palette.custom.status.warning.light,
    },
    {
      icon: <Inventory sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Active Branches',
      value: activeBranches.toLocaleString(),
      bgColor: theme.palette.custom.status.success.light,
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.BRANCH} />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 1 }}
            >
              Branch Management
            </Typography>
            <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>
              Quản lý thông tin các chi nhánh trong hệ thống
            </Typography>
          </Box>
          <CustomButton
            variant="contained"
            startIcon={<Add />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Add Branch
          </CustomButton>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography
                  sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}
                >
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Branch List */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[800] }}
            >
              Branch List
            </Typography>
            <TextField
              placeholder="Search branches..."
              size="small"
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.custom.neutral[400] }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Branch
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Type
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Location
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Manager
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Inventory
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Transfers
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                      Status
                    </Typography>
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {branchesData.map((branch) => {
                  const typeColor = branch.type === 'HUB'
                    ? { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main }
                    : { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };

                  const statusColor = branch.isActive
                    ? { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main }
                    : { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };

                  return (
                    <TableRow
                      key={branch.branchId}
                      hover
                      onClick={() => handleRowClick(branch.branchId)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.custom.neutral[50],
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              backgroundColor: typeColor.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {branch.type === 'HUB' ? (
                              <Store sx={{ color: typeColor.color, fontSize: 20 }} />
                            ) : (
                              <Warehouse sx={{ color: typeColor.color, fontSize: 20 }} />
                            )}
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                              {branch.branchName}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              {branch.branchCode}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={branch.type}
                          size="small"
                          sx={{
                            backgroundColor: typeColor.bg,
                            color: typeColor.color,
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationOn sx={{ fontSize: 16, color: theme.palette.custom.neutral[400], mt: 0.3 }} />
                          <Box>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[800] }}>
                              {branch.district}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              {branch.city}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={branch.managerAvatar}
                            sx={{ width: 32, height: 32, bgcolor: theme.palette.custom.neutral[200] }}
                          >
                            {branch.managerName[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                              {branch.managerName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }} />
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                                {branch.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Inventory sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {branch.totalInventory.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {branch.pendingTransfers > 0 ? (
                          <Chip
                            label={`${branch.pendingTransfers} pending`}
                            size="small"
                            sx={{
                              backgroundColor: theme.palette.custom.status.warning.light,
                              color: theme.palette.custom.status.warning.main,
                              fontWeight: 500,
                              fontSize: 11,
                            }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>
                            No pending
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={branch.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.color,
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                          <MoreVert sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default BranchPage;
