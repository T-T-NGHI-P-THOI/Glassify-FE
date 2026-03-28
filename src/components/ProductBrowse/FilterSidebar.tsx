import React from 'react';
import ReactDOM from 'react-dom';
import { 
  ExpandMore, 
  ExpandLess, 
  Search,
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
  const vietnamProvinceCities = React.useMemo(
    () => [
      'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh',
      'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
      'Cần Thơ', 'Cao Bằng', 'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên',
      'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội',
      'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên',
      'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn',
      'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận',
      'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh',
      'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
      'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP.HCM', 'Trà Vinh', 'Tuyên Quang',
      'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
    ],
    []
  );
  const locationOptions = React.useMemo(
    () => Array.from(new Set([...vietnamProvinceCities, ...filterOptions.shopCities])).sort((a, b) => a.localeCompare(b, 'vi')),
    [filterOptions.shopCities, vietnamProvinceCities]
  );
  const initialLocationCount = 8;
  const moreLocationCount = 16;
  const [showMoreLocations, setShowMoreLocations] = React.useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = React.useState(false);
  const [locationSearchKeyword, setLocationSearchKeyword] = React.useState('');
  const locationLetterRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const normalizeText = React.useCallback((value: string) => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  }, []);

  const getAlphabetKey = React.useCallback((city: string) => {
    const trimmed = city.trim();
    if (!trimmed) {
      return '#';
    }

    const firstChar = trimmed[0].toUpperCase();
    if (firstChar === 'Đ') {
      return 'Đ';
    }

    const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedFirst = normalized[0]?.toUpperCase() ?? '#';

    if (normalizedFirst >= 'A' && normalizedFirst <= 'Z') {
      return normalizedFirst;
    }

    return '#';
  }, []);

  const alphabetOrder = React.useMemo(
    () => [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), 'Đ', '#'],
    []
  );
  const visibleLocationOptions = React.useMemo(() => {
    if (showMoreLocations) {
      return locationOptions.slice(0, moreLocationCount);
    }
    return locationOptions.slice(0, initialLocationCount);
  }, [locationOptions, showMoreLocations]);
  const canShowMoreLocations =
    !showMoreLocations && locationOptions.length > initialLocationCount;
  const canShowAllLocations =
    showMoreLocations && locationOptions.length > moreLocationCount;

  const filteredLocationOptions = React.useMemo(() => {
    const keyword = normalizeText(locationSearchKeyword.trim());
    if (!keyword) {
      return locationOptions;
    }

    return locationOptions.filter(city => normalizeText(city).includes(keyword));
  }, [locationOptions, locationSearchKeyword, normalizeText]);

  const groupedLocationOptions = React.useMemo(() => {
    const groups = new Map<string, string[]>();

    filteredLocationOptions.forEach(city => {
      const key = getAlphabetKey(city);
      const current = groups.get(key) ?? [];
      groups.set(key, [...current, city]);
    });

    return Array.from(groups.entries()).sort(
      ([left], [right]) => alphabetOrder.indexOf(left) - alphabetOrder.indexOf(right)
    );
  }, [alphabetOrder, filteredLocationOptions, getAlphabetKey]);

  const visibleAlphabetKeys = React.useMemo(
    () => groupedLocationOptions.map(([key]) => key),
    [groupedLocationOptions]
  );

  const handleAlphabetJump = (key: string) => {
    const section = locationLetterRefs.current[key];
    if (!section) {
      return;
    }
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const locationDialog = isLocationDialogOpen ? (
    <div className="location-dialog-backdrop" onClick={() => setIsLocationDialogOpen(false)}>
      <div className="location-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="location-dialog-header">
          <h4>Tinh / Thanh pho</h4>
          <button
            type="button"
            className="location-dialog-close-btn"
            onClick={() => setIsLocationDialogOpen(false)}
          >
            <Close fontSize="small" />
          </button>
        </div>
        <div className="location-dialog-toolbar">
          <div className="location-search-box">
            <Search className="location-search-icon" fontSize="small" />
            <input
              type="text"
              className="location-search-input"
              placeholder="Ban muon mua hang tu Tinh / Thanh pho nao?"
              value={locationSearchKeyword}
              onChange={(e) => setLocationSearchKeyword(e.target.value)}
            />
          </div>
        </div>
        <div className="location-dialog-content">
          <div className="location-dialog-list">
            {groupedLocationOptions.length > 0 ? (
              groupedLocationOptions.map(([key, cities]) => (
                <div
                  key={key}
                  className="location-letter-section"
                  ref={(element) => {
                    locationLetterRefs.current[key] = element;
                  }}
                >
                  <h5 className="location-letter-title">{key}</h5>
                  <div className="location-letter-grid">
                    {cities.map(city => (
                      <label key={city} className="filter-option">
                        <input
                          type="checkbox"
                          checked={activeFilters.shopCities?.includes(city)}
                          onChange={() => handleLocationChange(city)}
                        />
                        <span>{city}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="location-empty-state">Khong tim thay tinh / thanh pho phu hop.</p>
            )}
          </div>
          <div className="location-alphabet-index">
            {visibleAlphabetKeys.map(key => (
              <button
                key={key}
                type="button"
                className="location-alphabet-btn"
                onClick={() => handleAlphabetJump(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
        <div className="location-dialog-footer">
          <button
            type="button"
            className="location-text-btn"
            onClick={() => {
              setLocationSearchKeyword('');
              setIsLocationDialogOpen(false);
            }}
          >
            Dong
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const [expandedSections, setExpandedSections] = React.useState<{[key: string]: boolean}>({
    brand: true,
    location: true,
    category: true,
    price: true,
    rating: true,
    features: true
  });

  const [priceMinInput, setPriceMinInput] = React.useState<string>(
    activeFilters.priceMin !== undefined ? String(activeFilters.priceMin) : ''
  );
  const [priceMaxInput, setPriceMaxInput] = React.useState<string>(
    activeFilters.priceMax !== undefined ? String(activeFilters.priceMax) : ''
  );

  // Keep local input values in sync when filters are changed externally.
  React.useEffect(() => {
    setPriceMinInput(activeFilters.priceMin !== undefined ? String(activeFilters.priceMin) : '');
    setPriceMaxInput(activeFilters.priceMax !== undefined ? String(activeFilters.priceMax) : '');
  }, [activeFilters.priceMin, activeFilters.priceMax]);

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

  const handleLocationChange = (city: string) => {
    const currentCities = activeFilters.shopCities || [];
    const newCities = currentCities.includes(city)
      ? currentCities.filter(name => name !== city)
      : [...currentCities, city];

    onFilterChange({
      ...activeFilters,
      shopCities: newCities
    });
  };

  const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
    const onlyDigits = value.replace(/[^\d]/g, '');
    if (type === 'min') {
      setPriceMinInput(onlyDigits);
      return;
    }
    setPriceMaxInput(onlyDigits);
  };

  const parsedPriceMin = priceMinInput ? Number(priceMinInput) : undefined;
  const parsedPriceMax = priceMaxInput ? Number(priceMaxInput) : undefined;
  const hasInvalidPriceRange =
    parsedPriceMin !== undefined &&
    parsedPriceMax !== undefined &&
    parsedPriceMin > parsedPriceMax;

  const handleApplyPriceRange = () => {
    if (hasInvalidPriceRange) {
      return;
    }

    onFilterChange({
      ...activeFilters,
      priceMin: parsedPriceMin,
      priceMax: parsedPriceMax
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

  const handleRemoveLocation = (city: string) => {
    const newCities = activeFilters.shopCities?.filter(name => name !== city) || [];
    onFilterChange({ ...activeFilters, shopCities: newCities });
  };

  const handleClearPrice = () => {
    setPriceMinInput('');
    setPriceMaxInput('');
    onFilterChange({ ...activeFilters, priceMin: undefined, priceMax: undefined });
  };

  const handleClearRating = () => {
    onFilterChange({ ...activeFilters, minRating: undefined });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.brandIds?.length) count += activeFilters.brandIds.length;
    if (activeFilters.categoryNames?.length) count += activeFilters.categoryNames.length;
    if (activeFilters.shopCities?.length) count += activeFilters.shopCities.length;
    if (activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined) count++;
    if (activeFilters.minRating) count++;
    if (activeFilters.isFeatured) count++;
    if (activeFilters.isReturnable) count++;
    if (activeFilters.inStock) count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();
  const getPriceTagLabel = () => {
    const hasMin = activeFilters.priceMin !== undefined;
    const hasMax = activeFilters.priceMax !== undefined;

    if (hasMin && hasMax) {
      return `₫${activeFilters.priceMin} - ₫${activeFilters.priceMax}`;
    }
    if (hasMin) {
      return `From ₫${activeFilters.priceMin}`;
    }
    if (hasMax) {
      return `Up to ₫${activeFilters.priceMax}`;
    }
    return '';
  };

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

            {/* Location tags */}
            {activeFilters.shopCities?.map(city => (
              <div key={city} className="filter-tag">
                <span>{city}</span>
                <button onClick={() => handleRemoveLocation(city)} className="filter-tag-remove">
                  <Close fontSize="small" />
                </button>
              </div>
            ))}

            {/* Price tag */}
            {(activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined) && (
              <div className="filter-tag">
                <span>{getPriceTagLabel()}</span>
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

        {/* Shop Location Filter */}
        {locationOptions.length > 0 && (
          <div className="filter-section">
            <button
              className="filter-section-header"
              onClick={() => toggleSection('location')}
            >
              <span>Shop Location</span>
              {expandedSections.location ? <ExpandLess /> : <ExpandMore />}
            </button>
            {expandedSections.location && (
              <div className="filter-options">
                {visibleLocationOptions.map(city => (
                  <label key={city} className="filter-option">
                    <input
                      type="checkbox"
                      checked={activeFilters.shopCities?.includes(city)}
                      onChange={() => handleLocationChange(city)}
                    />
                    <span>{city}</span>
                  </label>
                ))}
                {(canShowMoreLocations || canShowAllLocations) && (
                  <div className="location-action-row">
                    {canShowMoreLocations && (
                      <button
                        type="button"
                        className="location-text-btn"
                        onClick={() => setShowMoreLocations(true)}
                      >
                        Them &gt;
                      </button>
                    )}
                    {canShowAllLocations && (
                      <button
                        type="button"
                        className="location-text-btn"
                        onClick={() => setIsLocationDialogOpen(true)}
                      >
                        Khac &gt;
                      </button>
                    )}
                  </div>
                )}
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
              <div className="price-inputs">
                <div className="price-input-group">
                  <input
                    type="number"
                    value={priceMinInput}
                    onChange={(e) => handlePriceInputChange('min', e.target.value)}
                    placeholder="₫ FROM"
                    min={0}
                  />
                </div>
                <span className="price-separator">-</span>
                <div className="price-input-group">
                  <input
                    type="number"
                    value={priceMaxInput}
                    onChange={(e) => handlePriceInputChange('max', e.target.value)}
                    placeholder="₫ TO"
                    min={0}
                  />
                </div>
              </div>
              {hasInvalidPriceRange && (
                <span className="price-validation-error">Max price must be greater than or equal to min price.</span>
              )}
              <div className="price-actions">
                <button
                  className="price-apply-btn"
                  onClick={handleApplyPriceRange}
                  disabled={hasInvalidPriceRange}
                >
                  Apply
                </button>
                <button
                  className="price-reset-btn"
                  onClick={handleClearPrice}
                  type="button"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {typeof document !== 'undefined' && locationDialog
        ? ReactDOM.createPortal(locationDialog, document.body)
        : null}
    </div>
  );
};

export default FilterSidebar;
