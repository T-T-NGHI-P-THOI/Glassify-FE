import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Snackbar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Settings,
  Edit,
  History,
  AttachMoney,
  AssignmentReturn,
  Visibility,
  CheckCircle,
  ContentCopy,
  RestartAlt,
  Inventory2,
  Save,
  Cancel,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import platformSettingApi from '@/api/platformSettingApi';
import type { PlatformSettingResponse, PlatformSettingUpdateRequest } from '@/models/PlatformSetting';
import { adminApi, type CommissionTierResponse, type UpdateCommissionTierRequest } from '@/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(v: number | undefined | null) {
  if (v == null) return '—';
  return String(v);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN');
}

function shortId(id: string) {
  return id.slice(0, 8) + '…';
}

type DiffEntry = { label: string; from: string; to: string };

function flattenSetting(s: PlatformSettingResponse): Record<string, string> {
  return {
    'Platform Name': String(s.platformName ?? ''),
    'Commission Rate': `${s.defaultCommissionRate ?? ''}%`,
    'Escrow Hold Days': `${s.escrowHoldDays ?? ''} days`,
    'Return Window': `${s.returnWindowDays ?? ''} days`,
    'Exchange Window': `${s.exchangeWindowDays ?? ''} days`,
    'Min Withdrawal': String(s.minWithdrawalAmount ?? ''),
    'Max Cart Qty': String(s.maxCartItemQty ?? ''),
    'Max Buyer Shipping Fee': String(s.maxBuyerShippingFee ?? ''),
    'Free Shipping Threshold': String(s.freeShippingThreshold ?? ''),
    'Refund Seller Deadline': `${s.refundSellerResponseDeadlineHours ?? ''} hrs`,
    'Refund Partial Min %': `${s.refundPartialMinPercent ?? ''}%`,
    'Refund Min Evidence Images': String(s.refundNoLongerNeededMinEvidenceImages ?? ''),
    'Refund Seller Reminder': `${s.refundSellerReminderAfterHours ?? ''} hrs`,
    'Refund Buyer Reminder': `${s.refundBuyerShipmentReminderAfterDays ?? ''} days`,
    'Stuck Shipment Warning': `${s.refundStuckShipmentWarningAfterDays ?? ''} days`,
    'Refund Processing Min': `${s.refundProcessingMinDays ?? ''} days`,
    'Refund Processing Max': `${s.refundProcessingMaxDays ?? ''} days`,
    'Auto Approval': String(s.refundAutoApprovalWithEvidence ?? ''),
    'Platform Review Escalation': String(s.refundPlatformReviewEscalation ?? ''),
    'SPH Min': String(s.sph?.min ?? ''),
    'SPH Max': String(s.sph?.max ?? ''),
    'SPH Step': String(s.sph?.step ?? ''),
    'CYL Min': String(s.cyl?.min ?? ''),
    'CYL Max': String(s.cyl?.max ?? ''),
    'CYL Step': String(s.cyl?.step ?? ''),
    'Axis Min': String(s.axis?.min ?? ''),
    'Axis Max': String(s.axis?.max ?? ''),
    'ADD Min': String(s.add?.min ?? ''),
    'ADD Max': String(s.add?.max ?? ''),
    'PD Min': String(s.pd?.min ?? ''),
    'PD Max': String(s.pd?.max ?? ''),
    'PD Split Min': String(s.pdSplit?.min ?? ''),
    'PD Split Max': String(s.pdSplit?.max ?? ''),
    'Pkg Frame (LxWxH cm)': `${s.packageDimensions?.frameLengthCm ?? ''}x${s.packageDimensions?.frameWidthCm ?? ''}x${s.packageDimensions?.frameHeightCm ?? ''}`,
    'Pkg Frame Weight': `${s.packageDimensions?.frameWeightG ?? ''} g`,
    'Pkg Lens (LxWxH cm)': `${s.packageDimensions?.lensLengthCm ?? ''}x${s.packageDimensions?.lensWidthCm ?? ''}x${s.packageDimensions?.lensHeightCm ?? ''}`,
    'Pkg Lens Weight': `${s.packageDimensions?.lensWeightG ?? ''} g`,
    'Pkg Accessory (LxWxH cm)': `${s.packageDimensions?.accessoryLengthCm ?? ''}x${s.packageDimensions?.accessoryWidthCm ?? ''}x${s.packageDimensions?.accessoryHeightCm ?? ''}`,
    'Pkg Accessory Weight': `${s.packageDimensions?.accessoryWeightG ?? ''} g`,
    'Pkg Gift (LxWxH cm)': `${s.packageDimensions?.giftLengthCm ?? ''}x${s.packageDimensions?.giftWidthCm ?? ''}x${s.packageDimensions?.giftHeightCm ?? ''}`,
    'Pkg Gift Weight': `${s.packageDimensions?.giftWeightG ?? ''} g`,
    'Carton S (LxWxH cm)': `${s.packageDimensions?.cartonSLengthCm ?? ''}x${s.packageDimensions?.cartonSWidthCm ?? ''}x${s.packageDimensions?.cartonSHeightCm ?? ''}`,
    'Carton S Tare': `${s.packageDimensions?.cartonSTareG ?? ''} g`,
    'Carton M (LxWxH cm)': `${s.packageDimensions?.cartonMLengthCm ?? ''}x${s.packageDimensions?.cartonMWidthCm ?? ''}x${s.packageDimensions?.cartonMHeightCm ?? ''}`,
    'Carton M Tare': `${s.packageDimensions?.cartonMTareG ?? ''} g`,
    'Carton L (LxWxH cm)': `${s.packageDimensions?.cartonLLengthCm ?? ''}x${s.packageDimensions?.cartonLWidthCm ?? ''}x${s.packageDimensions?.cartonLHeightCm ?? ''}`,
    'Carton L Tare': `${s.packageDimensions?.cartonLTareG ?? ''} g`,
    'Packing Buffer': String(s.packageDimensions?.packingBuffer ?? ''),
  };
}

