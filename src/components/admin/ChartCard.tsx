import { Box, Paper, Typography, Skeleton } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  option: EChartsOption;
  height?: number;
  loading?: boolean;
  headerRight?: React.ReactNode;
}

export const ChartCard = ({ title, subtitle, option, height = 300, loading, headerRight }: ChartCardProps) => {
  return (
    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize: 12, color: '#888', mt: 0.25 }}>{subtitle}</Typography>}
        </Box>
        {headerRight}
      </Box>
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
        ) : (
          <ReactECharts option={option} style={{ height }} notMerge />
        )}
      </Box>
    </Paper>
  );
};
