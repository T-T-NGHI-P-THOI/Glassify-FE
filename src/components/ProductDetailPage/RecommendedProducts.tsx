import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FavoriteBorder, Star } from '@mui/icons-material';
import type { RecommendedProduct } from '../../types/product';
import './RecommendedProducts.css';

interface RecommendedProductsProps {
  products: RecommendedProduct[];
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsPerView = 4;
  const maxIndex = Math.max(0, products.length - itemsPerView);

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.children[0]?.clientWidth || 0;
      const gap = 20;
      container.scrollTo({
        left: index * (itemWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  React.useEffect(() => {
    scrollToIndex(currentIndex);
  }, [currentIndex]);

  return (
    <div className="recommended-products">
      <div className="section-header">
        <h2>You Might Also Like</h2>
        <div className="navigation-buttons">
          <button 
            className="nav-btn prev" 
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ‹
          </button>
          <button 
            className="nav-btn next" 
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
          >
            ›
          </button>
        </div>
      </div>
      
      <div className="carousel-container">
        <div className="products-grid" ref={scrollContainerRef}>
          {products.map((product) => (
            <Link 
              key={product.id} 
              to={`/product/${product.slug}/${product.id}`}
              className="product-card"
            >
              <button className="favorite-btn" onClick={(e) => e.preventDefault()}>
                <FavoriteBorder />
              </button>
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-card-info">
                <p className="product-price">${product.price.toFixed(2)}</p>
                <div className="product-rating">
                  <Star className="star" />
                  <span>{product.rating}</span>
                  <span className="review-count">({product.reviewCount})</span>
                </div>
                <p className="product-shape">{product.shape}</p>
                {product.deliveryDate && (
                  <p className="delivery-date">Get it as early as {product.deliveryDate}</p>
                )}
                <div className="color-options">
                  {product.colors.map((color, index) => (
                    <span key={index} className="color-dot" style={{ backgroundColor: color }}></span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendedProducts;
