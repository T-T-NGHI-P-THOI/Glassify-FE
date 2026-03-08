import { Chip } from '@mui/material';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE:     { bg: '#e8f5e9', color: '#2e7d32' },
  PENDING:    { bg: '#fff8e1', color: '#f57f17' },
  INACTIVE:   { bg: '#f5f5f5', color: '#757575' },
  SUSPENDED:  { bg: '#fce4ec', color: '#c62828' },
  CLOSING:    { bg: '#fafafa', color: '#9e9e9e' },
  CONFIRMED:  { bg: '#e3f2fd', color: '#1565c0' },
  PROCESSING: { bg: '#fff3e0', color: '#e65100' },
  SHIPPED:    { bg: '#e8eaf6', color: '#3949ab' },
  DELIVERED:  { bg: '#e8f5e9', color: '#2e7d32' },
  CANCELLED:  { bg: '#ffebee', color: '#b71c1c' },
  REFUNDED:   { bg: '#ede7f6', color: '#4527a0' },
};

export const StatusChip = ({ status }: { status: string }) => {
  const style = STATUS_COLORS[status] || { bg: '#f5f5f5', color: '#555' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 600, fontSize: 11 }}
    />
  );
};
