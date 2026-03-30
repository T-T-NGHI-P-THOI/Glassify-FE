import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Add, ArrowBack, CheckCircle, Delete } from '@mui/icons-material';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { shopApi } from '@/api/shopApi';
import ProductAPI from '@/api/product-api';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { lensApi, type CreateLensRequest } from '@/api/lens-api';
import type { ShopDetailResponse } from '@/models/Shop';

type LensScope = 'GLOBAL' | 'FRAME_VARIANT' | 'FRAME_GROUP';
type LensCategory = 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE';
type ProgressiveType = 'STANDARD' | 'PREMIUM' | 'OFFICE';
type UsageType = 'NON_PRESCRIPTION' | 'SINGLE_VISION' | 'READING' | 'BIFOCAL' | 'PROGRESSIVE';
type TintBehavior = 'NONE' | 'PHOTOCHROMIC' | 'GRADIENT';

interface FeatureDraft {
  sku: string;
  name: string;
  description: string;
}

interface TintDraft {
  code: string;
  name: string;
  cssValue: string;
  opacity: string;
  basePrice: string;
  isActive: boolean;
  behavior: TintBehavior;
}

interface UsageDraft {
  type: UsageType;
  name: string;
  description: string;
  isActive: boolean;
}

interface ProgressiveOptionDraft {
  name: string;
  description: string;
  maxViewDistanceFt: string;
  extraPrice: string;
  isRecommended: boolean;
  isActive: boolean;
  progressiveType: ProgressiveType;
}

interface LensFormState {
  scope: LensScope;
  frameVariantId: string;
  frameGroupId: string;
  sku: string;
  name: string;
  basePrice: string;
  isProgressive: boolean;
  isActive: boolean;
  category: LensCategory;
  progressiveType: ProgressiveType;
  featureIdsInput: string;
  tintIdsInput: string;
  usageIdsInput: string;
  featuresToCreate: FeatureDraft[];
  tintsToCreate: TintDraft[];
  usagesToCreate: UsageDraft[];
  progressiveOptions: ProgressiveOptionDraft[];
}

interface FrameVariantLite {
  id: string;
  colorName: string;
  size: string;
}

interface FrameGroupLite {
  id: string;
  frameName: string;
  frameVariantResponses?: FrameVariantLite[];
}

const DEFAULT_FEATURE: FeatureDraft = { sku: '', name: '', description: '' };
const DEFAULT_TINT: TintDraft = {
  code: '',
  name: '',
  cssValue: '#b3b3b3',
  opacity: '0.4',
  basePrice: '0',
  isActive: true,
  behavior: 'NONE',
};
const DEFAULT_USAGE: UsageDraft = {
  type: 'NON_PRESCRIPTION',
  name: '',
  description: '',
  isActive: true,
};
const DEFAULT_PROGRESSIVE_OPTION: ProgressiveOptionDraft = {
  name: '',
  description: '',
  maxViewDistanceFt: '0',
  extraPrice: '0',
  isRecommended: false,
  isActive: true,
  progressiveType: 'STANDARD',
};

const DEFAULT_FORM: LensFormState = {
  scope: 'GLOBAL',
  frameVariantId: '',
  frameGroupId: '',
  sku: '',
  name: '',
  basePrice: '',
  isProgressive: false,
  isActive: true,
  category: 'SINGLE_VISION',
  progressiveType: 'STANDARD',
  featureIdsInput: '',
  tintIdsInput: '',
  usageIdsInput: '',
  featuresToCreate: [],
  tintsToCreate: [],
  usagesToCreate: [],
  progressiveOptions: [],
};

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.custom.border.light,
    borderTopWidth: 2,
  },
  '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.custom.status.success.main,
  },
}));

const STEPS = [
  { label: 'Basic Info' },
  { label: 'Lens Details' },
  { label: 'Review & Submit' },
];

const parseIds = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((id) => id.trim())
    .filter(Boolean);

const formatScopeLabel = (scope: LensScope) => {
  if (scope === 'FRAME_GROUP') return 'Frame Group';
  if (scope === 'FRAME_VARIANT') return 'Frame Variant';
  return 'Global';
};

const CreateLensPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [frameGroups, setFrameGroups] = useState<FrameGroupLite[]>([]);
  const [form, setForm] = useState<LensFormState>(DEFAULT_FORM);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const shopRes = await shopApi.getMyShops();
        const myShop = shopRes.data?.[0] ?? null;
        setShop(myShop);
        if (myShop?.id) {
          const groups = await ProductAPI.getFrameGroupFromShopId(myShop.id);
          setFrameGroups((groups ?? []) as FrameGroupLite[]);
        }
      } catch (error) {
        console.error('Failed to initialize create lens page:', error);
        toast.error('Unable to load shop data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const variantOptions = useMemo(
    () =>
      frameGroups.flatMap((group) =>
        (group.frameVariantResponses ?? []).map((variant) => ({
          id: variant.id,
          label: `${group.frameName} - ${variant.colorName || 'Color'} ${variant.size ? `(${variant.size})` : ''}`,
        })),
      ),
    [frameGroups],
  );

  const handleFieldChange = <K extends keyof LensFormState>(key: K, value: LensFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validateStep = (step: number): boolean => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!form.sku.trim()) nextErrors.sku = 'SKU is required';
      if (!form.name.trim()) nextErrors.name = 'Lens name is required';
      if (!form.basePrice || Number(form.basePrice) <= 0) nextErrors.basePrice = 'Base price must be greater than 0';

      if (form.scope === 'FRAME_VARIANT' && !form.frameVariantId) {
        nextErrors.frameVariantId = 'Please select a frame variant';
      }

      if (form.scope === 'FRAME_GROUP' && !form.frameGroupId) {
        nextErrors.frameGroupId = 'Please select a frame group';
      }

      if (form.isProgressive && !form.progressiveType) {
        nextErrors.progressiveType = 'Progressive type is required when lens is progressive';
      }
    }

    if (step === 1) {
      form.tintsToCreate.forEach((tint, index) => {
        if (!tint.name.trim()) {
          nextErrors[`tintsToCreate.${index}.name`] = 'Tint name is required';
        }
      });

      form.usagesToCreate.forEach((usage, index) => {
        if (!usage.name.trim()) {
          nextErrors[`usagesToCreate.${index}.name`] = 'Usage name is required';
        }
      });

      if (form.isProgressive) {
        form.progressiveOptions.forEach((option, index) => {
          if (!option.name.trim()) {
            nextErrors[`progressiveOptions.${index}.name`] = 'Progressive option name is required';
          }
        });
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const buildPayload = (): CreateLensRequest => {
    const featureIds = parseIds(form.featureIdsInput);
    const tintIds = parseIds(form.tintIdsInput);
    const usageIds = parseIds(form.usageIdsInput);

    return {
      shopId: shop?.id ?? '',
      sku: form.sku.trim(),
      name: form.name.trim(),
      basePrice: Number(form.basePrice),
      isProgressive: form.isProgressive,
      isActive: form.isActive,
      category: form.category,
      progressiveType: form.isProgressive ? form.progressiveType : undefined,
      lensDetailData: {
        featureIds: featureIds.length ? featureIds : undefined,
        tintIds: tintIds.length ? tintIds : undefined,
        usageIds: usageIds.length ? usageIds : undefined,
        featuresToCreate: form.featuresToCreate
          .filter((x) => x.name.trim())
          .map((x) => ({ sku: x.sku.trim(), name: x.name.trim(), description: x.description.trim() })),
        tintsToCreate: form.tintsToCreate
          .filter((x) => x.name.trim())
          .map((x) => ({
            code: x.code.trim(),
            name: x.name.trim(),
            cssValue: x.cssValue.trim(),
            opacity: Number(x.opacity || 0),
            basePrice: Number(x.basePrice || 0),
            isActive: x.isActive,
            behavior: x.behavior,
          })),
        usagesToCreate: form.usagesToCreate
          .filter((x) => x.name.trim())
          .map((x) => ({
            type: x.type,
            name: x.name.trim(),
            description: x.description.trim(),
            isActive: x.isActive,
          })),
        progressiveOptions: form.isProgressive
          ? form.progressiveOptions
              .filter((x) => x.name.trim())
              .map((x) => ({
                name: x.name.trim(),
                description: x.description.trim(),
                maxViewDistanceFt: Number(x.maxViewDistanceFt || 0),
                extraPrice: Number(x.extraPrice || 0),
                isRecommended: x.isRecommended,
                isActive: x.isActive,
                progressiveType: x.progressiveType,
              }))
          : undefined,
      },
    };
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      setActiveStep(0);
      return;
    }

    if (!shop?.id) {
      toast.error('Shop not found');
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPayload();

      let response;
      if (form.scope === 'FRAME_VARIANT') {
        response = await lensApi.createForFrame(form.frameVariantId, payload);
      } else if (form.scope === 'FRAME_GROUP') {
        response = await lensApi.createForFrameGroup(form.frameGroupId, payload);
      } else {
        response = await lensApi.create(payload);
      }

      const createdLens = response.data;
      setSuccessMessage(`Lens created successfully${createdLens?.id ? ` (ID: ${createdLens.id})` : ''}.`);
      toast.success('Lens created successfully');
    } catch (error: any) {
      console.error('Create lens failed:', error);
      const message = error?.response?.data?.message || 'Unable to create lens';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const sidebarProps = {
    activeMenu: PAGE_ENDPOINTS.SHOP.PRODUCTS,
    shopName: shop?.shopName,
    shopLogo: shop?.logoUrl,
    ownerName: user?.fullName,
    ownerEmail: user?.email,
    ownerAvatar: user?.avatarUrl,
  };

  const setFeatureAt = (index: number, key: keyof FeatureDraft, value: string) => {
    setForm((prev) => {
      const next = [...prev.featuresToCreate];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, featuresToCreate: next };
    });
  };

  const setTintAt = <K extends keyof TintDraft>(index: number, key: K, value: TintDraft[K]) => {
    setForm((prev) => {
      const next = [...prev.tintsToCreate];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, tintsToCreate: next };
    });
  };

  const setUsageAt = <K extends keyof UsageDraft>(index: number, key: K, value: UsageDraft[K]) => {
    setForm((prev) => {
      const next = [...prev.usagesToCreate];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, usagesToCreate: next };
    });
  };

  const setProgressiveOptionAt = <K extends keyof ProgressiveOptionDraft>(
    index: number,
    key: K,
    value: ProgressiveOptionDraft[K],
  ) => {
    setForm((prev) => {
      const next = [...prev.progressiveOptions];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, progressiveOptions: next };
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar {...sidebarProps} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50], display: 'flex' }}>
      <ShopOwnerSidebar {...sidebarProps} />

      <Box sx={{ flex: 1, p: 4, maxWidth: 1100 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Add New Lens
            </Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
              Multi-step flow for creating lens catalog data in shop management
            </Typography>
          </Box>
        </Box>

        {!!successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
          <Stepper activeStep={activeStep} connector={<CustomConnector />} alternativeLabel>
            {STEPS.map((step, index) => (
              <Step key={step.label} completed={index < activeStep}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: index <= activeStep ? theme.palette.custom.status.success.main : theme.palette.custom.border.light,
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {index < activeStep ? <CheckCircle sx={{ fontSize: 20 }} /> : index + 1}
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
          {activeStep === 0 && (
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <FormControl>
                  <FormLabel>Apply Scope</FormLabel>
                  <RadioGroup
                    row
                    value={form.scope}
                    onChange={(e) => handleFieldChange('scope', e.target.value as LensScope)}
                  >
                    <FormControlLabel value="GLOBAL" control={<Radio />} label="Global" />
                    <FormControlLabel value="FRAME_VARIANT" control={<Radio />} label="For Frame Variant" />
                    <FormControlLabel value="FRAME_GROUP" control={<Radio />} label="For Frame Group" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {form.scope === 'FRAME_VARIANT' && (
                <Grid size={{ xs: 12, md: 8 }}>
                  <FormControl fullWidth error={!!errors.frameVariantId}>
                    <InputLabel>Frame Variant</InputLabel>
                    <Select
                      label="Frame Variant"
                      value={form.frameVariantId}
                      onChange={(e) => handleFieldChange('frameVariantId', e.target.value)}
                    >
                      {variantOptions.map((variant) => (
                        <MenuItem key={variant.id} value={variant.id}>{variant.label}</MenuItem>
                      ))}
                    </Select>
                    {!!errors.frameVariantId && <Typography color="error" fontSize={12}>{errors.frameVariantId}</Typography>}
                  </FormControl>
                </Grid>
              )}

              {form.scope === 'FRAME_GROUP' && (
                <Grid size={{ xs: 12, md: 8 }}>
                  <FormControl fullWidth error={!!errors.frameGroupId}>
                    <InputLabel>Frame Group</InputLabel>
                    <Select
                      label="Frame Group"
                      value={form.frameGroupId}
                      onChange={(e) => handleFieldChange('frameGroupId', e.target.value)}
                    >
                      {frameGroups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>{group.frameName}</MenuItem>
                      ))}
                    </Select>
                    {!!errors.frameGroupId && <Typography color="error" fontSize={12}>{errors.frameGroupId}</Typography>}
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="SKU"
                  value={form.sku}
                  onChange={(e) => handleFieldChange('sku', e.target.value)}
                  error={!!errors.sku}
                  helperText={errors.sku}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Lens Name"
                  value={form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Base Price"
                  value={form.basePrice}
                  onChange={(e) => handleFieldChange('basePrice', e.target.value)}
                  error={!!errors.basePrice}
                  helperText={errors.basePrice}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={form.category}
                    label="Category"
                    onChange={(e) => handleFieldChange('category', e.target.value as LensCategory)}
                  >
                    <MenuItem value="SINGLE_VISION">Single Vision</MenuItem>
                    <MenuItem value="BIFOCAL">Bifocal</MenuItem>
                    <MenuItem value="PROGRESSIVE">Progressive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth disabled={!form.isProgressive} error={!!errors.progressiveType}>
                  <InputLabel>Progressive Type</InputLabel>
                  <Select
                    value={form.progressiveType}
                    label="Progressive Type"
                    onChange={(e) => handleFieldChange('progressiveType', e.target.value as ProgressiveType)}
                  >
                    <MenuItem value="STANDARD">Standard</MenuItem>
                    <MenuItem value="PREMIUM">Premium</MenuItem>
                    <MenuItem value="OFFICE">Office</MenuItem>
                  </Select>
                  {!!errors.progressiveType && <Typography color="error" fontSize={12}>{errors.progressiveType}</Typography>}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={<Switch checked={form.isProgressive} onChange={(e) => handleFieldChange('isProgressive', e.target.checked)} />}
                  label="Is Progressive"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={<Switch checked={form.isActive} onChange={(e) => handleFieldChange('isActive', e.target.checked)} />}
                  label="Is Active"
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box>
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Existing Feature IDs"
                    multiline
                    minRows={3}
                    placeholder="uuid-1, uuid-2"
                    value={form.featureIdsInput}
                    onChange={(e) => handleFieldChange('featureIdsInput', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Existing Tint IDs"
                    multiline
                    minRows={3}
                    placeholder="uuid-1, uuid-2"
                    value={form.tintIdsInput}
                    onChange={(e) => handleFieldChange('tintIdsInput', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Existing Usage IDs"
                    multiline
                    minRows={3}
                    placeholder="uuid-1, uuid-2"
                    value={form.usageIdsInput}
                    onChange={(e) => handleFieldChange('usageIdsInput', e.target.value)}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600 }}>Features To Create</Typography>
                <Button startIcon={<Add />} onClick={() => handleFieldChange('featuresToCreate', [...form.featuresToCreate, { ...DEFAULT_FEATURE }])}>
                  Add Feature
                </Button>
              </Box>
              {form.featuresToCreate.map((item, index) => (
                <Paper key={`feature-${index}`} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField fullWidth label="SKU" value={item.sku} onChange={(e) => setFeatureAt(index, 'sku', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Name" value={item.name} onChange={(e) => setFeatureAt(index, 'name', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Description" value={item.description} onChange={(e) => setFeatureAt(index, 'description', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <IconButton
                        color="error"
                        onClick={() =>
                          handleFieldChange(
                            'featuresToCreate',
                            form.featuresToCreate.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600 }}>Tints To Create</Typography>
                <Button startIcon={<Add />} onClick={() => handleFieldChange('tintsToCreate', [...form.tintsToCreate, { ...DEFAULT_TINT }])}>
                  Add Tint
                </Button>
              </Box>
              {form.tintsToCreate.map((item, index) => (
                <Paper key={`tint-${index}`} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField fullWidth label="Code" value={item.code} onChange={(e) => setTintAt(index, 'code', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={item.name}
                        onChange={(e) => setTintAt(index, 'name', e.target.value)}
                        error={!!errors[`tintsToCreate.${index}.name`]}
                        helperText={errors[`tintsToCreate.${index}.name`]}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField fullWidth label="CSS Value" value={item.cssValue} onChange={(e) => setTintAt(index, 'cssValue', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1.5 }}>
                      <TextField fullWidth type="number" label="Opacity" value={item.opacity} onChange={(e) => setTintAt(index, 'opacity', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1.5 }}>
                      <TextField fullWidth type="number" label="Price" value={item.basePrice} onChange={(e) => setTintAt(index, 'basePrice', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Behavior</InputLabel>
                        <Select value={item.behavior} label="Behavior" onChange={(e) => setTintAt(index, 'behavior', e.target.value as TintBehavior)}>
                          <MenuItem value="NONE">None</MenuItem>
                          <MenuItem value="PHOTOCHROMIC">Photochromic</MenuItem>
                          <MenuItem value="GRADIENT">Gradient</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <IconButton
                        color="error"
                        onClick={() =>
                          handleFieldChange(
                            'tintsToCreate',
                            form.tintsToCreate.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={<Switch checked={item.isActive} onChange={(e) => setTintAt(index, 'isActive', e.target.checked)} />}
                        label="Tint Active"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600 }}>Usages To Create</Typography>
                <Button startIcon={<Add />} onClick={() => handleFieldChange('usagesToCreate', [...form.usagesToCreate, { ...DEFAULT_USAGE }])}>
                  Add Usage
                </Button>
              </Box>
              {form.usagesToCreate.map((item, index) => (
                <Paper key={`usage-${index}`} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select value={item.type} label="Type" onChange={(e) => setUsageAt(index, 'type', e.target.value as UsageType)}>
                          <MenuItem value="NON_PRESCRIPTION">Non Prescription</MenuItem>
                          <MenuItem value="SINGLE_VISION">Single Vision</MenuItem>
                          <MenuItem value="READING">Reading</MenuItem>
                          <MenuItem value="BIFOCAL">Bifocal</MenuItem>
                          <MenuItem value="PROGRESSIVE">Progressive</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={item.name}
                        onChange={(e) => setUsageAt(index, 'name', e.target.value)}
                        error={!!errors[`usagesToCreate.${index}.name`]}
                        helperText={errors[`usagesToCreate.${index}.name`]}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <TextField fullWidth label="Description" value={item.description} onChange={(e) => setUsageAt(index, 'description', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <FormControlLabel
                        control={<Switch checked={item.isActive} onChange={(e) => setUsageAt(index, 'isActive', e.target.checked)} />}
                        label=""
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <IconButton
                        color="error"
                        onClick={() =>
                          handleFieldChange(
                            'usagesToCreate',
                            form.usagesToCreate.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              {form.isProgressive && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 600 }}>Progressive Options</Typography>
                    <Button
                      startIcon={<Add />}
                      onClick={() => handleFieldChange('progressiveOptions', [...form.progressiveOptions, { ...DEFAULT_PROGRESSIVE_OPTION }])}
                    >
                      Add Progressive Option
                    </Button>
                  </Box>
                  {form.progressiveOptions.map((item, index) => (
                    <Paper key={`prog-${index}`} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 2.5 }}>
                          <TextField
                            fullWidth
                            label="Name"
                            value={item.name}
                            onChange={(e) => setProgressiveOptionAt(index, 'name', e.target.value)}
                            error={!!errors[`progressiveOptions.${index}.name`]}
                            helperText={errors[`progressiveOptions.${index}.name`]}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3.5 }}>
                          <TextField
                            fullWidth
                            label="Description"
                            value={item.description}
                            onChange={(e) => setProgressiveOptionAt(index, 'description', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Max Distance (ft)"
                            value={item.maxViewDistanceFt}
                            onChange={(e) => setProgressiveOptionAt(index, 'maxViewDistanceFt', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Extra Price"
                            value={item.extraPrice}
                            onChange={(e) => setProgressiveOptionAt(index, 'extraPrice', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 1 }}>
                          <FormControlLabel
                            control={<Switch checked={item.isRecommended} onChange={(e) => setProgressiveOptionAt(index, 'isRecommended', e.target.checked)} />}
                            label=""
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 1 }}>
                          <IconButton
                            color="error"
                            onClick={() =>
                              handleFieldChange(
                                'progressiveOptions',
                                form.progressiveOptions.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Delete />
                          </IconButton>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2.5 }}>
                          <FormControl fullWidth>
                            <InputLabel>Progressive Type</InputLabel>
                            <Select
                              value={item.progressiveType}
                              label="Progressive Type"
                              onChange={(e) => setProgressiveOptionAt(index, 'progressiveType', e.target.value as ProgressiveType)}
                            >
                              <MenuItem value="STANDARD">Standard</MenuItem>
                              <MenuItem value="PREMIUM">Premium</MenuItem>
                              <MenuItem value="OFFICE">Office</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2.5 }}>
                          <FormControlLabel
                            control={<Switch checked={item.isActive} onChange={(e) => setProgressiveOptionAt(index, 'isActive', e.target.checked)} />}
                            label="Option Active"
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </>
              )}
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 1.5 }}>Review Lens Payload</Typography>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 3 }}>
                Scope: {formatScopeLabel(form.scope)}
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Basic</Typography>
                    <Typography sx={{ fontSize: 13 }}>SKU: {form.sku || 'N/A'}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Name: {form.name || 'N/A'}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Base Price: {form.basePrice || '0'}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Category: {form.category}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Is Progressive: {form.isProgressive ? 'Yes' : 'No'}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Progressive Type: {form.isProgressive ? form.progressiveType : 'N/A'}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Is Active: {form.isActive ? 'Yes' : 'No'}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Detail Summary</Typography>
                    <Typography sx={{ fontSize: 13 }}>Existing Feature IDs: {parseIds(form.featureIdsInput).length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Existing Tint IDs: {parseIds(form.tintIdsInput).length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Existing Usage IDs: {parseIds(form.usageIdsInput).length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>New Features: {form.featuresToCreate.filter((x) => x.name.trim()).length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>New Tints: {form.tintsToCreate.filter((x) => x.name.trim()).length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>New Usages: {form.usagesToCreate.filter((x) => x.name.trim()).length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Progressive Options: {form.isProgressive ? form.progressiveOptions.filter((x) => x.name.trim()).length : 0}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || submitting}>Back</Button>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {successMessage && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setForm(DEFAULT_FORM);
                    setSuccessMessage('');
                    setActiveStep(0);
                    setErrors({});
                  }}
                >
                  Create Another
                </Button>
              )}
              {activeStep < STEPS.length - 1 ? (
                <Button variant="contained" onClick={handleNext} disabled={submitting}>Continue</Button>
              ) : (
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Lens'}
                </Button>
              )}
              <Button variant="text" onClick={() => navigate(PAGE_ENDPOINTS.SHOP.PRODUCTS)} disabled={submitting}>
                Back to Products
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default CreateLensPage;
