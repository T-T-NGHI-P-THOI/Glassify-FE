import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FilterList, 
  ViewModule, 
  ViewList,
  Sort 
} from '@mui/icons-material';
import FilterSidebar from '../../components/ProductBrowse/FilterSidebar';
import ProductGrid from '../../components/ProductBrowse/ProductGrid';
import type { FilterOptions, ActiveFilters, BrowseProduct } from '../../types/filter';
import ProductAPI, { type ProductFilterParams } from '../../api/product-api';
import './ProductBrowsePage.css';

const ProductBrowsePage: React.FC = () => {
  const defaultShopCities = [
    'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương',
    'Đồng Nai', 'Quảng Ninh', 'Khánh Hòa', 'Nghệ An', 'Thanh Hóa', 'Thừa Thiên Huế'
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<BrowseProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<BrowseProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    productTypes: ['FRAME', 'LENS', 'ACCESSORIES'],
    brands: [],
    categories: [],
    shopCities: defaultShopCities,
    priceRange: { min: 0, max: 500 },
    ratings: [0, 1, 2, 3, 4]
  });

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    productType: searchParams.get('productType') as ActiveFilters['productType'] || undefined,
    brandIds: searchParams.get('brandId') ? [searchParams.get('brandId')!] : [],
    categoryNames: searchParams.get('categoryName') ? [searchParams.get('categoryName')!] : [],
    shopCities: searchParams.get('shopCity') ? [searchParams.get('shopCity')!] : [],
    searchQuery: searchParams.get('q') || '',
    sortBy: (searchParams.get('sortBy') as ActiveFilters['sortBy']) || 'popular',
    priceMax: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    priceMin: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined,
  });

  useEffect(() => {
    const category = searchParams.get('category');
    const productType = searchParams.get('productType');
    const query = searchParams.get('q');
    const shopCity = searchParams.get('shopCity');
    
    // Only update if there are actual params in URL
    if (category || productType || query || shopCity) {
      setActiveFilters(prev => {
        const updates: Partial<ActiveFilters> = {
          searchQuery: query || '',
        };
        
        // Handle productType (FRAME, LENS, ACCESSORIES)
        if (productType) {
          updates.productType = productType as ActiveFilters['productType'];
        }
        
        // Handle category name - set it to categoryNames array for API filtering
        if (category) {
          updates.categoryNames = [category];
        }

        if (shopCity) {
          updates.shopCities = [shopCity];
        }
        
        return { ...prev, ...updates };
      });
    }
  }, [searchParams]);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const PAGE_SIZE = 10;

  const normalizeLocationText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const extractProductLocation = (product: {
    shop?: { city?: string; address?: string };
    shopBasicInfo?: { city?: string; address?: string };
    shopbasicinfo?: { city?: string; address?: string };
  }) => {
    const city =
      product.shopBasicInfo?.city ||
      product.shopbasicinfo?.city ||
      product.shop?.city ||
      '';
    const address =
      product.shopBasicInfo?.address ||
      product.shopbasicinfo?.address ||
      product.shop?.address ||
      '';

    return {
      city: city || undefined,
      address: address || undefined
    };
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await ProductAPI.getCategories();
        const categoryOptions = categories
          .filter(cat => cat.isActive)
          .map(cat => ({ id: cat.id, name: cat.name }));
        
        setFilterOptions(prev => ({
          ...prev,
          categories: categoryOptions
        }));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch products from API with filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);

        // Build filter params from activeFilters
        const filterParams: ProductFilterParams = {
          search: activeFilters.searchQuery || undefined,
          minPrice: activeFilters.priceMin !== undefined ? activeFilters.priceMin : undefined,
          maxPrice: activeFilters.priceMax !== undefined ? activeFilters.priceMax : undefined,
          isActive: true,
          minRating: activeFilters.minRating || undefined,
          productType: activeFilters.productType,
          brandId: activeFilters.brandIds.length > 0 ? activeFilters.brandIds[0] : undefined,
          categoryName: activeFilters.categoryNames.length > 0 ? activeFilters.categoryNames[0] : undefined,
          isFeatured: activeFilters.isFeatured,
          isReturnable: activeFilters.isReturnable,
          page: currentPage,
          unitPerPage: PAGE_SIZE,
        };

        // Map sortBy to API params
        if (activeFilters.sortBy) {
          switch (activeFilters.sortBy) {
            case 'price-asc':
              filterParams.sortBy = 'basePrice';
              filterParams.sortDirection = 'ASC';
              break;
            case 'price-desc':
              filterParams.sortBy = 'basePrice';
              filterParams.sortDirection = 'DESC';
              break;
            case 'rating':
              filterParams.sortBy = 'avgRating';
              filterParams.sortDirection = 'DESC';
              break;
            case 'newest':
              filterParams.sortBy = 'createdAt';
              filterParams.sortDirection = 'DESC';
              break;
            case 'popular':
            default:
              filterParams.sortBy = 'soldCount';
              filterParams.sortDirection = 'DESC';
              break;
          }
        }

        const apiProducts = await ProductAPI.getAllProducts(filterParams) ?? [];

        // Transform API products to BrowseProduct format
        const transformedProducts: BrowseProduct[] = apiProducts.map((product) => {
          const productLocation = extractProductLocation(product);

          return {
            id: product.id,
            slug: product.slug,
            productId: product.id,
            variantId: product.variantId || product.id,
            name: product.name,
            sku: product.sku,
            price: product.basePrice,
            rating: product.avgRating || 0,
            reviewCount: product.reviewCount || 0,
            productType: product.productType,
            image: 'https://placehold.co/300x200/000000/FFFFFF?text=' + encodeURIComponent(product.name),
            colorVariants: [],
            isFeatured: product.isFeatured,
            isNew: false,
            stockQuantity: product.stockQuantity,
            brandId: product.brandId,
            categoryId: product.categoryId,
            categoryName: product.categoryName,
            shopCity: productLocation.city,
            shopAddress: productLocation.address
          };
        });

        const detectedCities = Array.from(
          new Set(
            transformedProducts
              .map(product => product.shopCity)
              .filter((city): city is string => Boolean(city))
          )
        );

        setFilterOptions(prev => ({
          ...prev,
          shopCities: Array.from(new Set([...defaultShopCities, ...detectedCities]))
        }));

        setProducts(transformedProducts);
        setHasNextPage(transformedProducts.length === PAGE_SIZE);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [activeFilters.searchQuery, activeFilters.priceMin, activeFilters.priceMax, activeFilters.sortBy, activeFilters.minRating, activeFilters.productType, activeFilters.isFeatured, activeFilters.isReturnable, activeFilters.inStock, activeFilters.brandIds, activeFilters.categoryNames, currentPage]);

  // Apply location filtering client-side because product listing API does not currently expose city param.
  useEffect(() => {
    let nextProducts = products;

    if (activeFilters.shopCities.length > 0) {
      nextProducts = nextProducts.filter(
        product => {
          const cityValue = normalizeLocationText(product.shopCity || '');
          const addressValue = normalizeLocationText(product.shopAddress || '');

          return activeFilters.shopCities.some((selectedCity) => {
            const selectedValue = normalizeLocationText(selectedCity);
            return (
              cityValue === selectedValue ||
              cityValue.includes(selectedValue) ||
              selectedValue.includes(cityValue) ||
              addressValue.includes(selectedValue)
            );
          });
        }
      );
    }

    setFilteredProducts(nextProducts);
  }, [products, activeFilters.shopCities]);

  const handleFilterChange = (newFilters: ActiveFilters) => {
    setCurrentPage(1);
    setActiveFilters(newFilters);
    
    // Update URL params to match filters
    const params = new URLSearchParams();
    
    // Convert productType to category name for URL
    if (newFilters.productType) {
      const categoryName = newFilters.categoryNames && newFilters.categoryNames.length > 0
        ? newFilters.categoryNames[0]
        : undefined;
      params.set('productType', newFilters.productType);
      if (categoryName) {
        params.set('category', categoryName);
      }
    }
    if (newFilters.searchQuery) params.set('q', newFilters.searchQuery);
    if (newFilters.sortBy && newFilters.sortBy !== 'popular') params.set('sortBy', newFilters.sortBy);
    if (newFilters.priceMin !== undefined) params.set('minPrice', newFilters.priceMin.toString());
    if (newFilters.priceMax !== undefined) params.set('maxPrice', newFilters.priceMax.toString());
    if (newFilters.minRating) params.set('minRating', newFilters.minRating.toString());
    if (newFilters.brandIds && newFilters.brandIds.length > 0) {
      params.set('brandId', newFilters.brandIds[0]);
    }
    if (newFilters.categoryNames && newFilters.categoryNames.length > 0) {
      params.set('category', newFilters.categoryNames[0]);
    }
    if (newFilters.shopCities && newFilters.shopCities.length > 0) {
      params.set('shopCity', newFilters.shopCities[0]);
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setActiveFilters({
      productType: undefined,
      brandIds: [],
      categoryNames: [],
      shopCities: [],
      searchQuery: '',
      sortBy: 'popular'
    });
    setSearchParams({});
  };

  const handleSort = (sortBy: ActiveFilters['sortBy']) => {
    setActiveFilters(prev => ({ ...prev, sortBy }));
  };

  const handleProductTypeClick = (productType: ActiveFilters['productType']) => {
    const newFilters = { 
      ...activeFilters, 
      productType 
    };
    setActiveFilters(newFilters);
    
    if (productType) {
      setSearchParams({ productType });
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete('productType');
      setSearchParams(params);
    }
  };

  return (
    <div className="browse-page">
      {isMobileFilterOpen && (
        <div 
          className="filter-overlay"
          onClick={() => setIsMobileFilterOpen(false)}
        />
      )}

      <div className="browse-container">
        <aside className="browse-sidebar">
          <FilterSidebar
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            isMobileOpen={isMobileFilterOpen}
            onMobileClose={() => setIsMobileFilterOpen(false)}
          />
        </aside>

        <main className="browse-main">
          <div className="browse-header">
            <div className="browse-controls">
              <button 
                className="filter-toggle-btn"
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <FilterList /> Filters
              </button>

              <div className="sort-controls">
                <Sort className="sort-icon" />
                <select
                  value={activeFilters.sortBy}
                  onChange={(e) => handleSort(e.target.value as ActiveFilters['sortBy'])}
                  className="sort-select"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <div className="view-controls">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <ViewModule />
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <ViewList />
                </button>
              </div>
            </div>
          </div>

          <div className="browse-results-info">
            <h1 className="results-title">
              {activeFilters.productType 
                ? `All ${activeFilters.productType.charAt(0) + activeFilters.productType.slice(1).toLowerCase()}`
                : 'All Products'}
            </h1>
            <p className="results-count">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <ProductGrid
                products={filteredProducts}
                onAddToFavorites={(id) => console.log('Add to favorites:', id)}
                viewMode={viewMode}
              />
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ← Previous
                </button>
                <span className="pagination-info">Page {currentPage}</span>
                <button
                  className="pagination-btn"
                  disabled={!hasNextPage}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className="no-results">
              <h2>No products found</h2>
              <p>Try adjusting your filters or search terms</p>
              <button className="clear-filters-btn" onClick={handleClearFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductBrowsePage;
