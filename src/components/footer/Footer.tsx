// src/components/footer/Footer.tsx
import { Box, Container, Typography, Link, IconButton, Divider } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn, YouTube } from '@mui/icons-material';

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#ffffff',
        color: '#ffffff',
        pt: 6,
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 4,
            mb: 4,
          }}
        >
          {/* Company Info */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: '#000000',
              }}
            >
              GLASSIFY
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#383838',
                mb: 2,
                lineHeight: 1.7,
                fontSize: '15px',
              }}
            >
              Building innovative solutions to help businesses grow and succeed in the digital age.
            </Typography>
          </Box>

          {/* Product Links */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
              }}
            >
              Product
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Features
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                }}
              >
                Pricing
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Solutions
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Integrations
              </Link>
            </Box>
          </Box>

          {/* Company Links */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
              }}
            >
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                About Us
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Careers
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Blog
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Contact
              </Link>
            </Box>
          </Box>

          {/* Support Links */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
              }}
            >
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Help Center
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Documentation
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                underline="none"
                sx={{
                  color: '#383838',
                  '&:hover': { color: '#4a90e2' },
                  transition: 'color 0.3s',
                  fontSize: '15px',
                }}
              >
                Terms of Service
              </Link>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3 }} />
      </Container>
    </Box>
  );
}