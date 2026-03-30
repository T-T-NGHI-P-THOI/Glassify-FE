import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Home } from '@mui/icons-material';
import { Snackbar, Alert } from '@mui/material';
import ImageGallery from '../../components/ProductDetailPage/ImageGallery';
import ProductInfo from '../../components/ProductDetailPage/ProductInfo';
import ProductDetails from '../../components/ProductDetailPage/ProductDetails';
import RecommendedProducts from '../../components/ProductDetailPage/RecommendedProducts';
import ShopInfo from '../../components/ProductDetailPage/ShopInfo';
import Product3DPreviewDialog, { type Product3DVariantOption } from '../../components/ProductDetailPage/Product3DPreviewDialog';
import { LensSelectionDialog } from '../../components/LensSelection/LensSelectionDialog';
import GlassesTryOnPopup from '../Virtrual-Try-On/GlassesTryOn/GlassesTryOnPopup';
import type { Product, RecommendedProduct } from '../../types/product';
import type { LensSelection } from '../../models/Lens';
import ProductAPI, {
  type ApiProduct,
  type ApiFrameVariant,
  type ApiTextureFile,
  type ProductWithFrameInfoData,
  type ReviewResponse,
} from '../../api/product-api';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import './ProductDetailPage.css';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/000000/FFFFFF?text=Product';

const mmToInches = (mm: number): number => Number((mm / 25.4).toFixed(1));

