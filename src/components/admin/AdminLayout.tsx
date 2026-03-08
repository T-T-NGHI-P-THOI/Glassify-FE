import { useEffect } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from '../sidebar/Sidebar';
import { useLayout } from '../../layouts/LayoutContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenu?: string;
}

export const AdminLayout = ({ children, activeMenu }: AdminLayoutProps) => {
  const { setShowNavbar, setShowFooter } = useLayout();

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar activeMenu={activeMenu} />
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
};
