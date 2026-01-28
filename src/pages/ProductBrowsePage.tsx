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
    shapes: [],
    materials: [],
    colors: [],
    rimTypes: [],
    sizes: [],
    searchQuery: searchParams.get('q') || '',
    sortBy: 'popular'
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // TODO: Fetch products from API
    // Mock data
    const mockProducts: BrowseProduct[] = [
      {
        id: '1',
        slug: 'classic-rectangle-glasses',
        productId: 'PROD001',
        variantId: 'VAR001',
        name: 'Classic Rectangle Glasses',
        sku: '3217321',
        price: 15.95,
        rating: 4.5,
        reviewCount: 831,
        shape: 'Rectangle',
        material: 'Acetate',
        color: 'Black',
        rimType: 'Full Rim',
        size: 'Medium',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=Rectangle+Black',
        colorVariants: [
          { color: 'Black', colorCode: '#000000', slug: 'classic-rectangle-glasses', productId: 'PROD001', variantId: 'VAR001' },
          { color: 'Tortoise', colorCode: '#8B4513', slug: 'classic-rectangle-glasses', productId: 'PROD001', variantId: 'VAR002' },
          { color: 'Navy', colorCode: '#000080', slug: 'classic-rectangle-glasses', productId: 'PROD001', variantId: 'VAR003' }
        ],
        isBestSeller: true
      },
      {
        id: '2',
        slug: 'modern-round-glasses',
        productId: 'PROD002',
        variantId: 'VAR004',
        name: 'Modern Round Glasses',
        sku: '4328451',
        price: 18.95,
        rating: 4.7,
        reviewCount: 523,
        shape: 'Round',
        material: 'Metal',
        color: 'Tortoise',
        rimType: 'Full Rim',
        size: 'Small',
        image: 'https://placehold.co/300x200/D2691E/FFFFFF?text=Round+Tortoise',
        colorVariants: [
          { color: 'Tortoise', colorCode: '#D2691E', slug: 'modern-round-glasses', productId: 'PROD002', variantId: 'VAR004' },
          { color: 'Black', colorCode: '#000000', slug: 'modern-round-glasses', productId: 'PROD002', variantId: 'VAR005' }
        ],
        isNew: true
      },
      {
        id: '3',
        slug: 'square-titanium-frames',
        productId: 'PROD003',
        variantId: 'VAR006',
        name: 'Square Titanium Frames',
        sku: '5439562',
        price: 29.95,
        rating: 4.6,
        reviewCount: 892,
        shape: 'Square',
        material: 'Titanium',
        color: 'Gray',
        rimType: 'Full Rim',
        size: 'Large',
        image: 'https://placehold.co/300x200/808080/FFFFFF?text=Square+Gray',
        colorVariants: [
          { color: 'Gray', colorCode: '#808080', slug: 'square-titanium-frames', productId: 'PROD003', variantId: 'VAR006' },
          { color: 'Silver', colorCode: '#C0C0C0', slug: 'square-titanium-frames', productId: 'PROD003', variantId: 'VAR007' },
          { color: 'Black', colorCode: '#000000', slug: 'square-titanium-frames', productId: 'PROD003', variantId: 'VAR008' }
        ]
      },
      {
        id: '4',
        slug: 'cat-eye-acetate-glasses',
        productId: 'PROD004',
        variantId: 'VAR009',
        name: 'Cat Eye Acetate Glasses',
        sku: '6540673',
        price: 22.95,
        rating: 4.8,
        reviewCount: 645,
        shape: 'Cat Eye',
        material: 'Acetate',
        color: 'Brown',
        rimType: 'Full Rim',
        size: 'Medium',
        image: 'https://placehold.co/300x200/8B4513/FFFFFF?text=Cat+Eye+Brown',
        colorVariants: [
          { color: 'Brown', colorCode: '#8B4513', slug: 'cat-eye-acetate-glasses', productId: 'PROD004', variantId: 'VAR009' },
          { color: 'Black', colorCode: '#000000', slug: 'cat-eye-acetate-glasses', productId: 'PROD004', variantId: 'VAR010' },
          { color: 'Pink', colorCode: '#FFC0CB', slug: 'cat-eye-acetate-glasses', productId: 'PROD004', variantId: 'VAR011' }
        ]
      },
      {
        id: '5',
        slug: 'aviator-metal-glasses',
        productId: 'PROD005',
        variantId: 'VAR012',
        name: 'Aviator Metal Glasses',
        sku: '7651784',
        price: 24.95,
        rating: 4.9,
        reviewCount: 1024,
        shape: 'Aviator',
        material: 'Stainless Steel',
        color: 'Silver',
        rimType: 'Half Rim',
        size: 'Medium',
        image: 'https://placehold.co/300x200/C0C0C0/FFFFFF?text=Aviator+Silver',
        colorVariants: [
          { color: 'Silver', colorCode: '#C0C0C0', slug: 'aviator-metal-glasses', productId: 'PROD005', variantId: 'VAR012' },
          { color: 'Gold', colorCode: '#FFD700', slug: 'aviator-metal-glasses', productId: 'PROD005', variantId: 'VAR013' }
        ]
      },
      {
        id: '6',
        slug: 'oval-plastic-glasses',
        productId: 'PROD006',
        variantId: 'VAR014',
        name: 'Oval Plastic Glasses',
        sku: '8762895',
        price: 16.95,
        rating: 4.4,
        reviewCount: 412,
        shape: 'Oval',
        material: 'Plastic',
        color: 'Blue',
        rimType: 'Full Rim',
        size: 'Small',
        image: 'https://placehold.co/300x200/0000FF/FFFFFF?text=Oval+Blue',
        colorVariants: [
          { color: 'Blue', colorCode: '#0000FF', slug: 'oval-plastic-glasses', productId: 'PROD006', variantId: 'VAR014' },
          { color: 'Navy', colorCode: '#000080', slug: 'oval-plastic-glasses', productId: 'PROD006', variantId: 'VAR015' },
          { color: 'Green', colorCode: '#008000', slug: 'oval-plastic-glasses', productId: 'PROD006', variantId: 'VAR016' }
        ]
      },
      {
        id: '7',
        slug: 'browline-classic-glasses',
        productId: 'PROD007',
        variantId: 'VAR017',
        name: 'Browline Classic Glasses',
        sku: '9873906',
        price: 19.95,
        rating: 4.5,
        reviewCount: 756,
        shape: 'Browline',
        material: 'Acetate',
        color: 'Black',
        rimType: 'Half Rim',
        size: 'Medium',
        image: 'https://placehold.co/300x200/000000/FFFFFF?text=Browline+Black',
        colorVariants: [
          { color: 'Black', colorCode: '#000000', slug: 'browline-classic-glasses', productId: 'PROD007', variantId: 'VAR017' },
          { color: 'Brown', colorCode: '#8B4513', slug: 'browline-classic-glasses', productId: 'PROD007', variantId: 'VAR018' }
        ],
        isBestSeller: true
      },
      {
        id: '8',
        slug: 'rectangle-tr90-glasses',
        productId: 'PROD008',
        variantId: 'VAR019',
        name: 'Rectangle TR90 Glasses',
        sku: '1984017',
        price: 21.95,
        rating: 4.6,
        reviewCount: 589,
        shape: 'Rectangle',
        material: 'TR90',
        color: 'Navy',
        rimType: 'Full Rim',
        size: 'Large',
        image: 'https://placehold.co/300x200/000080/FFFFFF?text=Rectangle+Navy',
        colorVariants: [
          { color: 'Navy', colorCode: '#000080', slug: 'rectangle-tr90-glasses', productId: 'PROD008', variantId: 'VAR019' },
          { color: 'Black', colorCode: '#000000', slug: 'rectangle-tr90-glasses', productId: 'PROD008', variantId: 'VAR020' }
        ],
        isNew: true
      }
    ];

    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...products];

    // Search filter
    if (activeFilters.searchQuery) {
      const query = activeFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.shape.toLowerCase().includes(query) ||
        p.material.toLowerCase().includes(query) ||
        p.color.toLowerCase().includes(query)
      );
    }

    // Shape filter
    if (activeFilters.shapes.length > 0) {
      filtered = filtered.filter(p => activeFilters.shapes.includes(p.shape));
    }

    // Material filter
    if (activeFilters.materials.length > 0) {
      filtered = filtered.filter(p => activeFilters.materials.includes(p.material));
    }

    // Color filter
    if (activeFilters.colors.length > 0) {
      filtered = filtered.filter(p => activeFilters.colors.includes(p.color));
    }

    // Rim type filter
    if (activeFilters.rimTypes.length > 0) {
      filtered = filtered.filter(p => activeFilters.rimTypes.includes(p.rimType));
    }

    // Size filter
    if (activeFilters.sizes.length > 0) {
      filtered = filtered.filter(p => activeFilters.sizes.includes(p.size));
    }

    // Price filter
    if (activeFilters.priceMin !== undefined) {
      filtered = filtered.filter(p => p.price >= activeFilters.priceMin!);
    }
    if (activeFilters.priceMax !== undefined) {
      filtered = filtered.filter(p => p.price <= activeFilters.priceMax!);
    }

    // Sorting
    switch (activeFilters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'popular':
      default:
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    setFilteredProducts(filtered);
  }, [products, activeFilters]);

  const handleFilterChange = (newFilters: ActiveFilters) => {
    setActiveFilters(newFilters);
  };

  const handleClearFilters = () => {
    setActiveFilters({
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
              {activeFilters.category || 'All Eyeglasses'}
            </h1>
            <p className="results-count">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          {filteredProducts.length > 0 ? (
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