function getChanges(current: PlatformSettingResponse, prev: PlatformSettingResponse): DiffEntry[] {
  const a = flattenSetting(prev);
  const b = flattenSetting(current);
  return Object.keys(b)
    .filter(k => a[k] !== b[k])
    .map(k => ({ label: k, from: a[k], to: b[k] }));
}

// ─── flat form state derived from PlatformSettingResponse ───────────────────

function toForm(s: PlatformSettingResponse): PlatformSettingUpdateRequest {
  return {
    platformName: s.platformName,
    defaultCommissionRate: s.defaultCommissionRate,
    escrowHoldDays: s.escrowHoldDays,
    returnWindowDays: s.returnWindowDays,
    exchangeWindowDays: s.exchangeWindowDays,
    minWithdrawalAmount: s.minWithdrawalAmount,
    maxCartItemQty: s.maxCartItemQty,
    maxBuyerShippingFee: s.maxBuyerShippingFee,
    freeShippingThreshold: s.freeShippingThreshold,

    refundSellerResponseDeadlineHours: s.refundSellerResponseDeadlineHours,
    refundPartialMinPercent: s.refundPartialMinPercent,
    refundNoLongerNeededMinEvidenceImages: s.refundNoLongerNeededMinEvidenceImages,
    refundSellerReminderAfterHours: s.refundSellerReminderAfterHours,
    refundBuyerShipmentReminderAfterDays: s.refundBuyerShipmentReminderAfterDays,
    refundStuckShipmentWarningAfterDays: s.refundStuckShipmentWarningAfterDays,
    refundProcessingMinDays: s.refundProcessingMinDays,
    refundProcessingMaxDays: s.refundProcessingMaxDays,
    refundAutoApprovalWithEvidence: s.refundAutoApprovalWithEvidence,
    refundPlatformReviewEscalation: s.refundPlatformReviewEscalation,

    sphMin: s.sph?.min, sphMax: s.sph?.max, sphStep: s.sph?.step,
    sphNormalAbsMax: s.sph?.normalAbsMax, sphWarnAbsMax: s.sph?.warnAbsMax,

    cylMin: s.cyl?.min, cylMax: s.cyl?.max, cylStep: s.cyl?.step,
    cylNormalAbsMax: s.cyl?.normalAbsMax, cylWarnAbsMax: s.cyl?.warnAbsMax,

    axisMin: s.axis?.min, axisMax: s.axis?.max,

    addMin: s.add?.min, addMax: s.add?.max, addStep: s.add?.step,
    addNormalMin: s.add?.normalMin, addNormalMax: s.add?.normalMax,

    pdMin: s.pd?.min, pdMax: s.pd?.max, pdStep: s.pd?.step,
    pdNormalMin: s.pd?.normalMin, pdNormalMax: s.pd?.normalMax,

    pdSplitMin: s.pdSplit?.min, pdSplitMax: s.pdSplit?.max, pdSplitStep: s.pdSplit?.step,
    pdSplitNormalMin: s.pdSplit?.normalMin, pdSplitNormalMax: s.pdSplit?.normalMax,

    prescriptionNote: s.prescriptionNote,

    pkgFrameLengthCm: s.packageDimensions?.frameLengthCm,
    pkgFrameWidthCm: s.packageDimensions?.frameWidthCm,
    pkgFrameHeightCm: s.packageDimensions?.frameHeightCm,
    pkgFrameWeightG: s.packageDimensions?.frameWeightG,
    pkgLensLengthCm: s.packageDimensions?.lensLengthCm,
    pkgLensWidthCm: s.packageDimensions?.lensWidthCm,
    pkgLensHeightCm: s.packageDimensions?.lensHeightCm,
    pkgLensWeightG: s.packageDimensions?.lensWeightG,
    pkgAccessoryLengthCm: s.packageDimensions?.accessoryLengthCm,
    pkgAccessoryWidthCm: s.packageDimensions?.accessoryWidthCm,
    pkgAccessoryHeightCm: s.packageDimensions?.accessoryHeightCm,
    pkgAccessoryWeightG: s.packageDimensions?.accessoryWeightG,
    pkgGiftLengthCm: s.packageDimensions?.giftLengthCm,
    pkgGiftWidthCm: s.packageDimensions?.giftWidthCm,
    pkgGiftHeightCm: s.packageDimensions?.giftHeightCm,
    pkgGiftWeightG: s.packageDimensions?.giftWeightG,
    pkgCartonSLengthCm: s.packageDimensions?.cartonSLengthCm,
    pkgCartonSWidthCm: s.packageDimensions?.cartonSWidthCm,
    pkgCartonSHeightCm: s.packageDimensions?.cartonSHeightCm,
    pkgCartonSTareG: s.packageDimensions?.cartonSTareG,
    pkgCartonMLengthCm: s.packageDimensions?.cartonMLengthCm,
    pkgCartonMWidthCm: s.packageDimensions?.cartonMWidthCm,
    pkgCartonMHeightCm: s.packageDimensions?.cartonMHeightCm,
    pkgCartonMTareG: s.packageDimensions?.cartonMTareG,
    pkgCartonLLengthCm: s.packageDimensions?.cartonLLengthCm,
    pkgCartonLWidthCm: s.packageDimensions?.cartonLWidthCm,
    pkgCartonLHeightCm: s.packageDimensions?.cartonLHeightCm,
    pkgCartonLTareG: s.packageDimensions?.cartonLTareG,
    pkgPackingBuffer: s.packageDimensions?.packingBuffer,
  };
}

