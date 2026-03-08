import { Box, Paper, Typography, Chip, Skeleton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  growth?: number | null;
  bgColor?: string;
  loading?: boolean;
}

export const KpiCard = ({ icon, label, value, subValue, growth, bgColor, loading }: KpiCardProps) => {
  const theme = useTheme();
  const hasGrowth = growth !== null && growth !== undefined;

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
        <Skeleton variant="rectangular" width={44} height={44} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton width="60%" height={14} sx={{ mb: 1 }} />
        <Skeleton width="80%" height={32} sx={{ mb: 0.5 }} />
        <Skeleton width="50%" height={12} />
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2,
          backgroundColor: bgColor || theme.palette.custom.neutral[100],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </Box>
        {hasGrowth && (
          <Chip
            icon={growth! >= 0 ? <ArrowUpward sx={{ fontSize: 13 }} /> : <ArrowDownward sx={{ fontSize: 13 }} />}
            label={`${Math.abs(growth!).toFixed(1)}%`}
            size="small"
            sx={{
              height: 24, fontSize: 11, fontWeight: 600,
              backgroundColor: growth! >= 0 ? theme.palette.custom.status.success.light : theme.palette.custom.status.error.light,
              color: growth! >= 0 ? theme.palette.custom.status.success.main : theme.palette.custom.status.error.main,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        )}
      </Box>
      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
        {value}
      </Typography>
      {subValue && (
        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
          {subValue}
        </Typography>
      )}
    </Paper>
  );
};
