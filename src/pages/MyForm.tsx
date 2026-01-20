import { Box, Typography } from '@mui/material';
import { CustomCard } from '@/components/custom/CustomCard';
import { CustomButton } from '@/components/custom/CustomButton';
import { CustomTextField } from '@/components/custom/CustomTextField';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

export default function MyForm() {
  useLayoutConfig({ showNavbar: true, showFooter: true });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Form Section */}
      <Box sx={{ maxWidth: 500, mx: 'auto', mb: 6, px: 2, pt: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          Form Demo
        </Typography>
        
        <CustomTextField label="Email" sx={{ mb: 2 }} />
        <CustomTextField label="Password" type="password" sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <CustomButton>Submit</CustomButton>
          <CustomButton variant="outlined">Cancel</CustomButton>
        </Box>
      </Box>

      {/* Cards Section */}
      <Box sx={{ px: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
          Card Components
        </Typography>
        
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap',
            justifyContent: 'center',
            pb: 4,
          }}
        >
          <CustomCard
            image="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop"
            title="Technology"
            description="Egestas elit dui scelerisque ut eu purus aliquam vitae habitasse."
            linkText="More Info"
            onLinkClick={() => console.log('Card 1 clicked')}
          />

          <CustomCard
            image="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop"
            title="Product Feature"
            description="Discover amazing features that will transform your workflow and boost productivity."
            linkText="Learn More"
            onLinkClick={() => console.log('Card 2 clicked')}
          />

          <CustomCard
            title="No Image Card"
            description="This card has no image, so it shows the placeholder icon."
            linkText="View More"
          />
        </Box>
      </Box>
    </Box>
  );
}