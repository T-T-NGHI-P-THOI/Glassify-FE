import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home } from '@mui/icons-material';
import ImageGallery from '../components/ProductDetailPage/ImageGallery';
import ProductInfo from '../components/ProductDetailPage/ProductInfo';
import ProductDetails from '../components/ProductDetailPage/ProductDetails';
import RecommendedProducts from '../components/ProductDetailPage/RecommendedProducts';
import type { Product, RecommendedProduct } from '../types/product';
import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
  const { slug, productId, variantId } = useParams<{ slug: string; productId: string; variantId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>(variantId || '');

  // Product variant mapping - maps productId to default variantId
  const productVariantMap: Record<string, string> = {
    'PROD001': 'VAR001',
    'PROD002': 'VAR004',
    'PROD003': 'VAR006',
    'PROD004': 'VAR009',
    'PROD005': 'VAR012',
    'PROD006': 'VAR014',
    'PROD007': 'VAR017',
    'PROD008': 'VAR019',
  };

  useEffect(() => {
    // Redirect to first variant if variantId is missing
    if (!variantId && productId && slug) {
      const defaultVariantId = productVariantMap[productId];
      if (defaultVariantId) {
        navigate(`/product/${slug}/${productId}/${defaultVariantId}`, { replace: true });
        return;
      }
    }
  }, [slug, productId, variantId, navigate]);

  useEffect(() => {
    // TODO: Fetch product data from API using slug and variant
    // Mock data for now with placeholder images
    const mockProduct: Product = {
      id: '32173',
      slug: 'black-rectangle-glasses',
      name: 'Black Rectangle Glasses #3217321',
      sku: '3217321',
      price: 15.95,
      rating: 4.5,
      reviewCount: 831,
      shape: 'Rectangle',
      category: 'eyeglasses',
      sizes: ['Large', 'X-Large'],
      colors: [
        { 
          name: 'Black', 
          code: '#000000',
          image: 'https://placehold.co/600x400/000000/FFFFFF?text=Black+Frame',
          images: [
            'https://placehold.co/600x400/000000/FFFFFF?text=Black+Front',
            'https://placehold.co/600x400/1a1a1a/FFFFFF?text=Black+Side',
            'https://placehold.co/600x400/333333/FFFFFF?text=Black+Top',
            'https://placehold.co/600x400/4d4d4d/FFFFFF?text=Black+Detail'
          ],
          productId: 'PROD001',
          variantId: 'VAR001'
        },
        { 
          name: 'Tortoise', 
          code: '#8B4513',
          image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Tortoise+Frame',
          images: [
            'https://placehold.co/600x400/8B4513/FFFFFF?text=Tortoise+Front',
            'https://placehold.co/600x400/A0522D/FFFFFF?text=Tortoise+Side',
            'https://placehold.co/600x400/CD853F/FFFFFF?text=Tortoise+Top',
            'https://placehold.co/600x400/D2691E/FFFFFF?text=Tortoise+Detail'
          ],
          productId: 'PROD001',
          variantId: 'VAR002'
        },
        { 
          name: 'Navy Blue', 
          code: '#000080',
          image: 'https://placehold.co/600x400/000080/FFFFFF?text=Navy+Frame',
          images: [
            'https://placehold.co/600x400/000080/FFFFFF?text=Navy+Front',
            'https://placehold.co/600x400/0000CD/FFFFFF?text=Navy+Side',
            'https://placehold.co/600x400/1E90FF/FFFFFF?text=Navy+Top',
            'https://placehold.co/600x400/4169E1/FFFFFF?text=Navy+Detail'
          ],
          productId: 'PROD001',
          variantId: 'VAR003'
        },
        { 
          name: 'Gray', 
          code: '#808080',
          image: 'https://placehold.co/600x400/808080/FFFFFF?text=Gray+Frame',
          images: [
            'https://placehold.co/600x400/808080/FFFFFF?text=Gray+Front',
            'https://placehold.co/600x400/A9A9A9/FFFFFF?text=Gray+Side',
            'https://placehold.co/600x400/C0C0C0/FFFFFF?text=Gray+Top',
            'https://placehold.co/600x400/D3D3D3/FFFFFF?text=Gray+Detail'
          ],
          productId: 'PROD001',
          variantId: 'VAR004'
        }
      ],
      images: [
        'https://placehold.co/600x400/000000/FFFFFF?text=Front+View',
        'https://placehold.co/600x400/333333/FFFFFF?text=Side+View',
        'https://placehold.co/600x400/666666/FFFFFF?text=Top+View',
        'https://placehold.co/600x400/999999/FFFFFF?text=Detail+View'
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
        material: 'Stainless Steel',
        weight: 'Lightweight',
        weightGrams: 13,
        rim: 'Half Rim',
        shape: 'Rectangle'
      },
      prescriptionDetails: {
        pdRange: '62 - 79 mm',
        pdRangeNote: 'Additional cost for PDs outside this range',
        prescriptionRange: '-16.00 - +9.00',
        progressive: true,
        bifocal: true,
        readers: false
      },
      description: 'Discover the perfect blend of style and functionality with our Black Rectangle Glasses. Designed for the modern individual, these frames offer exceptional comfort and durability for everyday wear.',
      features: ['Nose Pads', 'Lightweight'],
      deliveryDate: 'Fri, Jan 23'
    };

    setProduct(mockProduct);

    // Update images based on selected variant
    if (variantId && mockProduct.colors) {
      const selectedColor = mockProduct.colors.find(color => color.variantId === variantId);
      if (selectedColor && selectedColor.images) {
        mockProduct.images = selectedColor.images;
      }
    }

    // Mock recommended products with slug, productId and variantId
    setRecommendedProducts([
      {
        id: '1',
        slug: 'classic-rectangle-glasses',
        productId: 'PROD001',
        variantId: 'VAR002',
        name: 'Rectangle Glasses',
        price: 15.95,
        rating: 4.5,
        reviewCount: 760,
        shape: 'Rectangle',
        image: 'https://placehold.co/300x200/FF6B6B/FFFFFF?text=Product+1',
        colors: ['#000000', '#8B4513'],
        deliveryDate: 'Fri, Jan 23'
      },
      {
        id: '2',
        slug: 'modern-round-glasses',
        productId: 'PROD002',
        variantId: 'VAR004',
        name: 'Round Glasses',
        price: 18.95,
        rating: 4.7,
        reviewCount: 523,
        shape: 'Round',
        image: 'https://placehold.co/300x200/4ECDC4/FFFFFF?text=Product+2',
        colors: ['#000000', '#C0C0C0'],
        deliveryDate: 'Mon, Jan 26'
      },
      {
        id: '3',
        slug: 'square-titanium-frames',
        productId: 'PROD003',
        variantId: 'VAR006',
        name: 'Square Glasses',
        price: 19.95,
        rating: 4.6,
        reviewCount: 892,
        shape: 'Square',
        image: 'https://placehold.co/300x200/95E1D3/FFFFFF?text=Product+3',
        colors: ['#000000', '#FFD700'],
        deliveryDate: 'Fri, Jan 23'
      },
      {
        id: '4',
        slug: 'cat-eye-acetate-glasses',
        productId: 'PROD004',
        variantId: 'VAR009',
        name: 'Cat Eye Glasses',
        price: 22.95,
        rating: 4.8,
        reviewCount: 645,
        shape: 'Cat Eye',
        image: 'https://placehold.co/300x200/F38181/FFFFFF?text=Product+4',
        colors: ['#8B4513', '#000000'],
        deliveryDate: 'Tue, Jan 27'
      },
      {
        id: '5',
        slug: 'aviator-metal-glasses',
        productId: 'PROD005',
        variantId: 'VAR012',
        name: 'Aviator Glasses',
        price: 24.95,
        rating: 4.9,
        reviewCount: 1024,
        shape: 'Aviator',
        image: 'https://placehold.co/300x200/AA96DA/FFFFFF?text=Product+5',
        colors: ['#C0C0C0', '#FFD700'],
        deliveryDate: 'Fri, Jan 23'
      }
    ]);
  }, [slug, productId, variantId]);

  const handleAddToFavorites = () => {
    // TODO: Implement add to favorites
    console.log('Added to favorites');
  };

  const handleColorClick = (color: { productId: string; variantId: string }) => {
    navigate(`/product/${slug}/${color.productId}/${color.variantId}`);
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

  if (!product) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="product-detail-page">
      <nav className="breadcrumb">
        <a href="/">
          <Home fontSize="small" />
        </a>
        <span> › </span>
        <span>{slug} - {productId} - {variantId}</span>
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
                    className={`color-variant-btn ${color.variantId === variantId ? 'active' : ''}`}
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

      <ProductDetails product={product} />

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
