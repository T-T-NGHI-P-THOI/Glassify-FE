import React, {useState, useEffect, useRef, useCallback} from 'react';
import { useLocation } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import {
  FilterList,
  ViewModule,
  ViewList,
  Sort,
  KeyboardArrowDown
} from '@mui/icons-material';
import FilterSidebar from '../../components/ProductBrowse/FilterSidebar';
import ProductGrid from '../../components/ProductBrowse/ProductGrid';
import type { FilterOptions, ActiveFilters, BrowseProduct } from '../../types/filter';
import ProductAPI, { type ProductFilterParams } from '../../api/product-api';
import './ProductBrowsePage.css';
import type { ProductType } from '@/api/service/Type';
import { Box, Button, Checkbox, Chip, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Color, type FrameShape } from '@/types/user-recommendation.enum';

const DdButton = styled(Button)({
  height: 36,
  padding: '0 12px',
  fontSize: 13,
  fontWeight: 400,
  color: 'inherit',
  border: '1px solid #c4bbbb',
  borderRadius: 8,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  background: '#fff',
  '&:hover': { background: '#f5f5f5', border: '1px solid #e0e0e0' },
});

const shapes: FrameShape[] = [
  'RECTANGLE', 'ROUND', 'OVAL', 'SQUARE',
  'CAT_EYE', 'AVIATOR', 'BROWLINE', 'GEOMETRIC'
];

const colorOptions: { val: Color; hex: string }[] = [
  { val: Color.BLACK, hex: '#1a1a1a' },
  { val: Color.WHITE, hex: '#e5e5e5' },
  { val: Color.GOLD, hex: '#c8a84b' },
  { val: Color.SILVER, hex: '#a8a9ad' },
  { val: Color.BROWN, hex: '#8b6914' },
  { val: Color.BLUE, hex: '#2563eb' },
  { val: Color.RED, hex: '#dc2626' },
  { val: Color.PINK, hex: '#ec4899' },
  { val: Color.GREEN, hex: '#16a34a' },
  { val: Color.TRANSPARENT, hex: '#dbeafe' },
];

const normalizeProductTypeParam = (value?: string | null): ProductType | undefined => {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  if (normalized === 'FRAME') return 'FRAME';
  if (normalized === 'ACCESSORIES') return 'ACCESSORIES';
  if (normalized === 'LENSES' || normalized === 'LENS' || normalized === 'LENSES') return 'LENSES';
  return undefined;
};

