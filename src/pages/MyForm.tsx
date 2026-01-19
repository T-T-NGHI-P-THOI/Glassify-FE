import { Box, Typography } from '@mui/material';
import { CustomCard } from '@/components/custom/CustomCard';
import { CustomButton } from '@/components/custom/CustomButton';
import { CustomTextField } from '@/components/custom/CustomTextField';

export default function MyForm() {
  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Form Section */}
      <Box sx={{ maxWidth: 500, mx: 'auto', mb: 6 }}>
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
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
        Card Components
      </Typography>
      
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <CustomCard
          title="Title"
          description="Egestas elit dui scelerisque ut eu purus aliquam vitae habitasse."
          linkText="More Info"
          onLinkClick={() => console.log('Card 1 clicked')}
        />

        <CustomCard
          title="Product Feature"
          description="Discover amazing features that will transform your workflow and boost productivity."
          linkText="Learn More"
          onLinkClick={() => console.log('Card 2 clicked')}
        />

        <CustomCard
          title="Documentation"
          description="Comprehensive guides and tutorials to help you get started quickly."
          linkText="Read Docs"
          linkHref="/docs"
        />
      </Box>
    </Box>
  );
}