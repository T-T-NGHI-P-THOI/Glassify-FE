import React from 'react';
import { 
  ExpandMore, 
  ExpandLess, 
  Close
} from '@mui/icons-material';
import MuiSlider from '@mui/material/Slider';
import type { FilterOptions, ActiveFilters } from '../../types/filter';
import './FilterSidebar.css';

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
  onClearFilters: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filterOptions,
  activeFilters,
  onFilterChange,
  onClearFilters,
  isMobileOpen,
  onMobileClose
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{[key: string]: boolean}>({
    brand: true,
    category: true,
    price: true,
    rating: true,
    features: true
  });

  const [priceRange, setPriceRange] = React.useState<number[]>([
    activeFilters.priceMin ?? filterOptions.priceRange.min,
    activeFilters.priceMax ?? filterOptions.priceRange.max
  ]);

  // Update local state when activeFilters change
  React.useEffect(() => {
    setPriceRange([
      activeFilters.priceMin ?? filterOptions.priceRange.min,
      activeFilters.priceMax ?? filterOptions.priceRange.max
    ]);
  }, [activeFilters.priceMin, activeFilters.priceMax, filterOptions.priceRange]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleBrandChange = (brandId: string) => {
    const currentBrands = activeFilters.brandIds || [];
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter(id => id !== brandId)
      : [...currentBrands, brandId];
    
    onFilterChange({
      ...activeFilters,
      brandIds: newBrands
    });
  };

  const handleCategoryChange = (categoryName: string) => {
    const currentCategories = activeFilters.categoryNames || [];
    const newCategories = currentCategories.includes(categoryName)
      ? currentCategories.filter(name => name !== categoryName)
      : [...currentCategories, categoryName];
    
    onFilterChange({
      ...activeFilters,
      categoryNames: newCategories
    });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFilterChange({
      ...activeFilters,
      [type === 'min' ? 'priceMin' : 'priceMax']: numValue
    });
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handleSliderCommitted = (event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    const [min, max] = newValue as number[];
    onFilterChange({
      ...activeFilters,
      priceMin: min === filterOptions.priceRange.min ? undefined : min,
      priceMax: max === filterOptions.priceRange.max ? undefined : max
    });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...activeFilters,
      minRating: activeFilters.minRating === rating ? undefined : rating
    });
  };

  const handleFeatureToggle = (feature: 'isFeatured' | 'isReturnable' | 'inStock') => {
    const currentValue = activeFilters[feature];
    onFilterChange({
      ...activeFilters,
      [feature]: currentValue ? undefined : true
    });
  };

  const handleRemoveBrand = (brandId: string) => {
    const newBrands = activeFilters.brandIds?.filter(id => id !== brandId) || [];
    onFilterChange({ ...activeFilters, brandIds: newBrands });
  };

  const handleRemoveCategory = (categoryName: string) => {
    const newCategories = activeFilters.categoryNames?.filter(name => name !== categoryName) || [];
    onFilterChange({ ...activeFilters, categoryNames: newCategories });
  };

  const handleClearPrice = () => {
    onFilterChange({ ...activeFilters, priceMin: undefined, priceMax: undefined });
  };

  const handleClearRating = () => {
    onFilterChange({ ...activeFilters, minRating: undefined });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.brandIds?.length) count += activeFilters.brandIds.length;
    if (activeFilters.categoryNames?.length) count += activeFilters.categoryNames.length;
    if (activeFilters.priceMin || activeFilters.priceMax) count++;
    if (activeFilters.minRating) count++;
    if (activeFilters.isFeatured) count++;
    if (activeFilters.isReturnable) count++;
    if (activeFilters.inStock) count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  return (
    <div className={`filter-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="filter-header">
        <div className="filter-title-section">
          <h3>Filters</h3>
          {activeCount > 0 && (
            <span className="active-count">({activeCount})</span>
          )}
        </div>
        <div className="filter-actions">
          {activeCount > 0 && (
            <button className="clear-all-btn" onClick={onClearFilters}>
              Clear All
            </button>
          )}
          {isMobileOpen && onMobileClose && (
            <button className="close-mobile-btn" onClick={onMobileClose}>
              <Close />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Tags */}
      {activeCount > 0 && (
        <div className="active-filters-section">
          <div className="active-filters-header">
            <span className="active-filters-title">Active Filters:</span>
          </div>
          <div className="active-filters-tags">
            {/* Brand tags */}
            {activeFilters.brandIds?.map(brandId => {
              const brand = filterOptions.brands.find(b => b.id === brandId);
              return brand ? (
                <div key={brandId} className="filter-tag">
                  <span>{brand.name}</span>
                  <button onClick={() => handleRemoveBrand(brandId)} className="filter-tag-remove">
                    <Close fontSize="small" />
                  </button>
                </div>
              ) : null;
            })}

            {/* Price tag */}
            {(activeFilters.priceMin || activeFilters.priceMax) && (
              <div className="filter-tag">
                <span>
                  ${activeFilters.priceMin ?? filterOptions.priceRange.min} - 
                  ${activeFilters.priceMax ?? filterOptions.priceRange.max}
                </span>
                <button onClick={handleClearPrice} className="filter-tag-remove">
                  <Close fontSize="small" />
                </button>
              </div>
            )}

            {/* Rating tag */}
            {activeFilters.minRating !== undefined && (
              <div className="filter-tag">
                <span>{activeFilters.minRating === 0 ? 'No stars' : `${activeFilters.minRating}+ sao`}</span>
                <button onClick={handleClearRating} className="filter-tag-remove">
                  <Close fontSize="small" />
                </button>
              </div>
            )}

            {/* Feature tags */}
            {activeFilters.isFeatured && (
              <div className="filter-tag">
                <span>Featured</span>
                <button onClick={() => handleFeatureToggle('isFeatured')} className="filter-tag-remove">
                  <Close fontSize="small" />
                </button>
              </div>
            )}

            {activeFilters.isReturnable && (
              <div className="filter-tag">
                <span>Returnable</span>
                <button onClick={() => handleFeatureToggle('isReturnable')} className="filter-tag-remove">
                  <Close fontSize="small" />
                </button>
              </div>
            )}

            {activeFilters.inStock && (
              <div className="filter-tag">
                <span>In Stock</span>
                <button onClick={() => handleFeatureToggle('inStock')} className="filter-tag-remove">
                  <Close fontSize="small" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="filter-content">
        {/* Brand Filter */}
        {filterOptions.brands.length > 0 && (
          <div className="filter-section">
            <button 
              className="filter-section-header"
              onClick={() => toggleSection('brand')}
            >
              <span>Brand</span>
              {expandedSections.brand ? <ExpandLess /> : <ExpandMore />}
            </button>
            {expandedSections.brand && (
              <div className="filter-options">
                {filterOptions.brands.map(brand => (
                  <label key={brand.id} className="filter-option">
                    <input
                      type="checkbox"
                      checked={activeFilters.brandIds?.includes(brand.id)}
                      onChange={() => handleBrandChange(brand.id)}
                    />
                    <span>{brand.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        
        {/* Rating Filter */}
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('rating')}
          >
            <span>Minimum Rating</span>
            {expandedSections.rating ? <ExpandLess /> : <ExpandMore />}
          </button>
          {expandedSections.rating && (
            <div className="filter-options">
              {filterOptions.ratings.map(rating => (
                <label key={rating} className="filter-option">
                  <input
                    type="radio"
                    name="rating"
                    checked={activeFilters.minRating === rating}
                    onChange={() => handleRatingChange(rating)}
                  />
                  <span>{rating === 0 ? 'No stars' : `${rating}+ stars`}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Features Filter */}
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('features')}
          >
            <span>Features</span>
            {expandedSections.features ? <ExpandLess /> : <ExpandMore />}
          </button>
          {expandedSections.features && (
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.isFeatured || false}
                  onChange={() => handleFeatureToggle('isFeatured')}
                />
                <span>Featured Items</span>
              </label>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.isReturnable || false}
                  onChange={() => handleFeatureToggle('isReturnable')}
                />
                <span>Returnable</span>
              </label>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.inStock || false}
                  onChange={() => handleFeatureToggle('inStock')}
                />
                <span>In Stock</span>
              </label>
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('price')}
          >
            <span>Price Range</span>
            {expandedSections.price ? <ExpandLess /> : <ExpandMore />}
          </button>
          {expandedSections.price && (
            <div className="filter-options">
              <div className="price-slider-container">
                <MuiSlider
                  value={priceRange}
                  onChange={handleSliderChange}
                  onChangeCommitted={handleSliderCommitted}
                  valueLabelDisplay="auto"
                  min={filterOptions.priceRange.min}
                  max={filterOptions.priceRange.max}
                  valueLabelFormat={(value) => `$${value}`}
                  sx={{
                    color: '#1976d2',
                    '& .MuiSlider-thumb': {
                      width: 20,
                      height: 20,
                    },
                    '& .MuiSlider-valueLabel': {
                      fontSize: 12,
                      fontWeight: 'normal',
                      top: -6,
                      backgroundColor: 'unset',
                      color: '#1976d2',
                      '&:before': {
                        display: 'none',
                      },
                      '& *': {
                        background: 'transparent',
                        color: '#000',
                      },
                    },
                  }}
                />
              </div>
              <div className="price-inputs">
                <div className="price-input-group">
                  <label className="price-input-label">MIN</label>
                  <input
                    type="number"
                    value={activeFilters.priceMin ?? priceRange[0]}
                    onChange={(e) => handlePriceChange('min', e.target.value)}
                    min={filterOptions.priceRange.min}
                    max={filterOptions.priceRange.max}
                  />
                </div>
                <span className="price-separator">-</span>
                <div className="price-input-group">
                  <label className="price-input-label">MAX</label>
                  <input
                    type="number"
                    value={activeFilters.priceMax ?? priceRange[1]}
                    onChange={(e) => handlePriceChange('max', e.target.value)}
                    min={filterOptions.priceRange.min}
                    max={filterOptions.priceRange.max}
                  />
                </div>
              </div>
              <div className="price-quick-filters">
                <button 
                  className="price-quick-btn"
                  onClick={() => onFilterChange({ 
                    ...activeFilters, 
                    priceMin: undefined, 
                    priceMax: 100
                  })}
                >
                  Under $100
                </button>
                <button 
                  className="price-quick-btn"
                  onClick={() => onFilterChange({ 
                    ...activeFilters, 
                    priceMin: 100, 
                    priceMax: 300
                  })}
                >
                  $100 - $300
                </button>
                <button 
                  className="price-quick-btn"
                  onClick={() => onFilterChange({ 
                    ...activeFilters, 
                    priceMin: 300, 
                    priceMax: undefined 
                  })}
                >
                  Over $300
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
