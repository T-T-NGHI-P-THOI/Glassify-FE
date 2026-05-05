import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Box, Rating, Stack, Typography, Tooltip } from '@mui/material';
import { FavoriteBorder } from '@mui/icons-material';
import type { BrowseProduct, ColorVariant } from '@/types/filter.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import './ProductGrid.css';
import type { ProductWithFrameInfoData } from "@/api/product-api.ts";

interface ProductGridProps {
  products: BrowseProduct[];
  onAddToFavorites?: (productId: string) => void;
  viewMode?: 'grid' | 'list';
  setActiveVariantProduct?: React.Dispatch<React.SetStateAction<BrowseProduct | null>>;
  frameInfoByProduct?: Record<string, ProductWithFrameInfoData | null>;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToFavorites,
  viewMode = 'grid',
  setActiveVariantProduct,
  frameInfoByProduct: frameInfoByProductProp,
}) => {
  const frameInfoByProduct = frameInfoByProductProp || {};
  const [selectedVariantByGroup, setSelectedVariantByGroup] = useState<Record<string, { image?: string; name?: string; price?: number; rating?: number; reviewCount?: number; slug?: string; sku?: string }>>({});

  const productToGroupKey = useMemo(() => {
    const map = new Map<string, string>();

    products.forEach((p) => {
      const frameInfo = frameInfoByProduct[p.id];
      const frameGroupId = p.productType === 'FRAME' ? frameInfo?.frameGroup?.id : undefined;
      const key = frameGroupId ? `${p.shopId}:framegroup:${frameGroupId}` : `${p.shopId}:product:${p.id}`;
      map.set(`${p.shopId}:${p.id}`, key);
      if (p.variantId) map.set(`${p.shopId}:${p.variantId}`, key);
    });

    return map;
  }, [products, frameInfoByProduct]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, BrowseProduct[]> = {};

    products.forEach((product) => {
      const keyFromApi = productToGroupKey.get(`${product.shopId}:${product.id}`) || `${product.shopId}:product:${product.id}`;

      if (!groups[keyFromApi]) {
        groups[keyFromApi] = [];
      }

      groups[keyFromApi].push(product);
    });

    return Object.values(groups);
  }, [products, productToGroupKey]);

    // initialize default selected variant per group from frameInfo (first variant) on load
  React.useEffect(() => {
    if (!products || products.length === 0) return;
    const init: Record<string, { image?: string; name?: string; price?: number; rating?: number; reviewCount?: number; slug?: string; sku?: string }> = {};

    products.forEach((p) => {
      const frameInfo = frameInfoByProduct[p.id];
      const variants = frameInfo?.frameVariants ?? [];
      const key = productToGroupKey.get(`${p.shopId}:${p.id}`) || `${p.shopId}:product:${p.id}`;
      if (selectedVariantByGroup[key]) return; // skip if already selected
      if (variants.length > 0) {
        const first = variants[0];
        const variantProduct = products.find(x => x.variantId === first.id) || p;
        init[key] = {
          image: variantProduct.image || p.image,
          name: variantProduct.name,
          price: variantProduct.price,
          rating: variantProduct.rating,
          reviewCount: variantProduct.reviewCount,
          slug: (variantProduct as any).slug,
          sku: (variantProduct as any).sku,
        };
      }
    });

    if (Object.keys(init).length > 0) setSelectedVariantByGroup(prev => ({ ...init, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, frameInfoByProduct, productToGroupKey]);

  const handleVariantClick = (variant?: ColorVariant | { image?: string; color?: string; colorCode?: string }, baseProduct?: BrowseProduct, groupKey?: string) => {
    if (!variant || !baseProduct) return;

    // update local selected variant for this group so the main card shows variant image/name
    if (groupKey) {
      setSelectedVariantByGroup((prev) => ({
        ...prev,
        [groupKey]: {
          image: variant.image,
          name: `${baseProduct.name}`,
          price: baseProduct.price,
          rating: baseProduct.rating,
          reviewCount: baseProduct.reviewCount,
          slug: (baseProduct as any).slug,
          sku: (baseProduct as any).sku,
        },
      }));
    }

    // also call external handler if provided
    setActiveVariantProduct?.({
      ...baseProduct,
      name: `${baseProduct.name}`,
      price: baseProduct.price,
      colorVariants: baseProduct.colorVariants,
    });
  };

  const navigate = useNavigate();

  const renderVariantIcons = (group: BrowseProduct[], groupKey: string, displayProduct: BrowseProduct) => {
    // Use ProductWithFrameInfoData.frameVariants when available to render color icons
    const main = group[0];
    const frameInfo = frameInfoByProduct[main.id];
    const variants = frameInfo?.frameVariants ?? [];

    const icons = variants.slice(0, 3).map((v) => {
      const product = products.find((prod) => prod.variantId === v.id);
      if (!product) return null;
      const color = v.colorHex || '#00000000';
      var variantImage = product.image;
      // determine the group key the same way grouping does so selection maps to the correct card
      const key = product ? (productToGroupKey.get(`${product.shopId}:${product.id}`) || `${product.shopId}:product:${product.id}`) : `${main.shopId}:product:${main.id}`;
      // determine if this variant is currently selected for the group
      const selectedForKey = selectedVariantByGroup[key];
      const isActive = !!selectedForKey && ((selectedForKey.slug && product && selectedForKey.slug === product.slug) || selectedForKey.image === variantImage);
      // Avoid rendering nested anchors: use navigate for inner clicks instead of Link
      return (
        <Tooltip key={v.id || color} title={v.colorName || 'Variant'} arrow enterDelay={250}>
          {product && product.slug && product.sku ? (
            <VariantIcon
              key={v.id}
              variantImage={variantImage}
              color={color}
              active={isActive}
              // click selects variant
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // select this variant to update card contents instead of navigating
                handleVariantClick({ image: variantImage, color: v.colorName, colorCode: v.colorHex }, product, key);
              }}
            />
          ) : (
            <VariantIcon
              key={`main-${v.id}-${key}`}
              variantImage={variantImage}
              color={color}
              active={isActive}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVariantClick({ image: variantImage, color: v.colorName, colorCode: v.colorHex }, product, key);
              }}
            />
          )}
        </Tooltip>
      );
    });

    if (variants.length > 3) {
      icons.push(
        <Box
          key={`more-${groupKey}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // navigate to the variant currently displayed on the card
            navigate(`/product/${displayProduct.slug}/${displayProduct.sku}`);
          }}
          sx={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            bgcolor: '#fff',
            border: '1px solid rgba(0,0,0,0.14)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 10,
            zIndex: 4,
          }}
        >
          +
        </Box>
      );
    }

    return icons;
  };


  const VariantIcon: React.FC<{
    variantImage?: string;
    color?: string;
    active?: boolean;
    onEnter?: () => void;
    onLeave?: () => void;
    onClick?: (e: React.MouseEvent) => void;
  }> = ({ variantImage, color, active, onEnter, onLeave, onClick }) => (
    <Box
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      sx={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        bgcolor: color,
        border: active ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.14)',
        flexShrink: 0,
        marginRight: 0.5,
        display: 'inline-block',
        cursor: 'pointer',
        p: 0,
        minWidth: 0,
        lineHeight: 0,
        zIndex: 4,
        transform: active ? 'scale(1.15)' : undefined,
      }}
    />
  );

  return (
    <div className={`product-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
      {groupedProducts.map((group) => {
        const mainProduct = group[0];
        const groupKey = productToGroupKey.get(`${mainProduct.shopId}:${mainProduct.id}`) || `${mainProduct.shopId}:product:${mainProduct.id}`;
        const selectedVariant = selectedVariantByGroup[groupKey];
        const displayProduct = ({
          ...mainProduct,
          ...(selectedVariant || {}),
          image: (selectedVariant && selectedVariant.image) || mainProduct.image,
        } as BrowseProduct & { price?: number; rating?: number; reviewCount?: number });

        return (
          <div key={groupKey} className="product-grid-card-wrapper">
            <div className="product-main-clickable" style={{ position: 'relative' }}>
              <Link
                to={`/product/${displayProduct.slug}/${displayProduct.sku}`}
                className="product-grid-card"
                style={{ position: 'relative' }}
              >
                {/* badges inside card */}
                {displayProduct.isNew && <span className="badge badge-new" style={{ position: 'absolute', top: 8, left: 12, zIndex: 6 }}>New</span>}
                {displayProduct.isFeatured && <span className="badge badge-bestseller" style={{ position: 'absolute', top: 8, left: mainProduct.isNew ? 68 : 12, zIndex: 6 }}>Best Seller</span>}

                <div className="product-image-container">
                  <img src={displayProduct.image} alt={selectedVariant?.name || displayProduct.name} />
                </div>

                <div className="product-grid-info">
                  <p className="product-grid-category">
                    {displayProduct.categoryName || mainProduct.productType}
                  </p>

                  <Tooltip title={mainProduct.name} arrow enterDelay={250}>
                    <h3 className="product-grid-name">{selectedVariant?.name || displayProduct.name}</h3>
                  </Tooltip>

                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Rating value={selectedVariant?.rating ?? displayProduct.rating} precision={0.5} size="small" readOnly />
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      ({selectedVariant?.reviewCount ?? displayProduct.reviewCount})
                    </Typography>
                  </Stack>

                  <p className="product-grid-price">{formatCurrency(selectedVariant?.price ?? displayProduct.price)}</p>
                </div>
              </Link>
              {/* variant icons rendered outside the anchor to avoid triggering outer link on click */}
              <div
                className="variant-icons"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'absolute', bottom: 54, right: 12, display: 'flex', zIndex: 9999, pointerEvents: 'auto' }}>
                {renderVariantIcons(group, groupKey, displayProduct)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