const ProductBrowsePage: React.FC = () => {
  const defaultShopCities = [
    'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương',
    'Đồng Nai', 'Quảng Ninh', 'Khánh Hòa', 'Nghệ An', 'Thanh Hóa', 'Thừa Thiên Huế'
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [products, setProducts] = useState<BrowseProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<BrowseProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    productTypes: ['FRAME', 'LENSES', 'ACCESSORIES'],
    brands: [],
    categories: [],
    shopCities: defaultShopCities,
    ageGroups: ['KIDS', 'TEENS', 'ADULTS', 'SENIORS'],
    priceRange: { min: 0, max: 500 },
    ratings: [0, 1, 2, 3, 4]
  });

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    productType: normalizeProductTypeParam(searchParams.get('productType')),
    brandIds: searchParams.get('brandId') ? [searchParams.get('brandId')!] : [],
    categoryNames: searchParams.get('categoryName') ? [searchParams.get('categoryName')!] : [],
    shopCities: searchParams.get('shopCity') ? [searchParams.get('shopCity')!] : [],
    searchQuery: searchParams.get('q') || '',
    sortBy: (searchParams.get('sortBy') as ActiveFilters['sortBy']) || 'popular',
    priceMax: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    priceMin: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined,
    colors: searchParams.getAll('colors').length > 0 ? searchParams.getAll('colors') : undefined,
    frameShapes: searchParams.get('frameShapes') ? [searchParams.get('frameShapes')!] : undefined,
    ageGroups: searchParams.get('ageGroups') ? searchParams.get('ageGroups')!.split(',') : undefined,
  });

  useEffect(() => {

    if (location.state && location.state.resetFilters) {
      if (location.state.resetFilters === 'FRAME') {
        setActiveFilters({
          productType: 'FRAME',
          brandIds: [],
          categoryNames: [],
          shopCities: [],
          searchQuery: '',
          sortBy: 'popular'
        });
        setSearchParams({ productType: 'FRAME' });
      } else if (location.state.resetFilters === 'LENSES') {
        setActiveFilters({
          productType: 'LENSES',
          brandIds: [],
          categoryNames: [],
          shopCities: [],
          searchQuery: '',
          sortBy: 'popular'
        });
        setSearchParams({ productType: 'LENSES' });
      } else {
        setActiveFilters({
          productType: undefined,
          brandIds: [],
          categoryNames: [location.state.resetFilters],
          shopCities: [],
          searchQuery: '',
          sortBy: 'popular'
        });
        setSearchParams({ category: location.state.resetFilters });
      }

      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      return;
    }

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

        // Handle productType (FRAME, LENSES, ACCESSORIES)
        if (productType) {
          updates.productType = normalizeProductTypeParam(productType);
        }

        // Handle category name - set it to categoryNames array for API filtering
        if (category) {
          updates.categoryNames = [category];
        }

        if (shopCity) {
          updates.shopCities = [shopCity];
        }

        const ageGroupsParam = searchParams.get('ageGroups');
        if (ageGroupsParam) {
          updates.ageGroups = ageGroupsParam.split(',');
        }

        return { ...prev, ...updates };
      });
    }
  }, [searchParams, location.state]);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [typeOpen, setTypeOpen] = useState<HTMLElement | null>(null);
  const [shapeOpen, setShapeOpen] = useState<HTMLElement | null>(null);
  const [colorOpen, setColorOpen] = useState<HTMLElement | null>(null);
  const [typeAnchor, setTypeAnchor] = useState<null | HTMLElement>(null);
  const [shapeAnchor, setShapeAnchor] = useState<null | HTMLElement>(null);
  const [colorAnchor, setColorAnchor] = useState<null | HTMLElement>(null);
  const [ageAnchor, setAgeAnchor] = useState<null | HTMLElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const ageRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!typeRef.current?.contains(e.target as Node)) setTypeOpen(null);
      if (!shapeRef.current?.contains(e.target as Node)) setShapeOpen(null);
      if (!colorRef.current?.contains(e.target as Node)) setColorOpen(null);
      if (!ageRef.current?.contains(e.target as Node)) setAgeAnchor(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        // Only send one of productType or categoryName
        let filterParams: ProductFilterParams = {
          search: activeFilters.searchQuery || undefined,
          minPrice: activeFilters.priceMin !== undefined ? activeFilters.priceMin : undefined,
          maxPrice: activeFilters.priceMax !== undefined ? activeFilters.priceMax : undefined,
          isActive: true,
          minRating: activeFilters.minRating || undefined,
          brandId: activeFilters.brandIds.length > 0 ? activeFilters.brandIds[0] : undefined,
          isFeatured: activeFilters.isFeatured,
          isReturnable: activeFilters.isReturnable,
          page: currentPage,
          unitPerPage: PAGE_SIZE,
          frameShapes: activeFilters.frameShapes || undefined,
          colors: activeFilters.colors || undefined,
          ageGroups: activeFilters.ageGroups || undefined,
        };
        if (activeFilters.productType) {
          filterParams.productType = activeFilters.productType;
        } else if (activeFilters.categoryNames.length > 0) {
          filterParams.categoryName = activeFilters.categoryNames[0];
        }

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
        const transformedProducts = apiProducts.map((product) => {
          const productLocation = extractProductLocation(product);
          const productImage = ProductAPI.getPrimaryImageUrl(product);

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
            image: productImage,
            colorVariants: [],
            isFeatured: product.isFeatured,
            isNew: false,
            stockQuantity: product.stockQuantity,
            brandId: product.brandId,
            categoryId: product.categoryId,
            categoryName: product.categoryName,
            shopId: product.shopId,
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
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [activeFilters.searchQuery, activeFilters.priceMin, activeFilters.priceMax, activeFilters.sortBy, activeFilters.minRating, activeFilters.productType, activeFilters.isFeatured, activeFilters.isReturnable, activeFilters.inStock, activeFilters.brandIds, activeFilters.categoryNames, activeFilters.frameShapes, activeFilters.colors, activeFilters.ageGroups]);

  // Load more products when reaching bottom
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasNextPage) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      let filterParams : ProductFilterParams = {
        search: activeFilters.searchQuery || undefined,
        minPrice: activeFilters.priceMin !== undefined ? activeFilters.priceMin : undefined,
        maxPrice: activeFilters.priceMax !== undefined ? activeFilters.priceMax : undefined,
        isActive: true,
        minRating: activeFilters.minRating || undefined,
        productType: activeFilters.productType || undefined,
        categoryName: activeFilters.categoryNames.length > 0 ? activeFilters.categoryNames[0] : undefined,
        brandId: activeFilters.brandIds.length > 0 ? activeFilters.brandIds[0] : undefined,
        isFeatured: activeFilters.isFeatured,
        isReturnable: activeFilters.isReturnable,
        page: nextPage,
        unitPerPage: PAGE_SIZE,
        frameShapes: activeFilters.frameShapes || undefined,
        colors: activeFilters.colors || undefined,
        ageGroups: activeFilters.ageGroups || undefined,
      };
      if (activeFilters.productType) {
        filterParams.productType = activeFilters.productType;
      } else if (activeFilters.categoryNames.length > 0) {
        filterParams.categoryName = activeFilters.categoryNames[0];
      }

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

      const transformedProducts = apiProducts.map((product) => {
        const productLocation = extractProductLocation(product);
        const productImage = ProductAPI.getPrimaryImageUrl(product);

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
          image: productImage,
          colorVariants: [],
          isFeatured: product.isFeatured,
          isNew: false,
          stockQuantity: product.stockQuantity,
          brandId: product.brandId,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          shopId: product.shopId,
          shopCity: productLocation.city,
          shopAddress: productLocation.address
        };
      });

      setProducts(prev => [...prev, ...transformedProducts]);
      setCurrentPage(nextPage);
      setHasNextPage(transformedProducts.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, isLoadingMore, activeFilters.searchQuery, activeFilters.priceMin, activeFilters.priceMax, activeFilters.sortBy, activeFilters.minRating, activeFilters.productType, activeFilters.isFeatured, activeFilters.isReturnable, activeFilters.brandIds, activeFilters.categoryNames, activeFilters.frameShapes, activeFilters.colors, activeFilters.ageGroups]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading && !isLoadingMore && hasNextPage) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [loadMore, isLoading, isLoadingMore, hasNextPage]);
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
    setActiveFilters(newFilters);

    // Update URL params to match filters
    const params = new URLSearchParams();

    // Only set one of productType or category
    if (newFilters.productType) {
      params.set('productType', newFilters.productType);
    } else if (newFilters.categoryNames && newFilters.categoryNames.length > 0) {
      params.set('category', newFilters.categoryNames[0]);
    }

    if (newFilters.searchQuery) params.set('q', newFilters.searchQuery);
    if (newFilters.sortBy && newFilters.sortBy !== 'popular') params.set('sortBy', newFilters.sortBy);
    if (newFilters.priceMin !== undefined) params.set('minPrice', newFilters.priceMin.toString());
    if (newFilters.priceMax !== undefined) params.set('maxPrice', newFilters.priceMax.toString());
    if (newFilters.minRating) params.set('minRating', newFilters.minRating.toString());
    if (newFilters.brandIds && newFilters.brandIds.length > 0) {
      params.set('brandId', newFilters.brandIds[0]);
    }
    if (newFilters.shopCities && newFilters.shopCities.length > 0) {
      params.set('shopCity', newFilters.shopCities[0]);
    }
    if (newFilters.frameShapes?.length) {
      newFilters.frameShapes.forEach(s => params.append('frameShapes', s));
    }
    if (newFilters.colors?.length) {
      newFilters.colors.forEach(c => params.append('colors', c));
    }
    if (newFilters.ageGroups?.length) {
      params.set('ageGroups', newFilters.ageGroups.join(','));
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setActiveFilters({
      productType: undefined,
      brandIds: [],
      categoryNames: [],
      shopCities: [],
      ageGroups: [],
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
              {/* Product Type */}
              <DdButton
                onClick={e => setTypeAnchor(e.currentTarget)}
                endIcon={<KeyboardArrowDown fontSize="small" />}
              >
                {activeFilters.productType
                  ? activeFilters.productType.charAt(0) + activeFilters.productType.slice(1).toLowerCase()
                  : 'All types'}
              </DdButton>
              <Menu
                anchorEl={typeAnchor}
                open={Boolean(typeAnchor)}
                onClose={() => setTypeAnchor(null)}
                slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 2, minWidth: 160 } } }}
              >
                {[
                  { val: undefined, label: 'All types' },
                  { val: 'FRAME' as ProductType, label: 'Frames' },
                  { val: 'LENSES' as ProductType, label: 'Lenses' },
                  { val: 'ACCESSORIES' as ProductType, label: 'Accessories' },
                ].map(opt => (
                  <MenuItem
                    key={opt.label}
                    selected={activeFilters.productType === opt.val}
                    sx={{ fontSize: 13 }}
                    onClick={() => {
                      handleFilterChange({ ...activeFilters, productType: opt.val, frameShapes: [] });
                      setTypeAnchor(null);
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </Menu>

              {/* Frame Shape */}
              {(!activeFilters.productType || activeFilters.productType === 'FRAME') && (
                <>
                  <DdButton
                    onClick={e => setShapeAnchor(e.currentTarget)}
                    endIcon={
                      activeFilters.frameShapes?.length
                        ? <Chip label={activeFilters.frameShapes.length} size="small" sx={{
                          height: 18, fontSize: 11, ml: 0.5,
                          '& .MuiChip-label': {
                            fontSize: 14,
                            lineHeight: '18px',
                          },
                        }} />
                        : <KeyboardArrowDown fontSize="small" />
                    }
                  >
                    Frame shape
                  </DdButton>
                  <Menu
                    anchorEl={shapeAnchor}
                    open={Boolean(shapeAnchor)}
                    onClose={() => setShapeAnchor(null)}
                    slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 2, minWidth: 180 } } }}
                  >
                    {shapes.map(shape => {
                      const checked = activeFilters.frameShapes?.includes(shape as any) ?? false;
                      return (
                        <MenuItem
                          key={shape}
                          sx={{ fontSize: 13, py: 0.5 }}
                          onClick={() => {
                            const prev = activeFilters.frameShapes ?? [];
                            const next = checked ? prev.filter(s => s !== shape) : [...prev, shape as any];
                            handleFilterChange({ ...activeFilters, frameShapes: next });
                          }}
                        >
                          <Checkbox checked={checked} size="small" sx={{ p: 0, mr: 1 }} />
                          {shape.charAt(0) + shape.slice(1).toLowerCase().replace(/_/g, ' ')}
                        </MenuItem>
                      );
                    })}
                  </Menu>
                </>
              )}

              {/* Color */}
              <DdButton
                onClick={e => setColorAnchor(e.currentTarget)}
                endIcon={
                  activeFilters.colors?.length ? (
                    <Chip label={activeFilters.colors.length} size="small" sx={{
                      height: 18, fontSize: 11, ml: 0.5,
                      '& .MuiChip-label': {
                        fontSize: 14,
                        lineHeight: '18px',
                      },
                    }} />
                  ) : (
                    <KeyboardArrowDown fontSize="small" />
                  )
                }
              >
                Color
              </DdButton>

              <Menu
                anchorEl={colorAnchor}
                open={Boolean(colorAnchor)}
                onClose={() => setColorAnchor(null)}
                slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 2, minWidth: 180 } } }}
              >
                {colorOptions.map(({ val, hex }) => {
                  const checked = activeFilters.colors?.includes(val) ?? false;

                  return (
                    <MenuItem
                      key={val}
                      sx={{ fontSize: 13, py: 0.5 }}
                      onClick={() => {
                        const prev = activeFilters.colors ?? [];
                        const next = checked ? prev.filter(c => c !== val) : [...prev, val];
                        handleFilterChange({ ...activeFilters, colors: next });
                      }}
                    >
                      <Checkbox checked={checked} size="small" sx={{ p: 0, mr: 1 }} />
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: hex,
                          border: '1px solid rgba(0,0,0,.15)',
                          display: 'inline-block',
                          mr: 1,
                          flexShrink: 0,
                        }}
                      />
                      {val.charAt(0) + val.slice(1).toLowerCase()}
                    </MenuItem>
                  );
                })}
              </Menu>

              {/* Age Group (moved from sidebar) */}
              <div ref={ageRef} style={{ display: 'inline-block' }}>
                <DdButton
                  onClick={e => setAgeAnchor(e.currentTarget)}
                  endIcon={
                    activeFilters.ageGroups?.length ? (
                      <Chip label={activeFilters.ageGroups.length} size="small" sx={{
                        height: 18, fontSize: 11, ml: 0.5,
                        '& .MuiChip-label': {
                          fontSize: 14,
                          lineHeight: '18px',
                        },
                      }} />
                    ) : (
                      <KeyboardArrowDown fontSize="small" />
                    )
                  }
                >
                  Age group
                </DdButton>

                <Menu
                  anchorEl={ageAnchor}
                  open={Boolean(ageAnchor)}
                  onClose={() => setAgeAnchor(null)}
                  slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 2, minWidth: 180 } } }}
                >
                  {(filterOptions.ageGroups || []).map(group => {
                    const checked = activeFilters.ageGroups?.includes(group) ?? false;
                    return (
                      <MenuItem
                        key={group}
                        sx={{ fontSize: 13, py: 0.5 }}
                        onClick={() => {
                          const prev = activeFilters.ageGroups ?? [];
                          const next = checked ? prev.filter(g => g !== group) : [...prev, group];
                          handleFilterChange({ ...activeFilters, ageGroups: next });
                        }}
                      >
                        <Checkbox checked={checked} size="small" sx={{ p: 0, mr: 1 }} />
                        {group}
                      </MenuItem>
                    );
                  })}
                </Menu>
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
              Showing {filteredProducts.length} products
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
              <div ref={observerTarget} style={{ height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px' }}>
                {isLoadingMore && (
                  <p style={{ fontSize: '14px', color: '#666' }}>Loading more products...</p>
                )}
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
