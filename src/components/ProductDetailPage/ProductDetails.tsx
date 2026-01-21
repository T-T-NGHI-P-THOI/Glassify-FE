import React, { useState } from 'react';
import { Info, Visibility, Star, StarBorder, ThumbUp } from '@mui/icons-material';
import type { Product } from '../../types/product';
import './ProductDetails.css';

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'reviews'>('details');

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
                  const percentage = stars === 5 ? 65 : stars === 4 ? 25 : stars === 3 ? 8 : stars === 2 ? 2 : 0;
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

          <div className="reviews-list">
            {(product.reviews || [
              {
                id: '1',
                author: 'Sarah M.',
                rating: 5,
                date: 'January 15, 2025',
                title: 'Perfect fit and great quality!',
                comment: 'These glasses exceeded my expectations. The frame is lightweight yet sturdy, and they fit perfectly. The anti-scratch coating works great and the UV protection gives me peace of mind. Highly recommend!',
                verified: true,
                helpful: 24
              },
              {
                id: '2',
                author: 'Michael R.',
                rating: 5,
                date: 'January 10, 2025',
                title: 'Excellent value for money',
                comment: 'I was skeptical about ordering glasses online, but these are fantastic! The quality is comparable to much more expensive brands. The delivery was fast and they came in a nice protective case.',
                verified: true,
                helpful: 18
              },
              {
                id: '3',
                author: 'Emily T.',
                rating: 4,
                date: 'January 8, 2025',
                title: 'Great glasses, minor adjustment needed',
                comment: 'Really happy with these glasses overall. The style is exactly what I wanted and they\'re very comfortable. Had to adjust the nose pads slightly but that\'s normal. Would definitely buy again.',
                verified: true,
                helpful: 12
              },
              {
                id: '4',
                author: 'David L.',
                rating: 5,
                date: 'January 5, 2025',
                title: 'Stylish and comfortable',
                comment: 'Love the rectangle shape - it suits my face perfectly. The black color is sleek and professional. I\'ve been wearing them for two weeks now and they\'re still as comfortable as day one.',
                verified: true,
                helpful: 9
              },
              {
                id: '5',
                author: 'Jessica K.',
                rating: 5,
                date: 'January 2, 2025',
                title: 'Best online glasses purchase!',
                comment: 'This is my third pair from Glassify and they never disappoint. The quality is consistent and the price can\'t be beat. The lightweight design means I can wear them all day without discomfort.',
                verified: true,
                helpful: 15
              }
            ]).map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name">{review.author}</span>
                    {review.verified && <span className="verified-badge">✓ Verified Purchase</span>}
                  </div>
                  <span className="review-date">{review.date}</span>
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
                <div className="review-footer">
                  <button className="helpful-btn">
                    <ThumbUp fontSize="small" /> Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="load-more-btn">Load More Reviews</button>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
