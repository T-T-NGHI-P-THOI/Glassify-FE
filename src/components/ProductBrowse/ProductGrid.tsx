import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Rating, Stack, Typography, Tooltip } from '@mui/material';
import { FavoriteBorder } from '@mui/icons-material';
import type { BrowseProduct, ColorVariant } from '@/types/filter.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import './ProductGrid.css';
import type { ApiShopFrameGroup } from "@/api/product-api.ts";
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
  const [frameGroupsByShop, setFrameGroupsByShop] = useState<Record<string, ApiShopFrameGroup[]>>({});

  useEffect(() => {
    const fetchFrameGroups = async () => {
      try {
        const shopIds = Array.from(
          new Set(products.map((product) => product.shopId).filter(Boolean))
        );

        if (shopIds.length === 0) return;

        const results = await Promise.all(
          shopIds.map(async (shopId) => {
            const frameGroups = await ProductAPI.getFrameGroupFromShopId(shopId);
            return { shopId, frameGroups };
          })
        );

        const grouped: Record<string, ApiShopFrameGroup[]> = {};
        results.forEach(({ shopId, frameGroups }) => {
          grouped[shopId] = frameGroups;
        });

        setFrameGroupsByShop(grouped);
      } catch (error) {
        console.error('Error fetching frame groups:', error);
      }
    };

    fetchFrameGroups();
  }, [products]);

  const productToGroupKey = useMemo(() => {
    const lookup = new Map<string, string>();

    Object.entries(frameGroupsByShop).forEach(([shopId, groups]) => {
      groups.forEach((group) => {
        // IMPORTANT:
        // Replace `group.productIds` with the actual member field returned by your API.
        // Examples could be: `group.products`, `group.productIds`, `group.variantIds`, etc.
        const memberIds = (group as ApiShopFrameGroup & { productIds?: string[]; variantIds?: string[] }).productIds
          ?? (group as ApiShopFrameGroup & { productIds?: string[]; variantIds?: string[] }).variantIds
          ?? [];

        memberIds.forEach((id) => {
          lookup.set(`${shopId}:${id}`, `${shopId}:${group.id}`);
        });
      });
    });

    return lookup;
  }, [frameGroupsByShop]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, BrowseProduct[]> = {};

    products.forEach((product) => {
      const keyFromApi = productToGroupKey.get(`${product.shopId}:${product.id}`)
        || productToGroupKey.get(`${product.shopId}:${product.variantId}`)
        || `${product.shopId}:${product.id}`;

      if (!groups[keyFromApi]) {
        groups[keyFromApi] = [];
      }

      groups[keyFromApi].push(product);
    });

    return Object.values(groups);
  }, [products, productToGroupKey]);

  const handleVariantClick = (variant?: ColorVariant, baseProduct?: BrowseProduct) => {
    if (!variant || !baseProduct || !variant.image || !variant.color) return;

    setActiveVariantProduct?.({
      ...baseProduct,
      image: variant.image,
      name: `${baseProduct.name} - ${variant.color}`,
      price: baseProduct.price,
      colorVariants: baseProduct.colorVariants,
    });
  };

  const renderVariantIcons = (group: BrowseProduct[]) => {
    return group.map((variantProduct) => {
      const variant = variantProduct.colorVariants?.[0];
      if (!variant) return null;

      return (
        <Tooltip
          key={variantProduct.productId}
          title={variant.color || 'Variant'}
          arrow
          enterDelay={250}
        >
          <Box
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleVariantClick(variant, group[0]);
            }}
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: variant.colorCode || '#000',
              border: '1px solid rgba(0,0,0,0.14)',
              flexShrink: 0,
              marginRight: 0.5,
              display: 'inline-block',
              cursor: 'pointer',
            }}
          />
        </Tooltip>
      );
    });
  };

  return (
    <div className={`product-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
      {groupedProducts.map((group) => {
        const mainProduct = group[0];
        const groupKey = `${mainProduct.shopId}:${mainProduct.id}`;

        return (
          <div key={groupKey} className="product-grid-card-wrapper">
            <Link
              to={`/product/${mainProduct.slug}/${mainProduct.sku}`}
              className="product-grid-card"
            >
              {mainProduct.isNew && <span className="badge badge-new">New</span>}
              {mainProduct.isFeatured && <span className="badge badge-bestseller">Best Seller</span>}

              <button
                className="favorite-btn-grid"
                onClick={(e) => {
                  e.preventDefault();
                  if (onAddToFavorites) onAddToFavorites(mainProduct.id);
                }}
              >
                <FavoriteBorder />
              </button>

              <div className="product-image-container">
                <img src={mainProduct.image} alt={mainProduct.name} />
              </div>

              <div className="product-grid-info">
                <p className="product-grid-category">
                  {mainProduct.categoryName || mainProduct.productType}
                </p>

                <div className="variant-icons">
                  {renderVariantIcons(group)}
                </div>

                <Tooltip title={mainProduct.name} arrow enterDelay={250}>
                  <h3 className="product-grid-name">{mainProduct.name}</h3>
                </Tooltip>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Rating value={mainProduct.rating} precision={0.5} size="small" readOnly />
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    ({mainProduct.reviewCount})
                  </Typography>
                </Stack>

                <p className="product-grid-price">{formatCurrency(mainProduct.price)}</p>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
