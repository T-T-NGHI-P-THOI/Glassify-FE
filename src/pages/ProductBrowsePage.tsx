import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  FilterList, 
  ViewModule, 
  ViewList,
  Sort 
} from '@mui/icons-material';
import FilterSidebar from '../components/ProductBrowse/FilterSidebar';
import ProductGrid from '../components/ProductBrowse/ProductGrid';
import type { FilterOptions, ActiveFilters, BrowseProduct } from '../types/filter';
import ProductAPI, { type ProductFilterParams } from '../api/product-api';
import './ProductBrowsePage.css';

const ProductBrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<BrowseProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<BrowseProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    productTypes: ['EYEGLASSES', 'SUNGLASSES', 'ACCESSORIES'],
    brands: [],
    categories: [],
    priceRange: { min: 0, max: 500 },
    ratings: [5, 4, 3, 2, 1]
  });

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    productType: searchParams.get('productType') as ActiveFilters['productType'] || undefined,
    brandIds: searchParams.get('brandId') ? [searchParams.get('brandId')!] : [],
    categoryIds: searchParams.get('categoryId') ? [searchParams.get('categoryId')!] : [],
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
    
    // Only update if there are actual params in URL
    if (category || productType || query) {
      setActiveFilters(prev => ({
        ...prev,
        productType: (productType as ActiveFilters['productType']) || (category === 'Eyeglasses' ? 'EYEGLASSES' : category === 'Sunglasses' ? 'SUNGLASSES' : undefined),
        searchQuery: query || '',
        // Don't set categoryIds from category param - it's just for display, not a UUID
      }));
    }
  }, [searchParams]);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await ProductAPI.getCategories();
        setFilterOptions(prev => ({
          ...prev,
          categories: categories
            .filter(cat => cat.isActive)
            .map(cat => ({ id: cat.id, name: cat.name }))
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
          minPrice: activeFilters.priceMin || undefined,
          maxPrice: activeFilters.priceMax || undefined,
          isActive: true,
          minRating: activeFilters.minRating || undefined,
          productType: activeFilters.productType,
          brandId: activeFilters.brandIds.length > 0 ? activeFilters.brandIds[0] : undefined,
          categoryId: activeFilters.categoryIds.length > 0 ? activeFilters.categoryIds[0] : undefined,
          isFeatured: activeFilters.isFeatured,
          isReturnable: activeFilters.isReturnable,
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

        const apiProducts = await ProductAPI.getAllProducts(filterParams);
        
        // Transform API products to BrowseProduct format
        const transformedProducts: BrowseProduct[] = apiProducts.map((product) => ({
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
          categoryId: product.categoryId
        }));

        setProducts(transformedProducts);
        setFilteredProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [
    activeFilters.searchQuery, 
    activeFilters.priceMin, 
    activeFilters.priceMax, 
    activeFilters.sortBy, 
    activeFilters.minRating, 
    activeFilters.productType, 
    JSON.stringify(activeFilters.brandIds), 
    JSON.stringify(activeFilters.categoryIds), 
    activeFilters.isFeatured, 
    activeFilters.isReturnable,
    activeFilters.inStock
  ]);

  // No client-side filtering needed - all filtering done by API
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleFilterChange = (newFilters: ActiveFilters) => {
    setActiveFilters(newFilters);
    
    // Update URL params to match filters
    const params = new URLSearchParams();
    
    // Convert productType to category name for URL
    if (newFilters.productType) {
      const categoryName = newFilters.productType === 'EYEGLASSES' ? 'Eyeglasses' 
        : newFilters.productType === 'SUNGLASSES' ? 'Sunglasses' 
        : newFilters.productType;
      params.set('category', categoryName);
    }
    if (newFilters.searchQuery) params.set('q', newFilters.searchQuery);
    if (newFilters.sortBy && newFilters.sortBy !== 'popular') params.set('sortBy', newFilters.sortBy);
    if (newFilters.priceMin) params.set('minPrice', newFilters.priceMin.toString());
    if (newFilters.priceMax) params.set('maxPrice', newFilters.priceMax.toString());
    if (newFilters.minRating) params.set('minRating', newFilters.minRating.toString());
    if (newFilters.brandIds && newFilters.brandIds.length > 0) {
      params.set('brandId', newFilters.brandIds[0]);
    }
    
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setActiveFilters({
      productType: undefined,
      brandIds: [],
      categoryIds: [],
      searchQuery: '',
      sortBy: 'popular'
    });
    setSearchParams({});
  };

  const handleSearch = (query: string) => {
    setActiveFilters(prev => ({ ...prev, searchQuery: query }));
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
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
            <div className="browse-search">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search glasses..."
                value={activeFilters.searchQuery || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>

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
            <ProductGrid 
              products={filteredProducts}
              onAddToFavorites={(id) => console.log('Add to favorites:', id)}
              viewMode={viewMode}
            />
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
