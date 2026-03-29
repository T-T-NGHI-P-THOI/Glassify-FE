import React, { useState } from 'react';
import { Star, StarBorder, Straighten, Favorite, Facebook, Pinterest, Twitter, Close, ShoppingCart } from '@mui/icons-material';
import type { Product, ProductColor } from '../../types/product';
import { formatCurrency } from '@/utils/formatCurrency';
import './ProductInfo.css';

interface ProductInfoProps {
  product: Product;
  onColorSelect?: (color: ProductColor) => void;
  activeVariantId?: string;
  onAddToFavorites: () => void;
  onAddToCart?: (frameOnly: boolean) => void;
  isEditMode?: boolean;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  onColorSelect,
  activeVariantId,
  onAddToFavorites,
  onAddToCart,
  isEditMode,
}) => {
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Medium'
  );

  const handleSelectLenses = () => {
    // TODO: Navigate to lens selection page or open lens configurator
    console.log('Navigate to lens selection');
    if (onAddToCart) {
      onAddToCart(false); // with lenses
    }
  };

  const handleAddToCart = () => {
    // Add frame only to cart
    console.log('Add frame only to cart');
    if (onAddToCart) {
      onAddToCart(true); // frame only
    }
  };

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
        {product.sizes && product.sizes.length > 0 ? (
          product.sizes.map((size) => (
            <button 
              key={size} 
              className={`size-btn ${selectedSize === size ? 'active' : ''}`}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </button>
          ))
        ) : (
          <button className="size-btn active">Medium</button>
        )}
        <button className="size-chart-link" onClick={() => setShowSizeChart(true)}>
          <Straighten fontSize="small" /> Size Chart
        </button>
      </div>

      <div className="price-section">
        <h2 className="price">{formatCurrency(product.price)}</h2>
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

      {product.colors && product.colors.length > 0 && (
        <div className="color-selector">
          <p className="color-label">Color</p>
          <div className="color-options">
            {product.colors.map((color, index) => {
              const isActive = Boolean(activeVariantId) && color.variantId === activeVariantId;

              return (
                <button
                  key={`${color.variantId}-${index}`}
                  type="button"
                  className={`color-option ${isActive ? 'active' : ''}`}
                  onClick={() => onColorSelect?.(color)}
                  title={color.name}
                >
                  <img src={color.image || product.images[0]} alt={color.name} />
                  <span className="color-name">{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="payment-options">
        <p>Pay over time with PayPal, Affirm or Afterpay. <a href="#">Learn More</a></p>
      </div>

      <div className="action-buttons">
        {product.productType === 'FRAME' ? (
          <>
            <button className="select-lenses-btn" onClick={handleSelectLenses}>
              {isEditMode ? 'Update Lenses' : 'Select Lenses'}
            </button>
            <button className="add-to-cart-btn-frame" onClick={handleAddToCart}>
              <ShoppingCart /> {isEditMode ? 'Update Cart (without lenses)' : 'Add to Cart (without lenses)'}
            </button>
          </>
        ) : (
          <button className="select-lenses-btn" onClick={handleAddToCart}>
            <ShoppingCart /> {isEditMode ? 'Update Cart Item' : 'Add to Cart'}
          </button>
        )}
      </div>
      
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
    </div>
  );
};

export default ProductInfo;
