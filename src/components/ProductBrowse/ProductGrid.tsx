import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Rating, Stack, Typography, Tooltip } from '@mui/material';
import { FavoriteBorder } from '@mui/icons-material';
import type { BrowseProduct, ColorVariant } from '@/types/filter.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import './ProductGrid.css';
import type { ProductWithFrameInfoData } from "@/api/product-api.ts";
import ProductAPI from "@/api/product-api.ts";

interface ProductGridProps {
  products: BrowseProduct[];
  onAddToFavorites?: (productId: string) => void;
  viewMode?: 'grid' | 'list';
  setActiveVariantProduct?: React.Dispatch<React.SetStateAction<BrowseProduct | null>>;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToFavorites,
  viewMode = 'grid',
  setActiveVariantProduct,
}) => {
  // Map productId -> ProductWithFrameInfoData so we can show frame variants as color icons
  const [frameInfoByProduct, setFrameInfoByProduct] = useState<Record<string, ProductWithFrameInfoData | null>>({});
  // Local selected variant per group key to show variant image/name on the main card
  const [selectedVariantByGroup, setSelectedVariantByGroup] = useState<Record<string, { image?: string; name?: string }>>({});
  // hover-only preview (temporary) per group
  const [hoverVariantByGroup, setHoverVariantByGroup] = useState<Record<string, string>>({});
  const [hoverVariantDetailsByGroup, setHoverVariantDetailsByGroup] = useState<Record<string, { name?: string; price?: number; rating?: number; reviewCount?: number; category?: string }>>({});

  useEffect(() => {
    // Fetch ProductWithFrameInfoData for each unique product id in the list.
    const fetchFrameInfo = async () => {
      try {
        const productIds = Array.from(new Set(products.map((p) => p.id).filter(Boolean)));
        if (productIds.length === 0) return;

        const results = await Promise.all(
          productIds.map(async (id) => {
            try {
              const info = await ProductAPI.getProductWithFrameInfo(id);
              return { id, info };
            } catch (e) {
              return { id, info: null };
            }
          })
        );

        const map: Record<string, ProductWithFrameInfoData | null> = {};
        results.forEach(({ id, info }) => (map[id] = info));
        setFrameInfoByProduct(map);
      } catch (error) {
        console.error('Error fetching product frame info:', error);
      }
    };

    fetchFrameInfo();
  }, [products]);

  const productToGroupKey = useMemo(() => {
    const map = new Map<string, string>();

    products.forEach((p) => {
      const frameInfo = frameInfoByProduct[p.id];
      const frameGroupId = frameInfo?.frameGroup?.id;
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

  const handleVariantClick = (variant?: ColorVariant | { image?: string; color?: string; colorCode?: string }, baseProduct?: BrowseProduct, groupKey?: string) => {
    if (!variant || !baseProduct) return;

    const image = (variant as any).image || (variant as any).imageUrl || '';
    const color = (variant as any).color || (variant as any).colorCode || '';

    // update local selected variant for this group so the main card shows variant image/name
    if (groupKey) {
      setSelectedVariantByGroup((prev) => ({
        ...prev,
        [groupKey]: { image, name: `${baseProduct.name}${color ? ` - ${color}` : ''}` },
      }));
    }

    // also call external handler if provided
    setActiveVariantProduct?.({
      ...baseProduct,
      image,
      name: `${baseProduct.name}${color ? ` - ${color}` : ''}`,
      price: baseProduct.price,
      colorVariants: baseProduct.colorVariants,
    });
  };

  const renderVariantIcons = (group: BrowseProduct[]) => {
    // Use ProductWithFrameInfoData.frameVariants when available to render color icons
    const main = group[0];
    const frameInfo = frameInfoByProduct[main.id];
    const variants = frameInfo?.frameVariants ?? [];

    return variants.map((v) => {
      const product = products.find((prod) => prod.variantId === v.id);
      const color = v.colorHex || '#00000000';
      const variantImage = ProductAPI.getPrimaryImageUrl(product, '');
      const key = `${product?.shopId}:framegroup:${frameInfo?.frameGroup?.id}`;

      return (
        <Tooltip key={v.id || color} title={v.colorName || 'Variant'} arrow enterDelay={250}>
          {product && product.slug && product.sku ? (
            <Link to={`/product/${product.slug}/${product.sku}`} onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'none' }}>
              <Box
                onMouseEnter={() => {
                  setHoverVariantByGroup((prev) => ({ ...prev, [key]: variantImage }));
                  setHoverVariantDetailsByGroup((prev) => ({
                    ...prev, [key]: {
                      name: product.name || `${main.name} - ${v.colorName || ''}`,
                      price: product.price ?? main.price,
                      rating: product.rating ?? main.rating,
                      reviewCount: product.reviewCount ?? main.reviewCount,
                      category: product.categoryName ?? main.categoryName,
                    }
                  }));
                }}
                onMouseLeave={() => {
                  setHoverVariantByGroup((prev) => { const c = { ...prev }; delete c[key]; return c; });
                  setHoverVariantDetailsByGroup((prev) => { const c = { ...prev }; delete c[key]; return c; });
                }}
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: color,
                  border: '1px solid rgba(0,0,0,0.14)',
                  flexShrink: 0,
                  marginRight: 0.5,
                  display: 'inline-block',
                  cursor: 'pointer',
                  p: 0,
                  minWidth: 0,
                  lineHeight: 0,
                  zIndex: 4,
                }}
              />
            </Link>
          ) : (
            <Link to={`/product/${main.slug}/${main.sku}`} onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'none' }}>
              <Box
                onMouseEnter={() => {
                  setHoverVariantByGroup((prev) => ({ ...prev, [key]: variantImage }));
                  setHoverVariantDetailsByGroup((prev) => ({
                    ...prev, [key]: {
                      name: `${main.name} - ${v.colorName || ''}`,
                      price: main.price,
                      rating: main.rating,
                      reviewCount: main.reviewCount,
                      category: main.categoryName,
                    }
                  }));
                }}
                onMouseLeave={() => {
                  setHoverVariantByGroup((prev) => { const c = { ...prev }; delete c[key]; return c; });
                  setHoverVariantDetailsByGroup((prev) => { const c = { ...prev }; delete c[key]; return c; });
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVariantClick({ image: variantImage, color: v.colorName, colorCode: v.colorHex }, product, key);
                }}
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: color,
                  border: '1px solid rgba(0,0,0,0.14)',
                  flexShrink: 0,
                  marginRight: 0.5,
                  display: 'inline-block',
                  cursor: 'pointer',
                  p: 0,
                  minWidth: 0,
                  lineHeight: 0,
                  zIndex: 4,
                }}
              />
            </Link>
          )}
        </Tooltip>
      );
    });
  };

  return (
    <div className={`product-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
      {groupedProducts.map((group) => {
        const mainProduct = group[0];
        const groupKey = `${mainProduct.shopId}:${mainProduct.id}`;
        const variantProduct = hoverVariantDetailsByGroup[groupKey];
        const displayProduct = variantProduct ? { ...mainProduct, ...variantProduct } : mainProduct;
        const selectedVariant = selectedVariantByGroup[groupKey];

        return (
          <div key={groupKey} className="product-grid-card-wrapper">
            <div className="product-main-clickable">
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
                    <Rating value={variantProduct?.rating ?? displayProduct.rating} precision={0.5} size="small" readOnly />
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      ({variantProduct?.reviewCount ?? displayProduct.reviewCount})
                    </Typography>
                  </Stack>

                  <p className="product-grid-price">{formatCurrency(variantProduct?.price ?? displayProduct.price)}</p>
                </div>
                {/* favorite button inside card top-right, below variants */}
                <button
                  className="favorite-btn-grid"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onAddToFavorites) onAddToFavorites(mainProduct.id);
                  }}
                  style={{ position: 'absolute', top: 0, right: 48, zIndex: 8, transform: 'translateX(36px)' }}
                >
                  <FavoriteBorder />
                </button>
                {/* variant icons inside card top-right */}
                <div
                  className="variant-icons"
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'absolute', bottom: 48, right: 12, display: 'flex', zIndex: 7 }}>
                  {renderVariantIcons(group)}
                </div>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
