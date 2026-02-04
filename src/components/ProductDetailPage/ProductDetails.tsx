import React, { useState } from 'react';
import { Info, Visibility, Star, StarBorder } from '@mui/icons-material';
import type { Product } from '../../types/product';
import type { ReviewResponse } from '../../api/product-api';
import './ProductDetails.css';

interface ProductDetailsProps {
  product: Product;
  reviewData?: ReviewResponse;
  isLoadingReviews?: boolean;
  onLoadMoreReviews?: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, reviewData, isLoadingReviews = false, onLoadMoreReviews }) => {
  const reviews = reviewData?.reviews || [];
  const summary = reviewData?.summary || { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, total: 0 };
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'reviews'>('details');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const openGallery = (images: string[], index: number) => {
    setGalleryImages(images);
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

  const closeGallery = () => {
    setGalleryOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="product-details-section">
      <div className="details-tabs">
        <button
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`tab ${activeTab === 'description' ? 'active' : ''}`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="details-content">
          <div className="details-grid">
            <div className="details-column">
              <h3>Frame Measurements <Info className="info-icon" /></h3>
              <div className="measurement-item">
                <Visibility className="icon" />
                <span><strong>Frame Width:</strong> {product.frameMeasurements.frameWidth.mm} mm / {product.frameMeasurements.frameWidth.inches} in</span>
              </div>
              <div className="measurement-item">
                <Visibility className="icon" />
                <span><strong>Bridge:</strong> {product.frameMeasurements.bridge.mm} mm / {product.frameMeasurements.bridge.inches} in</span>
              </div>
              <div className="measurement-item">
                <Visibility className="icon" />
                <span><strong>Lens Width:</strong> {product.frameMeasurements.lensWidth.mm} mm / {product.frameMeasurements.lensWidth.inches} in</span>
              </div>
              <div className="measurement-item">
                <Visibility className="icon" />
                <span><strong>Lens Height:</strong> {product.frameMeasurements.lensHeight.mm} mm / {product.frameMeasurements.lensHeight.inches} in</span>
              </div>
              <div className="measurement-item">
                <Visibility className="icon" />
                <span><strong>Temple Length:</strong> {product.frameMeasurements.templeLength.mm} mm / {product.frameMeasurements.templeLength.inches} in</span>
              </div>
            </div>

            <div className="details-column">
              <h3>Frame Details</h3>
              <p><strong>Size:</strong> {product.frameDetails.size} ({product.frameDetails.sizeRange})</p>
              <p><strong>Material:</strong> <a href="#">{product.frameDetails.material}</a></p>
              <p><strong>Weight:</strong> <a href="#">{product.frameDetails.weight}</a> ({product.frameDetails.weightGrams} grams / 0.5 ounces)</p>
              <p><strong>Rim:</strong> <a href="#">{product.frameDetails.rim}</a></p>
              <p><strong>Shape:</strong> <a href="#">{product.frameDetails.shape}</a></p>
              <p><strong>Feature:</strong> {product.features.map((feature, i) => (
                <span key={i}><a href="#">{feature}</a>{i < product.features.length - 1 ? ', ' : ''}</span>
              ))}</p>
            </div>

            <div className="details-column">
              <h3>Prescription Details <Info className="info-icon" /></h3>
              <p><strong>PD Range:</strong> {product.prescriptionDetails.pdRange}</p>
              {product.prescriptionDetails.pdRangeNote && (
                <p className="note">{product.prescriptionDetails.pdRangeNote}</p>
              )}
              <p><strong>Prescription Range:</strong> {product.prescriptionDetails.prescriptionRange}</p>
              <p><strong>Available as <a href="#">Progressive</a> / <a href="#">Bifocal</a>:</strong> {product.prescriptionDetails.progressive && product.prescriptionDetails.bifocal ? 'Yes' : 'No'}</p>
              <p><strong>Available as <a href="#">Readers</a>:</strong> {product.prescriptionDetails.readers ? 'No' : 'Yes'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'description' && (
        <div className="description-content">
          <div className="description-text">
            {product.description || (
              <>
                <p>
                  Experience sophistication with our {product.name}. These stylish {product.shape.toLowerCase()} frames 
                  are crafted from premium {product.frameDetails.material}, offering both durability and comfort for all-day wear.
                </p>
                <p>
                  The {product.frameDetails.rim.toLowerCase()} design provides a modern aesthetic while maintaining 
                  a lightweight feel at just {product.frameDetails.weightGrams} grams. Perfect for both professional 
                  and casual settings, these frames feature adjustable nose pads for a customized fit.
                </p>
                <h3>Key Features:</h3>
                <ul>
                  <li>Premium {product.frameDetails.material} construction</li>
                  <li>{product.frameDetails.weight} design for all-day comfort</li>
                  <li>{product.frameDetails.rim} frame for enhanced durability</li>
                  <li>Adjustable nose pads for perfect fit</li>
                  <li>Compatible with prescription lenses</li>
                  <li>UV protection included</li>
                </ul>
                <p>
                  Available in multiple colors to match your personal style. Each pair comes with a protective case 
                  and cleaning cloth. Our frames meet international quality standards and come with a satisfaction guarantee.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="reviews-content">
          <div className="reviews-summary">
            <div className="rating-overview">
              <div className="average-rating">
                <span className="rating-number">{product.rating}</span>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    i < Math.floor(product.rating) ? 
                    <Star key={i} className="star filled" /> : 
                    <StarBorder key={i} className="star" />
                  ))}
                </div>
                <span className="total-reviews">{product.reviewCount} reviews</span>
              </div>
              <div className="rating-bars">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = summary.counts[stars as keyof typeof summary.counts] || 0;
                  const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <div key={stars} className="rating-bar-item">
                      <span className="stars-label">{stars} <Star className="small-star" /></span>
                      <div className="bar-container">
                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
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
              {Array.isArray(reviews) && reviews.map(review => {
                const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
                
                return (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <span className="reviewer-name">User {review.userId.substring(0, 8)}</span>
                        {review.isVerifiedPurchase && <span className="verified-badge">✓ Verified Purchase</span>}
                      </div>
                      <span className="review-date">{reviewDate}</span>
                    </div>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        i < review.rating ? 
                        <Star key={i} className="star filled" /> : 
                        <StarBorder key={i} className="star" />
                      ))}
                    </div>
                    <h4 className="review-title">{review.title}</h4>
                    <p className="review-comment">{review.comment}</p>
                    
                    {review.imageUrls && review.imageUrls.length > 0 && review.imageUrls[0] !== "string" && (
                      <div className="review-images">
                        {review.imageUrls.map((imageUrl, index) => (
                          <img 
                            key={index} 
                            src={imageUrl} 
                            alt={`Review ${index + 1}`} 
                            className="review-image-thumbnail"
                            onClick={() => openGallery(review.imageUrls, index)}
                          />
                        ))}
                      </div>
                    )}
                    
                    {review.shopResponse && (
                      <div className="shop-response">
                        <strong>Shop Response:</strong> {review.shopResponse}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {Array.isArray(reviews) && reviews.length > 0 && reviews.length < summary.total && (
            <button 
              className="load-more-btn" 
              onClick={onLoadMoreReviews}
              disabled={isLoadingReviews}
            >
              {isLoadingReviews ? 'Loading...' : 'Load More Reviews'}
            </button>
          )}
        </div>
      )}

      {/* Image Gallery Modal */}
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