// ─── sub-components ─────────────────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  value: string | number | boolean | undefined | null;
  unit?: string;
}
function FieldRow({ label, value, unit }: FieldRowProps) {
  const theme = useTheme();
  const display =
    typeof value === 'boolean'
      ? value
        ? 'Enabled'
        : 'Disabled'
      : value != null
      ? `${value}${unit ? ' ' + unit : ''}`
      : '—';
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
        {typeof value === 'boolean' ? (
          <Chip
            label={display}
            size="small"
            color={value ? 'success' : 'default'}
            sx={{ fontSize: 11, height: 20 }}
          />
        ) : display}
      </Typography>
    </Box>
  );
}

interface NumFieldProps {
  label: string;
  field: keyof PlatformSettingUpdateRequest;
  form: PlatformSettingUpdateRequest;
  onChange: (f: keyof PlatformSettingUpdateRequest, v: any) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
}
function NumField({ label, field, form, onChange, unit, step = 1, min, max }: NumFieldProps) {
  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      type="number"
      value={form[field] ?? ''}
      onChange={e => onChange(field, e.target.value === '' ? undefined : Number(e.target.value))}
      inputProps={{ step, min, max }}
      InputProps={{ endAdornment: unit ? <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>{unit}</Typography> : undefined }}
    />
  );
}

interface SwitchFieldProps {
  label: string;
  field: keyof PlatformSettingUpdateRequest;
  form: PlatformSettingUpdateRequest;
  onChange: (f: keyof PlatformSettingUpdateRequest, v: any) => void;
}
function SwitchField({ label, field, form, onChange }: SwitchFieldProps) {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={Boolean(form[field])}
          onChange={e => onChange(field, e.target.checked)}
          size="small"
        />
      }
      label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
    />
  );
}

// ─── section card ────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ color: theme.palette.primary.main, display: 'flex' }}>{icon}</Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{title}</Typography>
      </Box>
      {children}
    </Paper>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

