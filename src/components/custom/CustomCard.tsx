import { Card, CardContent, CardMedia, Typography, Link, Box } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { type FC } from 'react';

interface CustomCardProps {
  image?: string;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
  onLinkClick?: () => void;
}

export const CustomCard: FC<CustomCardProps> = ({
  image,
  title,
  description,
  linkText = 'More Info',
  linkHref = '#',
  onLinkClick,
}) => {
  return (
    <Card
      sx={{
        maxWidth: 280,
        borderRadius: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transform: 'translateY(-4px)',
        },
      }}
    >
      {/* Image */}
      {image ? (
        <CardMedia
          component="img"
          height="180"
          image={image}
          alt={title}
          sx={{
            objectFit: 'cover',
          }}
        />
      ) : (
        <CardMedia
          sx={{
            height: 180,
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              border: '3px solid white',
              borderRadius: 1,
              position: 'relative',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                backgroundColor: 'white',
              },
              '&::before': {
                width: '100%',
                height: '3px',
                top: '50%',
                left: 0,
                transform: 'translateY(-50%) rotate(45deg)',
              },
              '&::after': {
                width: '100%',
                height: '3px',
                top: '50%',
                left: 0,
                transform: 'translateY(-50%) rotate(-45deg)',
              },
            }}
          />
        </CardMedia>
      )}

      <CardContent sx={{ p: 3 }}>
        {/* Title */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            fontSize: '1.125rem',
            color: '#111827',
          }}
        >
          {title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: '#6b7280',
            mb: 2,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>

        {/* Link */}
        <Link
          href={linkHref}
          onClick={onLinkClick}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: '#2563eb',
            fontWeight: 600,
            fontSize: '0.9375rem',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#1d4ed8',
              gap: 1,
            },
          }}
        >
          {linkText}
          <ArrowForward sx={{ fontSize: '1rem' }} />
        </Link>
      </CardContent>
    </Card>
  );
};