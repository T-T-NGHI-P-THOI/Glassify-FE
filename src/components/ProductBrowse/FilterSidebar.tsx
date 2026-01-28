import React from 'react';
import { 
  ExpandMore, 
  ExpandLess, 
  Close 
} from '@mui/icons-material';
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
    shape: true,
    material: true,
    color: true,
    rimType: true,
    size: true,
    price: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCheckboxChange = (filterType: keyof ActiveFilters, value: string) => {
    const currentValues = activeFilters[filterType] as string[] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange({
      ...activeFilters,
      [filterType]: newValues
    });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFilterChange({
      ...activeFilters,
      [type === 'min' ? 'priceMin' : 'priceMax']: numValue
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.shapes.length) count += activeFilters.shapes.length;
    if (activeFilters.materials.length) count += activeFilters.materials.length;
    if (activeFilters.colors.length) count += activeFilters.colors.length;
    if (activeFilters.rimTypes.length) count += activeFilters.rimTypes.length;
    if (activeFilters.sizes.length) count += activeFilters.sizes.length;
    if (activeFilters.priceMin || activeFilters.priceMax) count++;
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

      <div className="filter-content">
        {/* Shape Filter */}
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('shape')}
          >
            <span>Frame Shape</span>
            {expandedSections.shape ? <ExpandLess /> : <ExpandMore />}
          </button>
          {expandedSections.shape && (
            <div className="filter-options">
              {filterOptions.shapes.map(shape => (
                <label key={shape} className="filter-option">
                  <input
                    type="checkbox"
                    checked={activeFilters.shapes.includes(shape)}
                    onChange={() => handleCheckboxChange('shapes', shape)}
                  />
                  <span>{shape}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Material Filter */}
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('material')}
          >
            <span>Material</span>
            {expandedSections.material ? <ExpandLess /> : <ExpandMore />}
          </button>
          {expandedSections.material && (
            <div className="filter-options">
              {filterOptions.materials.map(material => (
                <label key={material} className="filter-option">
                  <input
                    type="checkbox"
                    checked={activeFilters.materials.includes(material)}
                    onChange={() => handleCheckboxChange('materials', material)}
                  />
                  <span>{material}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Color Filter */}
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('color')}
          >
            <span>Color</span>
            {expandedSections.color ? <ExpandLess /> : <ExpandMore />}
          </button>
          {expandedSections.color && (
            <div className="filter-options">
              {filterOptions.colors.map(color => (
                <label key={color} className="filter-option">
                  <input
                    type="checkbox"
                    checked={activeFilters.colors.includes(color)}
                    onChange={() => handleCheckboxChange('colors', color)}
                  />
                  <span className="color-option">
                    <span 
                      className="color-swatch" 
                      style={{ backgroundColor: getColorCode(color) }}
                    ></span>
                    {color}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rim Type Filter */}
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('rimType')}
          >
            <span>Rim Type</span>
            {expandedSections.rimType ? <ExpandLess /> : <ExpandMore />}
          </button>
          {expandedSections.rimType && (
            <div className="filter-options">
              {filterOptions.rimTypes.map(rimType => (
                <label key={rimType} className="filter-option">
                  <input
                    type="checkbox"
                    checked={activeFilters.rimTypes.includes(rimType)}
                    onChange={() => handleCheckboxChange('rimTypes', rimType)}
                  />
                  <span>{rimType}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Size Filter */}
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('size')}
          >
            <span>Size</span>
            {expandedSections.size ? <ExpandLess /> : <ExpandMore />}
          </button>
          {expandedSections.size && (
            <div className="filter-options">
              {filterOptions.sizes.map(size => (
                <label key={size} className="filter-option">
                  <input
                    type="checkbox"
                    checked={activeFilters.sizes.includes(size)}
                    onChange={() => handleCheckboxChange('sizes', size)}
                  />
                  <span>{size}</span>
                </label>
              ))}
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
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder={`Min $${filterOptions.priceRange.min}`}
                  value={activeFilters.priceMin || ''}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  min={filterOptions.priceRange.min}
                  max={filterOptions.priceRange.max}
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  placeholder={`Max $${filterOptions.priceRange.max}`}
                  value={activeFilters.priceMax || ''}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  min={filterOptions.priceRange.min}
                  max={filterOptions.priceRange.max}
                />
              </div>
              <div className="price-quick-filters">
                <button 
                  className="price-quick-btn"
                  onClick={() => onFilterChange({ 
                    ...activeFilters, 
                    priceMin: undefined, 
                    priceMax: 20 
                  })}
                >
                  Under $20
                </button>
                <button 
                  className="price-quick-btn"
                  onClick={() => onFilterChange({ 
                    ...activeFilters, 
                    priceMin: 20, 
                    priceMax: 50 
                  })}
                >
                  $20 - $50
                </button>
                <button 
                  className="price-quick-btn"
                  onClick={() => onFilterChange({ 
                    ...activeFilters, 
                    priceMin: 50, 
                    priceMax: undefined 
                  })}
                >
                  Over $50
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get color codes
const getColorCode = (colorName: string): string => {
  const colorMap: {[key: string]: string} = {
    'Black': '#000000',
    'Brown': '#8B4513',
    'Tortoise': '#D2691E',
    'Blue': '#0000FF',
    'Navy': '#000080',
    'Gray': '#808080',
    'Silver': '#C0C0C0',
    'Gold': '#FFD700',
    'Red': '#FF0000',
    'Pink': '#FFC0CB',
    'Purple': '#800080',
    'Green': '#008000',
    'Clear': '#FFFFFF'
  };
  return colorMap[colorName] || '#CCCCCC';
};

export default FilterSidebar;
