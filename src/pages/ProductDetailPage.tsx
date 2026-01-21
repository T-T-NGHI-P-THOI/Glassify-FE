import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Home } from '@mui/icons-material';
import ImageGallery from '../components/ProductDetailPage/ImageGallery';
import ProductInfo from '../components/ProductDetailPage/ProductInfo';
import ProductDetails from '../components/ProductDetailPage/ProductDetails';
import RecommendedProducts from '../components/ProductDetailPage/RecommendedProducts';
import type { Product, RecommendedProduct } from '../types/product';
import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
  const { slug, variant } = useParams<{ slug: string; variant: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>(variant || '');

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
      colors: [
        { 
          name: 'Black', 
          code: '#000000',
          image: 'https://placehold.co/600x400/000000/FFFFFF?text=Black+Frame'
        },
        { 
          name: 'Tortoise', 
          code: '#8B4513',
          image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Tortoise+Frame'
        },
        { 
          name: 'Navy Blue', 
          code: '#000080',
          image: 'https://placehold.co/600x400/000080/FFFFFF?text=Navy+Frame'
        },
        { 
          name: 'Gray', 
          code: '#808080',
          image: 'https://placehold.co/600x400/808080/FFFFFF?text=Gray+Frame'
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

    // Mock recommended products with slug and variant
    setRecommendedProducts([
      {
        id: '1',
        slug: 'classic-rectangle-glasses',
        variant: '3217322',
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
        variant: '4328451',
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
        slug: 'square-frame-glasses',
        variant: '5439562',
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
        slug: 'retro-cat-eye-glasses',
        variant: '6540673',
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
        variant: '7651784',
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
  }, [slug, variant]);

  const handleAddToFavorites = () => {
    // TODO: Implement add to favorites
    console.log('Added to favorites');
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
        <span>{slug} - {variant}</span>
      </nav>

      <div className="product-main">
        <ImageGallery images={product.images} productName={product.name} />
        <ProductInfo product={product} onAddToFavorites={handleAddToFavorites} />
      </div>

      <div className="color-selector-section">
        <h3>Available Colors</h3>
        <div className="color-thumbnails">
          {product.colors.map((color, index) => (
            <button 
              key={index} 
              className={`color-thumbnail ${selectedVariant === color.name ? 'active' : ''}`}
              onClick={() => setSelectedVariant(color.name)}
            >
              <img src={color.image || product.images[0]} alt={color.name} />
              <span className="color-name">{color.name}</span>
            </button>
          ))}
        </div>
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
