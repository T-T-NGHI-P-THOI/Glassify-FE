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
  const [filterOptions] = useState<FilterOptions>({
    categories: ['Eyeglasses', 'Sunglasses', 'Reading Glasses', 'Blue Light Glasses'],
    shapes: ['Rectangle', 'Round', 'Square', 'Cat Eye', 'Aviator', 'Oval', 'Browline'],
    materials: ['Acetate', 'Metal', 'Titanium', 'Stainless Steel', 'Plastic', 'TR90'],
    colors: ['Black', 'Brown', 'Tortoise', 'Blue', 'Navy', 'Gray', 'Silver', 'Gold', 'Clear'],
    rimTypes: ['Full Rim', 'Half Rim', 'Rimless'],
    sizes: ['Extra Small', 'Small', 'Medium', 'Large', 'Extra Large'],
    priceRange: { min: 0, max: 200 }
  });

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    category: searchParams.get('category') || undefined,
    shapes: searchParams.get('shape') ? [searchParams.get('shape')!] : [],
    materials: [],
    colors: searchParams.get('color') ? [searchParams.get('color')!] : [],
    rimTypes: [],
    sizes: searchParams.get('size') ? [searchParams.get('size')!] : [],
    searchQuery: searchParams.get('q') || '',
    sortBy: (searchParams.get('sortBy') as ActiveFilters['sortBy']) || 'popular',
    priceMax: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from API with filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);

        // Build filter params from activeFilters
        const filterParams: ProductFilterParams = {
          search: activeFilters.searchQuery || undefined,
          minPrice: activeFilters.priceMin ? activeFilters.priceMin : undefined,
          maxPrice: activeFilters.priceMax ? activeFilters.priceMax : undefined,
          isActive: true, // Only show active products
          minRating: activeFilters.minRating || undefined,
          productType: activeFilters.category ? mapCategoryToProductType(activeFilters.category) : undefined,
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
          shape: 'Rectangle', // Default value - update if you have this data
          material: 'Acetate', // Default value - update if you have this data
          color: 'Black', // Default value - update if you have this data
          rimType: 'Full Rim', // Default value - update if you have this data
          size: 'Medium', // Default value - update if you have this data
          image: 'https://placehold.co/300x200/000000/FFFFFF?text=' + encodeURIComponent(product.name),
          colorVariants: [],
          isBestSeller: product.isFeatured,
          isNew: false
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
  }, [activeFilters.searchQuery, activeFilters.priceMin, activeFilters.priceMax, activeFilters.sortBy, activeFilters.minRating, activeFilters.category]);

  // Apply client-side filters for attributes not supported by backend
  useEffect(() => {
    let filtered = [...products];

    // Shape filter (client-side only)
    if (activeFilters.shapes.length > 0) {
      filtered = filtered.filter(p => activeFilters.shapes.includes(p.shape));
    }

    // Material filter (client-side only)
    if (activeFilters.materials.length > 0) {
      filtered = filtered.filter(p => activeFilters.materials.includes(p.material));
    }

    // Color filter (client-side only)
    if (activeFilters.colors.length > 0) {
      filtered = filtered.filter(p => activeFilters.colors.includes(p.color));
    }

    // Rim type filter (client-side only)
    if (activeFilters.rimTypes.length > 0) {
      filtered = filtered.filter(p => activeFilters.rimTypes.includes(p.rimType));
    }

    // Size filter (client-side only)
    if (activeFilters.sizes.length > 0) {
      filtered = filtered.filter(p => activeFilters.sizes.includes(p.size));
    }

    setFilteredProducts(filtered);
  }, [products, activeFilters.shapes, activeFilters.materials, activeFilters.colors, activeFilters.rimTypes, activeFilters.sizes]);

  const handleFilterChange = (newFilters: ActiveFilters) => {
    setActiveFilters(newFilters);
  };

  const handleClearFilters = () => {
    setActiveFilters({
      category: undefined,
      shapes: [],
      materials: [],
      colors: [],
      rimTypes: [],
      sizes: [],
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

  const handleCategoryClick = (category: string | undefined) => {
    setActiveFilters(prev => ({ ...prev, category }));
    if (category) {
      setSearchParams({ category });
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete('category');
      setSearchParams(params);
    }
  };

  // Map category name to API productType
  const mapCategoryToProductType = (category: string): 'EYEGLASSES' | 'SUNGLASSES' | 'ACCESSORIES' | undefined => {
    const categoryMap: Record<string, 'EYEGLASSES' | 'SUNGLASSES' | 'ACCESSORIES'> = {
      'Eyeglasses': 'EYEGLASSES',
      'Sunglasses': 'SUNGLASSES',
      'Reading Glasses': 'EYEGLASSES',
      'Blue Light Glasses': 'EYEGLASSES',
    };
    return categoryMap[category];
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
          {/* Category Filter Buttons */}
          <div className="category-filter-section">
            {filterOptions.categories.map((category) => (
              <button
                key={category}
                className={`category-filter-btn ${activeFilters.category === category ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
            {activeFilters.category && (
              <button
                className="category-filter-btn clear"
                onClick={() => handleCategoryClick(undefined)}
              >
                Clear Category
              </button>
            )}
          </div>

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
              {activeFilters.category || 'All Eyeglasses'}
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
