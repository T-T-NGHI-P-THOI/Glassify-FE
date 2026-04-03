import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowBack, ExpandMore } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useAuth } from '@/hooks/useAuth';
import { shopApi } from '@/api/shopApi';
import { lensApi, type LensResponse } from '@/api/lens-api';
import ProductAPI from '@/api/product-api';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import type { ShopDetailResponse } from '@/models/Shop';

type FrameSpecificLensDetail = {
  frameGroupId?: string;
  frameGroupName?: string;
  frameVariantId?: string;
  frameVariantSku?: string;
  features: unknown[];
  tints: unknown[];
  usages: unknown[];
  progressiveOptions: unknown[];
};

type GroupedLensDetailItem = {
  key: string;
  item: unknown;
  frameLabels: string[];
};

const LensDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lensId } = useParams<{ lensId: string }>();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [lensDetail, setLensDetail] = useState<(LensResponse & Record<string, unknown>) | null>(null);

  const findLensDetailsFromCatalog = async (
    targetLensId: string,
    shopId?: string,
  ): Promise<FrameSpecificLensDetail[]> => {
    if (!shopId) return [];

    const frameGroups = await ProductAPI.getFrameGroupFromShopId(shopId);
    const frameGroupByVariantId = new Map<string, { frameGroupId: string; frameGroupName: string }>();

    frameGroups.forEach((group) => {
      (group.frameVariantResponses || []).forEach((variant) => {
        if (variant.id) {
          frameGroupByVariantId.set(variant.id, {
            frameGroupId: group.id,
            frameGroupName: group.frameName,
          });
        }
      });
    });

    const frameVariantIds = Array.from(
      new Set(
        (frameGroups || [])
          .flatMap((group) => group.frameVariantResponses || [])
          .map((variant) => variant.id)
          .filter(Boolean),
      ),
    );

    if (frameVariantIds.length === 0) return [];

    const catalogResults = await Promise.allSettled(
      frameVariantIds.map((frameVariantId) => lensApi.getCatalogForFrame(frameVariantId)),
    );

    const details: FrameSpecificLensDetail[] = [];

    for (const result of catalogResults) {
      if (result.status !== 'fulfilled' || !result.value) continue;

      const catalog = result.value;
      const matchedLens = catalog.lenses?.find((lens) => lens.lensId === targetLensId);

      if (matchedLens) {
        const frameGroupInfo = catalog.frameVariantId ? frameGroupByVariantId.get(catalog.frameVariantId) : undefined;
        details.push({
          features: matchedLens.features || [],
          tints: matchedLens.tints || [],
          usages: matchedLens.usages || [],
          progressiveOptions: matchedLens.progressiveOptions || [],
          frameGroupId: frameGroupInfo?.frameGroupId,
          frameGroupName: frameGroupInfo?.frameGroupName,
          frameVariantId: catalog.frameVariantId,
          frameVariantSku: catalog.frameVariantSku,
        });
      }
    }

    return details;
  };

  const getRelatedItems = (source: Record<string, unknown> | null, keys: string[]) => {
    if (!source) return [] as unknown[];

    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value) && value.length > 0) return value;
    }

    const detailData = source.lensDetailData as Record<string, unknown> | undefined;
    if (!detailData) return [] as unknown[];

    for (const key of keys) {
      const value = detailData[key];
      if (Array.isArray(value) && value.length > 0) return value;
    }

    return [] as unknown[];
  };

  const toDisplayLabel = (key: string) => {
    const labels: Record<string, string> = {
      name: 'Name',
      sku: 'SKU',
      code: 'Code',
      extraPrice: 'Extra Price',
      basePrice: 'Base Price',
      isDefault: 'Default',
      allowTint: 'Allow Tint',
      allowProgressive: 'Allow Progressive',
      minPriceAdjustment: 'Min Price Adj',
      progressiveType: 'Progressive Type',
      maxViewDistanceFt: 'Max View Distance Ft',
      isRecommended: 'Recommended',
      isActive: 'Active',
      behavior: 'Behavior',
      opacity: 'Opacity',
      sphLimit: 'SPH Limit',
    };

    return labels[key] || key;
  };

  const formatRelatedItem = (item: unknown) => {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return '-';

    const typed = item as Record<string, unknown>;
    return String(
      typed.name ||
        typed.sku ||
        typed.code ||
        typed.id ||
        typed.featureId ||
        typed.tintId ||
        typed.usageId ||
        '-',
    );
  };

  const getItemIdentity = (item: unknown, keys: string[]) => {
    if (!item || typeof item !== 'object') return formatRelatedItem(item);

    const typed = item as Record<string, unknown>;

    for (const key of keys) {
      const value = typed[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }

    const nestedCandidates = [typed.feature, typed.tint, typed.usage, typed.progressiveOption];
    for (const nested of nestedCandidates) {
      if (!nested || typeof nested !== 'object') continue;
      const nestedRecord = nested as Record<string, unknown>;
      for (const key of keys) {
        const value = nestedRecord[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
    }

    return formatRelatedItem(item);
  };

  const groupLensItems = (itemsByFrame: FrameSpecificLensDetail[], property: keyof FrameSpecificLensDetail, identityKeys: string[]) => {
    const grouped = new Map<string, GroupedLensDetailItem>();

    itemsByFrame.forEach((frameDetail) => {
      const frameGroupLabel = frameDetail.frameGroupName || 'Unknown Group';
      const frameVariantLabel = frameDetail.frameVariantSku || frameDetail.frameVariantId || 'Unknown Variant';
      const frameLabel = `${frameGroupLabel} - ${frameVariantLabel}`;
      const items = frameDetail[property] as unknown[];

      items.forEach((item) => {
        const key = getItemIdentity(item, identityKeys);
        const current = grouped.get(key);

        if (current) {
          if (!current.frameLabels.includes(frameLabel)) {
            current.frameLabels.push(frameLabel);
          }
          return;
        }

        grouped.set(key, {
          key,
          item,
          frameLabels: [frameLabel],
        });
      });
    });

    return Array.from(grouped.values()).sort((left, right) => left.key.localeCompare(right.key));
  };

  const getDetailFields = (item: unknown, preferredKeys: string[]) => {
    if (!item || typeof item !== 'object') {
      return [{ label: 'Value', value: formatRelatedItem(item) }];
    }

    const typed = item as Record<string, unknown>;
    const fields: Array<{ label: string; value: string }> = [];

    preferredKeys.forEach((key) => {
      const value = typed[key];
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        fields.push({
          label: toDisplayLabel(key),
          value: String(value),
        });
      }
    });

    if (fields.length === 0) {
      return [{ label: 'Value', value: formatRelatedItem(item) }];
    }

    return fields;
  };

  const frameSpecificDetails = useMemo(() => {
    if (!lensDetail) return [] as FrameSpecificLensDetail[];

    const fromCatalog = lensDetail.frameLensDetails;
    if (Array.isArray(fromCatalog) && fromCatalog.length > 0) {
      return fromCatalog as FrameSpecificLensDetail[];
    }

    return [
      {
        frameVariantId:
          (lensDetail.frameVariantId as string | undefined) ||
          (lensDetail.frameId as string | undefined),
        frameVariantSku: lensDetail.frameVariantSku as string | undefined,
        features: getRelatedItems(lensDetail, [
          'features',
          'lensFeatures',
          'featureMappings',
          'lensFeatureMappings',
          'featureIds',
        ]),
        tints: getRelatedItems(lensDetail, [
          'tints',
          'lensTints',
          'tintOptions',
          'lensTintOptions',
          'tintIds',
        ]),
        usages: getRelatedItems(lensDetail, [
          'usages',
          'lensUsages',
          'usageRules',
          'lensUsageRules',
          'usageIds',
        ]),
        progressiveOptions: getRelatedItems(lensDetail, [
          'progressiveOptions',
          'lensProgressiveOptions',
        ]),
      },
    ];
  }, [lensDetail]);

  const currentStepDetails = useMemo(() => {
    const featureCount = (lensDetail?.featureMappings?.length ?? 0) || 0;
    const tintCount = (lensDetail?.tintOptions?.length ?? 0) || 0;
    const usageCount = (lensDetail?.usageRules?.length ?? 0) || 0;
    const progressiveCount = (lensDetail?.progressiveOptions?.length ?? 0) || 0;
    const frameCount = frameSpecificDetails.length;

    return {
      featureCount,
      tintCount,
      usageCount,
      progressiveCount,
      frameCount,
    };
  }, [frameSpecificDetails.length, lensDetail]);

  const groupedDetailItems = useMemo(() => ({
    features: groupLensItems(frameSpecificDetails, 'features', ['featureId', 'id', 'sku', 'name']),
    tints: groupLensItems(frameSpecificDetails, 'tints', ['tintId', 'id', 'code', 'name']),
    usages: groupLensItems(frameSpecificDetails, 'usages', ['usageId', 'id', 'name']),
    progressiveOptions: groupLensItems(frameSpecificDetails, 'progressiveOptions', [
      'progressiveOptionId',
      'id',
      'name',
      'progressiveType',
    ]),
  }), [frameSpecificDetails]);

  useEffect(() => {
    if (!lensId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const shopRes = await shopApi.getMyShops();
        const myShop = shopRes.data?.[0] ?? null;
        setShop(myShop);

        const detail = await lensApi.getById(lensId);
        const catalogDetails = await findLensDetailsFromCatalog(lensId, myShop?.id);

        if (catalogDetails.length > 0) {
          const firstCatalogDetail = catalogDetails[0];

          const enrichedFeatures = detail.featureMappings?.map((mapping) => {
            const fullFeature = firstCatalogDetail.features?.find(
              (f: any) => f.featureId === mapping.featureId || f.id === mapping.featureId,
            );
            const enriched: any = { ...mapping };
            if (fullFeature && typeof fullFeature === 'object') {
              Object.assign(enriched, fullFeature);
            }
            enriched.extraPrice = mapping.extraPrice;
            enriched.isDefault = mapping.isDefault;
            return enriched;
          }) || [];

          const enrichedTints = detail.tintOptions?.map((option) => {
            const fullTint = firstCatalogDetail.tints?.find(
              (t: any) => t.tintId === option.tintId || t.id === option.tintId,
            );
            const enriched: any = { ...option };
            if (fullTint && typeof fullTint === 'object') {
              Object.assign(enriched, fullTint);
            }
            enriched.extraPrice = option.extraPrice;
            enriched.isDefault = option.isDefault;
            return enriched;
          }) || [];

          const enrichedUsages = detail.usageRules?.map((rule) => {
            const fullUsage = firstCatalogDetail.usages?.find(
              (u: any) => u.usageId === rule.usageId || u.id === rule.usageId,
            );
            const enriched: any = { ...rule };
            if (fullUsage && typeof fullUsage === 'object') {
              Object.assign(enriched, fullUsage);
            }
            return enriched;
          }) || [];

          setLensDetail({
            ...detail,
            frameVariantId: firstCatalogDetail.frameVariantId,
            frameVariantSku: firstCatalogDetail.frameVariantSku,
            featureMappings: enrichedFeatures,
            tintOptions: enrichedTints,
            usageRules: enrichedUsages,
            frameLensDetails: catalogDetails,
          } as LensResponse & Record<string, unknown>);
        } else {
          setLensDetail(detail as LensResponse & Record<string, unknown>);
        }
      } catch (error) {
        console.error('Failed to load lens detail:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [lensId]);

  const sidebarProps = {
    activeMenu: PAGE_ENDPOINTS.SHOP.PRODUCT_LENS,
    shopName: shop?.shopName,
    shopLogo: shop?.logoUrl,
    ownerName: user?.fullName,
    ownerEmail: user?.email,
    ownerAvatar: user?.avatarUrl,
  };

  const renderGroupedCards = (items: GroupedLensDetailItem[], preferredKeys: string[], emptyLabel: string) => {
    if (items.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 1 }}>
          {emptyLabel}
        </Alert>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {items.map((groupedItem, index) => (
          <Paper
            key={`${emptyLabel}-${index}`}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              borderColor: theme.palette.custom.border.light,
              background: theme.palette.custom.neutral[50],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                {getDetailFields(groupedItem.item, preferredKeys).map((field) => (
                  <Typography key={`${emptyLabel}-${index}-${field.label}`} sx={{ fontSize: 12.5, mb: 0.35 }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {field.label}:
                    </Box>{' '}
                    {field.value}
                  </Typography>
                ))}
              </Box>
              <Chip size="small" label={`${groupedItem.frameLabels.length} frame(s)`} variant="outlined" />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {groupedItem.frameLabels.map((frameLabel) => (
                <Chip key={`${groupedItem.key}-${frameLabel}`} size="small" label={frameLabel} />
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    );
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

      <Box sx={{ flex: 1, p: 4, maxWidth: 1180 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Lens Details
            </Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
              Read-only lens detail view aligned with the edit layout
            </Typography>
          </Box>
        </Box>

        {!lensDetail && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Lens data could not be loaded.
          </Alert>
        )}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Basic Info</Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>SKU</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{lensDetail?.sku || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Lens Name</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{lensDetail?.name || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Base Price</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    {typeof lensDetail?.basePrice === 'number'
                      ? lensDetail.basePrice.toLocaleString('vi-VN')
                      : '0'}{' '}
                    VND
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Category</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{lensDetail?.category || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Progressive</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    {lensDetail?.isProgressive ? (lensDetail?.progressiveType as string) || 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Status</Typography>
                  <Chip
                    size="small"
                    label={lensDetail?.isActive ? 'ACTIVE' : 'INACTIVE'}
                    color={lensDetail?.isActive ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Updated At</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    {lensDetail?.updatedAt
                      ? new Date(String(lensDetail.updatedAt)).toLocaleString('vi-VN')
                      : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Overview</Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Frame Variants</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{currentStepDetails.frameCount}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Features</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{currentStepDetails.featureCount}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Tints</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{currentStepDetails.tintCount}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Usage Rules</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{currentStepDetails.usageCount}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Progressive Options</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{currentStepDetails.progressiveCount}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Lens Detail Objects</Typography>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                Review the mapped lens objects in the same structure used by the edit screen.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Mapped Features</Typography>
                  {renderGroupedCards(groupedDetailItems.features, ['name', 'sku', 'extraPrice', 'isDefault', 'sphLimit'], 'No related features')}
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Mapped Tints</Typography>
                  {renderGroupedCards(groupedDetailItems.tints, ['name', 'code', 'behavior', 'opacity', 'basePrice', 'extraPrice', 'isDefault'], 'No related tints')}
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Usage Rules</Typography>
                  {renderGroupedCards(groupedDetailItems.usages, ['name', 'type', 'allowTint', 'allowProgressive', 'minPriceAdjustment'], 'No related usages')}
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Progressive Options</Typography>
                  {renderGroupedCards(groupedDetailItems.progressiveOptions, ['name', 'progressiveType', 'maxViewDistanceFt', 'extraPrice', 'isRecommended', 'isActive'], 'No progressive options')}
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LensDetailPage;
