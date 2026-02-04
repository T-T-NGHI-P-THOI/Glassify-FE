import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, FavoriteBorder } from '@mui/icons-material';
import type { BrowseProduct } from '../../types/filter';
import './ProductGrid.css';

interface ProductGridProps {
  products: BrowseProduct[];
  onAddToFavorites?: (productId: string) => void;
  viewMode?: 'grid' | 'list';
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToFavorites, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  const handleColorClick = (e: React.MouseEvent<HTMLButtonElement>, slug: string, sku: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Color clicked:', slug, sku);
    navigate(`/product/${slug}/${sku}`);
  };

  return (
    <div className={`product-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
      {products.map(product => (
        <div key={product.id} className="product-grid-card-wrapper">
          <Link 
            to={`/product/${product.slug}/${product.sku}`}
            className="product-grid-card"
          >
            {product.isNew && <span className="badge badge-new">New</span>}
            {product.isBestSeller && <span className="badge badge-bestseller">Best Seller</span>}
            
            <button 
              className="favorite-btn-grid"
              onClick={(e) => {
                e.preventDefault();
                if (onAddToFavorites) onAddToFavorites(product.id);
              }}
            >
              <FavoriteBorder />
            </button>

            <div className="product-image-container">
              <img src={product.image} alt={product.name} />
            </div>

            <div className="product-grid-info">
              <h3 className="product-grid-name">{product.name}</h3>
              
              <div className="product-grid-rating">
                <Star className="star" />
                <span>{product.rating}</span>
                <span className="review-count">({product.reviewCount})</span>
              </div>

              <div className="product-grid-details">
                <span className="product-type">{product.productType}</span>
                {product.stockQuantity > 0 && (
                  <>
                    <span className="separator">•</span>
                    <span className="product-stock">In Stock</span>
                  </>
                )}
              </div>

              <p className="product-grid-price">${product.price.toFixed(2)}</p>
            </div>
          </Link>
          
          <div className="product-grid-colors">
            {product.colorVariants.slice(0, 4).map((colorVariant, index) => (
              <button
                key={index}
                className={`color-dot-grid ${colorVariant.variantId === product.variantId ? 'active' : ''}`}
                style={{ backgroundColor: colorVariant.colorCode }}
                onClick={(e) => handleColorClick(e, colorVariant.slug, product.sku)}
                title={colorVariant.color}
              />
            ))}
            {product.colorVariants.length > 4 && (
              <span className="more-colors">+{product.colorVariants.length - 4}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
