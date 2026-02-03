import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home } from '@mui/icons-material';
import ImageGallery from '../components/ProductDetailPage/ImageGallery';
import ProductInfo from '../components/ProductDetailPage/ProductInfo';
import ProductDetails from '../components/ProductDetailPage/ProductDetails';
import RecommendedProducts from '../components/ProductDetailPage/RecommendedProducts';
import type { Product, RecommendedProduct } from '../types/product';
import ProductAPI, { type ReviewResponse } from '../api/product-api';
import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
  const { slug, sku } = useParams<{ slug: string; sku: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [reviewData, setReviewData] = useState<ReviewResponse>({ reviews: [], summary: { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, total: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);
        const apiProduct = await ProductAPI.getProductBySlug(slug);
        
        // Transform API product to Product format
        const transformedProduct: Product = {
          id: apiProduct.id,
          slug: apiProduct.slug,
          name: apiProduct.name,
          sku: apiProduct.sku,
          price: apiProduct.basePrice,
          rating: apiProduct.avgRating || 0,
          reviewCount: apiProduct.reviewCount || 0,
          shape: 'Rectangle', // Default - update if you have this data
          category: apiProduct.productType === 'SUNGLASSES' ? 'sunglasses' : apiProduct.productType === 'EYEGLASSES' ? 'eyeglasses' : 'accessories',
          productType: apiProduct.productType,
          colors: [
            {
              name: 'Default',
              code: '#000000',
              image: 'https://placehold.co/600x400/000000/FFFFFF?text=' + encodeURIComponent(apiProduct.name),
              images: [
                'https://placehold.co/600x400/000000/FFFFFF?text=Front',
                'https://placehold.co/600x400/333333/FFFFFF?text=Side',
                'https://placehold.co/600x400/666666/FFFFFF?text=Top',
                'https://placehold.co/600x400/999999/FFFFFF?text=Detail'
              ],
              productId: apiProduct.id,
              variantId: apiProduct.variantId || apiProduct.id
            }
          ],
          images: [
            'https://placehold.co/600x400/000000/FFFFFF?text=Front',
            'https://placehold.co/600x400/333333/FFFFFF?text=Side',
            'https://placehold.co/600x400/666666/FFFFFF?text=Top',
            'https://placehold.co/600x400/999999/FFFFFF?text=Detail'
          ],
          frameMeasurements: {
            frameWidth: { mm: 130, inches: 5.1 },
            bridge: { mm: 19, inches: 0.7 },
            lensWidth: { mm: 54, inches: 2.1 },
            lensHeight: { mm: 33, inches: 1.3 },
            templeLength: { mm: 145, inches: 5.7 }
          },
          frameDetails: {
            size: 'Medium',
            sizeRange: '126 - 132 mm / 5.0 - 5.2 in',
            material: 'Acetate',
            weight: 'Lightweight',
            weightGrams: 15,
            rim: 'Full Rim',
            shape: 'Rectangle'
          },
          prescriptionDetails: {
            pdRange: '62 - 79 mm',
            prescriptionRange: '-16.00 - +9.00',
            progressive: true,
            bifocal: true,
            readers: false
          },
          description: apiProduct.description,
          features: ['Nose Pads', 'Lightweight'],
          deliveryDate: 'Fri, Jan 23'
        };

        setProduct(transformedProduct);

        // Fetch reviews for this product
        try {
          setIsLoadingReviews(true);
          const response = await ProductAPI.getProductReviews(apiProduct.id, { page: 1, unitPerPage: 10 });
          setReviewData(response);
        } catch (error) {
          console.error('Error fetching reviews:', error);
          setReviewData({ reviews: [], summary: { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, total: 0 } });
        } finally {
          setIsLoadingReviews(false);
        }

        // Fetch recommended products
        const allProducts = await ProductAPI.getAllProducts();
        const recommended: RecommendedProduct[] = allProducts
          .filter(p => p.slug !== slug)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            slug: p.slug,
            productId: p.id,
            variantId: p.variantId || p.id,
            name: p.name,
            price: p.basePrice,
            rating: p.avgRating || 0,
            reviewCount: p.reviewCount || 0,
            shape: 'Rectangle',
            image: 'https://placehold.co/300x200/000000/FFFFFF?text=' + encodeURIComponent(p.name),
            colors: ['#000000'],
            deliveryDate: 'Fri, Jan 23'
          }));

        setRecommendedProducts(recommended);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug, sku]);

  const loadMoreReviews = async () => {
    if (!product || isLoadingReviews) return;
    
    try {
      setIsLoadingReviews(true);
      const nextPage = currentReviewPage + 1;
      const response = await ProductAPI.getProductReviews(product.id, { page: nextPage, unitPerPage: 10 });
      
      // Append new reviews to existing ones
      setReviewData(prev => ({
        reviews: [...prev.reviews, ...response.reviews],
        summary: response.summary // Keep the summary updated
      }));
      setCurrentReviewPage(nextPage);
    } catch (error) {
      console.error('Error loading more reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleAddToFavorites = () => {
    // TODO: Implement add to favorites
    console.log('Added to favorites');
  };

  const handleColorClick = (color: { productId: string; variantId: string }) => {
    // Navigate with slug and sku
    navigate(`/product/${product?.slug}/${product?.sku || 'default'}`);
  };

  const handleAddToCart = (frameOnly: boolean) => {
    // TODO: Implement add to cart functionality
    if (frameOnly) {
      console.log('Added frame only to cart:', product?.name);
      alert(`Added ${product?.name} (Frame Only) to cart!`);
    } else {
      console.log('Navigate to lens selection');
      // Navigate to lens selection page
    }
  };

  if (!product || isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="product-detail-page">
      <nav className="breadcrumb">
        <a href="/">
          <Home fontSize="small" />
        </a>
        <span> › </span>
        <span>{product.name} - SKU: {sku}</span>
      </nav>

      <div className="product-main">
        <div className="product-preview-column">
          <ImageGallery 
            images={product.images} 
            productName={product.name}
          />
          {product.colors && product.colors.length > 0 && (
            <div className="color-variants-section">
              <div className="color-variants">
                {product.colors.map((color, index) => (
                  <button
                    key={index}
                    className={`color-variant-btn ${color.variantId === product.id ? 'active' : ''}`}
                    onClick={() => handleColorClick(color)}
                    title={color.name}
                  >
                    <img src={color.image || product.images[0]} alt={color.name} />
                    <span className="variant-label">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <ProductInfo 
          product={product} 
          onAddToFavorites={handleAddToFavorites}
          onAddToCart={handleAddToCart}
        />
      </div>

      <ProductDetails product={product} reviewData={reviewData} isLoadingReviews={isLoadingReviews} onLoadMoreReviews={loadMoreReviews} />

      <div className="accessories-section">
        <h2>Accessories</h2>
        <div className="accessory-card">
          <img src="https://placehold.co/200x200/E8E8E8/666666?text=Eyewear+Case" alt="Deluxe Eyewear Case" />
          <div className="accessory-info">
            <p className="accessory-price">$3.95</p>
            <h4>Deluxe Eyewear Case</h4>
            <p className="accessory-sku">SKU: A60105621</p>
            <p className="accessory-description">
              Protect your eyewear wherever life takes you with this reliable case. Features premium materials, 
              soft interior lining, and compact design perfect for travel.
              <a href="#"> Read more</a>
            </p>
            <button className="add-to-cart-btn">Add to cart</button>
          </div>
        </div>
      </div>

      <RecommendedProducts products={recommendedProducts} />

      <div className="newsletter-section">
        <h2>Get 10% off your first order</h2>
        <p>Sign up now for exclusive news and savings</p>
        <form className="newsletter-form">
          <input type="email" placeholder="Email Address" />
          <button type="submit">Sign Up</button>
        </form>
        <p className="newsletter-terms">
          10% off only applies to full price items. Zenni reserves the right to modify or cancel at any time.
        </p>
      </div>
    </div>
  );
};

export default ProductDetailPage;
