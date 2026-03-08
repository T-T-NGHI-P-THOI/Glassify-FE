import { Box, TextField, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import type { TrendParams } from '@/api/admin-analytics-api';

interface DateRangeFilterProps {
  params: TrendParams;
  onChange: (p: TrendParams) => void;
  onExport?: () => void;
  showPeriod?: boolean;
}

export const DateRangeFilter = ({ params, onChange, onExport, showPeriod = true }: DateRangeFilterProps) => {
  const today = new Date().toISOString().split('T')[0];
  const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      {showPeriod && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={params.period || 'MONTHLY'}
          onChange={(_, v) => v && onChange({ ...params, period: v })}
          sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: 12, textTransform: 'none' } }}
        >
          <ToggleButton value="DAILY">Daily</ToggleButton>
          <ToggleButton value="WEEKLY">Weekly</ToggleButton>
          <ToggleButton value="MONTHLY">Monthly</ToggleButton>
        </ToggleButtonGroup>
      )}
      <TextField
        type="date"
        size="small"
        label="From"
        value={params.from || defaultFrom}
        onChange={(e) => onChange({ ...params, from: e.target.value })}
        InputLabelProps={{ shrink: true }}
        sx={{ width: 150, '& .MuiInputBase-root': { fontSize: 13 } }}
      />
      <TextField
        type="date"
        size="small"
        label="To"
        value={params.to || today}
        onChange={(e) => onChange({ ...params, to: e.target.value })}
        InputLabelProps={{ shrink: true }}
        inputProps={{ max: today }}
        sx={{ width: 150, '& .MuiInputBase-root': { fontSize: 13 } }}
      />
      {onExport && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileDownload sx={{ fontSize: 16 }} />}
          onClick={onExport}
          sx={{ textTransform: 'none', fontSize: 13, borderColor: '#ddd', color: '#555' }}
        >
          Export
        </Button>
      )}
    </Box>
  );
};
