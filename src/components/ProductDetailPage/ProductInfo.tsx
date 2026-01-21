import React, { useState } from 'react';
import { Star, StarBorder, Straighten, Favorite, Facebook, Pinterest, Twitter, Close } from '@mui/icons-material';
import type { Product } from '../../types/product';
import './ProductInfo.css';

interface ProductInfoProps {
  product: Product;
  onAddToFavorites: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product, onAddToFavorites }) => {
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showRestrictions, setShowRestrictions] = useState(false);

  return (
    <div className="product-info">
      <h1 className="product-title">{product.name}</h1>
      <p className="product-sku">{product.sku}</p>
      
      <div className="product-reviews">
        <span className="reviews-label">REVIEWS ({product.reviewCount})</span>
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            i < Math.floor(product.rating) ? 
            <Star key={i} className="star filled" /> : 
            <StarBorder key={i} className="star" />
          ))}
        </div>
      </div>

      <div className="size-selector">
        <button className="size-btn active">Medium</button>
        <button className="size-chart-link" onClick={() => setShowSizeChart(true)}>
          <Straighten fontSize="small" /> Size Chart
        </button>
      </div>

      <div className="price-section">
        <h2 className="price">${product.price.toFixed(2)}</h2>
        <div className="price-includes">
          <p className="includes-title">GLASSIFY WOW PRICE INCLUDES:</p>
          <ul className="includes-list">
            <li>✓ High-quality frame</li>
            <li>✓ Basic prescription lenses*</li>
            <li>✓ Anti-scratch coating</li>
            <li>✓ UV protection</li>
          </ul>
          <p className="includes-note">*multifocal or readers lenses start at additional cost</p>
        </div>
      </div>

      {product.deliveryDate && (
        <div className="delivery-info">
          <p className="delivery-date">Get it as early as {product.deliveryDate}</p>
          <p className="delivery-details">Rush Delivery starts at $19</p>
          <button className="restrictions-link" onClick={() => setShowRestrictions(true)}>
            See restrictions
          </button>
        </div>
      )}

      <div className="payment-options">
        <p>Pay over time with PayPal, Affirm or Afterpay. <a href="#">Learn More</a></p>
      </div>

      <button className="select-lenses-btn">Select Lenses</button>
      
      <button className="add-to-favorites-btn" onClick={onAddToFavorites}>
        <Favorite /> Add to favorites
      </button>

      <div className="insurance-info">
        <p>Use your insurance or FSA/HSA benefits. <a href="#">Learn more</a></p>
      </div>

      <div className="share-section">
        <p className="share-label">Share</p>
        <div className="share-buttons">
          <button className="share-btn">
            <Facebook />
          </button>
          <button className="share-btn">
            <Pinterest />
          </button>
          <button className="share-btn">
            <Twitter />
          </button>
        </div>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div className="modal-overlay" onClick={() => setShowSizeChart(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Frame Size Chart</h2>
              <button className="close-btn" onClick={() => setShowSizeChart(false)}>
                <Close />
              </button>
            </div>
            <div className="modal-body">
              <div className="size-chart-info">
                <p>
                  Frame width is the total width of the frame front, measured from the outer edge of one lens to the outer edge of the other lens.
                </p>
              </div>
              <table className="size-chart-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Frame Width (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Extra Small</strong></td>
                    <td>110 - 118 mm</td>
                  </tr>
                  <tr>
                    <td><strong>Small</strong></td>
                    <td>119 - 125 mm</td>
                  </tr>
                  <tr className="highlight">
                    <td><strong>Medium</strong></td>
                    <td>126 - 132 mm</td>
                  </tr>
                  <tr>
                    <td><strong>Large</strong></td>
                    <td>133 - 140 mm</td>
                  </tr>
                  <tr>
                    <td><strong>Extra Large</strong></td>
                    <td>141+ mm</td>
                  </tr>
                </tbody>
              </table>
              <div className="size-chart-note">
                <p>
                  <strong>Your frame:</strong> {product.frameMeasurements.frameWidth.mm} mm ({product.frameDetails.size})
                </p>
                <p className="help-text">
                  Not sure about your size? Measure a pair of glasses you already own that fit well, or visit our virtual try-on to find your perfect fit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restrictions Modal */}
      {showRestrictions && (
        <div className="modal-overlay" onClick={() => setShowRestrictions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rush Delivery Restrictions</h2>
              <button className="close-btn" onClick={() => setShowRestrictions(false)}>
                <Close />
              </button>
            </div>
            <div className="modal-body">
              <div className="restrictions-content">
                <h3>Rush Delivery</h3>
                <p>
                  Rush Delivery is available for Single Vision, Progressive, and Non-Prescription lenses 
                  in the US and Canada.
                </p>
                
                <div className="restrictions-note">
                  <h4>Important Notes:</h4>
                  <ul>
                    <li>
                      Delivery estimates are based on <strong>Single Vision lenses</strong>
                    </li>
                    <li>
                      Please add <strong>two days</strong> for Progressive lenses
                    </li>
                    <li>
                      Higher prescriptions may require additional processing time
                    </li>
                  </ul>
                </div>

                <div className="restrictions-disclaimer">
                  <p>
                    While we aim for accurate delivery times, final dates depend on our shipping partners. 
                    For any issues or questions, please contact our customer service team.
                  </p>
                </div>

                <div className="restrictions-pricing">
                  <h4>Rush Delivery Options:</h4>
                  <table className="delivery-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Estimated Delivery</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Standard Rush</td>
                        <td>5-7 business days</td>
                        <td>$19.00</td>
                      </tr>
                      <tr>
                        <td>Express Rush</td>
                        <td>3-5 business days</td>
                        <td>$29.00</td>
                      </tr>
                      <tr>
                        <td>Premium Rush</td>
                        <td>1-2 business days</td>
                        <td>$49.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="contact-info">
                  <p>
                    <strong>Need help?</strong> Contact our customer service team at{' '}
                    <a href="mailto:support@glassify.com">support@glassify.com</a> or call{' '}
                    <a href="tel:1-800-GLASSIFY">1-800-GLASSIFY</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
