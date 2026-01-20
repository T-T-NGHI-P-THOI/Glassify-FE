import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { useLayout } from './LayoutContext';
import { Footer } from '@/components/footer/Footer';
import { Navbar } from '@/components/navbar/Navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { showNavbar, showFooter } = useLayout();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {showNavbar && <Navbar />}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: '#ffffff',
        }}
      >
        {children}
      </Box>
      
      {showFooter && <Footer />}
    </Box>
  );
};