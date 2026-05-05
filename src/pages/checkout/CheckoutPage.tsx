import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack,
  LocalShipping,
  Payment,
  ShoppingBag,
  AccountBalanceWallet,
  Edit,
  Delete,
  Add,
  CheckCircle,
  LocationOn,
  Close,
  Visibility,
} from '@mui/icons-material';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/api/service/CartService';
import { orderApi } from '@/api/order-api';
import { paymentApi } from '@/api/payment-api';
import { userWalletApi, type UserWalletResponse } from '@/api/user-wallet-api';
import { userAddressApi, type UserAddressResponse, type UserAddressRequest } from '@/api/user-address-api';
import { ghnApi, type GhnCheckoutShippingFeeResponse } from '@/api/ghnApi';
import type { GhnProvince, GhnDistrict, GhnWard } from '@/models/Shop';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/utils/formatCurrency';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

// ==================== Address Form ====================

interface AddressFormState {
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string;
  isDefault: boolean;
  ghnProvinceId: number | '';
  ghnDistrictId: number | '';
  ghnWardCode: string;
  provinceName: string;
  districtName: string;
  wardName: string;
}

const emptyAddressForm = (): AddressFormState => ({
  label: '',
  recipientName: '',
  recipientPhone: '',
  addressLine1: '',
  addressLine2: '',
  isDefault: false,
  ghnProvinceId: '',
  ghnDistrictId: '',
  ghnWardCode: '',
  provinceName: '',
  districtName: '',
  wardName: '',
});

// ==================== Address Edit Dialog ====================

interface AddressEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (address: UserAddressResponse) => void;
  existingAddress?: UserAddressResponse;
  defaultName?: string;
  defaultPhone?: string;
}

