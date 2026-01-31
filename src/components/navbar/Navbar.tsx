import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  TextField,
  Badge,
  Button,
  Container,
  InputAdornment,
  Chip,
} from "@mui/material";
import {
  Search,
  ShoppingCart,
  Person,
  Favorite,
  Help,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const cartItemCount = 3;

  const mainCategories = [
    { label: 'Eyeglasses', path: '/products', category: 'Eyeglasses' },
    { label: 'Sunglasses', path: '/products', category: 'Sunglasses' },
    { label: 'Lenses', path: '/lens', category: null },
    { label: 'Sports', path: '/sports', category: null },
    { label: 'Collabs & Partners', path: '/collabs', category: null },
    { label: '✨ Discover', path: '/discover', special: true, category: null },
    { label: '🏷️ Sale', path: '/sale', special: true, category: null },
  ];

  const filterTags = [
    { icon: '💰', label: 'Under $30', filter: 'price', value: '30' },
    { icon: '✨', label: 'New Arrivals', filter: 'new', value: 'true' },
    { icon: '🔥', label: 'Best Sellers', filter: 'sort', value: 'popular' },
    { icon: '⭐', label: 'Top Rated', filter: 'sort', value: 'rating' },
    { icon: '▭', label: 'Rectangle', filter: 'shape', value: 'Rectangle' },
    { icon: '⬭', label: 'Oversized', filter: 'size', value: 'Oversized' },
    { icon: '🐢', label: 'Tortoiseshell', filter: 'color', value: 'Tortoise' },
    { icon: '😺', label: 'Cat Eye', filter: 'shape', value: 'Cat Eye' },
    { icon: '💎', label: 'Premium', filter: 'featured', value: 'true' },
    { icon: '🏷️', label: 'On Sale', filter: 'sale', value: 'true' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (item: typeof mainCategories[0]) => {
    if (item.category) {
      navigate(`${item.path}?category=${encodeURIComponent(item.category)}`);
    } else {
      navigate(item.path);
    }
  };

  const handleFilterTagClick = (tag: typeof filterTags[0]) => {
    const params = new URLSearchParams();
    
    switch (tag.filter) {
      case 'price':
        params.set('maxPrice', tag.value);
        break;
      case 'new':
        params.set('sortBy', 'newest');
        break;
      case 'sort':
        params.set('sortBy', tag.value);
        break;
      case 'shape':
        params.set('shape', tag.value);
        break;
      case 'size':
        params.set('size', tag.value);
        break;
      case 'color':
        params.set('color', tag.value);
        break;
      case 'featured':
        params.set('featured', tag.value);
        break;
      case 'sale':
        params.set('sale', tag.value);
        break;
    }
    
    navigate(`/products?${params.toString()}`);
  };

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          color: "#000000",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Container maxWidth="xl">
          {/* Top Toolbar */}
          <Toolbar
            sx={{
              justifyContent: "space-between",
              py: 1.5,
              minHeight: "70px !important",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                fontWeight: 800,
                fontSize: "25px",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              GLASSIFY
            </Box>

            {/* Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                flexGrow: 1,
                maxWidth: 500,
                mx: 4,
                display: { xs: "none", md: "block" },
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search glasses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#6b7280", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" sx={{ p: "6px" }}>
                        <Search sx={{ color: "#6b7280", fontSize: 20 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "24px",
                    backgroundColor: "#f9fafb",
                    "& fieldset": {
                      borderColor: "#e5e7eb",
                    },
                    "&:hover fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#ffffff",
                      borderWidth: "1px",
                    },
                  },
                }}
              />
            </Box>

            {/* Right Icons */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <IconButton
                size="small"
                sx={{
                  flexDirection: "column",
                  color: "#1f2937",
                  borderRadius: 1,
                }}
              >
                <Person sx={{ fontSize: 24 }} />
                <Box sx={{ fontSize: "0.7rem", mt: 0.25 }}>Login</Box>
              </IconButton>

              <IconButton
                size="small"
                sx={{
                  flexDirection: "column",
                  color: "#1f2937",
                  borderRadius: 1,
                }}
              >
                <Favorite sx={{ fontSize: 24 }} />
                <Box sx={{ fontSize: "0.7rem", mt: 0.25 }}>Favorites</Box>
              </IconButton>

              <IconButton
                size="small"
                sx={{
                  flexDirection: "column",
                  color: "#1f2937",
                  borderRadius: 1,
                }}
              >
                <Help sx={{ fontSize: 24 }} />
                <Box sx={{ fontSize: "0.7rem", mt: 0.25 }}>Help</Box>
              </IconButton>

              <IconButton
                size="small"
                sx={{
                  flexDirection: "column",
                  color: "#1f2937",
                  borderRadius: 1,
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "#dc2626",
                    },
                  }}
                >
                  <ShoppingCart sx={{ fontSize: 24 }} />
                </Badge>
                <Box sx={{ fontSize: "0.7rem", mt: 0.25 }}>Cart</Box>
              </IconButton>
            </Box>
          </Toolbar>

          {/* Main Navigation */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              gap: 0.5,
              py: 1,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            {mainCategories.map((item) => (
              <Button
                key={item.path + item.label}
                onClick={() => handleCategoryClick(item)}
                sx={{
                  backgroundColor: "transparent",
                  color: item.special ? "#000000" : "#000000",
                  fontWeight: item.special ? 600 : 500,
                  px: 2,
                  py: 0.75,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  boxShadow: "none",
                  ":hover": {
                    boxShadow: "none",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "20px",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Filter Tags */}
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              justifyContent: "center",
              gap: 1,
              py: 1.5,
              borderTop: "1px solid #e5e7eb",
              flexWrap: "wrap",
            }}
          >
            {filterTags.map((tag, index) => (
              <Chip
                key={index}
                icon={<span style={{ fontSize: "1rem" }}>{tag.icon}</span>}
                label={tag.label}
                variant="outlined"
                onClick={() => handleFilterTagClick(tag)}
                sx={{
                  borderColor: "#d1d5db",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                    borderColor: '#0f766e',
                    color: '#0f766e',
                  },
                }}
              />
            ))}
          </Box>

          {/* Mobile Search */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: { xs: "block", md: "none" },
              pb: 2,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search glasses"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "24px",
                  backgroundColor: "#f9fafb",
                },
              }}
            />
          </Box>
        </Container>
      </AppBar>
    </>
  );
};
