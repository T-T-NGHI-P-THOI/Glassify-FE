import {
  Box,
  Typography,
  Container,
  Grid,
  Stack,
} from '@mui/material';
import { CustomButton, CustomProductCarousel, CustomFeatureCarousel } from '../components/custom';
import { Visibility, LocalShipping, Favorite, Loop } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductAPI from '../api/product-api';

import EmblaCarousel from '../components/custom/CustomEmblaCarousel'
import type { EmblaOptionsType } from 'embla-carousel';

const MainPage = () => {
  const navigate = useNavigate();
  const [bestSellerProducts, setBestSellerProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch best seller products from API
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setIsLoading(true);
        const products = await ProductAPI.getAllProducts({
          sortBy: 'soldCount',
          sortDirection: 'DESC',
          unitPerPage: 8,
          page: 0
        });

        // Transform API products to carousel format
        const transformedProducts = products.map((product) => ({
          id: product.id,
          title: product.name,
          price: `$${product.basePrice.toFixed(2)}`,
          rating: product.avgRating || 0,
          reviews: product.reviewCount > 1000 ? `${Math.floor(product.reviewCount / 1000)}K+` : product.reviewCount.toString(),
          shape: product.productType,
          image: `https://placehold.co/280x180/000000/FFFFFF?text=${encodeURIComponent(product.name)}`,
          slug: product.slug,
        }));

        setBestSellerProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching best sellers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  const collections = [
    {
      id: 1,
      title: 'YEAR OF THE HORSE',
      subtitle: 'LUNAR NEW YEAR',
      description: 'Free Gift with purchase while supplies last',
      image: 'https://picsum.photos/seed/collection1/600/400',
      linkText: 'Shop collection',
    },
    {
      id: 2,
      title: 'REDEFINING YOUR STYLE',
      subtitle: 'GLASSIFY x CHASE STOKES',
      description: 'NEW exclusive eyewear collection, where ease meets edge.',
      image: 'https://picsum.photos/seed/collection2/600/400',
      linkText: 'Shop collection',
    },
    {
      id: 3,
      title: 'THE BEST DAILY LENS',
      subtitle: 'EyeQLenz™',
      description: 'All-in-one lens shields your eyes from UV, blue light, and infrared.',
      image: 'https://picsum.photos/seed/collection3/600/400',
      linkText: 'Learn more',
    },
  ];

  // Mock data cho features
  const features = [
    {
      id: 1,
      image: 'https://picsum.photos/seed/feature1/500/300',
      title: 'BLUE LIGHT DEFENSE',
      description: 'Filter blue light from sun to screen with Blokz®',
      linkText: 'Shop now',
    },
    {
      id: 2,
      image: 'https://picsum.photos/seed/feature2/500/300',
      title: '100% UV COVERAGE',
      description: 'Every lens. Every style. Complete UVA/UVB protection.',
      linkText: 'Shop now',
    },
    {
      id: 3,
      image: 'https://picsum.photos/seed/feature3/500/300',
      title: 'ALL-IN-ONE PROTECTION',
      description: 'Infrared, UV, and blue light—EyeQLenz™ with Glassify ID Guard™ handles them all.',
      linkText: 'Shop now',
    },
    {
      id: 4,
      image: 'https://picsum.photos/seed/feature4/500/300',
      title: 'NIGHT DRIVING CLARITY',
      description: 'Reduce glare for sharper vision at night.',
      linkText: 'Shop now',
    },
  ];

  const OPTIONS: EmblaOptionsType = { loop: true }
  const PRODUCT_OPTIONS: EmblaOptionsType = { loop: true, align: 'start' }
  const FEATURE_OPTIONS: EmblaOptionsType = { loop: true, align: 'start' }


  return (
    <Box sx={{ bgcolor: '#f9fafb' }}>
      {/* Hero Banner */}
      <Box
        sx={{
          bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
          py: 8,
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3.5rem' },
              mb: 2,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            EYEWEAR FOR EVERYONE®
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.25rem' },
              opacity: 0.95,
            }}
          >
            Style & clarity made for you.
          </Typography>
        </Container>
      </Box>

      {/* Quick Categories */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e5e7eb', py: 2 }}>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#d1d5db',
                borderRadius: 3,
              },
            }}
            >
          </Stack>
        </Container>
      </Box>

      {/* Featured Collections Carousel */}
      <Box sx={{ bgcolor: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <EmblaCarousel slides={collections} options={OPTIONS}/>
        </Container>
      </Box>

      {/* Best Sellers Section */}
      <Box sx={{ py: 8, bgcolor: '#f0f9ff' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                textTransform: 'uppercase',
              }}
            >
              BEST SELLERS
            </Typography>
            <CustomButton variant="contained" color="primary" onClick={() => navigate('/products')}>
              Shop all
            </CustomButton>
          </Box>

          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading products...</Typography>
            </Box>
          ) : bestSellerProducts.length > 0 ? (
            <CustomProductCarousel slides={bestSellerProducts} options={PRODUCT_OPTIONS} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>No products available</Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              textAlign: 'center',
              mb: 2,
              fontSize: { xs: '1.5rem', md: '2rem' },
              textTransform: 'uppercase',
            }}
          >
            SMARTER DEFENSE STARTS HERE
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#6b7280',
              mb: 6,
              fontSize: '1.125rem',
            }}
          >
            Every Glassify lens delivers protection with a purpose.
          </Typography>

          <CustomFeatureCarousel slides={features} options={FEATURE_OPTIONS} />
        </Container>
      </Box>

      {/* Trust Badges */}
      <Box sx={{ bgcolor: '#f9fafb', py: 6, borderTop: '1px solid #e5e7eb' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
              <LocalShipping sx={{ fontSize: 48, color: '#3b82f6', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Free Shipping
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Orders $89+
              </Typography>
            </Grid>
            <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
              <Favorite sx={{ fontSize: 48, color: '#ef4444', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                150k+ Reviews
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                4.5 Rating
              </Typography>
            </Grid>
            <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  fontSize: 48,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Loop sx={{ fontSize: 48, color: '#f59e0b', mb: 1 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                30-Day Returns
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Easy & Free
              </Typography>
            </Grid>
            <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
              <Visibility sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                FSA/HSA Eligible
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Vision Insurance
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default MainPage;