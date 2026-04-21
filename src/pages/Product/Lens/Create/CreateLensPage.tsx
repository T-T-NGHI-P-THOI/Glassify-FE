import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
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
  Tab,
  Tabs,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Add, ArrowBack, CheckCircle, Delete, Edit, Save, Cancel, ExpandMore, CloudUpload, InfoOutlined } from '@mui/icons-material';
import { useMemo, useState, useEffect, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { shopApi } from '@/api/shopApi';
import ProductAPI from '@/api/product-api';
import { lensService } from '@/api/service/LensService';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import {
  lensApi,
  type CreateLensRequest,
  type LensFeatureFrameCompatibility,
  type LensFeatureFrameCompatibilityCreateRequest,
  type LensFeatureFrameCompatibilityUpdateRequest,
  type LensResponse,
  type LensWithProductResult,
} from '@/api/lens-api';
import type { ShopDetailResponse } from '@/models/Shop';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatNumber, parseNumber } from '@/utils/formatCurrency';
import { sanitizeTextInput } from '@/utils/text-input';

type LensScope = 'GLOBAL' | 'FRAME_VARIANT' | 'FRAME_GROUP';
type LensCategory = 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE' | 'READING' | 'FASHION';
type ProgressiveType = 'STANDARD' | 'PREMIUM' | 'MID_RANGE' | 'NEAR_RANGE';
type TintBehavior = 'NONE' | 'SOLID' | 'GRADIENT' | 'MIRROR' | 'PHOTOCHROMIC';

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
  costPrice: string;
  compareAtPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  warrantyMonths: string;
  isReturnable: boolean;
  isFeatured: boolean;

  isActive: boolean;
  category: LensCategory;
  progressiveType: ProgressiveType;
  featureIds: string[];
  tintIds: string[];
  usageIds: string[];
  featuresToCreate: FeatureDraft[];
  tintsToCreate: TintDraft[];
  progressiveOptions: ProgressiveOptionDraft[];
}

interface InitialLinkedDetailState {
  featureIds: string[];
  tintIds: string[];
  usageIds: string[];
}

interface FrameVariantLite {
  id: string;
  colorName: string;
  size: string;
  productId?: string | null;
}

interface FrameGroupLite {
  id: string;
  frameName: string;
  frameVariantResponses?: FrameVariantLite[];
}

interface ExistingFeatureOption {
  id: string;
  name: string;
  sku: string;
}

interface CompatibilityDraft {
  featureId: string;
  sph: string;
}

type EditingCompatibility = Omit<LensFeatureFrameCompatibility, 'sph'> & {
  sph: string;
};

interface ExistingTintOption {
  id: string;
  name: string;
  code: string;
  cssValue?: string;
  opacity?: number;
  basePrice?: number;
  isActive?: boolean;
  behavior?: TintBehavior;
}

interface ExistingUsageOption {
  id: string;
  name: string;
}

interface UsageRuleDraft {
  usageId: string;
  ruleId?: string;
  allowTint: boolean;
  allowProgressive: boolean;
  minPriceAdjustment: number;
}

interface EditingExistingFeature extends ExistingFeatureOption {
  description?: string;
  mappingId?: string;
  extraPrice?: number;
  isDefault?: boolean;
}

interface EditingExistingTint extends ExistingTintOption {
  cssValue?: string;
  opacity?: number;
  basePrice?: number;
  isActive?: boolean;
  behavior?: TintBehavior;
  optionId?: string;
  extraPrice?: number;
  isDefault?: boolean;
}

interface EditingExistingUsage extends ExistingUsageOption {
  description?: string;
  ruleId?: string;
  allowTint?: boolean;
  allowProgressive?: boolean;
  minPriceAdjustment?: number;
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

const resolveLensResponse = (
  value?: LensResponse | LensWithProductResult | null,
): LensResponse | null => {
  if (!value) return null;
  if ('lens' in value) return value.lens ?? null;
  return value;
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
  costPrice: '',
  compareAtPrice: '',
  stockQuantity: '',
  lowStockThreshold: '',
  warrantyMonths: '',
  isReturnable: true,
  isFeatured: true,

  isActive: true,
  category: 'SINGLE_VISION',
  progressiveType: 'STANDARD',
  featureIds: [],
  tintIds: [],
  usageIds: [],
  featuresToCreate: [],
  tintsToCreate: [],
  progressiveOptions: [],
};

const DEFAULT_INITIAL_LINKED: InitialLinkedDetailState = {
  featureIds: [],
  tintIds: [],
  usageIds: [],
};

const DEFAULT_COMPATIBILITY_DRAFT: CompatibilityDraft = {
  featureId: '',
  sph: '0',
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

const formatScopeLabel = (scope: LensScope) => {
  if (scope === 'FRAME_GROUP') return 'Frame Group';
  if (scope === 'FRAME_VARIANT') return 'Frame Variant';
  return 'Global';
};

const isCatalogableFrameVariant = (variant: FrameVariantLite) => Boolean(variant.id && variant.productId);

const DECIMAL_INPUT_REGEX = /^\d*(\.\d*)?$/;
const DECIMAL_10_2_MAX_ABS = 99_999_999.99;

const sanitizeDecimalInput = (value: string) => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const firstDot = normalized.indexOf('.');
  if (firstDot === -1) return normalized;
  return `${normalized.slice(0, firstDot + 1)}${normalized.slice(firstDot + 1).replace(/\./g, '')}`;
};

const parseDecimalInput = (value: string): number => Number(sanitizeDecimalInput(value));

const getBasePriceError = (value: string): string | undefined => {
  const parsedValue = parseDecimalInput(value);
  if (!value || !Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 'Base price must be greater than 0';
  }

  if (parsedValue > DECIMAL_10_2_MAX_ABS) {
    return 'Base price must be <= 99,999,999.99';
  }

  return undefined;
};

const shouldBlockNonNumericKey = (event: KeyboardEvent<HTMLElement>) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (event.key.length !== 1) return false;
  return !/[0-9.]/.test(event.key);
};

