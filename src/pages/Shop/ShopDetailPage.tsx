import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Store, Verified, Star } from '@mui/icons-material';
import ProductGrid from '../../components/ProductBrowse/ProductGrid';
import type { BrowseProduct } from '../../types/filter';
import type { ApiShopInfo } from '../../api/product-api';
import ProductAPI from '../../api/product-api';
import './ShopDetailPage.css';

const ShopDetailPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<ApiShopInfo | null>(null);
  const [products, setProducts] = useState<BrowseProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopProducts = async () => {
      if (!shopId) return;

      try {
        setIsLoading(true);
        const apiProducts = await ProductAPI.getProductsByShopId(shopId);

        if (apiProducts.length === 0) {
          setError('No products found for this shop');
          return;
        }

        // Get shop info from first product
        if (apiProducts[0].shop) {
          setShop(apiProducts[0].shop);
        }

        // Transform API products to BrowseProduct format
        const browseProducts: BrowseProduct[] = apiProducts.map(p => ({
          id: p.id,
          productId: p.id,
          slug: p.slug,
          sku: p.sku,
          name: p.name,
          price: p.basePrice,
          rating: p.avgRating || 0,
          reviewCount: p.reviewCount || 0,
          productType: p.productType,
          image: 'https://placehold.co/300x200/000000/FFFFFF?text=' + encodeURIComponent(p.name),
          stockQuantity: p.stockQuantity,
          isNew: false,
          isFeatured: p.isFeatured,
          variantId: p.variantId || p.id,
          brandId: p.brandId,
          categoryName: p.categoryName,
          colorVariants: [
            {
              color: 'Default',
              colorCode: '#000000',
              slug: p.slug,
              productId: p.id,
              variantId: p.variantId || p.id
            }
          ]
        }));

        setProducts(browseProducts);
      } catch (error) {
        console.error('Error fetching shop products:', error);
        setError('Failed to load shop products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopProducts();
  }, [shopId]);

  if (isLoading) {
    return <div className="shop-detail-loading">Loading...</div>;
  }

  if (error || !shop) {
    return (
      <div className="shop-detail-error">
        <p>{error || 'Shop not found'}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="shop-detail-page">
      <nav className="breadcrumb">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <Home fontSize="small" />
        </a>
        <span> › </span>
        <span>Shops</span>
        <span> › </span>
        <span>{shop.shopName}</span>
      </nav>

      <div className="shop-header">
        <div className="shop-header-content">
          <div className="shop-logo-large">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.shopName} />
            ) : (
              <Store className="shop-placeholder-icon-large" />
            )}
          </div>

          <div className="shop-info-content">
            <div className="shop-name-header">
              <h1>{shop.shopName}</h1>
              {shop.isVerified && (
                <Verified className="verified-icon-large" titleAccess="Verified Store" />
              )}
            </div>

            <div className="shop-stats-row">
              <div className="shop-stat-item">
                <Star className="star-icon-large" />
                <span className="stat-value">{shop.avgRating.toFixed(1)}</span>
                <span className="stat-label">Store Rating</span>
              </div>
              
              <div className="shop-stat-divider"></div>
              
              <div className="shop-stat-item">
                <span className="stat-value">{shop.totalProducts}</span>
                <span className="stat-label">Products</span>
              </div>
              
              <div className="shop-stat-divider"></div>
              
              <div className="shop-stat-item">
                <span className={`shop-tier-badge tier-${shop.tier.toLowerCase()}`}>
                  {shop.tier}
                </span>
              </div>
            </div>

            <div className="shop-code">
              Shop Code: <strong>{shop.shopCode}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="shop-products-section">
        <div className="products-header">
          <h2>All Products ({products.length})</h2>
        </div>
        
        {products.length > 0 ? (
          <ProductGrid products={products} viewMode="grid" />
        ) : (
          <div className="no-products">
            <p>No products available at this time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetailPage;
