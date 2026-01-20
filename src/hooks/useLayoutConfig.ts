import { useLayout } from '@/layouts/LayoutContext';
import { useEffect } from 'react';

interface LayoutConfig {
  showNavbar?: boolean;
  showFooter?: boolean;
}

export const useLayoutConfig = ({ showNavbar = true, showFooter = true }: LayoutConfig) => {
  const { setShowNavbar, setShowFooter } = useLayout();

  useEffect(() => {
    setShowNavbar(showNavbar);
    setShowFooter(showFooter);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [showNavbar, showFooter, setShowNavbar, setShowFooter]);
};