import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Verified, Star } from '@mui/icons-material';
import type { ShopInfo as ShopInfoType } from '../../types/product';
import './ShopInfo.css';

interface ShopInfoProps {
  shop: ShopInfoType;
}

const ShopInfo: React.FC<ShopInfoProps> = ({ shop }) => {
  const navigate = useNavigate();

  const handleShopClick = () => {
    navigate(`/shop/${shop.id}`);
  };

  return (
    <div className="shop-info-container">
      <div className="shop-info-header">
        <Store className="shop-icon" />
        <h3>Store Information</h3>
      </div>
      
      <div className="shop-info-content" onClick={handleShopClick}>
        <div className="shop-logo">
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.shopName} />
          ) : (
            <Store className="shop-placeholder-icon" />
          )}
        </div>
        
        <div className="shop-details">
          <div className="shop-name-row">
            <h4 className="shop-name">{shop.shopName}</h4>
            {shop.isVerified && (
              <Verified className="verified-icon" titleAccess="Verified Store" />
            )}
          </div>
          
          <div className="shop-stats">
            <div className="shop-stat">
              <Star className="star-icon" />
              <span>{(shop.avgRating ?? 0).toFixed(1)}</span>
            </div>
            <div className="shop-stat-divider">|</div>
            <div className="shop-stat">
              <span>{shop.totalProducts} products</span>
            </div>
          </div>
        </div>
        
        <button className="visit-shop-btn">
          Visit Store
        </button>
      </div>
    </div>
  );
};

export default ShopInfo;