const formatEnumLabel = (value?: string | null): string => {
  if (!value) return 'N/A';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getProductImages = (apiProduct: ApiProduct): string[] => {
  const images = ProductAPI.getImageUrls(apiProduct);
  return images.length > 0 ? images : ['https://placehold.co/600x400/000000/FFFFFF?text=Front'];
};

const buildFeatures = (frameInfo?: ProductWithFrameInfoData | null): string[] => {
  const features: string[] = [];
  const frameGroup = frameInfo?.frameGroup;

  if (!frameGroup) return features;

  if (frameGroup.hasNosePads) features.push('Nose Pads');
  if (frameGroup.hasSpringHinge) features.push('Spring Hinge');

  if (Array.isArray(frameGroup.suitableFaceShapes) && frameGroup.suitableFaceShapes.length > 0) {
    features.push(...frameGroup.suitableFaceShapes.map(shape => `${formatEnumLabel(shape)} Face`));
  }

  return features;
};

const ProductDetailPage: React.FC = () => {
  const { slug, sku } = useParams<{ slug: string; sku: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addItem, addFrameWithLens, removeItem, cartData } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [accessories, setAccessories] = useState<ApiProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [reviewData, setReviewData] = useState<ReviewResponse>({ reviews: [], summary: { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, total: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [currentAccessoryIndex, setCurrentAccessoryIndex] = useState(0);
  const [lensDialogOpen, setLensDialogOpen] = useState(false);
  const [selectedLens, setSelectedLens] = useState<LensSelection | null>(null);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [preview3DOpen, setPreview3DOpen] = useState(false);
  const [preview3DVariants, setPreview3DVariants] = useState<Product3DVariantOption[]>([]);
  const [activePreviewVariantId, setActivePreviewVariantId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const editCartItemId = searchParams.get('editCartItemId');
  const isEditMode = !!editCartItemId;

  // Derive the existing lens selection from cart data when editing
  const editLensSelection = useMemo(() => {
    if (!isEditMode || !editCartItemId || !cartData) return undefined;
    const parentItem = cartData.items.find(item => item.id === editCartItemId);
    if (!parentItem) return undefined;
    const lensChild = parentItem.children.find(c => c.item_type === 'LENS');
    return lensChild?.lens_selection;
  }, [isEditMode, editCartItemId, cartData]);

  // Auto-open lens dialog if URL has lens parameter (only check searchParams changes)
  useEffect(() => {
    const lensParam = searchParams.get('lens');
    if (lensParam === 'open') {
      setLensDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);
        const apiProduct = await ProductAPI.getProductBySlug(slug);
        let productWithFrameInfo: ProductWithFrameInfoData | null = null;

        try {
          productWithFrameInfo = await ProductAPI.getProductWithFrameInfo(apiProduct.id);
        } catch (error) {
          console.warn('Unable to fetch frame info details, falling back to base product data:', error);
        }

        const productResponse = productWithFrameInfo?.productResponse ?? apiProduct;
        const frameGroup = productWithFrameInfo?.frameGroup;
        const frameVariants = productWithFrameInfo?.frameVariants ?? [];

        const selectedFrameVariant =
          frameVariants.find((variant) => variant.id === productResponse.variantId) ||
          frameVariants.find((variant) => variant.productId === productResponse.id) ||
          frameVariants.find((variant) => variant.productResponse?.id === productResponse.id) ||
          frameVariants[0] ||
          null;

        const frameWidthMm = selectedFrameVariant?.frameWidthMm ?? 0;
        const bridgeMm = selectedFrameVariant?.bridgeWidthMm ?? 0;
        const lensWidthMm = selectedFrameVariant?.lensWidthMm ?? 0;
        const lensHeightMm = selectedFrameVariant?.lensHeightMm ?? 0;
        const templeLengthMm = selectedFrameVariant?.templeLengthMm ?? 0;

        const productImages = getProductImages(productResponse);
        const primaryImage = productImages[0] || PLACEHOLDER_IMAGE;

        const shapeLabel = formatEnumLabel(frameGroup?.frameShape);
        const materialLabel = formatEnumLabel(frameGroup?.frameMaterial);
        const rimLabel = formatEnumLabel(frameGroup?.frameStructure);
        const sizeLabel = formatEnumLabel(selectedFrameVariant?.size);

        const sizeRange = frameWidthMm > 0
          ? `${Math.max(frameWidthMm - 3, 0)} - ${frameWidthMm + 3} mm / ${mmToInches(Math.max(frameWidthMm - 3, 0))} - ${mmToInches(frameWidthMm + 3)} in`
          : 'N/A';

        const productFeatures = buildFeatures(productWithFrameInfo);

        const variantColorOptions = frameVariants.length > 0
          ? frameVariants.map((variant) => {
            const variantProduct = variant.productResponse ?? (variant.id === selectedFrameVariant?.id ? productResponse : undefined);
            const variantImages = getProductImages(variantProduct ?? productResponse);
            const variantProductId = variantProduct?.id ?? variant.productId ?? productResponse.id;

            return {
              name: variant.colorName || 'Default',
              code: variant.colorHex || '#000000',
              image: variantImages[0] || primaryImage,
              images: variantImages,
              productId: variantProductId,
              variantId: variant.id || variantProduct?.variantId || variantProductId
            };
          })
          : [
            {
              name: selectedFrameVariant?.colorName || 'Default',
              code: selectedFrameVariant?.colorHex || '#000000',
              image: primaryImage,
              images: productImages,
              productId: productResponse.id,
              variantId: productResponse.variantId || selectedFrameVariant?.id || productResponse.id
            }
          ];
        
        // Transform API product to Product format
        const transformedProduct: Product = {
          id: productResponse.id,
          shopId: productResponse.shopId,
          shop: productResponse.shop,
          slug: productResponse.slug,
          name: productResponse.name,
          sku: productResponse.sku,
          price: productResponse.basePrice,
          rating: productResponse.avgRating || 0,
          reviewCount: productResponse.reviewCount || 0,
          shape: shapeLabel,
          category: productResponse.categoryName,
          productType: productResponse.productType,
          variantId: productResponse.variantId ?? selectedFrameVariant?.id ?? undefined,
          frameGroupId: frameGroup?.id ?? selectedFrameVariant?.frameGroupId ?? undefined,
          vrEnabled: Boolean(frameGroup?.vrEnabled),
          stockQuantity: productResponse.stockQuantity,
          colors: variantColorOptions,
          images: productImages,
          frameMeasurements: {
            frameWidth: { mm: frameWidthMm, inches: mmToInches(frameWidthMm) },
            bridge: { mm: bridgeMm, inches: mmToInches(bridgeMm) },
            lensWidth: { mm: lensWidthMm, inches: mmToInches(lensWidthMm) },
            lensHeight: { mm: lensHeightMm, inches: mmToInches(lensHeightMm) },
            templeLength: { mm: templeLengthMm, inches: mmToInches(templeLengthMm) }
          },
          frameDetails: {
            size: sizeLabel,
            sizeRange,
            material: materialLabel,
            weight: 'N/A',
            weightGrams: 0,
            rim: rimLabel,
            shape: shapeLabel
          },
          prescriptionDetails: {
            pdRange: 'N/A',
            prescriptionRange: 'N/A',
            progressive: false,
            bifocal: false,
            readers: false
          },
          description: productResponse.description ?? frameGroup?.description ?? undefined,
          features: productFeatures
        };

        setProduct(transformedProduct);

        // Fetch reviews for this product
        try {
          setIsLoadingReviews(true);
          const response = await ProductAPI.getProductReviews(apiProduct.id, { page: 1, unitPerPage: 10 });
          setReviewData(response);
        } catch (error) {
          console.error('Error fetching reviews:', error);
          setReviewData({ reviews: [], summary: { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, total: 0 } });
        } finally {
          setIsLoadingReviews(false);
        }

        // Fetch accessories linked to current product
        const accessoryProducts = await ProductAPI.getAccessoriesByParentProductId(apiProduct.id);
        setAccessories(accessoryProducts.filter(item => item.isActive));

        // Fetch recommended products
        const allProducts = await ProductAPI.getAllProducts();
        const recommended: RecommendedProduct[] = allProducts
          .filter(p => p.slug !== slug)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            slug: p.slug,
            productId: p.id,
            variantId: p.variantId || p.id,
            name: p.name,
            price: p.basePrice,
            rating: p.avgRating || 0,
            reviewCount: p.reviewCount || 0,
            shape: 'Rectangle',
            image: ProductAPI.getPrimaryImageUrl(p),
            colors: ['#000000']
          }));

        setRecommendedProducts(recommended);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug, sku]);

  useEffect(() => {
    const build3DVariants = (
      textures: ApiTextureFile[],
      frameVariants: ApiFrameVariant[],
      currentProduct: Product
    ): Product3DVariantOption[] => {
      const normalizeHex = (hex?: string) => (hex ?? '').trim().toLowerCase();

      const textureByHex = new Map<string, ApiTextureFile>();
      textures.forEach((texture) => {
        const key = normalizeHex(texture.colorHex);
        if (key && texture.url) {
          textureByHex.set(key, texture);
        }
      });

      const variantsFromProduct = frameVariants.length > 0
        ? frameVariants
        : (currentProduct.colors || []).map((color) => ({
          id: color.variantId,
          colorName: color.name,
          colorHex: color.code,
          size: undefined,
        }));

      const mappedFromFrameVariants: Product3DVariantOption[] = variantsFromProduct.reduce<Product3DVariantOption[]>((acc, variant) => {
        const texture = textureByHex.get(normalizeHex(variant.colorHex));
        if (!texture?.url) return acc;

        acc.push({
          id: variant.id,
          variantId: variant.id,
          label: `${variant.colorName || 'Variant'}${variant.size ? ` (${variant.size})` : ''}`,
          colorHex: variant.colorHex || '#666666',
          textureUrl: texture.url,
        });

        return acc;
      }, []);

      if (mappedFromFrameVariants.length > 0) {
        return mappedFromFrameVariants;
      }

      return textures.map((texture, index) => ({
        id: `texture-${index}-${texture.colorHex}`,
        label: `Variant ${index + 1}`,
        colorHex: texture.colorHex || '#666666',
        textureUrl: texture.url,
      }));
    };

    const loadPreview3DVariants = async () => {
      if (!product?.vrEnabled || !product.frameGroupId) {
        setPreview3DVariants([]);
        setActivePreviewVariantId(null);
        return;
      }

      try {
        const texturePromise = ProductAPI.getTextureFiles(product.frameGroupId);
        const productWithFrameInfoPromise = ProductAPI.getProductWithFrameInfo(product.id)
          .catch(() => null);

        const [textures, productWithFrameInfo] = await Promise.all([texturePromise, productWithFrameInfoPromise]);
        const variants = build3DVariants(textures, productWithFrameInfo?.frameVariants ?? [], product);

        setPreview3DVariants(variants);

        const normalizeHex = (hex?: string) => (hex ?? '').trim().toLowerCase();
        const selected =
          variants.find((variant) => variant.variantId === product.variantId) ||
          variants.find((variant) => normalizeHex(variant.colorHex) === normalizeHex(product.colors?.[0]?.code)) ||
          variants[0] ||
          null;

        setActivePreviewVariantId(selected?.id ?? null);
      } catch (error) {
        console.error('Error loading 3D preview variants:', error);
        setPreview3DVariants([]);
        setActivePreviewVariantId(null);
      }
    };

    loadPreview3DVariants();
  }, [product]);

  const getProductImage = (apiProduct: ApiProduct) => {
    return ProductAPI.getPrimaryImageUrl(apiProduct);
  };

  const handleAddAccessoryToCart = async (accessory: ApiProduct) => {
    try {
      await addItem({
        productName: accessory.name,
        productSlug: accessory.slug,
        productId: accessory.id,
        productType: accessory.productType,
        sku: accessory.sku,
        imageUrl: getProductImage(accessory),
        unitPrice: accessory.basePrice,
        itemType: 'ACCESSORY',
        shopId: accessory.shopId,
        shopName: accessory.shop?.shopName,
        variantId: accessory.variantId || accessory.id,
        stockQuantity: accessory.stockQuantity,
      });

      setSnackbar({ open: true, message: `Da them ${accessory.name} vao gio hang!`, severity: 'success' });
    } catch (error) {
      console.error('Error adding accessory to cart:', error);
      setSnackbar({ open: true, message: 'Co loi xay ra khi them phu kien vao gio hang.', severity: 'error' });
    }
  };

  const ACCESSORIES_PER_VIEW = 3;
  const maxAccessoryIndex = Math.max(0, accessories.length - ACCESSORIES_PER_VIEW);
  const visibleAccessories = accessories.slice(
    currentAccessoryIndex,
    currentAccessoryIndex + ACCESSORIES_PER_VIEW
  );
  const hasAccessories = accessories.length > 0;

  const handlePrevAccessory = () => {
    setCurrentAccessoryIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextAccessory = () => {
    setCurrentAccessoryIndex(prev => Math.min(maxAccessoryIndex, prev + 1));
  };

  useEffect(() => {
    setCurrentAccessoryIndex(0);
  }, [product?.id]);

  // Cleanup lens dialog state when leaving the product page
  useEffect(() => {
    return () => {
      // Clear lens dialog state when component unmounts (navigating away)
      localStorage.removeItem('lens_dialog_state');
    };
  }, []);

  const loadMoreReviews = async () => {
    if (!product || isLoadingReviews) return;
    
    try {
      setIsLoadingReviews(true);
      const nextPage = currentReviewPage + 1;
      const response = await ProductAPI.getProductReviews(product.id, { page: nextPage, unitPerPage: 10 });
      
      // Append new reviews to existing ones
      setReviewData(prev => ({
        reviews: [...prev.reviews, ...response.reviews],
        summary: response.summary // Keep the summary updated
      }));
      setCurrentReviewPage(nextPage);
    } catch (error) {
      console.error('Error loading more reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleAddToFavorites = () => {
    // TODO: Implement add to favorites
    console.log('Added to favorites');
  };

  const handleOpenTryOn = () => {
    if (!product?.vrEnabled || !product.frameGroupId) return;
    setTryOnOpen(true);
  };

  const handleOpen3DPreview = () => {
    if (!product?.vrEnabled || !product.frameGroupId) return;
    console.log('[3D Preview] Open clicked with frameGroupId:', product.frameGroupId);
    setPreview3DOpen(true);
  };

  const handleColorClick = async (color: { productId: string; variantId: string }) => {
    if (!color.productId) return;

    if (color.productId === product?.id) {
      return;
    }

    try {
      const targetProduct = await ProductAPI.getProductById(color.productId);
      navigate(`/product/${targetProduct.slug}/${targetProduct.sku || 'default'}`);
    } catch (error) {
      console.error('Error loading selected variant product:', error);
      setSnackbar({
        open: true,
        message: 'Unable to load selected variant. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleAddToCart = async (frameOnly: boolean) => {
    if (frameOnly) {
      if (!product) return;
      try {
        await addItem({
          productName: product.name,
          productSlug: product.slug,
          productId: product.id,
          productType: product.productType || 'FRAME',
          sku: product.sku,
          imageUrl: product.images?.[0],
          unitPrice: product.price,
          itemType: product.productType === 'ACCESSORIES' ? 'ACCESSORY' : 'FRAME',
          shopId: product.shopId,
          shopName: product.shop?.shopName,
          variantId: product.variantId,
          stockQuantity: product.stockQuantity,
        });
        // In edit mode, remove the old cart item after adding the new one
        if (isEditMode && editCartItemId) {
          await removeItem(editCartItemId);
        }
        setSnackbar({ open: true, message: `Đã thêm ${product.name} (chỉ gọng) vào giỏ hàng!`, severity: 'success' });
        if (isEditMode) {
          navigate('/cart');
        }
      } catch (error) {
        console.error('Error adding frame to cart:', error);
        setSnackbar({ open: true, message: 'Có lỗi xảy ra khi thêm vào giỏ hàng. Vui lòng thử lại!', severity: 'error' });
      }
    } else {
      // Open lens selection dialog
      setLensDialogOpen(true);
    }
  };

  const handleLensSelection = async (selection: LensSelection) => {
    if (!product) return;

    try {
      setSelectedLens(selection);

      const frameParams = {
        productName: product.name,
        productSlug: product.slug,
        productId: product.id,
        productType: product.productType || 'FRAME',
        sku: product.sku,
        imageUrl: product.images?.[0],
        unitPrice: product.price,
        itemType: 'FRAME' as const,
        shopId: product.shopId,
        shopName: product.shop?.shopName,
        variantId: product.variantId,
        stockQuantity: product.stockQuantity,
      };

      // Calculate lens-only price (total_price includes framePrice, so subtract it)
      const lensOnlyPrice = selection.total_price - product.price;

      const lensParams = {
        productName: selection.lens_type.name,
        productSlug: product.slug,
        productId: '',
        productType: 'LENS',
        unitPrice: lensOnlyPrice,
        itemType: 'LENS' as const,
        lensSelection: selection,
        shopId: product.shopId,
        lensId: selection.lens_type.id,
        lensTintId: selection.tint?.id,
        lensFeatureIds: selection.features.map(f => f.id),
      };

      await addFrameWithLens(frameParams, lensParams);

      // In edit mode, remove the old cart item after adding the new one
      if (isEditMode && editCartItemId) {
        await removeItem(editCartItemId);
      }

      const totalPrice = product.price + lensOnlyPrice;
      setSnackbar({
        open: true,
        message: `Đã thêm ${product.name} + ${selection.lens_type.name} vào giỏ hàng! Tổng: ${formatCurrency(totalPrice)}`,
        severity: 'success',
      });

      if (isEditMode) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error adding to cart with lens:', error);
      setSnackbar({ open: true, message: 'Có lỗi xảy ra khi thêm vào giỏ hàng. Vui lòng thử lại!', severity: 'error' });
    }
  };

  if (!product || isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="product-detail-page">
      <nav className="breadcrumb">
        <a href="/">
          <Home fontSize="small" />
        </a>
        <span> › </span>
        <span>{product.name} - SKU: {sku}</span>
      </nav>

      <div className="product-content">
        <div className="product-left-column">
          <div className="product-preview-column">
            <ImageGallery 
              images={product.images} 
              productName={product.name}
              onTryOn={handleOpenTryOn}
              showTryOn={Boolean(product.vrEnabled && product.frameGroupId)}
              showPreview3D={Boolean(product.vrEnabled && product.frameGroupId)}
              onPreview3D={handleOpen3DPreview}
            />
            {product.shop && (
              <div className="product-shop-extended">
                <ShopInfo shop={product.shop} />
              </div>
            )}
          </div>

          {hasAccessories && (
            <div className="product-details-column">
              <ProductDetails product={product} reviewData={reviewData} isLoadingReviews={isLoadingReviews} onLoadMoreReviews={loadMoreReviews} />
            </div>
          )}
        </div>

        <div className="product-right-column">
          <div className="product-info-column">
            <ProductInfo
              product={product}
              onColorSelect={handleColorClick}
              activeVariantId={product.variantId}
              onAddToFavorites={handleAddToFavorites}
              onAddToCart={handleAddToCart}
              isEditMode={isEditMode}
            />
          </div>

          {hasAccessories && (
            <aside className="product-accessories-column">
              <div className="accessories-sidebar">
                <div className="accessories-sidebar-header">
                  <h3>Accessories</h3>
                  {accessories.length > ACCESSORIES_PER_VIEW && (
                    <div className="accessories-nav">
                      <button
                        type="button"
                        className="accessories-nav-btn"
                        onClick={handlePrevAccessory}
                        disabled={currentAccessoryIndex === 0}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="accessories-nav-btn"
                        onClick={handleNextAccessory}
                        disabled={currentAccessoryIndex >= maxAccessoryIndex}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>

                <div className="accessories-sidebar-list">
                  {visibleAccessories.map((accessory) => (
                    <div key={accessory.id} className="accessories-sidebar-item">
                      <img src={getProductImage(accessory)} alt={accessory.name} />
                      <div className="accessories-sidebar-item-info">
                        <p className="accessory-price">{formatCurrency(accessory.basePrice)}</p>
                        <h4>{accessory.name}</h4>
                        <p className="accessory-sku">SKU: {accessory.sku}</p>
                        <button
                          className="add-to-cart-btn"
                          onClick={() => handleAddAccessoryToCart(accessory)}
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {!hasAccessories && (
        <div className="product-details-fullwidth">
          <ProductDetails product={product} reviewData={reviewData} isLoadingReviews={isLoadingReviews} onLoadMoreReviews={loadMoreReviews} />
        </div>
      )}

      <LensSelectionDialog
        open={lensDialogOpen}
        onClose={() => {
          setLensDialogOpen(false);
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('lens');
          navigate({ search: newSearchParams.toString() }, { replace: true });
        }}
        onConfirm={handleLensSelection}
        productName={product.name}
        productId={product.id}
        frameVariantId={product.variantId}
        framePrice={product.price}
        initialSelection={editLensSelection}
      />

      {product.vrEnabled && product.frameGroupId && (
        <GlassesTryOnPopup
          frameGroupId={product.frameGroupId}
          open={tryOnOpen}
          onClose={() => setTryOnOpen(false)}
          onAddToCart={(lensId, textureId) => {
            setSnackbar({
              open: true,
              message: `Try-on selected lens ${lensId ?? 'N/A'} with texture ${textureId ?? 'N/A'}`,
              severity: 'success',
            });
          }}
        />
      )}

      {product.vrEnabled && product.frameGroupId && (
        <Product3DPreviewDialog
          open={preview3DOpen}
          onClose={() => setPreview3DOpen(false)}
          frameGroupId={product.frameGroupId}
          variants={preview3DVariants}
          activeVariantId={activePreviewVariantId}
          onChangeVariant={setActivePreviewVariantId}
        />
      )}

      <RecommendedProducts products={recommendedProducts} />

      <div className="newsletter-section">
        <h2>Get 10% off your first order</h2>
        <p>Sign up now for exclusive news and savings</p>
        <form className="newsletter-form">
          <input type="email" placeholder="Email Address" />
          <button type="submit">Sign Up</button>
        </form>
        <p className="newsletter-terms">
          10% off only applies to full price items. Zenni reserves the right to modify or cancel at any time.
        </p>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', bgcolor: snackbar.severity === 'success' ? '#2e3a2e' : undefined, color: snackbar.severity === 'success' ? '#fff' : undefined }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProductDetailPage;
