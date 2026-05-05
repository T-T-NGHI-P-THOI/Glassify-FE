import React, { useState } from 'react';
import { Star, StarBorder, Straighten, Favorite, Facebook, Pinterest, Twitter, Close, ShoppingCart } from '@mui/icons-material';
import type { Product, ProductColor } from '@/types/product.ts';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [showSizeChart, setShowSizeChart] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Medium'
  );

  const inStock = product.stockQuantity !== undefined ? product.stockQuantity > 0 : false;

  const handleSelectLenses = () => {
    if (!inStock) return;
    onAddToCart?.(false);
  };

  const handleAddToCart = () => {
    if (!inStock) return;
    onAddToCart?.(true);
  };

  return (
    <div className="product-info">
      <h1 className="product-title">{product.name}</h1>
      <p className="product-sku">{product.sku}</p>
      
      <div className="product-reviews">
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            i < Math.floor(product.rating)
              ? <Star key={i} className="star filled" />
              : <StarBorder key={i} className="star" />
          ))}
          <span className="rating-value">
            {product.rating > 0 ? product.rating.toFixed(1) : '—'}
          </span>
        </div>
        <span className="reviews-label">({product.reviewCount} reviews)</span>
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

        <button 
          className="size-chart-link" 
          onClick={() => setShowSizeChart(true)}
        >
          <Straighten fontSize="small" /> Size Chart
        </button>

        <div className={`stock-status ${!inStock ? 'out-of-stock' : ''}`}>
          {inStock 
            ? `In stock (${product.stockQuantity} available)` 
            : 'Out of stock'}
        </div>
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
          <p className="includes-note">
            *multifocal or readers lenses start at additional cost
          </p>
        </div>
      </div>

      {product.colors && product.colors.length > 0 && (
        <div className="color-selector">
          <p className="color-label">Variant(s)</p>

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
                  <span
                    className="color-swatch"
                    style={{ backgroundColor: color.code || '#ccc' }}
                  />
                  <span className="color-name">{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!inStock && (
        <p className="out-of-stock-note">
          This item is currently unavailable
        </p>
      )}

      {!isAdmin && (
        <div className="action-buttons">
          {product.productType === 'FRAME' ? (
            <>
              <button
                className="select-lenses-btn"
                onClick={handleSelectLenses}
                disabled={!inStock}
              >
                {isEditMode ? 'Update Lenses' : 'Select Lenses'}
              </button>

              <button
                className="add-to-cart-btn-frame"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingCart />
                {isEditMode
                  ? ' Update Cart (without lenses)'
                  : ' Add to Cart (without lenses)'}
              </button>
            </>
          ) : (
            <button
              className="select-lenses-btn"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingCart />
              {isEditMode ? ' Update Cart Item' : ' Add to Cart'}
            </button>
          )}
        </div>
      )}

      

      {/* <button className="add-to-favorites-btn" onClick={onAddToFavorites}>
        <Favorite /> Add to favorites
      </button> */}

      {/* <div className="share-section">
        <p className="share-label">Share</p>
        <div className="share-buttons">
          <button className="share-btn"><Facebook /></button>
          <button className="share-btn"><Pinterest /></button>
          <button className="share-btn"><Twitter /></button>
        </div>
      </div> */}

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
              <p>
                Frame width is the total width of the frame front, measured from one lens edge to the other.
              </p>

              <table className="size-chart-table">
                <tbody>
                  <tr><td><strong>Extra Small</strong></td><td>110 - 118 mm</td></tr>
                  <tr><td><strong>Small</strong></td><td>119 - 125 mm</td></tr>
                  <tr className="highlight"><td><strong>Medium</strong></td><td>126 - 132 mm</td></tr>
                  <tr><td><strong>Large</strong></td><td>133 - 140 mm</td></tr>
                  <tr><td><strong>Extra Large</strong></td><td>141+ mm</td></tr>
                </tbody>
              </table>

              <p>
                <strong>Your frame:</strong> {product.frameMeasurements.frameWidth.mm} mm ({product.frameDetails.size})
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;