const getFirstApiError = (response: { errors?: unknown; message?: string } | undefined): string | undefined => {
  const first = Array.isArray(response?.errors)
    ? response.errors.find((item) => typeof item === 'string')
    : undefined;
  if (typeof first === 'string' && first.trim()) return first;
  if (typeof response?.message === 'string' && response.message.trim()) return response.message;
  return undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object');

const toText = (value: unknown): string => (typeof value === 'string' && value.trim() ? value.trim() : '');

const UUID_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuidLike = (value: string): boolean => UUID_LIKE_REGEX.test(value.trim());

const extractText = (record: unknown, keys: string[]): string => {
  if (!isRecord(record)) return '';

  for (const key of keys) {
    const text = toText(record[key]);
    if (text) return text;
  }

  return '';
};

const pickDisplayValue = (id: string, candidates: Array<unknown>, fallback = 'N/A'): string => {
  const normalizedId = id.trim().toLowerCase();
  let uuidLikeCandidate = '';

  for (const candidate of candidates) {
    const text = toText(candidate);
    if (!text) continue;
    if (text.trim().toLowerCase() === normalizedId) continue;
    if (isUuidLike(text)) {
      if (!uuidLikeCandidate) uuidLikeCandidate = text;
      continue;
    }
    return text;
  }

  if (uuidLikeCandidate) return uuidLikeCandidate;

  return fallback;
};

const formatPrimarySecondaryLabel = (
  id: string,
  primaryCandidate: string,
  secondaryCandidate?: string,
): string => {
  const primary = pickDisplayValue(id, [primaryCandidate], '');
  const secondary = pickDisplayValue(id, [secondaryCandidate], '');

  if (primary && secondary && primary !== secondary) {
    return `${primary} (${secondary})`;
  }

  if (primary) return primary;
  if (secondary) return secondary;

  return id;
};

const normalizeFeatureOptionFromRecord = (item: unknown): ExistingFeatureOption => {
  const record = isRecord(item) ? item : {};
  const nestedFeature = isRecord(record.feature) ? record.feature : undefined;
  const id = toText(record.featureId) || toText(record.id);
  const rawSku =
    extractText(record, ['sku', 'featureSku']) ||
    extractText(nestedFeature, ['sku']) ||
    '';
  const rawName =
    extractText(record, ['name', 'featureName']) ||
    extractText(nestedFeature, ['name']) ||
    '';
  const name = pickDisplayValue(id, [rawName, rawSku], id);
  const sku = pickDisplayValue(id, [rawSku, rawName], id);
  return {
    id,
    name,
    sku,
  };
};

const normalizeTintOptionFromRecord = (item: unknown): ExistingTintOption => {
  const record = isRecord(item) ? item : {};
  const nestedTint = isRecord(record.tint) ? record.tint : undefined;
  const id = toText(record.tintId) || toText(record.id);
  const rawCode =
    extractText(record, ['code', 'tintCode']) ||
    extractText(nestedTint, ['code']) ||
    '';
  const rawName =
    extractText(record, ['name', 'tintName']) ||
    extractText(nestedTint, ['name']) ||
    '';
  const code = pickDisplayValue(id, [rawCode, rawName], id);
  const name = pickDisplayValue(id, [rawName, rawCode], id);
  return {
    id,
    name,
    code,
    cssValue: extractText(record, ['cssValue']) || extractText(nestedTint, ['cssValue']),
    opacity:
      typeof record.opacity === 'number'
        ? record.opacity
        : nestedTint && typeof nestedTint.opacity === 'number'
          ? nestedTint.opacity
          : undefined,
    basePrice:
      typeof record.basePrice === 'number'
        ? record.basePrice
        : nestedTint && typeof nestedTint.basePrice === 'number'
          ? nestedTint.basePrice
          : undefined,
    isActive:
      typeof record.isActive === 'boolean'
        ? record.isActive
        : nestedTint && typeof nestedTint.isActive === 'boolean'
          ? nestedTint.isActive
          : undefined,
    behavior: (extractText(record, ['behavior']) || extractText(nestedTint, ['behavior']) || 'NONE') as TintBehavior,
  };
};

const normalizeUsageOptionFromRecord = (item: unknown): ExistingUsageOption => {
  const record = isRecord(item) ? item : {};
  const nestedUsage = isRecord(record.usage) ? record.usage : undefined;
  const id = toText(record.usageId) || toText(record.id);
  const rawName =
    extractText(record, ['name', 'usageName']) ||
    extractText(nestedUsage, ['name']) ||
    '';
  const name = pickDisplayValue(id, [rawName], id);
  return {
    id,
    name,
  };
};

const mergeUsageOptions = (
  current: ExistingUsageOption[],
  incoming: ExistingUsageOption[],
): ExistingUsageOption[] => {
  const usageMap = new Map<string, ExistingUsageOption>();
  current.forEach((item) => {
    if (item.id) usageMap.set(item.id, item);
  });
  incoming.forEach((item) => {
    if (item.id) usageMap.set(item.id, item);
  });
  return Array.from(usageMap.values());
};

const normalizeUsageRuleDraftFromRecord = (
  item: unknown,
  fallback: Pick<UsageRuleDraft, 'allowTint' | 'allowProgressive' | 'minPriceAdjustment'>,
): UsageRuleDraft | null => {
  if (!isRecord(item)) return null;

  const usageId = toText(item.usageId);
  if (!usageId) return null;

  return {
    usageId,
    ruleId: toText(item.id) || undefined,
    allowTint: typeof item.allowTint === 'boolean' ? item.allowTint : fallback.allowTint,
    allowProgressive:
      typeof item.allowProgressive === 'boolean' ? item.allowProgressive : fallback.allowProgressive,
    minPriceAdjustment:
      typeof item.minPriceAdjustment === 'number'
        ? item.minPriceAdjustment
        : fallback.minPriceAdjustment,
  };
};

const assertApiSuccess = (
  response: { status?: number; errors?: unknown; message?: string } | undefined,
  fallbackMessage: string,
) => {
  const status = Number(response?.status ?? 0);
  if (status >= 400) {
    throw new Error(getFirstApiError(response) || fallbackMessage);
  }
};

const isAlreadyExistsError = (error: unknown): boolean => {
  const message = getApiErrorMessage(error, '').toLowerCase();
  return message.includes('already') || message.includes('exist');
};

const CreateLensPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { lensId } = useParams<{ lensId: string }>();
  const isEditMode = Boolean(lensId);
  const { user } = useAuth();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveCompleted, setSaveCompleted] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [frameGroups, setFrameGroups] = useState<FrameGroupLite[]>([]);
  const [form, setForm] = useState<LensFormState>(DEFAULT_FORM);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [existingFeatures, setExistingFeatures] = useState<ExistingFeatureOption[]>([]);
  const [existingTints, setExistingTints] = useState<ExistingTintOption[]>([]);
  const [existingUsages, setExistingUsages] = useState<ExistingUsageOption[]>([]);
  const [existingCompatibilities, setExistingCompatibilities] = useState<LensFeatureFrameCompatibility[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [selectedTintId, setSelectedTintId] = useState('');
  const [selectedUsageId, setSelectedUsageId] = useState('');
  const [selectedCompatibilityFeatureId, setSelectedCompatibilityFeatureId] = useState('');
  const [compatibilityDraft, setCompatibilityDraft] = useState<CompatibilityDraft>(DEFAULT_COMPATIBILITY_DRAFT);
  const [detailsObjectTab, setDetailsObjectTab] = useState<'FEATURE' | 'TINT' | 'USAGE' | 'COMPATIBILITY' | 'PROGRESSIVE'>('FEATURE');
  const [editingCompatibilityId, setEditingCompatibilityId] = useState<string | null>(null);
  const [editingCompatibility, setEditingCompatibility] = useState<EditingCompatibility | null>(null);
  const [lensLoading, setLensLoading] = useState(false);
  const [initialLinkedDetails, setInitialLinkedDetails] = useState<InitialLinkedDetailState>(
    DEFAULT_INITIAL_LINKED,
  );

  // State for tracking existing features/tints being edited
  const [editingExistingFeatureId, setEditingExistingFeatureId] = useState<string | null>(null);
  const [editingExistingFeature, setEditingExistingFeature] = useState<EditingExistingFeature | null>(null);
  const [editingExistingTintId, setEditingExistingTintId] = useState<string | null>(null);
  const [editingExistingTint, setEditingExistingTint] = useState<EditingExistingTint | null>(null);
  const [editingExistingUsageId, setEditingExistingUsageId] = useState<string | null>(null);
  const [editingExistingUsage, setEditingExistingUsage] = useState<EditingExistingUsage | null>(null);
  const [lens, setLens] = useState<LensResponse | null>(null);
  const [usageRuleDrafts, setUsageRuleDrafts] = useState<Record<string, UsageRuleDraft>>({});
  const [currentLensImageUrl, setCurrentLensImageUrl] = useState('');
  const [selectedLensImageFile, setSelectedLensImageFile] = useState<File | null>(null);
  const [selectedLensImagePreview, setSelectedLensImagePreview] = useState('');

  const previewLensImageUrl = selectedLensImagePreview || currentLensImageUrl;

  const clearSelectedLensImage = () => {
    if (selectedLensImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(selectedLensImagePreview);
    }
    setSelectedLensImagePreview('');
    setSelectedLensImageFile(null);
  };

  const handleLensImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (selectedLensImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(selectedLensImagePreview);
    }

    setSelectedLensImageFile(file);
    setSelectedLensImagePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (selectedLensImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(selectedLensImagePreview);
      }
    };
  }, [selectedLensImagePreview]);

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

  useEffect(() => {
    if (!isEditMode || !lensId) return;

    (async () => {
      try {
        setLensLoading(true);
        const fetchedLensResult = await lensApi.getById(lensId);
        const fetchedLens = fetchedLensResult.lens;
        const fetchedProduct = fetchedLensResult.product;
        setLens(fetchedLens);
        setCurrentLensImageUrl(fetchedLens.imageUrl || '');
        setSelectedLensImageFile(null);
        setSelectedLensImagePreview('');

        const rawFeatureMappings = (Array.isArray(fetchedLens.featureMappings) ? fetchedLens.featureMappings : []) as unknown[];
        const rawTintOptions = (Array.isArray(fetchedLens.tintOptions) ? fetchedLens.tintOptions : []) as unknown[];
        const rawUsageRules = (Array.isArray(fetchedLens.usageRules) ? fetchedLens.usageRules : []) as unknown[];

        const featureMappings = (fetchedLens.featureMappings as Array<{ featureId: string }>) ?? [];
        const tintOptions = (fetchedLens.tintOptions as Array<{ tintId: string }>) ?? [];
        const usageRules = (fetchedLens.usageRules as Array<{ usageId: string }>) ?? [];
        const progressiveOptions = (fetchedLens.progressiveOptions as Array<{
          name: string;
          description?: string;
          maxViewDistanceFt?: number;
          extraPrice?: number;
          isRecommended?: boolean;
          isActive?: boolean;
          progressiveType?: string;
        }>) ?? [];

        const usageIds = usageRules.map((u) => u.usageId).filter(Boolean);

        setInitialLinkedDetails({
          featureIds: featureMappings.map((m) => m.featureId).filter(Boolean),
          tintIds: tintOptions.map((t) => t.tintId).filter(Boolean),
          usageIds,
        });

        const detailFeatures = rawFeatureMappings
          .filter(isRecord)
          .map((item) => normalizeFeatureOptionFromRecord(item))
          .filter((item) => Boolean(item.id));
        const detailTints = rawTintOptions
          .filter(isRecord)
          .map((item) => normalizeTintOptionFromRecord(item))
          .filter((item) => Boolean(item.id));
        const detailUsages = rawUsageRules
          .filter(isRecord)
          .map((item) => normalizeUsageOptionFromRecord(item))
          .filter((item) => Boolean(item.id));

        const detailUsageRuleDrafts = rawUsageRules
          .map((item) =>
            normalizeUsageRuleDraftFromRecord(item, {
              allowTint: true,
              allowProgressive: Boolean((fetchedLens.category === 'PROGRESSIVE')),
              minPriceAdjustment: 0,
            }),
          )
          .filter((item): item is UsageRuleDraft => Boolean(item));

        if (detailUsageRuleDrafts.length > 0) {
          setUsageRuleDrafts(
            detailUsageRuleDrafts.reduce<Record<string, UsageRuleDraft>>((acc, item) => {
              acc[item.usageId] = item;
              return acc;
            }, {}),
          );
        }

        if (detailFeatures.length > 0) setExistingFeatures(detailFeatures);
        if (detailTints.length > 0) setExistingTints(detailTints);
        if (detailUsages.length > 0) setExistingUsages(detailUsages);

        setForm((prev) => ({
          ...prev,
          sku: String(fetchedProduct?.sku || ''),
          name: String(fetchedLens.name || ''),
          basePrice: String(fetchedProduct?.basePrice ?? fetchedLens.basePrice ?? ''),
          costPrice: String(fetchedProduct?.costPrice ?? ''),
          compareAtPrice: String(fetchedProduct?.compareAtPrice ?? ''),
          stockQuantity: String(fetchedProduct?.stockQuantity ?? ''),
          lowStockThreshold: String(fetchedProduct?.lowStockThreshold ?? ''),
          warrantyMonths: String(fetchedProduct?.warrantyMonths ?? ''),
          isReturnable: fetchedProduct?.isReturnable ?? true,
          isFeatured: fetchedProduct?.isFeatured ?? true,

          isActive: Boolean(fetchedLens.isActive),
          category: (fetchedLens.category as LensCategory) || 'SINGLE_VISION',
          progressiveType: (fetchedLens.progressiveType as ProgressiveType) || 'STANDARD',
          featureIds: featureMappings.map((m) => m.featureId).filter(Boolean),
          tintIds: tintOptions.map((t) => t.tintId).filter(Boolean),
          usageIds,
          featuresToCreate: [],
          tintsToCreate: [],
          progressiveOptions: progressiveOptions.map((item) => ({
            name: item.name || '',
            description: item.description || '',
            maxViewDistanceFt: String(item.maxViewDistanceFt ?? 0),
            extraPrice: String(item.extraPrice ?? 0),
            isRecommended: Boolean(item.isRecommended),
            isActive: Boolean(item.isActive),
            progressiveType: (item.progressiveType as ProgressiveType) || 'STANDARD',
          })),
        }));
      } catch (error) {
        console.error('Failed to load lens detail:', error);
        toast.error('Unable to load lens details for editing');
      } finally {
        setLensLoading(false);
      }
    })();
  }, [isEditMode, lensId]);

  useEffect(() => {
    if (!isEditMode || !lensId || !shop?.id || frameGroups.length === 0) return;

    let active = true;

    (async () => {
      try {
        const frameVariantIds = Array.from(
          new Set(
            frameGroups
              .flatMap((group) => group.frameVariantResponses ?? [])
              .filter(isCatalogableFrameVariant)
              .map((variant) => variant.id)
              .filter(Boolean),
          ),
        );

        if (frameVariantIds.length === 0) return;

        const catalogResults = await Promise.allSettled(
          frameVariantIds.map((frameVariantId) => lensApi.getCatalogForFrame(frameVariantId)),
        );

        if (!active) return;

        for (const result of catalogResults) {
          if (result.status !== 'fulfilled' || !result.value) continue;

          const matched = result.value.lenses?.find((lens) => lens.lensId === lensId);
          if (!matched) continue;

          const featureIds = (matched.features ?? [])
            .map((item) => item.featureId)
            .filter((id): id is string => Boolean(id));
          const tintIds = (matched.tints ?? [])
            .map((item) => item.tintId)
            .filter((id): id is string => Boolean(id));
          const usageIds = (matched.usages ?? [])
            .map((item) => item.usageId)
            .filter((id): id is string => Boolean(id));

          const matchedFeatures = (matched.features ?? [])
            .filter(isRecord)
            .map((item) => normalizeFeatureOptionFromRecord(item))
            .filter((item) => Boolean(item.id));
          const matchedTints = (matched.tints ?? [])
            .filter(isRecord)
            .map((item) => normalizeTintOptionFromRecord(item))
            .filter((item) => Boolean(item.id));
          const matchedUsages = (matched.usages ?? [])
            .filter(isRecord)
            .map((item) => normalizeUsageOptionFromRecord(item))
            .filter((item) => Boolean(item.id));

          setInitialLinkedDetails({
            featureIds,
            tintIds,
            usageIds,
          });

          const matchedUsageDrafts = (matched.usages ?? [])
            .map((item) =>
              normalizeUsageRuleDraftFromRecord(item, {
                allowTint: true,
                allowProgressive: Boolean((form.category === 'PROGRESSIVE')),
                minPriceAdjustment: 0,
              }),
            )
            .filter((item): item is UsageRuleDraft => Boolean(item));

          if (matchedUsageDrafts.length > 0) {
            setUsageRuleDrafts((prev) => {
              const next = { ...prev };
              matchedUsageDrafts.forEach((draft) => {
                if (!next[draft.usageId]) {
                  next[draft.usageId] = draft;
                }
              });
              return next;
            });
          }

          if (matchedFeatures.length > 0) setExistingFeatures(matchedFeatures);
          if (matchedTints.length > 0) setExistingTints(matchedTints);
          if (matchedUsages.length > 0) setExistingUsages(matchedUsages);

          setForm((prev) => ({
            ...prev,
            featureIds,
            tintIds,
            usageIds,
            // Existing options are already on server; keep this draft list for newly added options only.
            // Note: progressiveOptions are not affected by catalog loading - they are lens-specific, not frame-variant-specific
          }));

          break;
        }
      } catch (error) {
        console.error('Failed to preload existing lens details from catalog:', error);
      }
    })();

    return () => {
      active = false;
    };
  }, [isEditMode, lensId, shop?.id, frameGroups]);

  const variantOptions = useMemo(
    () =>
      frameGroups.flatMap((group) =>
        (group.frameVariantResponses ?? [])
          .filter(isCatalogableFrameVariant)
          .map((variant) => ({
            id: variant.id,
            label: `${group.frameName} - ${variant.colorName || 'Color'} ${variant.size ? `(${variant.size})` : ''}`,
          })),
      ),
    [frameGroups],
  );

  const catalogableFrameVariantIds = useMemo(
    () => new Set(variantOptions.map((variant) => variant.id)),
    [variantOptions],
  );

  const selectedCatalogFrameVariantId = useMemo(() => {
    if (form.scope === 'FRAME_VARIANT') {
      return catalogableFrameVariantIds.has(form.frameVariantId) ? form.frameVariantId : '';
    }
    if (form.scope === 'FRAME_GROUP') {
      const group = frameGroups.find((item) => item.id === form.frameGroupId);
      const selectedVariantId = group?.frameVariantResponses?.find(isCatalogableFrameVariant)?.id ?? '';
      return catalogableFrameVariantIds.has(selectedVariantId) ? selectedVariantId : '';
    }
    if (isEditMode) {
      const selectedVariantId = frameGroups[0]?.frameVariantResponses?.find(isCatalogableFrameVariant)?.id ?? '';
      return catalogableFrameVariantIds.has(selectedVariantId) ? selectedVariantId : '';
    }
    return '';
  }, [catalogableFrameVariantIds, form.scope, form.frameVariantId, form.frameGroupId, frameGroups, isEditMode]);

  useEffect(() => {
    let active = true;

    const loadExistingOptions = async () => {
      if (!selectedCatalogFrameVariantId) {
        if (!isEditMode) {
          setExistingFeatures([]);
          setExistingTints([]);
          setExistingCompatibilities([]);
        } else if (form.scope !== 'GLOBAL') {
          toast.error('This shop does not have this frame');
        }
        return;
      }

      try {
        setCatalogLoading(true);
        console.log('Loading catalog for frameVariantId:', selectedCatalogFrameVariantId);
        const catalog = await lensService.getLensCatalogForFrame(selectedCatalogFrameVariantId);
        if (!active) return;

        const featureMap = new Map<string, ExistingFeatureOption>();
        const tintMap = new Map<string, ExistingTintOption>();
        const usageMap = new Map<string, ExistingUsageOption>();

        (catalog?.lenses ?? []).forEach((lens) => {
          (lens.features ?? []).forEach((feature) => {
            const normalized = normalizeFeatureOptionFromRecord(feature);
            if (normalized.id && !featureMap.has(normalized.id)) {
              featureMap.set(normalized.id, normalized);
            }
          });

          (lens.tints ?? []).forEach((tint) => {
            const normalized = normalizeTintOptionFromRecord(tint);
            if (normalized.id && !tintMap.has(normalized.id)) {
              tintMap.set(normalized.id, normalized);
            }
          });

          (lens.usages ?? []).forEach((usage) => {
            const normalized = normalizeUsageOptionFromRecord(usage);
            if (normalized.id && !usageMap.has(normalized.id)) {
              usageMap.set(normalized.id, normalized);
            }
          });
        });

        const features = Array.from(featureMap.values());
        const tints = Array.from(tintMap.values());
        const usages = Array.from(usageMap.values());

        console.log('Catalog loaded:', {
          features: features.length,
          tints: tints.length,
          usages: usages.length,
          details: { features, tints, usages },
        });

        setExistingFeatures((prev) => {
          const next = new Map<string, ExistingFeatureOption>();
          prev.forEach((item) => {
            if (item.id) next.set(item.id, item);
          });
          features.forEach((item) => {
            if (item.id) next.set(item.id, item);
          });
          return Array.from(next.values());
        });
        setExistingTints((prev) => {
          const next = new Map<string, ExistingTintOption>();
          prev.forEach((item) => {
            if (item.id) next.set(item.id, item);
          });
          tints.forEach((item) => {
            if (item.id) next.set(item.id, item);
          });
          return Array.from(next.values());
        });
        setExistingUsages((prev) => mergeUsageOptions(prev, usages));

        if (shop?.id) {
          const compatibilities = await lensApi.getFeatureFrameCompatibilities({
            shopId: shop.id,
            frameVariantId: selectedCatalogFrameVariantId,
          });

          if (!active) return;
          setExistingCompatibilities(compatibilities);
        }
      } catch (error) {
        if (!active) return;
        console.error('Failed to load catalog:', error);
        setExistingFeatures([]);
        setExistingTints([]);
        setExistingCompatibilities([]);
      } finally {
        if (active) setCatalogLoading(false);
      }
    };

    loadExistingOptions();

    return () => {
      active = false;
    };
  }, [selectedCatalogFrameVariantId, isEditMode, shop?.id]);

  useEffect(() => {
    if (!shop?.id) return;

    let active = true;

    (async () => {
      try {
        const usageObjects = await lensApi.getUsages({
          page: 1,
          unitPerPage: 200,
          shopId: shop.id,
          isActive: true,
          sortBy: 'name',
          sortDirection: 'ASC',
        });

        if (!active) return;

        const normalizedUsageOptions = usageObjects
          .map((item) => ({
            id: toText(item.id),
            name: toText(item.name) || toText(item.id),
          }))
          .filter((item) => Boolean(item.id));

        if (normalizedUsageOptions.length > 0) {
          setExistingUsages((prev) => mergeUsageOptions(prev, normalizedUsageOptions));
        }
      } catch (error) {
        console.error('Failed to load usage objects:', error);
      }
    })();

    return () => {
      active = false;
    };
  }, [shop?.id]);

  useEffect(() => {
    console.log('Filtering selected IDs', {
      featureIds: form.featureIds,
      existingFeatureIds: existingFeatures.map((f) => f.id),
      tintIds: form.tintIds,
      existingTintIds: existingTints.map((t) => t.id),
      usageIds: form.usageIds,
      existingUsageIds: existingUsages.map((u) => u.id),
    });

    // Don't filter if existing arrays are empty (they're still loading)
    if (existingFeatures.length === 0 && existingTints.length === 0 && existingUsages.length === 0) {
      console.log('Skipping filter - catalog still loading');
      return;
    }

    setForm((prev) => {
      const filtered = {
        ...prev,
        featureIds: existingFeatures.length > 0 
          ? prev.featureIds.filter((id) => existingFeatures.some((option) => option.id === id))
          : prev.featureIds,
        tintIds: existingTints.length > 0
          ? prev.tintIds.filter((id) => existingTints.some((option) => option.id === id))
          : prev.tintIds,
        usageIds: existingUsages.length > 0
          ? prev.usageIds.filter((id) => existingUsages.some((option) => option.id === id))
          : prev.usageIds,
      };
      console.log('After filter:', filtered);
      return filtered;
    });
  }, [existingFeatures, existingTints, existingUsages]);

  useEffect(() => {
    setUsageRuleDrafts((prev) => {
      const next: Record<string, UsageRuleDraft> = {};
      form.usageIds.forEach((usageId) => {
        next[usageId] = prev[usageId] ?? {
          usageId,
          allowTint: true,
          allowProgressive: (form.category === 'PROGRESSIVE'),
          minPriceAdjustment: 0,
        };
      });
      return next;
    });
  }, [form.usageIds, (form.category === 'PROGRESSIVE')]);

  const handleFieldChange = <K extends keyof LensFormState>(key: K, value: LensFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handlePriceFieldChange = (key: 'basePrice' | 'costPrice' | 'compareAtPrice', value: string) => {
    let raw = value.replace(/,/g, '');
    raw = raw.replace(/[^\d.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts[1];
    if (parts[1]?.length > 2) raw = parts[0] + '.' + parts[1].slice(0, 2);
    handleFieldChange(key, raw);
    if (key === 'basePrice') {
      const error = getBasePriceError(raw);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[key] = error;
        } else {
          delete next[key];
        }
        return next;
      });
    }
  };

  const handlePriceFieldBlur = (key: 'basePrice' | 'costPrice' | 'compareAtPrice') => {
    let raw = (form[key] || '').replace(/,/g, '');
    if (!raw) return;
    const parts = raw.split('.');
    let formatted = formatNumber(Number(parts[0] || '0'));
    if (parts[1] !== undefined && parts[1] !== '') formatted += '.' + parts[1];
    handleFieldChange(key, formatted);
  };

  const validateStep = (step: number): boolean => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!form.sku.trim()) nextErrors.sku = 'SKU is required';
      if (!form.name.trim()) nextErrors.name = 'Lens name is required';
      if (!form.basePrice.trim()) {
        nextErrors.basePrice = 'Base price is required';
      } else {
        const basePriceError = getBasePriceError(form.basePrice);
        if (basePriceError) {
          nextErrors.basePrice = basePriceError;
        }
      }
            

      if (!isEditMode && form.scope === 'FRAME_VARIANT' && !form.frameVariantId) {
        nextErrors.frameVariantId = 'Please select a frame variant';
      }

      if (!isEditMode && form.scope === 'FRAME_GROUP' && !form.frameGroupId) {
        nextErrors.frameGroupId = 'Please select a frame group';
      }

      if ((form.category === 'PROGRESSIVE') && !form.progressiveType) {
        nextErrors.progressiveType = 'Progressive type is required when lens is progressive';
      }
    }

    if (step === 1) {
      form.featuresToCreate.forEach((feature, index) => {
        if (!feature.sku.trim()) {
          nextErrors[`featuresToCreate.${index}.sku`] = 'Feature SKU is required';
        }
        if (!feature.name.trim()) {
          nextErrors[`featuresToCreate.${index}.name`] = 'Feature name is required';
        }
      });

      form.tintsToCreate.forEach((tint, index) => {
        if (!tint.code.trim()) {
          nextErrors[`tintsToCreate.${index}.code`] = 'Tint code is required';
        }
        if (!tint.name.trim()) {
          nextErrors[`tintsToCreate.${index}.name`] = 'Tint name is required';
        }
      });

      if ((form.category === 'PROGRESSIVE')) {
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
    setSaveCompleted(false);
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setSaveCompleted(false);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const buildPayload = (): CreateLensRequest => {
    const parseOptionalDecimal = (value: string) => {
      const sanitized = sanitizeDecimalInput(value);
      return sanitized.trim() ? parseDecimalInput(sanitized) : undefined;
    };
    const parseOptionalInteger = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
    };

    const parsedBasePrice = parseDecimalInput(form.basePrice);

    
    const featureIds = form.featureIds.length ? form.featureIds : undefined;
    const tintIds = form.tintIds.length ? form.tintIds : undefined;
    const usageIds = form.usageIds.length ? form.usageIds : undefined;
    const featuresToCreate = form.featuresToCreate
      .filter((x) => x.sku.trim() && x.name.trim())
      .map((x) => ({ sku: x.sku.trim(), name: x.name.trim(), description: x.description.trim() }));
    const tintsToCreate = form.tintsToCreate
      .filter((x) => x.code.trim() && x.name.trim())
      .map((x) => ({
        code: x.code.trim(),
        name: x.name.trim(),
        cssValue: x.cssValue.trim(),
        opacity: Number(x.opacity || 0),
        basePrice: Number(x.basePrice || 0),
        isActive: x.isActive,
        behavior: x.behavior,
      }));
    const progressiveOptions = (form.category === 'PROGRESSIVE')
      ? form.progressiveOptions
          .filter((x) => x.name.trim())
          .map((x) => ({
            shopId: shop?.id ?? '',
            name: x.name.trim(),
            description: x.description.trim(),
            maxViewDistanceFt: Number(x.maxViewDistanceFt || 0),
            extraPrice: Number(x.extraPrice || 0),
            isRecommended: x.isRecommended,
            isActive: x.isActive,
            progressiveType: x.progressiveType,
          }))
      : undefined;

    return {
      shopId: shop?.id ?? '',
      sku: form.sku.trim(),
      name: form.name.trim(),
      imageFile: selectedLensImageFile ?? undefined,
      basePrice: parsedBasePrice,
      costPrice: parseOptionalDecimal(form.costPrice),
      compareAtPrice: parseOptionalDecimal(form.compareAtPrice),
      stockQuantity: parseOptionalInteger(form.stockQuantity),
      lowStockThreshold: parseOptionalInteger(form.lowStockThreshold),
      warrantyMonths: parseOptionalInteger(form.warrantyMonths),
      isReturnable: form.isReturnable,
      isFeatured: form.isFeatured,
      
      isActive: form.isActive,
      category: form.category,
      progressiveType: (form.category === 'PROGRESSIVE') ? form.progressiveType : undefined,
      featureIds,
      tintIds,
      usageIds,
      featuresToCreate: featuresToCreate.length ? featuresToCreate : undefined,
      tintsToCreate: tintsToCreate.length ? tintsToCreate : undefined,
      progressiveOptions: progressiveOptions?.length ? progressiveOptions : undefined,
    };
  };

  const createLensRelatedData = async (
    lensId: string,
    payload: CreateLensRequest,
    usageRulesByUsageId: Record<string, UsageRuleDraft>,
    onProgress?: (message: string) => void,
  ) => {
    if (!shop?.id) return;

    const featureIds = [...(payload.featureIds ?? [])];
    const tintIds = [...(payload.tintIds ?? [])];
    const usageIds = [...(payload.usageIds ?? [])];

    const featuresToCreate = payload.featuresToCreate ?? [];
    for (let i = 0; i < featuresToCreate.length; i += 1) {
      const feature = featuresToCreate[i];
      onProgress?.(`Creating feature ${i + 1}/${featuresToCreate.length}...`);
      const featureRes = await lensApi.createFeature({
        sku: feature.sku,
        name: feature.name,
        description: feature.description,
        featureDetailData: {
          shopId: shop.id,
          lensIds: [lensId],
          featureMappings: [
            {
              lensId,
              extraPrice: 0,
              isDefault: false,
            },
          ],
        },
      });
      assertApiSuccess(featureRes, 'Failed to create lens feature');
    }

    const tintsToCreate = payload.tintsToCreate ?? [];
    for (let i = 0; i < tintsToCreate.length; i += 1) {
      const tint = tintsToCreate[i];
      onProgress?.(`Creating tint ${i + 1}/${tintsToCreate.length}...`);
      const tintRes = await lensApi.createTint({
        code: tint.code,
        name: tint.name,
        cssValue: tint.cssValue,
        opacity: tint.opacity,
        basePrice: tint.basePrice,
        isActive: tint.isActive,
        behavior: tint.behavior,
        tintDetailData: {
          shopId: shop.id,
          lensIds: [lensId],
          tintOptions: [
            {
              lensId,
              extraPrice: 0,
              isDefault: false,
            },
          ],
        },
      });
      assertApiSuccess(tintRes, 'Failed to create lens tint');
    }

    const uniqueFeatureIds = Array.from(new Set(featureIds));
    const uniqueTintIds = Array.from(new Set(tintIds));
    const uniqueUsageIds = Array.from(new Set(usageIds));

    for (let i = 0; i < uniqueFeatureIds.length; i += 1) {
      const featureId = uniqueFeatureIds[i];
      onProgress?.(`Linking feature ${i + 1}/${uniqueFeatureIds.length} to lens...`);
      try {
        const mappingResult = await lensApi.createFeatureMapping(lensId, {
          shopId: shop.id,
          featureId,
          extraPrice: 0,
          isDefault: false,
        });
        assertApiSuccess(mappingResult, 'Failed to map feature to lens');
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          continue;
        }
        throw error;
      }
    }

    for (let i = 0; i < uniqueTintIds.length; i += 1) {
      const tintId = uniqueTintIds[i];
      onProgress?.(`Linking tint ${i + 1}/${uniqueTintIds.length} to lens...`);
      try {
        const tintOptionResult = await lensApi.createTintOption(lensId, {
          shopId: shop.id,
          tintId,
          extraPrice: 0,
          isDefault: false,
        });
        assertApiSuccess(tintOptionResult, 'Failed to map tint to lens');
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          continue;
        }
        throw error;
      }
    }

    for (let i = 0; i < uniqueUsageIds.length; i += 1) {
      const usageId = uniqueUsageIds[i];
      const usageRuleDraft = usageRulesByUsageId[usageId];

      // If this usage rule was already saved in edit mode, avoid creating it again on submit.
      if (usageRuleDraft?.ruleId) continue;

      onProgress?.(`Linking usage ${i + 1}/${uniqueUsageIds.length} to lens...`);
      try {
        const usageRuleResult = await lensApi.createUsageRule(lensId, {
          shopId: shop.id,
          usageId,
          allowTint: usageRuleDraft?.allowTint ?? true,
          allowProgressive: usageRuleDraft?.allowProgressive ?? (payload.category === 'PROGRESSIVE'),
          minPriceAdjustment: usageRuleDraft?.minPriceAdjustment ?? 0,
        });
        assertApiSuccess(usageRuleResult, 'Failed to map usage to lens');
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          continue;
        }
        throw error;
      }
    }

    if ((payload.category === 'PROGRESSIVE')) {
      const progressiveOptions = payload.progressiveOptions ?? [];
      for (let i = 0; i < progressiveOptions.length; i += 1) {
        const option = progressiveOptions[i];
        onProgress?.(`Creating progressive option ${i + 1}/${progressiveOptions.length}...`);
        try {
          const optionResult = await lensApi.createProgressiveOption(lensId, {
            shopId: shop.id,
            name: option.name,
            description: option.description,
            maxViewDistanceFt: option.maxViewDistanceFt,
            extraPrice: option.extraPrice,
            isRecommended: option.isRecommended,
            isActive: option.isActive,
            progressiveType: option.progressiveType,
          });
          assertApiSuccess(optionResult, 'Failed to create progressive option');
        } catch (error) {
          if (isAlreadyExistsError(error)) {
            continue;
          }
          throw error;
        }
      }
    }
  };

  const toEditDeltaPayload = (payload: CreateLensRequest): CreateLensRequest => {
    const nextFeatureIds = (payload.featureIds ?? []).filter(
      (id) => !initialLinkedDetails.featureIds.includes(id),
    );
    const nextTintIds = (payload.tintIds ?? []).filter((id) => !initialLinkedDetails.tintIds.includes(id));
    const nextUsageIds = (payload.usageIds ?? []).filter(
      (id) => !initialLinkedDetails.usageIds.includes(id),
    );

    return {
      ...payload,
      featureIds: nextFeatureIds,
      tintIds: nextTintIds,
      usageIds: nextUsageIds,
    };
  };

  const autoSaveEditRelatedData = async (
    currentLensId: string,
    onProgress?: (message: string) => void,
  ) => {
    if (!shop?.id) return;

    if (editingExistingFeatureId && editingExistingFeature?.mappingId) {
      onProgress?.('Saving feature changes...');
      await lensApi.updateFeature(editingExistingFeatureId, {
        sku: editingExistingFeature.sku.trim(),
        name: editingExistingFeature.name.trim(),
        description: editingExistingFeature.description?.trim(),
      });
      await lensApi.updateFeatureMapping(currentLensId, editingExistingFeature.mappingId, {
        shopId: shop.id,
        featureId: editingExistingFeatureId,
        extraPrice: editingExistingFeature.extraPrice,
        isDefault: editingExistingFeature.isDefault,
      });
    }

    if (editingExistingTintId && editingExistingTint?.optionId) {
      onProgress?.('Saving tint changes...');
      await lensApi.updateTint(editingExistingTintId, {
        code: editingExistingTint.code.trim(),
        name: editingExistingTint.name.trim(),
        cssValue: editingExistingTint.cssValue?.trim(),
        opacity: editingExistingTint.opacity,
        basePrice: editingExistingTint.basePrice,
        isActive: editingExistingTint.isActive,
        behavior: editingExistingTint.behavior,
      });
      await lensApi.updateTintOption(currentLensId, editingExistingTint.optionId, {
        shopId: shop.id,
        tintId: editingExistingTintId,
        extraPrice: editingExistingTint.extraPrice,
        isDefault: editingExistingTint.isDefault,
      });
    }

    const selectedUsageIds = Array.from(new Set(form.usageIds));
    for (let i = 0; i < selectedUsageIds.length; i += 1) {
      const usageId = selectedUsageIds[i];
      const draft = usageRuleDrafts[usageId];
      if (!draft?.ruleId) continue;

      onProgress?.(`Saving usage rule ${i + 1}/${selectedUsageIds.length}...`);
      await lensApi.updateUsageRule(currentLensId, draft.ruleId, {
        shopId: shop.id,
        usageId,
        allowTint: draft.allowTint,
        allowProgressive: draft.allowProgressive,
        minPriceAdjustment: draft.minPriceAdjustment,
      });
    }
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
      setSaveCompleted(false);
      setSubmitProgress(isEditMode ? 'Updating lens...' : 'Creating lens...');
      const payload = buildPayload();

      let response;
      if (isEditMode && lensId) {
        response = await lensApi.update(lensId, {
          shopId: payload.shopId,
          sku: payload.sku,
          name: payload.name,
          imageFile: selectedLensImageFile ?? undefined,
          keepImageUrls: selectedLensImageFile || !currentLensImageUrl ? [] : [currentLensImageUrl],
          basePrice: payload.basePrice,
          costPrice: payload.costPrice,
          compareAtPrice: payload.compareAtPrice,
          stockQuantity: payload.stockQuantity,
          lowStockThreshold: payload.lowStockThreshold,
          warrantyMonths: payload.warrantyMonths,
          isReturnable: payload.isReturnable,
          isFeatured: payload.isFeatured,
          isActive: payload.isActive,
          category: payload.category,
          progressiveType: payload.progressiveType,
          featureIds: payload.featureIds,
          tintIds: payload.tintIds,
          usageIds: payload.usageIds,
          featuresToCreate: payload.featuresToCreate,
          tintsToCreate: payload.tintsToCreate,
          usagesToCreate: payload.usagesToCreate,
          progressiveOptions: payload.progressiveOptions,
        });
      } else if (form.scope === 'FRAME_VARIANT') {
        if (!selectedCatalogFrameVariantId) {
          toast.error('This shop does not have this frame');
          return;
        }
        response = await lensApi.createForFrame(selectedCatalogFrameVariantId, payload);
      } else if (form.scope === 'FRAME_GROUP') {
        response = await lensApi.createForFrameGroup(form.frameGroupId, payload);
      } else {
        response = await lensApi.create(payload);
      }

      const updatedOrCreatedLens = resolveLensResponse(response?.data ?? null);
      const responseStatus = Number(response?.status ?? 0);

      // Some APIs wrap business errors in response body (status >= 400)
      // instead of throwing HTTP errors. Guard success by both status and entity id.
      if (responseStatus >= 400 || !updatedOrCreatedLens?.id) {
        const errorFromList = Array.isArray(response?.errors)
          ? response.errors.find((item) => typeof item === 'string')
          : undefined;
        const fallback = isEditMode ? 'Unable to update lens' : 'Unable to create lens';
        throw new Error(errorFromList || response?.message || fallback);
      }

      if (isEditMode && updatedOrCreatedLens?.id) {
        await autoSaveEditRelatedData(updatedOrCreatedLens.id, setSubmitProgress);

        // In edit mode, update endpoint handles lens core fields. New object links
        // (feature/tint/usage) must be created via dedicated mapping APIs.
        const deltaPayload = toEditDeltaPayload(payload);
        await createLensRelatedData(
          updatedOrCreatedLens.id,
          deltaPayload,
          usageRuleDrafts,
          setSubmitProgress,
        );
      }

      setSubmitProgress('Finalizing...');

      setSuccessMessage(
        isEditMode
          ? `Lens updated successfully${updatedOrCreatedLens?.id ? ` (ID: ${updatedOrCreatedLens.id})` : ''}.`
          : `Lens created successfully${updatedOrCreatedLens?.id ? ` (ID: ${updatedOrCreatedLens.id})` : ''}.`,
      );
      setSaveCompleted(true);
      toast.success(isEditMode ? 'Lens updated successfully' : 'Lens created successfully');
    } catch (error: any) {
      console.error('Create lens failed:', error);
      const message = getApiErrorMessage(error, isEditMode ? 'Unable to update lens' : 'Unable to create lens');
      toast.error(message);
    } finally {
      setSubmitting(false);
      setSubmitProgress('');
    }
  };

  const sidebarProps = {
    activeMenu: PAGE_ENDPOINTS.SHOP.PRODUCT_LENS,
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

  const removeExistingSelection = (type: 'feature' | 'tint' | 'usage', id: string) => {
    if (type === 'feature') {
      handleFieldChange(
        'featureIds',
        form.featureIds.filter((item) => item !== id),
      );
      return;
    }

    if (type === 'tint') {
      handleFieldChange(
        'tintIds',
        form.tintIds.filter((item) => item !== id),
      );
      return;
    }

    handleFieldChange(
      'usageIds',
      form.usageIds.filter((item) => item !== id),
    );
    setUsageRuleDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const featureLabelById = useMemo(
    () => Object.fromEntries(existingFeatures.map((item) => [item.id, `${item.name} (${item.sku})`])),
    [existingFeatures],
  );
  const tintLabelById = useMemo(
    () => Object.fromEntries(existingTints.map((item) => [item.id, `${item.name} (${item.code})`])),
    [existingTints],
  );
  const usageLabelById = useMemo(
    () => Object.fromEntries(existingUsages.map((item) => [item.id, item.name])),
    [existingUsages],
  );

  const existingCompatibilityFeatureIds = useMemo(
    () => new Set(existingCompatibilities.map((item) => item.featureId).filter(Boolean)),
    [existingCompatibilities],
  );

  const startEditingCompatibility = (compatibility: LensFeatureFrameCompatibility) => {
    setEditingCompatibilityId(compatibility.id);
    setEditingCompatibility({
      ...compatibility,
      sph: String(compatibility.sph ?? 0),
    });
  };

  const stopEditingCompatibility = () => {
    setEditingCompatibilityId(null);
    setEditingCompatibility(null);
  };

  const resetCompatibilityDraft = () => {
    setSelectedCompatibilityFeatureId('');
    setCompatibilityDraft(DEFAULT_COMPATIBILITY_DRAFT);
  };

  const refreshCompatibilities = async () => {
    if (!shop?.id || !selectedCatalogFrameVariantId) return;
    const compatibilities = await lensApi.getFeatureFrameCompatibilities({
      shopId: shop.id,
      frameVariantId: selectedCatalogFrameVariantId,
    });
    setExistingCompatibilities(compatibilities);
  };

  const handleSaveCompatibility = async () => {
    if (!shop?.id) {
      toast.error('Shop not found');
      return;
    }

    if (!selectedCatalogFrameVariantId) {
      toast.error('Please select a frame variant first');
      return;
    }

    try {
      setSubmitting(true);

      if (editingCompatibilityId && editingCompatibility) {
        const updatePayload: LensFeatureFrameCompatibilityUpdateRequest = {
          shopId: shop.id,
          sph: Number(editingCompatibility.sph || 0),
        };
        const response = await lensApi.updateFeatureFrameCompatibility(editingCompatibilityId, updatePayload);
        if ((response?.status ?? 0) >= 400 || !response?.data?.id) {
          throw new Error(response?.message || 'Unable to update feature compatibility');
        }

        toast.success('Feature compatibility updated successfully');
        stopEditingCompatibility();
        await refreshCompatibilities();
        return;
      }

      if (!selectedCompatibilityFeatureId) {
        toast.error('Please select a feature');
        return;
      }

      if (existingCompatibilityFeatureIds.has(selectedCompatibilityFeatureId)) {
        toast.error('This feature already has a compatibility for the selected frame variant');
        return;
      }

      const createPayload: LensFeatureFrameCompatibilityCreateRequest = {
        shopId: shop.id,
        featureId: selectedCompatibilityFeatureId,
        frameVariantId: selectedCatalogFrameVariantId,
        sph: Number(compatibilityDraft.sph || 0),
      };

      const response = await lensApi.createFeatureFrameCompatibility(createPayload);
      if ((response?.status ?? 0) >= 400 || !response?.data?.id) {
        throw new Error(response?.message || 'Unable to create feature compatibility');
      }

      toast.success('Feature compatibility created successfully');
      resetCompatibilityDraft();
      await refreshCompatibilities();
    } catch (error: any) {
      console.error('Failed to save feature compatibility:', error);
      toast.error(getApiErrorMessage(error, 'Failed to save feature compatibility')); 
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompatibility = async (compatibilityId: string) => {
    if (!shop?.id) {
      toast.error('Shop not found');
      return;
    }

    try {
      setSubmitting(true);
      const response = await lensApi.deleteFeatureFrameCompatibility(compatibilityId, shop.id);
      if ((response?.status ?? 0) >= 400) {
        throw new Error(response?.message || 'Unable to delete feature compatibility');
      }

      toast.success('Feature compatibility deleted successfully');
      if (editingCompatibilityId === compatibilityId) {
        stopEditingCompatibility();
      }
      await refreshCompatibilities();
    } catch (error: any) {
      console.error('Failed to delete feature compatibility:', error);
      toast.error(getApiErrorMessage(error, 'Failed to delete feature compatibility'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    stopEditingCompatibility();
    resetCompatibilityDraft();
  }, [selectedCatalogFrameVariantId]);

  if (loading || lensLoading) {
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

      <Box
        sx={{
          flex: 1,
          p: { xs: 2, md: 2.5, lg: 3 },
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {isEditMode ? 'Edit Lens' : 'Create Lens'}
            </Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
              Multi-step lens management flow for shop catalog data.
            </Typography>
          </Box>
        </Box>

        {!!successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {submitting && !!submitProgress && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {submitProgress}
          </Alert>
        )}

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
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
                      {index < activeStep || (saveCompleted && index === activeStep)
                        ? <CheckCircle sx={{ fontSize: 20 }} />
                        : index + 1}
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', pr: 0.5 }}>
          {activeStep === 0 && (
            <Grid container spacing={2.5} alignItems="stretch" sx={{ pt: 0.5 }}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12 }}>
                    <FormControl>
                      <FormLabel>Apply Scope</FormLabel>
                      <RadioGroup
                        row
                        value={form.scope}
                        onChange={(e) => handleFieldChange('scope', e.target.value as LensScope)}
                      >
                        <FormControlLabel
                          value="GLOBAL"
                          control={<Radio />}
                          label="Global"
                          disabled={isEditMode}
                        />
                        <FormControlLabel
                          value="FRAME_VARIANT"
                          control={<Radio />}
                          label="For Frame Variant"
                          disabled={isEditMode}
                        />
                        <FormControlLabel
                          value="FRAME_GROUP"
                          control={<Radio />}
                          label="For Frame Group"
                          disabled={isEditMode}
                        />
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

                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      sx={{ mt: 0.5 }}
                      fullWidth
                      required
                      label="SKU"
                      value={form.sku}
                      onChange={(e) => handleFieldChange('sku', sanitizeTextInput(e.target.value, { maxLength: 150 }))}
                      error={!!errors.sku}
                      helperText={errors.sku}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      fullWidth
                      required
                      label="Lens Name"
                      value={form.name}
                      onChange={(e) => handleFieldChange('name', sanitizeTextInput(e.target.value, { maxLength: 150 }))}
                      error={!!errors.name}
                      helperText={errors.name}
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
                        <MenuItem value="READING">Reading</MenuItem>
                        <MenuItem value="FASHION">Fashion</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth disabled={!(form.category === 'PROGRESSIVE')} error={!!errors.progressiveType}>
                      <InputLabel>Progressive Type</InputLabel>
                      <Select
                        value={form.progressiveType}
                        label="Progressive Type"
                        onChange={(e) => handleFieldChange('progressiveType', e.target.value as ProgressiveType)}
                      >
                        <MenuItem value="STANDARD">Standard</MenuItem>
                        <MenuItem value="PREMIUM">Premium</MenuItem>
                        <MenuItem value="MID_RANGE">Mid Range</MenuItem>
                        <MenuItem value="NEAR_RANGE">Near Range</MenuItem>
                      </Select>
                      {!!errors.progressiveType && <Typography color="error" fontSize={12}>{errors.progressiveType}</Typography>}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      label="Base Price"
                      value={form.basePrice}
                      onChange={(e) => handlePriceFieldChange('basePrice', e.target.value)}
                      onBlur={() => handlePriceFieldBlur('basePrice')}
                      error={!!errors.basePrice}
                      helperText={errors.basePrice}
                      inputProps={{ inputMode: 'decimal' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Cost Price"
                      value={form.costPrice}
                      onChange={(e) => handlePriceFieldChange('costPrice', e.target.value)}
                      onBlur={() => handlePriceFieldBlur('costPrice')}
                      inputProps={{ inputMode: 'decimal' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Compare At Price"
                      value={form.compareAtPrice}
                      onChange={(e) => handlePriceFieldChange('compareAtPrice', e.target.value)}
                      onBlur={() => handlePriceFieldBlur('compareAtPrice')}
                      inputProps={{ inputMode: 'decimal' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Stock Quantity"
                      type="number"
                      value={form.stockQuantity}
                      onChange={(e) => handleFieldChange('stockQuantity', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Low Stock Threshold"
                      type="number"
                      value={form.lowStockThreshold}
                      onChange={(e) => handleFieldChange('lowStockThreshold', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Warranty Months"
                      type="number"
                      value={form.warrantyMonths}
                      onChange={(e) => handleFieldChange('warrantyMonths', e.target.value)}
                    />
                  </Grid>



                  <Grid size={{ xs: 12, md: 6 }}>
                    <Tooltip title="Enable this to make the lens visible and sellable in the shop. Disable it to hide the lens from the storefront while keeping its data.">
                      <FormControlLabel
                        control={<Switch checked={form.isActive} onChange={(e) => handleFieldChange('isActive', e.target.checked)} />}
                        label="Active Lens"
                      />
                    </Tooltip>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={<Switch checked={form.isFeatured} onChange={(e) => handleFieldChange('isFeatured', e.target.checked)} />}
                      label="Featured Lens"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={<Switch checked={form.isReturnable} onChange={(e) => handleFieldChange('isReturnable', e.target.checked)} />}
                      label="Returnable"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }} sx={{ display: 'flex' }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: theme.palette.custom.border.light,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Lens Image</Typography>

                  <>
                    <Box
                      sx={{
                        width: 'min(100%, 180px)',
                        flex: '0 0 auto',
                        aspectRatio: '1 / 1',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.custom.border.light}`,
                        bgcolor: theme.palette.custom.neutral[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                      }}
                    >
                      {previewLensImageUrl ? (
                        <Box
                          component="img"
                          src={previewLensImageUrl}
                          alt="Lens preview"
                          sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <Typography sx={{ px: 2, textAlign: 'center', fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          Upload a lens image to preview it before saving.
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUpload />}
                      >
                        Choose Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleLensImageChange}
                        />
                      </Button>
                      {selectedLensImageFile && (
                        <Button color="error" variant="text" onClick={clearSelectedLensImage}>
                          Remove Selected File
                        </Button>
                      )}
                    </Box>

                    <Typography sx={{ mt: 1, fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                      {selectedLensImageFile
                        ? selectedLensImageFile.name
                        : 'No file selected (image is optional)'}
                    </Typography>
                  </>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Lens Detail Objects</Typography>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                Manage mapped lens detail objects for this lens, including existing relations and new objects.
              </Typography>

              {!selectedCatalogFrameVariantId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Select frame variant/frame group first to load existing feature and tint options. Usage rules can be added and edited without frame selection.
                </Alert>
              )}
              {selectedCatalogFrameVariantId && catalogLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CircularProgress size={18} />
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                    Loading existing lens details...
                  </Typography>
                </Box>
              )}

              <Paper variant="outlined" sx={{ mb: 3 }}>
                <Tabs
                  value={detailsObjectTab}
                  onChange={(_, value) => setDetailsObjectTab(value)}
                  variant="scrollable"
                  allowScrollButtonsMobile
                >
                  <Tab
                    value="FEATURE"
                    label={
                      <Tooltip title="Lens features are add-ons such as coatings/treatments that can be mapped to this lens.">
                        <span>{`Features (${form.featureIds.length + form.featuresToCreate.length})`}</span>
                      </Tooltip>
                    }
                  />
                  <Tab
                    value="TINT"
                    label={
                      <Tooltip title="Lens tints define color/appearance options and price adjustments for this lens.">
                        <span>{`Tints (${form.tintIds.length + form.tintsToCreate.length})`}</span>
                      </Tooltip>
                    }
                  />
                  <Tab
                    value="USAGE"
                    label={
                      <Tooltip title="Usage rules define how this lens can be used (for example: allow tint, allow progressive, and min price adjustment).">
                        <span>{`Usage Rules (${form.usageIds.length})`}</span>
                      </Tooltip>
                    }
                  />
                  <Tab
                    value="COMPATIBILITY"
                    label={
                      <Tooltip title="Frame compatibility controls which features are allowed for the selected frame variant and optional SPH limits.">
                        <span>{`Frame Compatibility (${existingCompatibilities.length})`}</span>
                      </Tooltip>
                    }
                  />
                  {(form.category === 'PROGRESSIVE') && (
                    <Tab
                      value="PROGRESSIVE"
                      label={
                        <Tooltip title="Progressive options define premium tiers, distance range, and extra price for progressive lenses.">
                          <span>{`Progressive Options (${form.progressiveOptions.length})`}</span>
                        </Tooltip>
                      }
                    />
                  )}
                </Tabs>

                <Box sx={{ p: 2.5 }}>
                  {detailsObjectTab === 'FEATURE' && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          Mapped Features
                        </Typography>
                        <Tooltip title="Choose existing features from your catalog or create new feature objects below.">
                          <InfoOutlined sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                        </Tooltip>
                      </Box>
                      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                        <Grid size={{ xs: 12 }}>
                          <FormControl fullWidth disabled={!selectedCatalogFrameVariantId || catalogLoading}>
                            <InputLabel>Feature Object</InputLabel>
                            <Select
                              value={selectedFeatureId}
                              label="Feature Object"
                              onChange={(e) => {
                                const featureId = e.target.value;
                                console.log('Selected feature:', featureId, 'from existingFeatures:', existingFeatures);
                                setForm((prev) => {
                                  const updated = {
                                    ...prev,
                                    featureIds: prev.featureIds.includes(featureId)
                                      ? prev.featureIds
                                      : [...prev.featureIds, featureId],
                                  };
                                  console.log('After adding feature, form.featureIds:', updated.featureIds);
                                  return updated;
                                });
                                setSelectedFeatureId('');
                              }}
                            >
                              {existingFeatures
                                .filter((f) => !form.featureIds.includes(f.id))
                                .map((option) => (
                                  <MenuItem key={option.id} value={option.id}>
                                    {formatPrimarySecondaryLabel(option.id, option.name, option.sku)}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      {!!form.featureIds.length && (
                        <Box sx={{ mb: 2.5 }}>
                          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Selected Existing Features</Typography>
                          {form.featureIds.map((id) => {
                            const featureOption = existingFeatures.find((f) => f.id === id);
                            const lensFeature = (lens?.featureMappings as Array<Record<string, unknown>> | undefined)?.find(
                              (mapping) => mapping.featureId === id || mapping.id === id,
                            );
                            const lensFeatureOption = normalizeFeatureOptionFromRecord(lensFeature);
                            const featureName = pickDisplayValue(id, [featureOption?.name, lensFeatureOption.name], id);
                            const featureSku = pickDisplayValue(id, [featureOption?.sku, lensFeatureOption.sku], id);
                            const isEditing = editingExistingFeatureId === id;
                            const editingData = editingExistingFeature;

                            return (
                              <Accordion key={id} sx={{ mb: 1 }}>
                                <AccordionSummary
                                  expandIcon={<ExpandMore />}
                                  sx={{
                                    bgcolor: theme.palette.custom.neutral[50],
                                    '&:hover': {
                                      bgcolor: theme.palette.custom.neutral[100],
                                    },
                                  }}
                                >
                                  <Typography sx={{ flex: 1, fontWeight: 500 }}>
                                    {formatPrimarySecondaryLabel(id, featureName, featureSku)}
                                  </Typography>
                                  {isEditing && (
                                    <Chip
                                      size="small"
                                      label="Editing"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ mr: 1 }}
                                    />
                                  )}
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 2 }}>
                                  {isEditing && editingData ? (
                                    <Grid container spacing={2}>
                                      <Grid size={{ xs: 12, md: 3 }}>
                                        <TextField
                                          fullWidth
                                          label="SKU"
                                          value={editingData.sku}
                                          onChange={(e) =>
                                            setEditingExistingFeature((prev) =>
                                              prev ? { ...prev, sku: sanitizeTextInput(e.target.value, { maxLength: 150 }) } : null,
                                            )
                                          }
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                          fullWidth
                                          label="Name"
                                          value={editingData.name}
                                          onChange={(e) =>
                                            setEditingExistingFeature((prev) =>
                                              prev ? { ...prev, name: sanitizeTextInput(e.target.value, { maxLength: 150 }) } : null,
                                            )
                                          }
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 5 }}>
                                        <TextField
                                          fullWidth
                                          label="Description"
                                          value={editingData.description || ''}
                                          onChange={(e) =>
                                            setEditingExistingFeature((prev) =>
                                              prev ? { ...prev, description: sanitizeTextInput(e.target.value, { maxLength: 1000 }) } : null,
                                            )
                                          }
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 3 }}>
                                        <TextField
                                          fullWidth
                                          label="Extra Price (Lens-specific)"
                                          type="text"
                                          value={editingData.extraPrice ? formatNumber(parseNumber(String(editingData.extraPrice))) : ''}
                                          onChange={(e) =>
                                            setEditingExistingFeature((prev) =>
                                              prev
                                                ? { ...prev, extraPrice: Number(parseNumber(e.target.value)) }
                                                : null,
                                            )
                                          }
                                          onKeyDown={(e) => {
                                            if (shouldBlockNonNumericKey(e)) e.preventDefault();
                                          }}
                                          inputProps={{ inputMode: 'numeric' }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 3 }}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={editingData.isDefault || false}
                                              onChange={(e) =>
                                                setEditingExistingFeature((prev) =>
                                                  prev ? { ...prev, isDefault: e.target.checked } : null,
                                                )
                                              }
                                            />
                                          }
                                          label="Default"
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                          size="small"
                                          startIcon={<CheckCircle />}
                                          variant="contained"
                                          color="success"
                                          onClick={async () => {
                                            if (!editingData.sku.trim() || !editingData.name.trim()) {
                                              toast.error('SKU and Name are required');
                                              return;
                                            }
                                            try {
                                              setSubmitting(true);
                                              await lensApi.updateFeature(id, {
                                                sku: editingData.sku.trim(),
                                                name: editingData.name.trim(),
                                                description: editingData.description?.trim(),
                                              });
                                              if (editingData.mappingId) {
                                                await lensApi.updateFeatureMapping(
                                                  lensId || '',
                                                  editingData.mappingId,
                                                  {
                                                    shopId: shop?.id ?? '',
                                                    featureId: id,
                                                    extraPrice: editingData.extraPrice,
                                                    isDefault: editingData.isDefault,
                                                  },
                                                );
                                              } else {
                                                toast.info('Feature mapping does not exist yet. It will be created on Submit.');
                                              }
                                              if (editingData.mappingId) {
                                                setInitialLinkedDetails((prev) => ({
                                                  ...prev,
                                                  featureIds: prev.featureIds.includes(id)
                                                    ? prev.featureIds
                                                    : [...prev.featureIds, id],
                                                }));
                                              }
                                              setEditingExistingFeatureId(null);
                                              setEditingExistingFeature(null);
                                              toast.success('Feature updated successfully');
                                            } catch (error: any) {
                                              toast.error(getApiErrorMessage(error, 'Failed to update feature'));
                                            } finally {
                                              setSubmitting(false);
                                            }
                                          }}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="small"
                                          startIcon={<Cancel />}
                                          variant="outlined"
                                          onClick={() => {
                                            setEditingExistingFeatureId(null);
                                            setEditingExistingFeature(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </Grid>
                                    </Grid>
                                  ) : (
                                    <Box>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>SKU:</strong> {featureSku}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Name:</strong> {featureName}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                          size="small"
                                          startIcon={<Edit />}
                                          onClick={() => {
                                            const mapping = (lens?.featureMappings as Array<any>)?.find(
                                              (m) => m.featureId === id,
                                            );
                                            const baseFeature = featureOption ?? lensFeatureOption;
                                            setEditingExistingFeature({
                                              id,
                                              sku: baseFeature?.sku || '',
                                              name: baseFeature?.name || '',
                                              description: String(lensFeature?.description || featureOption?.name || ''),
                                              mappingId: mapping?.id,
                                              extraPrice: mapping?.extraPrice || 0,
                                              isDefault: mapping?.isDefault || false,
                                            } as EditingExistingFeature);
                                            setEditingExistingFeatureId(id);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="small"
                                          color="error"
                                          startIcon={<Delete />}
                                          onClick={() => removeExistingSelection('feature', id)}
                                        >
                                          Remove
                                        </Button>
                                      </Box>
                                    </Box>
                                  )}
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </Box>
                      )}

                      <>
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography sx={{ fontWeight: 600 }}>Create New Feature Objects</Typography>
                            <Tooltip title="Create new feature definitions when the needed feature is not available in existing objects.">
                              <InfoOutlined sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                            </Tooltip>
                          </Box>
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
                      </>
                    </>
                  )}

                  {detailsObjectTab === 'TINT' && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          Mapped Tints
                        </Typography>
                        <Tooltip title="Choose existing tint objects or create new tint objects with color, behavior, and price.">
                          <InfoOutlined sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                        </Tooltip>
                      </Box>
                      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                        <Grid size={{ xs: 12 }}>
                          <FormControl fullWidth disabled={!selectedCatalogFrameVariantId || catalogLoading}>
                            <InputLabel>Tint Object</InputLabel>
                            <Select
                              value={selectedTintId}
                              label="Tint Object"
                              onChange={(e) => {
                                const tintId = e.target.value;
                                console.log('Selected tint:', tintId, 'from existingTints:', existingTints);
                                setForm((prev) => {
                                  const updated = {
                                    ...prev,
                                    tintIds: prev.tintIds.includes(tintId)
                                      ? prev.tintIds
                                      : [...prev.tintIds, tintId],
                                  };
                                  console.log('After adding tint, form.tintIds:', updated.tintIds);
                                  return updated;
                                });
                                setSelectedTintId('');
                              }}
                            >
                              {existingTints
                                .filter((t) => !form.tintIds.includes(t.id))
                                .map((option) => (
                                  <MenuItem key={option.id} value={option.id}>
                                    {formatPrimarySecondaryLabel(option.id, option.name, option.code)}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      {!!form.tintIds.length && (
                        <Box sx={{ mb: 2.5 }}>
                          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Selected Existing Tints</Typography>
                          {form.tintIds.map((id) => {
                            const tintOption = existingTints.find((t) => t.id === id);
                            const lensTint = (lens?.tintOptions as Array<Record<string, unknown>> | undefined)?.find(
                              (option) => option.tintId === id || option.id === id,
                            );
                            const lensTintOption = normalizeTintOptionFromRecord(lensTint);
                            const tintName = pickDisplayValue(id, [tintOption?.name, lensTintOption.name], id);
                            const tintCode = pickDisplayValue(id, [tintOption?.code, lensTintOption.code], id);
                            const tintCssValue = tintOption?.cssValue || lensTintOption.cssValue;
                            const tintOpacity = tintOption?.opacity ?? lensTintOption.opacity;
                            const tintBasePrice = tintOption?.basePrice ?? lensTintOption.basePrice;
                            const tintBehavior = tintOption?.behavior || lensTintOption.behavior;
                            const isEditing = editingExistingTintId === id;
                            const editingData = editingExistingTint;

                            return (
                              <Accordion key={id} sx={{ mb: 1 }}>
                                <AccordionSummary
                                  expandIcon={<ExpandMore />}
                                  sx={{
                                    bgcolor: theme.palette.custom.neutral[50],
                                    '&:hover': {
                                      bgcolor: theme.palette.custom.neutral[100],
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '4px',
                                      bgcolor: tintCssValue || '#ccc',
                                      opacity: tintOpacity ?? 1,
                                      border: '1px solid #ddd',
                                      mr: 1.5,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography sx={{ flex: 1, fontWeight: 500 }}>
                                    {formatPrimarySecondaryLabel(id, tintName, tintCode)}
                                  </Typography>
                                  {isEditing && (
                                    <Chip
                                      size="small"
                                      label="Editing"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ mr: 1 }}
                                    />
                                  )}
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 2 }}>
                                  {isEditing && editingData ? (
                                    <Grid container spacing={2}>
                                      <Grid size={{ xs: 12, md: 2 }}>
                                        <TextField
                                          fullWidth
                                          label="Code"
                                          value={editingData.code}
                                          onChange={(e) =>
                                            setEditingExistingTint((prev) =>
                                              prev ? { ...prev, code: e.target.value } : null,
                                            )
                                          }
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 2 }}>
                                        <TextField
                                          fullWidth
                                          label="Name"
                                          value={editingData.name}
                                          onChange={(e) =>
                                            setEditingExistingTint((prev) =>
                                              prev ? { ...prev, name: e.target.value } : null,
                                            )
                                          }
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 2 }}>
                                        <TextField
                                          fullWidth
                                          label="CSS Value"
                                          value={editingData.cssValue || ''}
                                          onChange={(e) =>
                                            setEditingExistingTint((prev) =>
                                              prev ? { ...prev, cssValue: e.target.value } : null,
                                            )
                                          }
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 1.5 }}>
                                        <TextField
                                          fullWidth
                                          type="number"
                                          label="Opacity"
                                          value={editingData.opacity || 0.4}
                                          onChange={(e) =>
                                            setEditingExistingTint((prev) =>
                                              prev
                                                ? { ...prev, opacity: Number(e.target.value) }
                                                : null,
                                            )
                                          }
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 1.5 }}>
                                        <TextField
                                          fullWidth
                                          type="text"
                                          label="Base Price"
                                          value={editingData.basePrice ? formatNumber(parseNumber(String(editingData.basePrice))) : ''}
                                          onChange={(e) =>
                                            setEditingExistingTint((prev) =>
                                              prev
                                                ? { ...prev, basePrice: Number(parseNumber(e.target.value)) }
                                                : null,
                                            )
                                          }
                                          onKeyDown={(e) => {
                                            if (shouldBlockNonNumericKey(e)) e.preventDefault();
                                          }}
                                          inputProps={{ inputMode: 'numeric' }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 2 }}>
                                        <FormControl fullWidth>
                                          <InputLabel>Behavior</InputLabel>
                                          <Select
                                            value={editingData.behavior || 'NONE'}
                                            label="Behavior"
                                            onChange={(e) =>
                                              setEditingExistingTint((prev) =>
                                                prev
                                                  ? { ...prev, behavior: e.target.value as TintBehavior }
                                                  : null,
                                              )
                                            }
                                          >
                                            <MenuItem value="NONE">None</MenuItem>
                                            <MenuItem value="SOLID">Solid</MenuItem>
                                            <MenuItem value="PHOTOCHROMIC">Photochromic</MenuItem>
                                            <MenuItem value="GRADIENT">Gradient</MenuItem>
                                            <MenuItem value="MIRROR">Mirror</MenuItem>
                                          </Select>
                                        </FormControl>
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 1.5 }}>
                                        <TextField
                                          fullWidth
                                          type="text"
                                          label="Extra Price"
                                          value={editingData.extraPrice ? formatNumber(parseNumber(String(editingData.extraPrice))) : ''}
                                          onChange={(e) =>
                                            setEditingExistingTint((prev) =>
                                              prev
                                                ? { ...prev, extraPrice: Number(parseNumber(e.target.value)) }
                                                : null,
                                            )
                                          }
                                          onKeyDown={(e) => {
                                            if (shouldBlockNonNumericKey(e)) e.preventDefault();
                                          }}
                                          inputProps={{ inputMode: 'numeric' }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 1.5 }}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={editingData.isActive || true}
                                              onChange={(e) =>
                                                setEditingExistingTint((prev) =>
                                                  prev ? { ...prev, isActive: e.target.checked } : null,
                                                )
                                              }
                                            />
                                          }
                                          label="Active"
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 1 }}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={editingData.isDefault || false}
                                              onChange={(e) =>
                                                setEditingExistingTint((prev) =>
                                                  prev ? { ...prev, isDefault: e.target.checked } : null,
                                                )
                                              }
                                            />
                                          }
                                          label="Default"
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                          size="small"
                                          startIcon={<CheckCircle />}
                                          variant="contained"
                                          color="success"
                                          onClick={async () => {
                                            if (!editingData.code.trim() || !editingData.name.trim()) {
                                              toast.error('Code and Name are required');
                                              return;
                                            }
                                            try {
                                              setSubmitting(true);
                                              await lensApi.updateTint(id, {
                                                code: editingData.code.trim(),
                                                name: editingData.name.trim(),
                                                cssValue: editingData.cssValue?.trim(),
                                                opacity: editingData.opacity,
                                                basePrice: editingData.basePrice,
                                                isActive: editingData.isActive,
                                                behavior: editingData.behavior,
                                              });
                                              if (editingData.optionId) {
                                                await lensApi.updateTintOption(
                                                  lensId || '',
                                                  editingData.optionId,
                                                  {
                                                    shopId: shop?.id ?? '',
                                                    tintId: id,
                                                    extraPrice: editingData.extraPrice,
                                                    isDefault: editingData.isDefault,
                                                  },
                                                );
                                              } else {
                                                toast.info('Tint option does not exist yet. It will be created on Submit.');
                                              }
                                              if (editingData.optionId) {
                                                setInitialLinkedDetails((prev) => ({
                                                  ...prev,
                                                  tintIds: prev.tintIds.includes(id)
                                                    ? prev.tintIds
                                                    : [...prev.tintIds, id],
                                                }));
                                              }
                                              setEditingExistingTintId(null);
                                              setEditingExistingTint(null);
                                              toast.success('Tint updated successfully');
                                            } catch (error: any) {
                                              toast.error(getApiErrorMessage(error, 'Failed to update tint'));
                                            } finally {
                                              setSubmitting(false);
                                            }
                                          }}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="small"
                                          startIcon={<Cancel />}
                                          variant="outlined"
                                          onClick={() => {
                                            setEditingExistingTintId(null);
                                            setEditingExistingTint(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </Grid>
                                    </Grid>
                                  ) : (
                                    <Box>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Code:</strong> {tintCode}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Name:</strong> {tintName}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>CSS Value:</strong> {tintCssValue || 'N/A'}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Opacity:</strong> {tintOpacity ?? 'N/A'}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Base Price:</strong> {tintBasePrice ?? 'N/A'}
                                        </Typography>
                                        {tintBehavior && (
                                          <Typography sx={{ fontSize: 14 }}>
                                            <strong>Behavior:</strong> {tintBehavior}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                          size="small"
                                          startIcon={<Edit />}
                                          onClick={() => {
                                            const option = (lens?.tintOptions as Array<any>)?.find(
                                              (o) => o.tintId === id,
                                            );
                                            const baseTint = tintOption ?? lensTintOption;
                                            setEditingExistingTint({
                                              id,
                                              name: baseTint?.name || '',
                                              code: baseTint?.code || '',
                                              cssValue: baseTint?.cssValue,
                                              opacity: baseTint?.opacity,
                                              basePrice: baseTint?.basePrice,
                                              isActive: baseTint?.isActive,
                                              behavior: baseTint?.behavior,
                                              optionId: option?.id,
                                              extraPrice: option?.extraPrice || 0,
                                              isDefault: option?.isDefault || false,
                                            } as EditingExistingTint);
                                            setEditingExistingTintId(id);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="small"
                                          color="error"
                                          startIcon={<Delete />}
                                          onClick={() => removeExistingSelection('tint', id)}
                                        >
                                          Remove
                                        </Button>
                                      </Box>
                                    </Box>
                                  )}
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </Box>
                      )}

                      <>
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography sx={{ fontWeight: 600 }}>Create New Tint Objects</Typography>
                            <Tooltip title="Create a tint when you need a new color/behavior option for this lens.">
                              <InfoOutlined sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                            </Tooltip>
                          </Box>
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
                                <TextField
                                  fullWidth
                                  type="text"
                                  label="Price"
                                  value={item.basePrice ? formatNumber(parseNumber(String(item.basePrice))) : ''}
                                  onChange={(e) => setTintAt(index, 'basePrice', parseNumber(e.target.value).toString())}
                                  onKeyDown={(e) => {
                                    if (shouldBlockNonNumericKey(e)) e.preventDefault();
                                  }}
                                  inputProps={{ inputMode: 'numeric' }}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 2 }}>
                                <FormControl fullWidth>
                                  <InputLabel>Behavior</InputLabel>
                                  <Select value={item.behavior} label="Behavior" onChange={(e) => setTintAt(index, 'behavior', e.target.value as TintBehavior)}>
                                    <MenuItem value="NONE">None</MenuItem>
                                    <MenuItem value="SOLID">Solid</MenuItem>
                                    <MenuItem value="PHOTOCHROMIC">Photochromic</MenuItem>
                                    <MenuItem value="GRADIENT">Gradient</MenuItem>
                                    <MenuItem value="MIRROR">Mirror</MenuItem>
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
                      </>
                    </>
                  )}

                  {detailsObjectTab === 'USAGE' && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          Mapped Usages
                        </Typography>
                        <Tooltip title="Usage rules control where this lens can be applied and pricing behavior for each usage type.">
                          <InfoOutlined sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                        </Tooltip>
                      </Box>
                      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                        <Grid size={{ xs: 12 }}>
                          <FormControl fullWidth disabled={catalogLoading}>
                            <InputLabel>Usage</InputLabel>
                            <Select
                              value={selectedUsageId}
                              label="Usage"
                              onChange={(e) => {
                                const usageId = e.target.value;
                                console.log('Selected usage:', usageId, 'from existingUsages:', existingUsages);
                                setForm((prev) => {
                                  const updated = {
                                    ...prev,
                                    usageIds: prev.usageIds.includes(usageId)
                                      ? prev.usageIds
                                      : [...prev.usageIds, usageId],
                                  };
                                  console.log('After adding usage, form.usageIds:', updated.usageIds);
                                  return updated;
                                });
                                setUsageRuleDrafts((prev) => ({
                                  ...prev,
                                  [usageId]:
                                    prev[usageId] ?? {
                                      usageId,
                                      allowTint: true,
                                      allowProgressive: (form.category === 'PROGRESSIVE'),
                                      minPriceAdjustment: 0,
                                    },
                                }));
                                setSelectedUsageId('');
                              }}
                            >
                              {existingUsages
                                .filter((u) => !form.usageIds.includes(u.id))
                                .map((option) => (
                                  <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      {!catalogLoading && existingUsages.length === 0 && (
                        <Alert severity="warning" sx={{ mb: 1.5 }}>
                            No usage objects available.
                          </Alert>
                      )}

                      {!!form.usageIds.length && (
                        <Box sx={{ mb: 2.5 }}>
                          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Selected Usages & Usage Rules</Typography>
                          {form.usageIds.map((id) => {
                            const usageOption = existingUsages.find((u) => u.id === id);
                            const lensUsage = (lens?.usageRules as Array<Record<string, unknown>> | undefined)?.find(
                              (rule) => rule.usageId === id || rule.id === id,
                            );
                            const usageRule = (lens?.usageRules as Array<Record<string, unknown>> | undefined)?.find(
                              (rule) => rule.usageId === id,
                            );
                            const usageRuleDraft = usageRuleDrafts[id];
                            const lensUsageOption = normalizeUsageOptionFromRecord(lensUsage);
                            const usageName = pickDisplayValue(id, [usageOption?.name, lensUsageOption.name], id);
                            const isEditing = editingExistingUsageId === id;
                            const editingData = editingExistingUsage;

                            return (
                              <Accordion key={id} sx={{ mb: 1 }}>
                                <AccordionSummary
                                  expandIcon={<ExpandMore />}
                                  sx={{
                                    bgcolor: theme.palette.custom.neutral[50],
                                    '&:hover': {
                                      bgcolor: theme.palette.custom.neutral[100],
                                    },
                                  }}
                                >
                                  <Typography sx={{ flex: 1, fontWeight: 500 }}>
                                    {usageName}
                                  </Typography>
                                  {isEditing && (
                                    <Chip
                                      size="small"
                                      label="Editing"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ mr: 1 }}
                                    />
                                  )}
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 2 }}>
                                  {isEditing && editingData ? (
                                    <Grid container spacing={2}>
                                      <Grid size={{ xs: 12, md: 2.5 }}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={editingData.allowTint ?? true}
                                              onChange={(e) =>
                                                setEditingExistingUsage((prev) =>
                                                  prev ? { ...prev, allowTint: e.target.checked } : null,
                                                )
                                              }
                                            />
                                          }
                                          label="Allow Tint"
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 2.5 }}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={editingData.allowProgressive ?? true}
                                              onChange={(e) =>
                                                setEditingExistingUsage((prev) =>
                                                  prev ? { ...prev, allowProgressive: e.target.checked } : null,
                                                )
                                              }
                                            />
                                          }
                                          label="Allow Progressive"
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, md: 3 }}>
                                        <TextField
                                          fullWidth
                                          type="text"
                                          label="Min Price Adj"
                                          value={editingData.minPriceAdjustment ? formatNumber(parseNumber(String(editingData.minPriceAdjustment))) : ''}
                                          onChange={(e) =>
                                            setEditingExistingUsage((prev) =>
                                              prev
                                                ? { ...prev, minPriceAdjustment: Number(parseNumber(e.target.value)) }
                                                : null,
                                            )
                                          }
                                          onKeyDown={(e) => {
                                            if (shouldBlockNonNumericKey(e)) e.preventDefault();
                                          }}
                                          inputProps={{ inputMode: 'numeric' }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                          size="small"
                                          startIcon={<CheckCircle />}
                                          variant="contained"
                                          color="success"
                                          onClick={async () => {
                                            try {
                                              setSubmitting(true);
                                              let resolvedRuleId = editingData.ruleId;

                                              // For new lens, persist rule config locally and submit later.
                                              if (!isEditMode || !lensId) {
                                                setUsageRuleDrafts((prev) => ({
                                                  ...prev,
                                                  [id]: {
                                                    usageId: id,
                                                    ruleId: resolvedRuleId,
                                                    allowTint: editingData.allowTint ?? true,
                                                    allowProgressive: editingData.allowProgressive ?? (form.category === 'PROGRESSIVE'),
                                                    minPriceAdjustment: editingData.minPriceAdjustment ?? 0,
                                                  },
                                                }));
                                                setEditingExistingUsageId(null);
                                                setEditingExistingUsage(null);
                                                toast.success('Usage rule updated in draft');
                                                return;
                                              }

                                              if (editingData.ruleId) {
                                                await lensApi.updateUsageRule(
                                                  lensId,
                                                  editingData.ruleId,
                                                  {
                                                    shopId: shop?.id ?? '',
                                                    usageId: id,
                                                    allowTint: editingData.allowTint,
                                                    allowProgressive: editingData.allowProgressive,
                                                    minPriceAdjustment: editingData.minPriceAdjustment,
                                                  },
                                                );
                                              } else {
                                                toast.info('Usage rule does not exist yet. It will be created on Submit.');
                                              }

                                              if (editingData.ruleId) {
                                                setInitialLinkedDetails((prev) => ({
                                                  ...prev,
                                                  usageIds: prev.usageIds.includes(id)
                                                    ? prev.usageIds
                                                    : [...prev.usageIds, id],
                                                }));
                                              }

                                              setUsageRuleDrafts((prev) => ({
                                                ...prev,
                                                [id]: {
                                                  usageId: id,
                                                  ruleId: resolvedRuleId,
                                                  allowTint: editingData.allowTint ?? true,
                                                  allowProgressive: editingData.allowProgressive ?? (form.category === 'PROGRESSIVE'),
                                                  minPriceAdjustment: editingData.minPriceAdjustment ?? 0,
                                                },
                                              }));
                                              setEditingExistingUsageId(null);
                                              setEditingExistingUsage(null);
                                              toast.success('Usage rule updated successfully');
                                            } catch (error: any) {
                                              toast.error(getApiErrorMessage(error, 'Failed to update usage rule'));
                                            } finally {
                                              setSubmitting(false);
                                            }
                                          }}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="small"
                                          startIcon={<Cancel />}
                                          variant="outlined"
                                          onClick={() => {
                                            setEditingExistingUsageId(null);
                                            setEditingExistingUsage(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </Grid>
                                    </Grid>
                                  ) : (
                                    <Box>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Name:</strong> {usageName}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Allow Tint:</strong> {(usageRuleDraft?.allowTint ?? usageRule?.allowTint ?? true) ? 'Yes' : 'No'}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Allow Progressive:</strong> {(usageRuleDraft?.allowProgressive ?? usageRule?.allowProgressive ?? true) ? 'Yes' : 'No'}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }}>
                                          <strong>Min Price Adjustment:</strong> {String(usageRuleDraft?.minPriceAdjustment ?? usageRule?.minPriceAdjustment ?? 0)}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                          size="small"
                                          startIcon={<Edit />}
                                          onClick={() => {
                                            const rule = (lens?.usageRules as Array<any>)?.find(
                                              (r) => r.usageId === id,
                                            );
                                            const baseUsage = usageOption ?? lensUsageOption;
                                            const baseRule = usageRuleDrafts[id];
                                            setEditingExistingUsage({
                                              id,
                                              name: baseUsage?.name || '',
                                              description: '',
                                              ruleId: baseRule?.ruleId ?? rule?.id,
                                              allowTint: baseRule?.allowTint ?? rule?.allowTint ?? true,
                                              allowProgressive:
                                                baseRule?.allowProgressive ?? rule?.allowProgressive ?? (form.category === 'PROGRESSIVE'),
                                              minPriceAdjustment:
                                                baseRule?.minPriceAdjustment ?? (rule?.minPriceAdjustment || 0),
                                            } as EditingExistingUsage);
                                            setEditingExistingUsageId(id);
                                          }}
                                        >
                                          Edit Rule
                                        </Button>
                                        <Button
                                          size="small"
                                          color="error"
                                          startIcon={<Delete />}
                                          onClick={() => removeExistingSelection('usage', id)}
                                        >
                                          Remove
                                        </Button>
                                      </Box>
                                    </Box>
                                  )}
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Alert severity="info">
                        Shop can select usages and configure usage rules per lens.
                      </Alert>
                    </>
                  )}

                  {detailsObjectTab === 'COMPATIBILITY' && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          Frame Feature Compatibility
                        </Typography>
                        <Tooltip title="Define which features are compatible with the selected frame variant and optional SPH thresholds.">
                          <InfoOutlined sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                        </Tooltip>
                      </Box>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                        Manage which lens features are compatible with the currently selected frame variant.
                      </Typography>

                      {!selectedCatalogFrameVariantId && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Select a frame variant or frame group first to manage feature compatibility.
                        </Alert>
                      )}

                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 7 }}>
                            <FormControl fullWidth disabled={!selectedCatalogFrameVariantId || catalogLoading}>
                              <InputLabel>Feature Object</InputLabel>
                              <Select
                                value={selectedCompatibilityFeatureId}
                                label="Feature Object"
                                onChange={(e) => setSelectedCompatibilityFeatureId(e.target.value)}
                                disabled={Boolean(editingCompatibilityId)}
                              >
                                {existingFeatures
                                  .filter((feature) => !existingCompatibilityFeatureIds.has(feature.id))
                                  .map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                      {formatPrimarySecondaryLabel(option.id, option.name, option.sku)}
                                    </MenuItem>
                                  ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              type="text"
                              label="SPH Limit"
                              value={editingCompatibilityId ? editingCompatibility?.sph ?? '0' : compatibilityDraft.sph}
                              onChange={(e) => {
                                const value = sanitizeDecimalInput(e.target.value);
                                if (editingCompatibilityId) {
                                  setEditingCompatibility((prev) => (prev ? { ...prev, sph: value } : prev));
                                  return;
                                }
                                setCompatibilityDraft((prev) => ({ ...prev, sph: value }));
                              }}
                              onKeyDown={(e) => {
                                if (shouldBlockNonNumericKey(e)) e.preventDefault();
                              }}
                              inputProps={{ inputMode: 'decimal' }}
                              disabled={!selectedCatalogFrameVariantId || catalogLoading}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', gap: 1 }}>
                            {editingCompatibilityId ? (
                              <>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={handleSaveCompatibility}
                                  disabled={submitting}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<Cancel />}
                                  onClick={stopEditingCompatibility}
                                  disabled={submitting}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={handleSaveCompatibility}
                                disabled={submitting || !selectedCatalogFrameVariantId || !selectedCompatibilityFeatureId}
                              >
                                Add
                              </Button>
                            )}
                          </Grid>
                        </Grid>
                      </Paper>

                      {!!existingCompatibilities.length && (
                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                          {existingCompatibilities.map((compatibility) => {
                            const featureName = featureLabelById[compatibility.featureId] || compatibility.featureSku || compatibility.featureId;
                            const isEditing = editingCompatibilityId === compatibility.id;

                            return (
                              <Accordion key={compatibility.id}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                  <Typography sx={{ flex: 1, fontWeight: 500 }}>
                                    {featureName}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={`SPH ${compatibility.sph ?? 0}`}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                  />
                                  {isEditing && (
                                    <Chip
                                      size="small"
                                      label="Editing"
                                      color="secondary"
                                      variant="outlined"
                                      sx={{ mr: 1 }}
                                    />
                                  )}
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={1.5}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                      <Typography sx={{ fontSize: 13 }}>
                                        <strong>Feature:</strong> {featureName}
                                      </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                      <Typography sx={{ fontSize: 13 }}>
                                        <strong>Frame Variant:</strong> {compatibility.frameVariantName || compatibility.frameVariantId}
                                      </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                      <Typography sx={{ fontSize: 13 }}>
                                        <strong>SPH Limit:</strong> {compatibility.sph ?? 0}
                                      </Typography>
                                    </Grid>

                                    {isEditing && editingCompatibility && (
                                      <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                          fullWidth
                                          type="text"
                                          label="SPH Limit"
                                          value={editingCompatibility.sph}
                                          onChange={(e) => {
                                            const value = sanitizeDecimalInput(e.target.value);
                                            setEditingCompatibility((prev) => (prev ? { ...prev, sph: value } : prev));
                                          }}
                                          onKeyDown={(e) => {
                                            if (shouldBlockNonNumericKey(e)) e.preventDefault();
                                          }}
                                          inputProps={{ inputMode: 'decimal' }}
                                        />
                                      </Grid>
                                    )}

                                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                      {!isEditing && (
                                        <Button
                                          size="small"
                                          startIcon={<Edit />}
                                          onClick={() => startEditingCompatibility(compatibility)}
                                          disabled={submitting}
                                        >
                                          Edit
                                        </Button>
                                      )}
                                      <Button
                                        size="small"
                                        color="error"
                                        startIcon={<Delete />}
                                        onClick={() => handleDeleteCompatibility(compatibility.id)}
                                        disabled={submitting}
                                      >
                                        Delete
                                      </Button>
                                    </Grid>
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </Box>
                      )}

                      {!existingCompatibilities.length && selectedCatalogFrameVariantId && (
                        <Alert severity="info">
                          No feature compatibility entries for this frame variant yet.
                        </Alert>
                      )}
                    </>
                  )}

                  {detailsObjectTab === 'PROGRESSIVE' && (
                    <>
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography sx={{ fontWeight: 600 }}>
                            Progressive Options
                          </Typography>
                          <Tooltip title="Configure option tiers for progressive lenses, including distance range, type, and extra price.">
                            <InfoOutlined sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                          </Tooltip>
                        </Box>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => handleFieldChange('progressiveOptions', [...form.progressiveOptions, { ...DEFAULT_PROGRESSIVE_OPTION }])}
                        >
                          Add Progressive Option
                        </Button>
                      </Box>

                      {!form.progressiveOptions.length && (
                        <Alert severity="info" sx={{ mb: 1.5 }}>
                          No progressive options yet. Add at least one option for progressive lenses.
                        </Alert>
                      )}

                      {form.progressiveOptions.map((item, index) => (
                        <Paper
                          key={`prog-${index}`}
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 1.5,
                            borderRadius: 2,
                            borderColor: theme.palette.custom.border.light,
                            overflow: 'hidden',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Chip size="small" label={`Option ${index + 1}`} color="primary" variant="outlined" />
                            <Tooltip title="Remove option">
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
                            </Tooltip>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                label="Name"
                                value={item.name}
                                onChange={(e) => setProgressiveOptionAt(index, 'name', e.target.value)}
                                error={!!errors[`progressiveOptions.${index}.name`]}
                                helperText={errors[`progressiveOptions.${index}.name`]}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                              <TextField
                                fullWidth
                                label="Description"
                                value={item.description}
                                onChange={(e) => setProgressiveOptionAt(index, 'description', e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Max Distance (ft)"
                                value={item.maxViewDistanceFt}
                                onChange={(e) => setProgressiveOptionAt(index, 'maxViewDistanceFt', e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <TextField
                                fullWidth
                                type="text"
                                label="Extra Price"
                                value={item.extraPrice ? formatNumber(parseNumber(String(item.extraPrice))) : ''}
                                onChange={(e) => setProgressiveOptionAt(index, 'extraPrice', parseNumber(e.target.value).toString())}
                                onKeyDown={(e) => {
                                  if (shouldBlockNonNumericKey(e)) e.preventDefault();
                                }}
                                inputProps={{ inputMode: 'numeric' }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <FormControl fullWidth>
                                <InputLabel>Progressive Type</InputLabel>
                                <Select
                                  value={item.progressiveType}
                                  label="Progressive Type"
                                  onChange={(e) => setProgressiveOptionAt(index, 'progressiveType', e.target.value as ProgressiveType)}
                                >
                                  <MenuItem value="STANDARD">Standard</MenuItem>
                                  <MenuItem value="PREMIUM">Premium</MenuItem>
                                  <MenuItem value="MID_RANGE">Mid Range</MenuItem>
                                  <MenuItem value="NEAR_RANGE">Near Range</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                  flexWrap: 'wrap',
                                  gap: { xs: 1, md: 2.5 },
                                  pt: 0.5,
                                }}
                              >
                                <FormControlLabel
                                  sx={{
                                    m: 0,
                                    '.MuiFormControlLabel-label': {
                                      fontSize: 14,
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                  control={
                                    <Switch
                                      checked={item.isRecommended}
                                      onChange={(e) => setProgressiveOptionAt(index, 'isRecommended', e.target.checked)}
                                    />
                                  }
                                  label="Recommended"
                                />
                                <FormControlLabel
                                  sx={{
                                    m: 0,
                                    '.MuiFormControlLabel-label': {
                                      fontSize: 14,
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                  control={
                                    <Switch
                                      checked={item.isActive}
                                      onChange={(e) => setProgressiveOptionAt(index, 'isActive', e.target.checked)}
                                    />
                                  }
                                  label="Active"
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </>
                  )}
                </Box>
              </Paper>

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

                    <Typography sx={{ fontSize: 13 }}>Category: {form.category}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Progressive: {(form.category === 'PROGRESSIVE') ? 'Yes' : 'No'}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Progressive Type: {(form.category === 'PROGRESSIVE') ? form.progressiveType : 'N/A'}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Active status: {form.isActive ? 'Yes' : 'No'}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Detail Summary</Typography>
                    <Typography sx={{ fontSize: 13 }}>Existing Features: {form.featureIds.length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Existing Tints: {form.tintIds.length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Existing Usage Rules: {form.usageIds.length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>New Features: {form.featuresToCreate.filter((x) => x.name.trim()).length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>New Tints: {form.tintsToCreate.filter((x) => x.name.trim()).length}</Typography>
                    <Typography sx={{ fontSize: 13 }}>Progressive Options: {(form.category === 'PROGRESSIVE') ? form.progressiveOptions.filter((x) => x.name.trim()).length : 0}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
          </Box>

          <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || submitting}>Back</Button>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {successMessage && (
                !saveCompleted && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (isEditMode) {
                        setSuccessMessage('');
                      } else {
                        setForm(DEFAULT_FORM);
                        setSuccessMessage('');
                        setActiveStep(0);
                        setErrors({});
                      }
                    }}
                  >
                    {isEditMode ? 'Dismiss' : 'Create Another Lens'}
                  </Button>
                )
              )}
              {activeStep < STEPS.length - 1 ? (
                <Button variant="contained" onClick={handleNext} disabled={submitting}>Continue</Button>
              ) : (
                !saveCompleted && (
                  <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? submitProgress || 'Submitting...' : isEditMode ? 'Save Lens' : 'Create Lens'}
                  </Button>
                )
              )}
              <Button variant="text" onClick={() => navigate(PAGE_ENDPOINTS.SHOP.PRODUCT_LENS)} disabled={submitting}>
                Back to Lens List
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default CreateLensPage;

