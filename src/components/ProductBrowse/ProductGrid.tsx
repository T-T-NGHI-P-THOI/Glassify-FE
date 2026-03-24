import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rating, Stack, Typography, Tooltip } from '@mui/material';
import { FavoriteBorder } from '@mui/icons-material';
import type { BrowseProduct } from '../../types/filter';
import { formatCurrency } from '@/utils/formatCurrency';
import './ProductGrid.css';

interface ProductGridProps {
  products: BrowseProduct[];
  onAddToFavorites?: (productId: string) => void;
  viewMode?: 'grid' | 'list';
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToFavorites, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  return (
    <div className={`product-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
      {products.map((product) => (
        <div key={product.id} className="product-grid-card-wrapper">
          <Link
            to={`/product/${product.slug}/${product.sku}`}
            className="product-grid-card"
          >
            {product.isNew && <span className="badge badge-new">New</span>}
            {product.isFeatured && <span className="badge badge-bestseller">Best Seller</span>}

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
              <p className="product-grid-category">
                {product.categoryName || product.productType}
              </p>

              <Tooltip title={product.name} arrow enterDelay={250}>
                <h3 className="product-grid-name">{product.name}</h3>
              </Tooltip>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Rating value={product.rating} precision={0.5} size="small" readOnly />
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  ({product.reviewCount})
                </Typography>
              </Stack>

              <p className="product-grid-price">{formatCurrency(product.price)}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