const AdminSettingsPage = () => {
  const theme = useTheme();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [settings, setSettings] = useState<PlatformSettingResponse | null>(null);
  const [history, setHistory] = useState<PlatformSettingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState(0);
  const [form, setForm] = useState<PlatformSettingUpdateRequest>({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState('');

  const [resetConfirm, setResetConfirm] = useState<'prescription' | 'refund' | null>(null);
  const [resetting, setResetting] = useState(false);

  // Commission tiers
  const TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const TIER_COLOR: Record<string, string> = { BRONZE: '#cd7f32', SILVER: '#9e9e9e', GOLD: '#ffc107', PLATINUM: '#00bcd4' };
  const [tiers, setTiers] = useState<CommissionTierResponse[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [tierDraft, setTierDraft] = useState<UpdateCommissionTierRequest>({ commissionRate: 0 });
  const [tierSaving, setTierSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await platformSettingApi.getCurrent();
      setSettings(res.data?.data ?? null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (activeTab === 3 && tiers.length === 0) {
      setTiersLoading(true);
      adminApi.getCommissionTiers()
        .then(r => {
          if (r.data) {
            const sorted = [...r.data].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
            setTiers(sorted);
          }
        })
        .finally(() => setTiersLoading(false));
    }
  }, [activeTab]);

  const startEditTier = (tier: CommissionTierResponse) => {
    setEditingTier(tier.tier);
    setTierDraft({ commissionRate: tier.commissionRate, minMonthlyOrders: tier.minMonthlyOrders, minMonthlyRevenue: tier.minMonthlyRevenue });
  };

  const saveTier = async () => {
    if (!editingTier) return;
    setTierSaving(true);
    try {
      const res = await adminApi.updateCommissionTier(editingTier, tierDraft);
      if (res.data) {
        setTiers(prev => prev.map(t => t.tier === editingTier ? res.data! : t));
        toast.success(`${editingTier} tier updated`);
      }
      setEditingTier(null);
    } catch {
      toast.error('Failed to update tier');
    } finally {
      setTierSaving(false);
    }
  };

  const renderCommissionTiersTab = () => (
    tiersLoading ? (
      <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
    ) : (
      <Box>
        <Typography sx={{ fontSize: 13, color: '#666', mb: 2 }}>
          Set commission rate and upgrade thresholds for each shop tier. Changes apply to new orders only.
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                {['Tier', 'Commission Rate', 'Min Monthly Orders', 'Min Monthly Revenue', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tiers.map(tier => {
                const isEditing = editingTier === tier.tier;
                return (
                  <TableRow key={tier.id} hover>
                    <TableCell>
                      <Chip
                        label={tier.tier}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: 12, bgcolor: TIER_COLOR[tier.tier] + '22', color: TIER_COLOR[tier.tier] }}
                      />
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={tierDraft.commissionRate}
                          onChange={e => setTierDraft(d => ({ ...d, commissionRate: parseFloat(e.target.value) || 0 }))}
                          inputProps={{ min: 0, max: 100, step: 0.5 }}
                          sx={{ width: 100 }}
                          InputProps={{ endAdornment: <Typography sx={{ fontSize: 12 }}>%</Typography> }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1976d2' }}>{tier.commissionRate}%</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={tierDraft.minMonthlyOrders ?? 0}
                          onChange={e => setTierDraft(d => ({ ...d, minMonthlyOrders: parseInt(e.target.value) || 0 }))}
                          inputProps={{ min: 0 }}
                          sx={{ width: 110 }}
                          InputProps={{ endAdornment: <Typography sx={{ fontSize: 12 }}>orders</Typography> }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: 13 }}>{tier.minMonthlyOrders}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={tierDraft.minMonthlyRevenue ?? 0}
                          onChange={e => setTierDraft(d => ({ ...d, minMonthlyRevenue: parseFloat(e.target.value) || 0 }))}
                          inputProps={{ min: 0 }}
                          sx={{ width: 140 }}
                          InputProps={{ endAdornment: <Typography sx={{ fontSize: 12 }}>₫</Typography> }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: 13 }}>{formatCurrency(tier.minMonthlyRevenue)}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" variant="contained" color="primary" startIcon={tierSaving ? <CircularProgress size={12} color="inherit" /> : <Save sx={{ fontSize: 14 }} />}
                            disabled={tierSaving} onClick={saveTier} sx={{ fontSize: 11, textTransform: 'none' }}>
                            Save
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<Cancel sx={{ fontSize: 14 }} />}
                            disabled={tierSaving} onClick={() => setEditingTier(null)} sx={{ fontSize: 11, textTransform: 'none' }}>
                            Cancel
                          </Button>
                        </Box>
                      ) : (
                        <IconButton size="small" onClick={() => startEditTier(tier)} disabled={!!editingTier}>
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )
  );

  const openHistory = async () => {
    setHistoryOpen(true);
    if (history.length === 0) {
      setHistoryLoading(true);
      try {
        const res = await platformSettingApi.getHistory();
        setHistory(res.data?.data ?? []);
      } catch {
        //
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const openEdit = () => {
    if (!settings) return;
    setForm(toForm(settings));
    setEditTab(0);
    setSaveError(null);
    setEditOpen(true);
  };

  const handleFieldChange = (field: keyof PlatformSettingUpdateRequest, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await platformSettingApi.updateAsNewVersion(form);
      setHistory([]);
      setEditOpen(false);
      setConfirmOpen(false);
      await load();
      setSnackbar('New settings version created successfully.');
    } catch (err: any) {
      const msg = err?.originalError?.response?.data?.message || err?.message || 'Failed to save settings.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!resetConfirm) return;
    setResetting(true);
    try {
      if (resetConfirm === 'prescription') {
        await platformSettingApi.resetPrescription();
      } else {
        await platformSettingApi.resetRefundPolicy();
      }
      setHistory([]);
      await load();
      setSnackbar(`${resetConfirm === 'prescription' ? 'Prescription' : 'Refund policy'} reset to defaults.`);
    } catch {
      setSnackbar('Reset failed.');
    } finally {
      setResetting(false);
      setResetConfirm(null);
    }
  };

  const withLayout = (content: React.ReactNode) => (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.SETTINGS} />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {content}
      </Box>
    </Box>
  );

  if (loading) {
    return withLayout(
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return withLayout(
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Could not load platform settings.</Alert>
      </Box>
    );
  }

  // ── View tabs content ──
  const renderGeneralTab = () => (
    <>
      <SectionCard title="Platform" icon={<Settings />}>
        <FieldRow label="Platform Name" value={settings.platformName} />
        <FieldRow label="Default Commission Rate" value={settings.defaultCommissionRate} unit="%" />
        <FieldRow label="Max Cart Item Quantity" value={settings.maxCartItemQty} unit="items" />
        <FieldRow label="Min Withdrawal Amount" value={settings.minWithdrawalAmount} unit="VND" />
      </SectionCard>
      <SectionCard title="Shipping Fee Subsidy" icon={<AttachMoney />}>
        <FieldRow label="Max Buyer Shipping Fee" value={settings.maxBuyerShippingFee} unit="VND" />
        <FieldRow label="Free Shipping Threshold" value={settings.freeShippingThreshold} unit="VND" />
      </SectionCard>
      <SectionCard title="Order Windows" icon={<AttachMoney />}>
        <FieldRow label="Escrow Hold Days" value={settings.escrowHoldDays} unit="days" />
        <FieldRow label="Return Window" value={settings.returnWindowDays} unit="days" />
        <FieldRow label="Exchange Window" value={settings.exchangeWindowDays} unit="days" />
      </SectionCard>
    </>
  );

  const renderRefundTab = () => (
    <SectionCard title="Refund Policy" icon={<AssignmentReturn />}>
      <FieldRow label="Seller Response Deadline" value={settings.refundSellerResponseDeadlineHours} unit="hours" />
      <FieldRow label="Partial Refund Min %" value={settings.refundPartialMinPercent} unit="%" />
      <FieldRow label="Min Evidence Images (No Longer Needed)" value={settings.refundNoLongerNeededMinEvidenceImages} unit="images" />
      <FieldRow label="Seller Reminder After" value={settings.refundSellerReminderAfterHours} unit="hours" />
      <FieldRow label="Buyer Shipment Reminder After" value={settings.refundBuyerShipmentReminderAfterDays} unit="days" />
      <FieldRow label="Stuck Shipment Warning After" value={settings.refundStuckShipmentWarningAfterDays} unit="days" />
      <FieldRow label="Processing Time" value={`${settings.refundProcessingMinDays} – ${settings.refundProcessingMaxDays}`} unit="days" />
      <FieldRow label="Auto Approval With Evidence" value={settings.refundAutoApprovalWithEvidence} />
      <FieldRow label="Platform Review Escalation" value={settings.refundPlatformReviewEscalation} />
    </SectionCard>
  );

  const renderPrescriptionTab = () => (
    <>
      {[
        { key: 'sph', label: 'Sphere (SPH)', cfg: settings.sph },
        { key: 'cyl', label: 'Cylinder (CYL)', cfg: settings.cyl },
        { key: 'add', label: 'ADD', cfg: settings.add },
        { key: 'pd',  label: 'PD (Pupillary Distance)', cfg: settings.pd },
        { key: 'pdSplit', label: 'PD Split (Monocular)', cfg: settings.pdSplit },
      ].map(({ label, cfg }) => (
        <SectionCard key={label} title={label} icon={<Visibility />}>
          <Grid container spacing={2}>
            {[
              ['Min', cfg?.min], ['Max', cfg?.max], ['Step', cfg?.step],
              ['Normal Min', cfg?.normalMin], ['Normal Max', cfg?.normalMax],
              ['Normal Abs Max', cfg?.normalAbsMax], ['Warn Abs Max', cfg?.warnAbsMax],
            ].filter(([, v]) => v != null).map(([lbl, val]) => (
              <Grid key={String(lbl)} size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>{String(lbl)}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{fmt(val as number)}</Typography>
              </Grid>
            ))}
          </Grid>
        </SectionCard>
      ))}
      <SectionCard title="Axis" icon={<Visibility />}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>Min</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{fmt(settings.axis?.min)}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>Max</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{fmt(settings.axis?.max)}</Typography>
          </Grid>
        </Grid>
      </SectionCard>
      {settings.prescriptionNote && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.custom.status.info.light }}>
          <Typography sx={{ fontSize: 13, color: theme.palette.custom.status.info.main }}>
            <strong>Note:</strong> {settings.prescriptionNote}
          </Typography>
        </Paper>
      )}
    </>
  );

  // ── Edit dialog form sections ──
  const renderEditGeneral = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth size="small" label="Platform Name" value={form.platformName ?? ''} onChange={e => handleFieldChange('platformName', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Commission Rate (%)" field="defaultCommissionRate" form={form} onChange={handleFieldChange} unit="%" step={0.01} min={0} max={100} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Max Cart Item Qty" field="maxCartItemQty" form={form} onChange={handleFieldChange} unit="items" min={1} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Min Withdrawal Amount" field="minWithdrawalAmount" form={form} onChange={handleFieldChange} unit="VND" step={1000} min={0} />
      </Grid>
      <Grid size={{ xs: 12 }}><Divider><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Shipping Fee Subsidy</Typography></Divider></Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Max Buyer Shipping Fee" field="maxBuyerShippingFee" form={form} onChange={handleFieldChange} unit="VND" step={1000} min={0} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Free Shipping Threshold" field="freeShippingThreshold" form={form} onChange={handleFieldChange} unit="VND" step={100000} min={0} />
      </Grid>
      <Grid size={{ xs: 12 }}><Divider><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Order Windows</Typography></Divider></Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <NumField label="Escrow Hold Days" field="escrowHoldDays" form={form} onChange={handleFieldChange} unit="days" min={1} max={365} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <NumField label="Return Window" field="returnWindowDays" form={form} onChange={handleFieldChange} unit="days" min={1} max={365} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <NumField label="Exchange Window" field="exchangeWindowDays" form={form} onChange={handleFieldChange} unit="days" min={1} max={365} />
      </Grid>
    </Grid>
  );

  const renderEditRefund = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Seller Response Deadline" field="refundSellerResponseDeadlineHours" form={form} onChange={handleFieldChange} unit="hours" min={1} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Partial Refund Min %" field="refundPartialMinPercent" form={form} onChange={handleFieldChange} unit="%" min={0} max={100} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Min Evidence Images" field="refundNoLongerNeededMinEvidenceImages" form={form} onChange={handleFieldChange} unit="images" min={0} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Seller Reminder After" field="refundSellerReminderAfterHours" form={form} onChange={handleFieldChange} unit="hours" min={1} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Buyer Shipment Reminder After" field="refundBuyerShipmentReminderAfterDays" form={form} onChange={handleFieldChange} unit="days" min={1} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Stuck Shipment Warning After" field="refundStuckShipmentWarningAfterDays" form={form} onChange={handleFieldChange} unit="days" min={1} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Processing Min Days" field="refundProcessingMinDays" form={form} onChange={handleFieldChange} unit="days" min={1} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NumField label="Processing Max Days" field="refundProcessingMaxDays" form={form} onChange={handleFieldChange} unit="days" min={1} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SwitchField label="Auto Approval With Evidence" field="refundAutoApprovalWithEvidence" form={form} onChange={handleFieldChange} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SwitchField label="Platform Review Escalation" field="refundPlatformReviewEscalation" form={form} onChange={handleFieldChange} />
      </Grid>
    </Grid>
  );

  const pkg = settings.packageDimensions;

  const renderPackagingTab = () => (
    <>
      <SectionCard title="Item Dimensions" icon={<Inventory2 />}>
        {[
          { label: 'Frame', l: pkg?.frameLengthCm, w: pkg?.frameWidthCm, h: pkg?.frameHeightCm, wt: pkg?.frameWeightG },
          { label: 'Lens', l: pkg?.lensLengthCm, w: pkg?.lensWidthCm, h: pkg?.lensHeightCm, wt: pkg?.lensWeightG },
          { label: 'Accessory', l: pkg?.accessoryLengthCm, w: pkg?.accessoryWidthCm, h: pkg?.accessoryHeightCm, wt: pkg?.accessoryWeightG },
          { label: 'Gift', l: pkg?.giftLengthCm, w: pkg?.giftWidthCm, h: pkg?.giftHeightCm, wt: pkg?.giftWeightG },
        ].map(({ label, l, w, h, wt }) => (
          <FieldRow key={label} label={label} value={`${l ?? '—'} × ${w ?? '—'} × ${h ?? '—'} cm  |  ${wt ?? '—'} g`} />
        ))}
      </SectionCard>
      <SectionCard title="Carton Sizes" icon={<Inventory2 />}>
        {[
          { label: 'Carton Size S (small)', l: pkg?.cartonSLengthCm, w: pkg?.cartonSWidthCm, h: pkg?.cartonSHeightCm, tare: pkg?.cartonSTareG },
          { label: 'Carton Size M (medium)', l: pkg?.cartonMLengthCm, w: pkg?.cartonMWidthCm, h: pkg?.cartonMHeightCm, tare: pkg?.cartonMTareG },
          { label: 'Carton Size L (large)', l: pkg?.cartonLLengthCm, w: pkg?.cartonLWidthCm, h: pkg?.cartonLHeightCm, tare: pkg?.cartonLTareG },
        ].map(({ label, l, w, h, tare }) => (
          <FieldRow key={label} label={label} value={`${l ?? '—'} × ${w ?? '—'} × ${h ?? '—'} cm  |  tare ${tare ?? '—'} g`} />
        ))}
      </SectionCard>
      <SectionCard title="Packing Buffer" icon={<Inventory2 />}>
        <FieldRow label="Buffer multiplier" value={pkg?.packingBuffer} />
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>
          The item's volume is multiplied by this factor to calculate the cushioning properties of the material (e.g. 1.30 = +30%).
        </Typography>
      </SectionCard>
    </>
  );

  const renderEditPackaging = () => (
    <Grid container spacing={3}>
      {([
        { title: 'Frame (gọng kính)', fields: [['pkgFrameLengthCm','Length (cm)'],['pkgFrameWidthCm','Width (cm)'],['pkgFrameHeightCm','Height (cm)'],['pkgFrameWeightG','Weight (g)']] },
        { title: 'Lens (tròng kính rời)', fields: [['pkgLensLengthCm','Length (cm)'],['pkgLensWidthCm','Width (cm)'],['pkgLensHeightCm','Height (cm)'],['pkgLensWeightG','Weight (g)']] },
        { title: 'Accessory (phụ kiện)', fields: [['pkgAccessoryLengthCm','Length (cm)'],['pkgAccessoryWidthCm','Width (cm)'],['pkgAccessoryHeightCm','Height (cm)'],['pkgAccessoryWeightG','Weight (g)']] },
        { title: 'Gift (quà tặng)', fields: [['pkgGiftLengthCm','Length (cm)'],['pkgGiftWidthCm','Width (cm)'],['pkgGiftHeightCm','Height (cm)'],['pkgGiftWeightG','Weight (g)']] },
      ] as const).map(({ title, fields }) => (
        <Grid key={title} size={{ xs: 12 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', mb: 1 }}>{title}</Typography>
          <Grid container spacing={1.5}>
            {fields.map(([f, lbl]) => (
              <Grid key={f} size={{ xs: 6, sm: 3 }}>
                <NumField label={lbl} field={f as keyof PlatformSettingUpdateRequest} form={form} onChange={handleFieldChange} min={1} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: 2 }} />
        </Grid>
      ))}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', mb: 1 }}>Carton Sizes</Typography>
        <Grid container spacing={1.5}>
          {([
            ['pkgCartonSLengthCm','S Length'],['pkgCartonSWidthCm','S Width'],['pkgCartonSHeightCm','S Height'],['pkgCartonSTareG','S Tare (g)'],
            ['pkgCartonMLengthCm','M Length'],['pkgCartonMWidthCm','M Width'],['pkgCartonMHeightCm','M Height'],['pkgCartonMTareG','M Tare (g)'],
            ['pkgCartonLLengthCm','L Length'],['pkgCartonLWidthCm','L Width'],['pkgCartonLHeightCm','L Height'],['pkgCartonLTareG','L Tare (g)'],
          ] as const).map(([f, lbl]) => (
            <Grid key={f} size={{ xs: 6, sm: 3 }}>
              <NumField label={lbl} field={f as keyof PlatformSettingUpdateRequest} form={form} onChange={handleFieldChange} min={1} />
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ mt: 2 }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <NumField label="Packing Buffer (e.g. 1.30)" field="pkgPackingBuffer" form={form} onChange={handleFieldChange} step={0.05} min={1} max={3} />
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
          Hệ số nhân thể tích item để tính vật liệu đệm.
        </Typography>
      </Grid>
    </Grid>
  );

  const renderEditPrescription = () => (
    <Grid container spacing={3}>
      {([
        { title: 'Sphere (SPH)', fields: [['sphMin','Min'],['sphMax','Max'],['sphStep','Step'],['sphNormalAbsMax','Normal Abs Max'],['sphWarnAbsMax','Warn Abs Max']] },
        { title: 'Cylinder (CYL)', fields: [['cylMin','Min'],['cylMax','Max'],['cylStep','Step'],['cylNormalAbsMax','Normal Abs Max'],['cylWarnAbsMax','Warn Abs Max']] },
        { title: 'Axis', fields: [['axisMin','Min'],['axisMax','Max']] },
        { title: 'ADD', fields: [['addMin','Min'],['addMax','Max'],['addStep','Step'],['addNormalMin','Normal Min'],['addNormalMax','Normal Max']] },
        { title: 'PD', fields: [['pdMin','Min'],['pdMax','Max'],['pdStep','Step'],['pdNormalMin','Normal Min'],['pdNormalMax','Normal Max']] },
        { title: 'PD Split', fields: [['pdSplitMin','Min'],['pdSplitMax','Max'],['pdSplitStep','Step'],['pdSplitNormalMin','Normal Min'],['pdSplitNormalMax','Normal Max']] },
      ] as const).map(({ title, fields }) => (
        <Grid key={title} size={{ xs: 12 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[600], mb: 1.5 }}>{title}</Typography>
          <Grid container spacing={1.5}>
            {fields.map(([f, lbl]) => (
              <Grid key={f} size={{ xs: 6, sm: 4, md: 3 }}>
                <NumField label={lbl} field={f as keyof PlatformSettingUpdateRequest} form={form} onChange={handleFieldChange} step={0.25} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: 2 }} />
        </Grid>
      ))}
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          label="Prescription Note"
          value={form.prescriptionNote ?? ''}
          onChange={e => handleFieldChange('prescriptionNote', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  return withLayout(
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[900] }}>
            Platform Settings
          </Typography>
          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.5 }}>
            Active version created {fmtDate(settings.createdAt)}
            <Tooltip title="Copy ID">
              <IconButton size="small" sx={{ ml: 0.5 }} onClick={() => navigator.clipboard.writeText(settings.id)}>
                <ContentCopy sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Typography component="span" sx={{ fontSize: 11, fontFamily: 'monospace', color: theme.palette.custom.neutral[400], ml: 0.5 }}>
              {shortId(settings.id)}
            </Typography>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" startIcon={<History />} onClick={openHistory}>
            Version History
          </Button>
          <Button variant="contained" size="small" startIcon={<Edit />} onClick={openEdit}>
            Edit Settings
          </Button>
        </Box>
      </Box>

      {/* View tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2 }}
        >
          <Tab label="General & Financial" />
          <Tab label="Refund Policy" />
          <Tab label="Prescription Config" />
          <Tab label="Packaging Config" />
          <Tab label="Commission Tiers" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderGeneralTab()}
          {activeTab === 1 && renderRefundTab()}
          {activeTab === 2 && renderPrescriptionTab()}
          {activeTab === 3 && renderPackagingTab()}
          {activeTab === 3 && renderCommissionTiersTab()}
        </Box>
      </Paper>

      {/* Reset shortcuts */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>Quick Resets</Typography>
          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
            Resets apply on top of current version (creates a new record).
          </Typography>
        </Box>
        <Button variant="outlined" size="small" color="warning" startIcon={<RestartAlt />} onClick={() => setResetConfirm('prescription')}>
          Reset Prescription Defaults
        </Button>
        <Button variant="outlined" size="small" color="warning" startIcon={<RestartAlt />} onClick={() => setResetConfirm('refund')}>
          Reset Refund Policy Defaults
        </Button>
      </Paper>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${theme.palette.divider}` }}>
          Edit Platform Settings
          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 400 }}>
            Saving will create a new version — the current version is preserved as history.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Tabs value={editTab} onChange={(_, v) => setEditTab(v)} sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Tab label="General & Financial" />
            <Tab label="Refund Policy" />
            <Tab label="Prescription Config" />
            <Tab label="Packaging Config" />
          </Tabs>
          {editTab === 0 && renderEditGeneral()}
          {editTab === 1 && renderEditRefund()}
          {editTab === 2 && renderEditPrescription()}
          {editTab === 3 && renderEditPackaging()}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => { setSaveError(null); setConfirmOpen(true); }}>
            Save as New Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Save Confirm Dialog ──────────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Save</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>
            This will create a new settings version. The current version will be preserved in history and the new version will become active immediately.
          </Typography>
          {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
          >
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Version History Dialog ───────────────────────────────────────────── */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${theme.palette.divider}` }}>
          Version History
          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 400 }}>
            Newest version is currently active. Old versions are read-only.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Version</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Created At</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Changes</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((v, i) => {
                    const prev = history[i + 1];
                    const changes = prev ? getChanges(v, prev) : [];
                    return (
                      <TableRow key={v.id} sx={{ bgcolor: i === 0 ? theme.palette.custom.status.success.light + '40' : 'inherit', verticalAlign: 'top' }}>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>v{history.length - i}</Typography>
                          <Tooltip title={v.id}>
                            <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: theme.palette.custom.neutral[400], cursor: 'default' }}>{shortId(v.id)}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(v.createdAt)}</TableCell>
                        <TableCell>
                          {!prev ? (
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], fontStyle: 'italic' }}>Initial version</Typography>
                          ) : changes.length === 0 ? (
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], fontStyle: 'italic' }}>No changes detected</Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {changes.map(c => (
                                <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.custom.neutral[600] }}>{c.label}:</Typography>
                                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.error?.main ?? '#dc2626', textDecoration: 'line-through' }}>{c.from}</Typography>
                                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>→</Typography>
                                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.success.main, fontWeight: 600 }}>{c.to}</Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {i === 0 ? (
                            <Chip label="Active" color="success" size="small" sx={{ fontSize: 11, height: 20 }} />
                          ) : (
                            <Chip label="Archived" size="small" sx={{ fontSize: 11, height: 20 }} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Reset Confirm ────────────────────────────────────────────────────── */}
      <Dialog open={!!resetConfirm} onClose={() => setResetConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Reset</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>
            This will reset <strong>{resetConfirm === 'prescription' ? 'prescription configuration' : 'refund policy'}</strong> to system defaults and save as a new version.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={() => setResetConfirm(null)} disabled={resetting}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleReset} disabled={resetting}
            startIcon={resetting ? <CircularProgress size={16} color="inherit" /> : <RestartAlt />}>
            {resetting ? 'Resetting…' : 'Reset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AdminSettingsPage;