const AddressEditDialog = ({ open, onClose, onSaved, existingAddress, defaultName, defaultPhone }: AddressEditDialogProps) => {
  const [form, setForm] = useState<AddressFormState>(emptyAddressForm());
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);

  // Load provinces once
  useEffect(() => {
    ghnApi.getProvinces().then((res) => {
      if (res.data) setProvinces(res.data);
    }).catch(() => { });
  }, []);

  // Init form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (existingAddress) {
      setForm({
        label: existingAddress.label || '',
        recipientName: existingAddress.recipientName,
        recipientPhone: existingAddress.recipientPhone,
        addressLine1: existingAddress.addressLine1,
        addressLine2: existingAddress.addressLine2 || '',
        isDefault: existingAddress.isDefault,
        ghnProvinceId: existingAddress.ghnProvinceId,
        ghnDistrictId: existingAddress.ghnDistrictId,
        ghnWardCode: existingAddress.ghnWardCode,
        provinceName: existingAddress.city,
        districtName: existingAddress.district,
        wardName: existingAddress.ward,
      });
    } else {
      setForm({
        ...emptyAddressForm(),
        recipientName: defaultName || '',
        recipientPhone: defaultPhone || '',
      });
    }
    setFormErrors({});
  }, [open, existingAddress, defaultName, defaultPhone]);

  // Fetch districts when province changes
  useEffect(() => {
    if (!form.ghnProvinceId) {
      setDistricts([]);
      return;
    }
    ghnApi.getDistricts(form.ghnProvinceId).then((res) => {
      if (res.data) setDistricts(res.data);
    }).catch(() => { });
  }, [form.ghnProvinceId]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!form.ghnDistrictId) {
      setWards([]);
      return;
    }
    ghnApi.getWards(form.ghnDistrictId).then((res) => {
      if (res.data) setWards(res.data);
    }).catch(() => { });
  }, [form.ghnDistrictId]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.recipientName.trim()) errs.recipientName = 'Name is required';
    if (!form.recipientPhone.trim()) errs.recipientPhone = 'Phone is required';
    else if (!/^[0-9]{9,11}$/.test(form.recipientPhone)) errs.recipientPhone = 'Invalid phone';
    if (!form.addressLine1.trim()) errs.addressLine1 = 'Address is required';
    if (!form.ghnProvinceId) errs.ghnProvinceId = 'Select a province';
    if (!form.ghnDistrictId) errs.ghnDistrictId = 'Select a district';
    if (!form.ghnWardCode) errs.ghnWardCode = 'Select a ward';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload: UserAddressRequest = {
        label: form.label || 'Home',
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        ward: form.wardName,
        district: form.districtName,
        city: form.provinceName,
        isDefault: form.isDefault,
        ghnProvinceId: form.ghnProvinceId as number,
        ghnDistrictId: form.ghnDistrictId as number,
        ghnWardCode: form.ghnWardCode,
      };

      let result: UserAddressResponse;
      if (existingAddress) {
        const res = await userAddressApi.update(existingAddress.id, payload);
        result = res.data!;
      } else {
        const res = await userAddressApi.create(payload);
        result = res.data!;
      }
      onSaved(result);
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
            {existingAddress ? 'Edit Address' : 'New Address'}
          </Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Label (e.g. Home, Office)"
            fullWidth
            size="small"
            value={form.label}
            onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="Home"
          />
          <TextField
            label="Recipient Name"
            fullWidth
            size="small"
            value={form.recipientName}
            onChange={(e) => setForm(f => ({ ...f, recipientName: e.target.value }))}
            error={!!formErrors.recipientName}
            helperText={formErrors.recipientName}
          />
          <TextField
            label="Phone Number"
            fullWidth
            size="small"
            value={form.recipientPhone}
            onChange={(e) => setForm(f => ({ ...f, recipientPhone: e.target.value.replace(/\D/g, '') }))}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 11 }}
            error={!!formErrors.recipientPhone}
            helperText={formErrors.recipientPhone}
          />
          <TextField
            label="Street Address"
            fullWidth
            size="small"
            value={form.addressLine1}
            onChange={(e) => setForm(f => ({ ...f, addressLine1: e.target.value }))}
            error={!!formErrors.addressLine1}
            helperText={formErrors.addressLine1}
            placeholder="Street number, building, ..."
          />
          <TextField
            label="Apartment / Suite (Optional)"
            fullWidth
            size="small"
            value={form.addressLine2}
            onChange={(e) => setForm(f => ({ ...f, addressLine2: e.target.value }))}
          />

          <FormControl fullWidth size="small" error={!!formErrors.ghnProvinceId}>
            <InputLabel>Province / City *</InputLabel>
            <Select
              value={form.ghnProvinceId}
              label="Province / City *"
              onChange={(e) => {
                const id = e.target.value as number;
                const found = provinces.find((p) => p.ProvinceID === id);
                setForm(f => ({
                  ...f,
                  ghnProvinceId: id,
                  provinceName: found?.ProvinceName ?? '',
                  ghnDistrictId: '',
                  districtName: '',
                  ghnWardCode: '',
                  wardName: '',
                }));
              }}
            >
              {provinces.map((p) => (
                <MenuItem key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</MenuItem>
              ))}
            </Select>
            {formErrors.ghnProvinceId && (
              <Typography sx={{ fontSize: 12, color: '#d32f2f', mt: 0.5, ml: 1.5 }}>{formErrors.ghnProvinceId}</Typography>
            )}
          </FormControl>

          <FormControl fullWidth size="small" disabled={!form.ghnProvinceId} error={!!formErrors.ghnDistrictId}>
            <InputLabel>District *</InputLabel>
            <Select
              value={form.ghnDistrictId}
              label="District *"
              onChange={(e) => {
                const id = e.target.value as number;
                const found = districts.find((d) => d.DistrictID === id);
                setForm(f => ({
                  ...f,
                  ghnDistrictId: id,
                  districtName: found?.DistrictName ?? '',
                  ghnWardCode: '',
                  wardName: '',
                }));
              }}
            >
              {districts.map((d) => (
                <MenuItem key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</MenuItem>
              ))}
            </Select>
            {formErrors.ghnDistrictId && (
              <Typography sx={{ fontSize: 12, color: '#d32f2f', mt: 0.5, ml: 1.5 }}>{formErrors.ghnDistrictId}</Typography>
            )}
          </FormControl>

          <FormControl fullWidth size="small" disabled={!form.ghnDistrictId} error={!!formErrors.ghnWardCode}>
            <InputLabel>Ward *</InputLabel>
            <Select
              value={form.ghnWardCode}
              label="Ward *"
              onChange={(e) => {
                const code = e.target.value as string;
                const found = wards.find((w) => w.WardCode === code);
                setForm(f => ({
                  ...f,
                  ghnWardCode: code,
                  wardName: found?.WardName ?? '',
                }));
              }}
            >
              {wards.map((w) => (
                <MenuItem key={w.WardCode} value={w.WardCode}>{w.WardName}</MenuItem>
              ))}
            </Select>
            {formErrors.ghnWardCode && (
              <Typography sx={{ fontSize: 12, color: '#d32f2f', mt: 0.5, ml: 1.5 }}>{formErrors.ghnWardCode}</Typography>
            )}
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={form.isDefault}
                onChange={(e) => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                size="small"
              />
            }
            label={<Typography sx={{ fontSize: 14 }}>Set as default address</Typography>}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', color: '#555' }}>Cancel</Button>
        <Button
          variant="contained"
          disableElevation
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ bgcolor: '#111', color: '#fff', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600 }}
        >
          {saving ? 'Saving...' : 'Save Address'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==================== Address Selector Dialog ====================

interface AddressSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  addresses: UserAddressResponse[];
  selectedId: string | null;
  onSelect: (address: UserAddressResponse) => void;
  onAdd: () => void;
  onEdit: (address: UserAddressResponse) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const AddressSelectorDialog = ({
  open, onClose, addresses, selectedId, onSelect, onAdd, onEdit, onDelete, onSetDefault,
}: AddressSelectorDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>My Addresses</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {addresses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <LocationOn sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
            <Typography sx={{ fontSize: 14, color: '#888' }}>No saved addresses</Typography>
          </Box>
        ) : (
          addresses.map((addr) => (
            <Box
              key={addr.id}
              onClick={() => onSelect(addr)}
              sx={{
                px: 3,
                py: 2,
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                bgcolor: selectedId === addr.id ? '#f9f9f9' : 'transparent',
                '&:hover': { bgcolor: '#f5f5f5' },
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Box sx={{ pt: 0.3 }}>
                {selectedId === addr.id
                  ? <CheckCircle sx={{ fontSize: 20, color: '#111' }} />
                  : <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #ccc' }} />
                }
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {addr.label && (
                    <Chip label={addr.label} size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#f0f0f0' }} />
                  )}
                  {addr.isDefault && (
                    <Chip label="Default" size="small" color="primary" sx={{ fontSize: 11, height: 20 }} />
                  )}
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{addr.recipientName}</Typography>
                <Typography sx={{ fontSize: 13, color: '#666' }}>{addr.recipientPhone}</Typography>
                <Typography sx={{ fontSize: 13, color: '#666' }}>
                  {[addr.addressLine1, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onEdit(addr); }}
                  sx={{ color: '#666', '&:hover': { color: '#111' } }}
                >
                  <Edit sx={{ fontSize: 16 }} />
                </IconButton>
                {!addr.isDefault && (
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onSetDefault(addr.id); }}
                    title="Set as default"
                    sx={{ color: '#666', '&:hover': { color: '#4caf50' } }}
                  >
                    <CheckCircle sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onDelete(addr.id); }}
                  sx={{ color: '#666', '&:hover': { color: '#d32f2f' } }}
                >
                  <Delete sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAdd}
          disableElevation
          sx={{ bgcolor: '#111', color: '#fff', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600 }}
        >
          Add New Address
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          disableElevation
          sx={{ bgcolor: '#111', color: '#fff', '&:hover': { bgcolor: '#333' }, textTransform: 'none', ml: 'auto' }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==================== CheckoutPage ====================

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartData, summary, isLoading: cartLoading, loadCart } = useCart();
  const { user } = useAuth();

  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wallet, setWallet] = useState<UserWalletResponse | null>(null);

  // Shipping fee state
  const [shippingFeeData, setShippingFeeData] = useState<GhnCheckoutShippingFeeResponse | null>(null);
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);

  // Prevents the district-change effect from resetting wardCode during applyAddress
  const skipWardReset = useRef(false);

  // GHN location state (for manual entry)
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
  const [selectedWardCode, setSelectedWardCode] = useState<string>('');
  const [provinceName, setProvinceName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [wardName, setWardName] = useState('');

  // Address management state
  const [savedAddresses, setSavedAddresses] = useState<UserAddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddressResponse | undefined>(undefined);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await userAddressApi.getAll();
      const list = res.data || [];
      setSavedAddresses(list);
      // Auto-fill with default address
      const defaultAddr = list.find(a => a.isDefault) || list[0];
      if (defaultAddr) {
        applyAddress(defaultAddr);
      }
    } catch {
      // No addresses yet — show empty form
    } finally {
      setAddressesLoaded(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyAddress = (addr: UserAddressResponse) => {
    skipWardReset.current = true; // prevent district effect from clearing ward
    setSelectedAddressId(addr.id);
    setShippingName(addr.recipientName);
    setShippingPhone(addr.recipientPhone);
    setShippingAddress(addr.addressLine1);
    setShippingCity([addr.ward, addr.district, addr.city].filter(Boolean).join(', '));
    setSelectedProvinceId(addr.ghnProvinceId);
    setSelectedDistrictId(addr.ghnDistrictId);
    setSelectedWardCode(addr.ghnWardCode);
    setProvinceName(addr.city);
    setDistrictName(addr.district);
    setWardName(addr.ward);
  };

  useLayoutConfig({ showNavbar: true, showFooter: true });

  useEffect(() => {
    if (user) {
      setShippingName(user.fullName || '');
    }
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    userWalletApi.getMyWallet().then((res) => {
      if (res.data) setWallet(res.data);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Fetch provinces on mount
  useEffect(() => {
    ghnApi.getProvinces().then((res) => {
      if (res.data) setProvinces(res.data);
    }).catch(() => { });
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setDistricts([]);
      setSelectedDistrictId('');
      setWards([]);
      setSelectedWardCode('');
      return;
    }
    ghnApi.getDistricts(selectedProvinceId).then((res) => {
      if (res.data) setDistricts(res.data);
    }).catch(() => { });
    if (!skipWardReset.current) {
      setSelectedDistrictId('');
      setWards([]);
      setSelectedWardCode('');
    }
  }, [selectedProvinceId]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setWards([]);
      setSelectedWardCode('');
      return;
    }
    ghnApi.getWards(selectedDistrictId).then((res) => {
      if (res.data) setWards(res.data);
    }).catch(() => { });
    if (!skipWardReset.current) {
      setSelectedWardCode('');
    } else {
      skipWardReset.current = false;
    }
  }, [selectedDistrictId]);

  // Sync shippingCity from GHN selections
  useEffect(() => {
    const parts = [wardName, districtName, provinceName].filter(Boolean);
    if (parts.length > 0) setShippingCity(parts.join(', '));
  }, [wardName, districtName, provinceName]);

  // Calculate shipping fee when district + ward are selected
  useEffect(() => {
    const cartItems = cartData?.items ?? [];
    if (!selectedDistrictId || !selectedWardCode || cartItems.length === 0) {
      setShippingFeeData(null);
      return;
    }
    const shopId = cartItems.find(i => i.shop_id)?.shop_id;
    if (!shopId) return;

    const orderSubtotal = cartData?.summary.items_subtotal ?? 0;

    const cartId = cartData?.cart?.id;
    if (!cartId) return;

    setShippingFeeLoading(true);
    ghnApi.getCheckoutShippingFee({
      shopId,
      toDistrictId: selectedDistrictId as number,
      toWardCode: selectedWardCode,
      orderSubtotal,
      cartId,
    })
      .then((res) => setShippingFeeData(res.data ?? null))
      .catch(() => setShippingFeeData(null))
      .finally(() => setShippingFeeLoading(false));
  }, [selectedDistrictId, selectedWardCode, cartData]);

  // ---- Address dialog handlers ----

  const handleSelectAddress = (addr: UserAddressResponse) => {
    applyAddress(addr);
    setShowAddressSelector(false);
  };

  const handleAddressEditorSaved = async (addr: UserAddressResponse) => {
    setShowAddressEditor(false);
    setEditingAddress(undefined);
    // Reload address list
    const res = await userAddressApi.getAll();
    const list = res.data || [];
    setSavedAddresses(list);
    // Apply the just-saved address
    applyAddress(addr);
    toast.success('Address saved');
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await userAddressApi.delete(id);
      const updated = savedAddresses.filter(a => a.id !== id);
      setSavedAddresses(updated);
      if (selectedAddressId === id) {
        const next = updated.find(a => a.isDefault) || updated[0];
        if (next) applyAddress(next);
        else setSelectedAddressId(null);
      }
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await userAddressApi.setDefault(id);
      const res = await userAddressApi.getAll();
      if (res.data) setSavedAddresses(res.data);
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to update default address');
    }
  };

  const [showStockDialog, setShowStockDialog] = useState(false);

  const items = cartData?.items ?? [];
  const cartId = cartData?.cart?.id;

  const exceededItems = items.filter(
    (i) => i.stock_quantity != null && i.quantity > i.stock_quantity,
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!shippingName.trim()) newErrors.shippingName = 'Name is required';
    if (!shippingPhone.trim()) newErrors.shippingPhone = 'Phone number is required';
    else if (!/^[0-9]{9,11}$/.test(shippingPhone.replace(/\s/g, ''))) newErrors.shippingPhone = 'Invalid phone number';
    if (!shippingAddress.trim()) newErrors.shippingAddress = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // The real order total the user will pay (items + shipping fee buyer portion)
  const orderTotal = summary.total_amount + (shippingFeeData?.buyerFee ?? 0);

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (!cartId) {
      toast.error('Cart not found. Please add items first.');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    // Guard: pre-check wallet balance BEFORE creating the order.
    // This prevents creating a PENDING/UNPAID order when funds are insufficient.
    if (paymentMethod === 'E_WALLET') {
      const balance = wallet?.availableBalance ?? 0;
      if (balance < orderTotal) {
        const deficit = orderTotal - balance;
        sessionStorage.setItem('topup_return_to', '/checkout');
        navigate(`/wallet?topUpAmount=${Math.ceil(deficit)}&returnTo=/checkout`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const response = await orderApi.createOrder({
        cartId,
        shippingName: shippingName.trim(),
        shippingPhone: shippingPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity.trim() || undefined,
        customerNote: customerNote.trim() || undefined,
        paymentMethod,
        selectedServiceId: 0,
        toDistrictId: selectedDistrictId !== '' ? selectedDistrictId as number : undefined,
        toWardCode: selectedWardCode || undefined,
      });

      const order = response.data;
      if (!order) {
        toast.error('Failed to create order');
        return;
      }

      if (paymentMethod === 'VNPAY') {
        try {
          const paymentResponse = await paymentApi.createVnpayPayment({
            orderId: order.id,
            orderInfo: `Payment for order ${order.orderNumber}`,
          });
          const paymentUrl = paymentResponse.data;
          if (paymentUrl) {
            sessionStorage.setItem('pending_vnpay_order_id', order.id);
            window.location.href = paymentUrl;
            return;
          }
        } catch {
          toast.error('Failed to create payment. Your order has been created, please pay later from My Orders.');
        }
      } else if (paymentMethod === 'E_WALLET') {
        try {
          await paymentApi.payFromWallet({ orderId: order.id });
          toast.success('Order paid from wallet successfully!');
          CartService.resetCartId();
          navigate('/my-orders');
          return;
        } catch {
          toast.error('Wallet payment failed. Your order has been created, please pay later from My Orders.');
        }
      }

      toast.success('Order placed successfully!');
      CartService.resetCartId();
      navigate('/my-orders');
    } catch (error: unknown) {
      console.error('Failed to create order:', error);
      const msg = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateItemTotal = (item: typeof items[0]): number => {
    const selfTotal = item.unit_price * item.quantity;
    const childrenTotal = item.children.reduce((sum, child) => sum + child.unit_price * child.quantity, 0);
    return selfTotal + childrenTotal;
  };

  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);

  if (cartLoading || !addressesLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 8, textAlign: 'center' }}>
        <ShoppingBag sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>Your cart is empty</Typography>
        <Button variant="contained" onClick={() => navigate('/products')} sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' } }}>
          Continue Shopping
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 3, py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/cart')}
          disableElevation
          sx={{
            bgcolor: '#111',
            color: '#fff',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#333', boxShadow: 'none' },
          }}
        >
          Back to Cart
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111' }}>
          Checkout
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Left: Form */}
        <Box sx={{ flex: 1 }}>
          {/* Shipping Info */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e5e5e5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocalShipping sx={{ color: '#555' }} />
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                  Shipping Information
                </Typography>
              </Box>
              {savedAddresses.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<LocationOn sx={{ fontSize: 16 }} />}
                  onClick={() => setShowAddressSelector(true)}
                  disableElevation
                  sx={{ bgcolor: '#111', color: '#fff', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600, fontSize: 13 }}
                >
                  {selectedAddress ? 'Change Address' : 'My Addresses'}
                </Button>
              )}
            </Box>

            {/* Selected address card */}
            {selectedAddress && (
              <Box
                sx={{
                  p: 2,
                  mb: 2.5,
                  bgcolor: '#f9f9f9',
                  borderRadius: 2,
                  border: '1px solid #e5e5e5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    {selectedAddress.label && (
                      <Chip label={selectedAddress.label} size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#e5e5e5' }} />
                    )}
                    {selectedAddress.isDefault && (
                      <Chip label="Default" size="small" color="primary" sx={{ fontSize: 11, height: 20 }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{selectedAddress.recipientName}</Typography>
                  <Typography sx={{ fontSize: 13, color: '#666' }}>{selectedAddress.recipientPhone}</Typography>
                  <Typography sx={{ fontSize: 13, color: '#666' }}>
                    {[selectedAddress.addressLine1, selectedAddress.ward, selectedAddress.district, selectedAddress.city].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => { setEditingAddress(selectedAddress); setShowAddressEditor(true); }}
                  sx={{ color: '#666', '&:hover': { color: '#111' } }}
                >
                  <Edit sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}

            {/* Buyer contact info (read-only) */}
            {user && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: '#888', mb: 0.5, fontWeight: 500 }}>Full Name</Typography>
                  <Box sx={{ px: 1.5, py: 1, bgcolor: '#f9f9f9', borderRadius: 1.5, border: '1px solid #e5e5e5' }}>
                    <Typography sx={{ fontSize: 14, color: '#111', fontWeight: 500 }}>
                      {user.fullName || '—'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: '#888', mb: 0.5, fontWeight: 500 }}>Email</Typography>
                  <Box sx={{ px: 1.5, py: 1, bgcolor: '#f9f9f9', borderRadius: 1.5, border: '1px solid #e5e5e5' }}>
                    <Typography sx={{ fontSize: 14, color: '#111' }}>
                      {user.email || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Recipient Name"
                fullWidth
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                error={!!errors.shippingName}
                helperText={errors.shippingName}
                size="small"
              />
              <Box>
                <Typography sx={{ fontSize: 13, color: '#555', mb: 0.5 }}>
                  Phone Number <Box component="span" sx={{ color: '#d32f2f' }}>*</Box>
                </Typography>
                <TextField
                  fullWidth
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, ''))}
                  error={!!errors.shippingPhone}
                  helperText={errors.shippingPhone}
                  size="small"
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 11 }}
                  placeholder="0xxxxxxxxx"
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: '#555', mb: 0.5 }}>
                  Shipping Address <Box component="span" sx={{ color: '#d32f2f' }}>*</Box>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  error={!!errors.shippingAddress}
                  helperText={errors.shippingAddress}
                  size="small"
                  placeholder="Street number, building, ..."
                />
              </Box>

              {/* GHN Province / District / Ward */}
              <FormControl fullWidth size="small">
                <InputLabel>Province / City</InputLabel>
                <Select
                  value={selectedProvinceId}
                  label="Province / City"
                  onChange={(e) => {
                    const id = e.target.value as number;
                    setSelectedProvinceId(id);
                    const found = provinces.find((p) => p.ProvinceID === id);
                    setProvinceName(found?.ProvinceName ?? '');
                    setSelectedAddressId(null);
                  }}
                >
                  {provinces.map((p) => (
                    <MenuItem key={p.ProvinceID} value={p.ProvinceID}>
                      {p.ProvinceName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" disabled={!selectedProvinceId}>
                <InputLabel>District</InputLabel>
                <Select
                  value={selectedDistrictId}
                  label="District"
                  onChange={(e) => {
                    const id = e.target.value as number;
                    setSelectedDistrictId(id);
                    const found = districts.find((d) => d.DistrictID === id);
                    setDistrictName(found?.DistrictName ?? '');
                    setSelectedAddressId(null);
                  }}
                >
                  {districts.map((d) => (
                    <MenuItem key={d.DistrictID} value={d.DistrictID}>
                      {d.DistrictName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" disabled={!selectedDistrictId}>
                <InputLabel>Ward</InputLabel>
                <Select
                  value={selectedWardCode}
                  label="Ward"
                  onChange={(e) => {
                    const code = e.target.value as string;
                    setSelectedWardCode(code);
                    const found = wards.find((w) => w.WardCode === code);
                    setWardName(found?.WardName ?? '');
                    setSelectedAddressId(null);
                  }}
                >
                  {wards.map((w) => (
                    <MenuItem key={w.WardCode} value={w.WardCode}>
                      {w.WardName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Full address preview */}
              {(shippingAddress || wardName || districtName || provinceName) && (
                <Box sx={{ p: 1.5, bgcolor: '#f9f9f9', borderRadius: 1.5, border: '1px solid #e5e5e5' }}>
                  <Typography sx={{ fontSize: 12, color: '#888', mb: 0.5, fontWeight: 500 }}>Full address</Typography>
                  <Typography sx={{ fontSize: 13, color: '#444' }}>
                    {[shippingAddress, wardName, districtName, provinceName].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
              )}

              {/* Save new address option (when no saved address selected) */}
              {!selectedAddressId && addressesLoaded && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add sx={{ fontSize: 16 }} />}
                  onClick={() => { setEditingAddress(undefined); setShowAddressEditor(true); }}
                  disableElevation
                  sx={{ bgcolor: '#111', color: '#fff', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontSize: 13, alignSelf: 'flex-start' }}
                >
                  Save as new address
                </Button>
              )}

              <TextField
                label="Note for seller (Optional)"
                fullWidth
                multiline
                rows={2}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                size="small"
              />
            </Box>
          </Paper>

        </Box>

        {/* Right: Order Summary + Payment Method (sticky) */}
        <Box sx={{ width: 400, flexShrink: 0, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>
          {/* Order Summary */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e5e5', mb: 2 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111', mb: 2 }}>
              Order Summary
            </Typography>

            {/* Items */}
            <Box sx={{ maxHeight: 260, overflowY: 'auto', mb: 2 }}>
              {items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', gap: 1.5, mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: '#f5f5f5',
                      backgroundImage: item.variant_details?.image_url ? `url(${item.variant_details.image_url})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111' }} noWrap>
                      {item.product?.name || 'Product'}
                    </Typography>
                    {item.shop_name && (
                      <Typography sx={{ fontSize: 11, color: '#00838f' }} noWrap>
                        Shop: {item.shop_name}
                      </Typography>
                    )}
                    {item.children.length > 0 && (
                      <Typography sx={{ fontSize: 11, color: '#888' }}>
                        + {item.children.map(c => c.product?.name || c.item_type).join(', ')}
                      </Typography>
                    )}
                    {item.lens_selection?.prescription && (item.lens_selection.prescription.right_eye?.sphere || item.lens_selection.prescription.left_eye?.sphere) && (() => {
                      const rx = item.lens_selection.prescription;
                      return (
                        <Box sx={{ mt: 0.75, p: 1, bgcolor: '#e1f5fe', borderRadius: 1.5, border: '1px solid rgba(2,136,209,0.2)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Visibility sx={{ fontSize: 11, color: '#0288d1' }} />
                            <Typography sx={{ fontSize: 10, color: '#0288d1', fontWeight: 700, letterSpacing: '0.4px' }}>Prescription</Typography>
                          </Box>
                          <Typography sx={{ fontSize: 10, color: '#01579b', fontFamily: 'monospace' }}>
                            R: SPH {rx.right_eye?.sphere ?? '—'} · CYL {rx.right_eye?.cylinder ?? '—'} · PD {rx.right_eye?.pd ?? '—'}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: '#01579b', fontFamily: 'monospace' }}>
                            L: SPH {rx.left_eye?.sphere ?? '—'} · CYL {rx.left_eye?.cylinder ?? '—'} · PD {rx.left_eye?.pd ?? '—'}
                          </Typography>
                          {(rx.right_eye?.add || rx.left_eye?.add) && (
                            <Typography sx={{ fontSize: 10, color: '#01579b', fontFamily: 'monospace' }}>
                              Add: {rx.right_eye?.add ?? rx.left_eye?.add}
                            </Typography>
                          )}
                        </Box>
                      );
                    })()}
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111', mt: 0.5 }}>
                      {formatCurrency(calculateItemTotal(item))}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: '#888', flexShrink: 0 }}>
                    x{item.quantity}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Totals */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, color: '#666' }}>Subtotal</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{formatCurrency(summary.items_subtotal)}</Typography>
              </Box>
              {summary.coupon_discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: '#666' }}>Discount</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#d32f2f' }}>
                    -{formatCurrency(summary.coupon_discount)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: 14, color: '#666' }}>Shipping</Typography>
                {shippingFeeLoading ? (
                  <CircularProgress size={14} thickness={4} />
                ) : shippingFeeData ? (
                  <Box sx={{ textAlign: 'right' }}>
                    {shippingFeeData.freeShipping ? (
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>Free</Typography>
                    ) : shippingFeeData.platformSubsidy > 0 ? (
                      <>
                        <Typography sx={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>
                          {formatCurrency(shippingFeeData.actualFee)}
                        </Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                          {formatCurrency(shippingFeeData.buyerFee)}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
                          Subsidy {formatCurrency(shippingFeeData.platformSubsidy)}
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                        {formatCurrency(shippingFeeData.buyerFee)}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 14, color: '#9ca3af' }}>—</Typography>
                )}
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Total</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                  {formatCurrency(summary.total_amount + (shippingFeeData?.buyerFee ?? 0))}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Payment Method */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e5e5', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Payment sx={{ color: '#555' }} />
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
                Payment Method
              </Typography>
            </Box>

            <FormControl>
              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <FormControlLabel
                  value="COD"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Cash on Delivery (COD)</Typography>
                      <Typography sx={{ fontSize: 12, color: '#888' }}>Pay when you receive the package</Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
                />
                <FormControlLabel
                  value="VNPAY"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>VNPay</Typography>
                      <Typography sx={{ fontSize: 12, color: '#888' }}>Pay online via VNPay (ATM/Credit/Debit card)</Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
                />
                <FormControlLabel
                  value="BANK_TRANSFER"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Bank Transfer</Typography>
                      <Typography sx={{ fontSize: 12, color: '#888' }}>Transfer directly to our bank account</Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
                />
                <FormControlLabel
                  value="E_WALLET"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccountBalanceWallet sx={{ fontSize: 16, color: '#4caf50' }} />
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Glassify Wallet</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: '#888' }}>
                        {wallet
                          ? `Balance: ${formatCurrency(wallet.availableBalance)}`
                          : 'Loading balance...'}
                      </Typography>
                      {wallet && wallet.availableBalance < orderTotal && (
                        <Typography sx={{ fontSize: 11, color: '#d32f2f' }}>
                          Insufficient balance (need {formatCurrency(orderTotal - wallet.availableBalance)} more)
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
                />
              </RadioGroup>
            </FormControl>
          </Paper>

          {/* Place Order Button */}
          <Box
            onClick={exceededItems.length > 0 && !submitting ? () => setShowStockDialog(true) : undefined}
            sx={{ cursor: exceededItems.length > 0 ? 'not-allowed' : 'default' }}
          >
            <Button
              variant="contained"
              fullWidth
              size="large"
              disableElevation
              disabled={submitting}
              onClick={exceededItems.length > 0 ? undefined : handlePlaceOrder}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{
                bgcolor: '#111',
                color: '#fff',
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': { bgcolor: exceededItems.length > 0 ? '#111' : '#333' },
                '&.Mui-disabled': { bgcolor: '#ccc', color: '#fff' },
                ...(exceededItems.length > 0 && {
                  opacity: 0.5,
                  filter: 'blur(0.4px)',
                  pointerEvents: 'none',
                }),
              }}
            >
              {submitting ? 'Placing Order...' : paymentMethod === 'VNPAY' ? 'Place Order & Pay' : 'Place Order'}
            </Button>
          </Box>

          {paymentMethod === 'VNPAY' && (
            <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>
              You will be redirected to VNPay to complete payment after placing the order.
            </Alert>
          )}
          {paymentMethod === 'E_WALLET' && wallet && wallet.availableBalance < orderTotal && (
            <Alert
              severity="warning"
              sx={{ mt: 2, fontSize: 12 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  onClick={() => {
                    const deficit = Math.ceil(orderTotal - (wallet?.availableBalance ?? 0));
                    sessionStorage.setItem('topup_return_to', '/checkout');
                    navigate(`/wallet?topUpAmount=${deficit}&returnTo=/checkout`);
                  }}
                >
                  Top Up
                </Button>
              }
            >
              Insufficient balance — need {formatCurrency(orderTotal - wallet.availableBalance)} more.
            </Alert>
          )}

          {/* Stock exceeded dialog */}
          <Dialog open={showStockDialog} onClose={() => setShowStockDialog(false)} maxWidth="xs" fullWidth>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#d32f2f' }}>
                  Vượt quá số lượng tồn kho
                </Typography>
                <IconButton size="small" onClick={() => setShowStockDialog(false)}><Close /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography sx={{ fontSize: 13, color: '#555', mb: 1.5 }}>
                Một số sản phẩm trong giỏ hàng vượt quá số lượng còn lại. Vui lòng điều chỉnh số lượng trước khi đặt hàng:
              </Typography>
              {exceededItems.map((item) => (
                <Box
                  key={item.id}
                  sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f0f0f0' }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1 }} noWrap>
                    {item.product?.name || 'Sản phẩm'}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#d32f2f', flexShrink: 0, ml: 2 }}>
                    Yêu cầu {item.quantity} / Còn {item.stock_quantity ?? 0}
                  </Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                variant="contained"
                disableElevation
                onClick={() => { setShowStockDialog(false); navigate('/cart'); }}
                sx={{ bgcolor: '#d32f2f', color: '#fff', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 600 }}
              >
                Về giỏ hàng
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>

      {/* Address Selector Dialog */}
      <AddressSelectorDialog
        open={showAddressSelector}
        onClose={() => setShowAddressSelector(false)}
        addresses={savedAddresses}
        selectedId={selectedAddressId}
        onSelect={handleSelectAddress}
        onAdd={() => { setShowAddressSelector(false); setEditingAddress(undefined); setShowAddressEditor(true); }}
        onEdit={(addr) => { setShowAddressSelector(false); setEditingAddress(addr); setShowAddressEditor(true); }}
        onDelete={handleDeleteAddress}
        onSetDefault={handleSetDefault}
      />

      {/* Address Editor Dialog */}
      <AddressEditDialog
        open={showAddressEditor}
        onClose={() => { setShowAddressEditor(false); setEditingAddress(undefined); }}
        onSaved={handleAddressEditorSaved}
        existingAddress={editingAddress}
        defaultName={user?.fullName}
        defaultPhone={shippingPhone}
      />
    </Box>
  );
};

export default CheckoutPage;
