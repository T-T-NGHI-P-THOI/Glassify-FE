import React, { useEffect, useMemo, useState } from 'react';
import { Info, Visibility, Star, StarBorder } from '@mui/icons-material';
import type { Product } from '../../types/product';
import type { ReviewResponse } from '../../api/product-api';
import type { ProductWithFrameInfoData } from '../../api/product-api';
import ProductAPI from '../../api/product-api';
import { lensApi, type LensDetailResponse } from '../../api/lens-api';
import './ProductDetails.css';

interface ProductDetailsProps {
  product: Product;
  reviewData?: ReviewResponse;
  isLoadingReviews?: boolean;
  onLoadMoreReviews?: () => void;
  productWithFrameInfo?: ProductWithFrameInfoData | null;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, reviewData, isLoadingReviews = false, onLoadMoreReviews, productWithFrameInfo }) => {
  const reviews = reviewData?.reviews || [];
  const rawSummary = reviewData?.summary;
  const summary = {
    counts: rawSummary?.counts ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    total: rawSummary?.total ?? 0,
    avgRating: rawSummary?.avgRating ?? 0,
  };
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'reviews'>('details');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeLensTintIndex, setActiveLensTintIndex] = useState(0);
  const [activeLensFeatureIndex, setActiveLensFeatureIndex] = useState(0);
  const [activeLensUsageIndex, setActiveLensUsageIndex] = useState(0);
  const [activeLensProgressiveIndex, setActiveLensProgressiveIndex] = useState(0);
  const [lensDetail, setLensDetail] = useState<LensDetailResponse | null>(null);
  const [accessoryDetail, setAccessoryDetail] = useState<{
    name?: string;
    description?: string;
    material?: string;
    dimensions?: string;
    weight?: string;
    weightGrams?: number;
    compatibleWith?: string[];
  } | null>(null);

  // For FRAME: store frameGroup for description
  const [frameGroup, setFrameGroup] = useState<any>(productWithFrameInfo?.frameGroup ?? null);

  const normalizedProductType = useMemo(() => (product.productType || '').toUpperCase(), [product.productType]);

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      setLensDetail(null);
      setAccessoryDetail(null);
      if (productWithFrameInfo && normalizedProductType === 'FRAME') {
        setFrameGroup(productWithFrameInfo.frameGroup ?? null);
        return;
      } else {
        setFrameGroup(null);
      }

      const lookupId = product.variantId || product.id;
      if (!lookupId) return;

      try {
        if (normalizedProductType === 'LENSES' || normalizedProductType === 'LENS') {
          const detail = await lensApi.getById(lookupId) as LensDetailResponse;
          if (!cancelled) setLensDetail(detail);
          return;
        }

        // ACCESSORIES
        const detail = await ProductAPI.getProductById(lookupId);
        if (!cancelled) {
          setAccessoryDetail({
            name: detail.name,
            description: detail.description,
            material: detail.metaTitle || detail.categoryName || undefined,
            dimensions: detail.metaDescription || undefined,
            weight: detail.warrantyMonths ? `${detail.warrantyMonths} months warranty` : undefined,
            weightGrams: undefined,
            compatibleWith: detail.brandId ? [detail.brandId] : [],
          });
        }
      } catch (error) {
        console.error('Failed to load product detail data:', error);
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [normalizedProductType, product.id, product.variantId, productWithFrameInfo]);

  useEffect(() => {
    setActiveLensTintIndex(0);
    setActiveLensFeatureIndex(0);
    setActiveLensUsageIndex(0);
    setActiveLensProgressiveIndex(0);
  }, [lensDetail]);

  const lensTintOptions = lensDetail?.lens.tintOptions ?? [];
  const lensFeatureMappings = lensDetail?.lens.featureMappings ?? [];
  const lensUsageRules = lensDetail?.lens.usageRules ?? [];
  const lensProgressiveOptions = lensDetail?.lens.progressiveOptions ?? [];

  const cycleIndex = (currentIndex: number, direction: 1 | -1, totalItems: number) => {
    if (totalItems <= 0) return 0;
    return (currentIndex + direction + totalItems) % totalItems;
  };

  const openGallery = (images: string[], index: number) => {
    setGalleryImages(images);
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

    const closeGallery = () => setGalleryOpen(false);
    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

    const formatMeasurement = (mm: number, inches: number): string => {
        if (!mm || mm <= 0) return 'N/A';
        return `${mm} mm / ${inches} in`;
    };

    const safeValue = (value?: string | number | null): string => {
        if (value === undefined || value === null || value === '') return 'N/A';
        return String(value);
    };

    return (
        <div className="product-details-section">
            <div className="details-tabs">
                <button className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
                    Details
                </button>
                <button className={`tab ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>
                    Description
                </button>
                <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                    Reviews
                </button>
            </div>

            {activeTab === 'details' && (
                <div className="details-content">
                    {normalizedProductType === 'FRAME' && (
                        <div className="details-grid">
                            <div className="details-column">
                                <h3>Frame Measurements <Info className="info-icon" /></h3>
                                <div className="measurement-item"><Visibility className="icon" /><span><strong>Frame Width:</strong> {formatMeasurement(product.frameMeasurements.frameWidth.mm, product.frameMeasurements.frameWidth.inches)}</span></div>
                                <div className="measurement-item"><Visibility className="icon" /><span><strong>Bridge:</strong> {formatMeasurement(product.frameMeasurements.bridge.mm, product.frameMeasurements.bridge.inches)}</span></div>
                                <div className="measurement-item"><Visibility className="icon" /><span><strong>Lens Width:</strong> {formatMeasurement(product.frameMeasurements.lensWidth.mm, product.frameMeasurements.lensWidth.inches)}</span></div>
                                <div className="measurement-item"><Visibility className="icon" /><span><strong>Lens Height:</strong> {formatMeasurement(product.frameMeasurements.lensHeight.mm, product.frameMeasurements.lensHeight.inches)}</span></div>
                                <div className="measurement-item"><Visibility className="icon" /><span><strong>Temple Length:</strong> {formatMeasurement(product.frameMeasurements.templeLength.mm, product.frameMeasurements.templeLength.inches)}</span></div>
                            </div>

                            <div className="details-column">
                                <h3>Frame Details</h3>
                                <p><strong>Size:</strong> {safeValue(product.frameDetails.size)} ({safeValue(product.frameDetails.sizeRange)})</p>
                                <p><strong>Material:</strong> {safeValue(product.frameDetails.material)}</p>
                                <p><strong>Weight:</strong> {product.frameDetails.weightGrams > 0 ? `${product.frameDetails.weightGrams} grams` : safeValue(product.frameDetails.weight)}</p>
                                <p><strong>Rim:</strong> {safeValue(product.frameDetails.rim)}</p>
                                <p><strong>Shape:</strong> {safeValue(product.frameDetails.shape)}</p>
                                <p><strong>Feature:</strong> {product.features.length > 0 ? product.features.join(', ') : 'N/A'}</p>
                            </div>

                            <div className="details-column">
                                <h3>Prescription Details <Info className="info-icon" /></h3>
                                <p><strong>PD Range:</strong> {product.prescriptionDetails.pdRange}</p>
                                {product.prescriptionDetails.pdRangeNote && <p className="note">{product.prescriptionDetails.pdRangeNote}</p>}
                                <p><strong>Prescription Range:</strong> {product.prescriptionDetails.prescriptionRange}</p>
                                <p><strong>Available as <a href="#">Progressive</a> / <a href="#">Bifocal</a>:</strong> {product.prescriptionDetails.progressive && product.prescriptionDetails.bifocal ? 'Yes' : 'No'}</p>
                                <p><strong>Available as <a href="#">Readers</a>:</strong> {product.prescriptionDetails.readers ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    )}

                    {(normalizedProductType === 'LENSES' || normalizedProductType === 'LENS') && (
                        <div className="details-grid">
                            <div className="details-column">
                                <h3>Lens Details</h3>
                                <p><strong>Category:</strong> {safeValue(lensDetail?.lens.category)}</p>
                                <p><strong>Progressive Type:</strong> {safeValue(lensDetail?.lens.progressiveType)}</p>
                            </div>

                            <div className="details-column">
                                <h3>Lens Catalog</h3>
                                <div className="lens-options-row">
                                    {lensUsageRules.length > 0 && (
                                        <div className="detail-option-switcher">
                                            <div className="detail-option-switcher-header">
                                                <strong>Usage Rule {activeLensUsageIndex + 1} of {lensUsageRules.length}</strong>
                                                {lensUsageRules.length > 1 && (
                                                    <div className="detail-option-switcher-actions">
                                                        <button type="button" onClick={() => setActiveLensUsageIndex((prev) => cycleIndex(prev, -1, lensUsageRules.length))}>Prev</button>
                                                        <button type="button" onClick={() => setActiveLensUsageIndex((prev) => cycleIndex(prev, 1, lensUsageRules.length))}>Next</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {lensTintOptions.length > 0 && (
                                        <div className="detail-option-switcher">
                                            <div className="detail-option-switcher-header">
                                                <strong>Tint Option {activeLensTintIndex + 1} of {lensTintOptions.length}</strong>
                                                {lensTintOptions.length > 1 && (
                                                    <div className="detail-option-switcher-actions">
                                                        <button type="button" onClick={() => setActiveLensTintIndex((prev) => cycleIndex(prev, -1, lensTintOptions.length))}>Prev</button>
                                                        <button type="button" onClick={() => setActiveLensTintIndex((prev) => cycleIndex(prev, 1, lensTintOptions.length))}>Next</button>
                                                    </div>
                                                )}
                                            </div>
                                            <p><strong>Name:</strong> {safeValue(lensTintOptions[activeLensTintIndex]?.tintName ?? lensTintOptions[activeLensTintIndex]?.tintCode)}</p>
                                            <p><strong>Behavior:</strong> {safeValue(lensTintOptions[activeLensTintIndex]?.tintBehavior)}</p>
                                            <p><strong>Extra Price:</strong> {safeValue(lensTintOptions[activeLensTintIndex]?.extraPrice)}</p>
                                            <p><strong>Default:</strong> {lensTintOptions[activeLensTintIndex]?.isDefault ? 'Yes' : 'No'}</p>
                                        </div>
                                    )}
                                    {lensFeatureMappings.length > 0 && (
                                        <div className="detail-option-switcher">
                                            <div className="detail-option-switcher-header">
                                                <strong>Feature Option {activeLensFeatureIndex + 1} of {lensFeatureMappings.length}</strong>
                                                {lensFeatureMappings.length > 1 && (
                                                    <div className="detail-option-switcher-actions">
                                                        <button type="button" onClick={() => setActiveLensFeatureIndex((prev) => cycleIndex(prev, -1, lensFeatureMappings.length))}>Prev</button>
                                                        <button type="button" onClick={() => setActiveLensFeatureIndex((prev) => cycleIndex(prev, 1, lensFeatureMappings.length))}>Next</button>
                                                    </div>
                                                )}
                                            </div>
                                            <p><strong>SKU:</strong> {safeValue(lensFeatureMappings[activeLensFeatureIndex]?.sku)}</p>
                                            <p><strong>Name:</strong> {safeValue(lensFeatureMappings[activeLensFeatureIndex]?.name)}</p>
                                            <p><strong>Description:</strong> {safeValue(lensFeatureMappings[activeLensFeatureIndex]?.description)}</p>
                                            <p><strong>Extra Price:</strong> {safeValue(lensFeatureMappings[activeLensFeatureIndex]?.extraPrice)}</p>
                                            <p><strong>Default:</strong> {lensFeatureMappings[activeLensFeatureIndex]?.isDefault ? 'Yes' : 'No'}</p>
                                        </div>
                                    )}
                                    {lensProgressiveOptions.length > 0 && (
                                        <div className="detail-option-switcher">
                                            <div className="detail-option-switcher-header">
                                                <strong>Progressive Option {activeLensProgressiveIndex + 1} of {lensProgressiveOptions.length}</strong>
                                                {lensProgressiveOptions.length > 1 && (
                                                    <div className="detail-option-switcher-actions">
                                                        <button type="button" onClick={() => setActiveLensProgressiveIndex((prev) => cycleIndex(prev, -1, lensProgressiveOptions.length))}>Prev</button>
                                                        <button type="button" onClick={() => setActiveLensProgressiveIndex((prev) => cycleIndex(prev, 1, lensProgressiveOptions.length))}>Next</button>
                                                    </div>
                                                )}
                                            </div>
                                            <p><strong>Name:</strong> {safeValue(lensProgressiveOptions[activeLensProgressiveIndex]?.name)}</p>
                                            <p><strong>Description:</strong> {safeValue(lensProgressiveOptions[activeLensProgressiveIndex]?.description)}</p>
                                            <p><strong>Type:</strong> {safeValue(lensProgressiveOptions[activeLensProgressiveIndex]?.progressiveType)}</p>
                                            <p><strong>Extra Price:</strong> {safeValue(lensProgressiveOptions[activeLensProgressiveIndex]?.extraPrice)}</p>
                                            <p><strong>Recommended:</strong> {lensProgressiveOptions[activeLensProgressiveIndex]?.isRecommended ? 'Yes' : 'No'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {normalizedProductType === 'ACCESSORIES' && (
                        <div className="details-grid">
                            <div className="details-column">
                                <h3>Accessory Details</h3>
                                <p><strong>Name:</strong> {safeValue(accessoryDetail?.name ?? product.name)}</p>
                                <p><strong>Description:</strong> {safeValue(accessoryDetail?.description ?? product.description)}</p>
                                <p><strong>Material:</strong> {safeValue(accessoryDetail?.material)}</p>
                                <p><strong>Dimensions:</strong> {safeValue(accessoryDetail?.dimensions)}</p>
                                <p><strong>Compatible With:</strong> {accessoryDetail?.compatibleWith && accessoryDetail.compatibleWith.length > 0 ? accessoryDetail.compatibleWith.join(', ') : 'N/A'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

      {activeTab === 'description' && (
        <div className="description-content">
          <div className="description-text">
            {normalizedProductType === 'FRAME'
              ? (frameGroup?.description || product.description
                ? <p>{frameGroup?.description || product.description}</p>
                : <p>Description is currently unavailable for this product.</p>)
              : (product.description
                ? <p>{product.description}</p>
                : <p>Description is currently unavailable for this product.</p>)}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="reviews-content">
          <div className="reviews-summary">
            <div className="rating-overview">
              <div className="average-rating">
                <span className="rating-number">{summary.total > 0 ? summary.avgRating.toFixed(1) : '—'}</span>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (i < Math.floor(product.rating) ? <Star key={i} className="star filled" /> : <StarBorder key={i} className="star" />))}
                  {[...Array(5)].map((_, i) => (
                    i < Math.floor(summary.avgRating) ?
                    <Star key={i} className="star filled" /> :
                    <StarBorder key={i} className="star" />
                  ))}
                </div>
                <span className="total-reviews">{summary.total} reviews</span>
              </div>
              <div className="rating-bars">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = summary.counts[stars as keyof typeof summary.counts] || 0;
                  const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <div key={stars} className="rating-bar-item">
                      <span className="stars-label">{stars} <Star className="small-star" /></span>
                      <div className="bar-container"><div className="bar-fill" style={{ width: `${percentage}%` }} /></div>
                      <span className="percentage">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {isLoadingReviews ? (
            <div className="reviews-loading">Loading reviews...</div>
          ) : !reviews || reviews.length === 0 ? (
            <div className="no-reviews">No reviews yet. Be the first to review this product!</div>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => {
                const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                return (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <span className="reviewer-name">{review.fullName || review.username || 'Anonymous'}</span>
                        {review.isVerifiedPurchase && <span className="verified-badge">✓ Verified Purchase</span>}
                      </div>
                      <span className="review-date">{reviewDate}</span>
                    </div>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (i < review.rating ? <Star key={i} className="star filled" /> : <StarBorder key={i} className="star" />))}
                    </div>
                    <h4 className="review-title">{review.title}</h4>
                    <p className="review-comment">{review.comment}</p>
                    {review.imageUrls && review.imageUrls.length > 0 && review.imageUrls[0] !== 'string' && (
                      <div className="review-images">
                        {review.imageUrls.map((imageUrl, index) => (
                          <img key={index} src={imageUrl} alt={`Review ${index + 1}`} className="review-image-thumbnail" onClick={() => openGallery(review.imageUrls, index)} />
                        ))}
                      </div>
                    )}
                    {review.shopResponse && <div className="shop-response"><strong>Shop Response:</strong> {review.shopResponse}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {Array.isArray(reviews) && reviews.length > 0 && reviews.length < summary.total && (
            <button className="load-more-btn" onClick={onLoadMoreReviews} disabled={isLoadingReviews}>
              {isLoadingReviews ? 'Loading...' : 'Load More Reviews'}
            </button>
          )}
        </div>
      )}

      {galleryOpen && (
        <div className="gallery-modal" onClick={closeGallery}>
          <button className="gallery-close" onClick={closeGallery}>&times;</button>
          <button className="gallery-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>&lt;</button>
          <div className="gallery-content" onClick={(e) => e.stopPropagation()}>
            <img src={galleryImages[currentImageIndex]} alt="Review" className="gallery-image" />
            <div className="gallery-counter">{currentImageIndex + 1} / {galleryImages.length}</div>
          </div>
          <button className="gallery-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>&gt;</button>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
