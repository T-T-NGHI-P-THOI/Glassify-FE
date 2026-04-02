import { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextType {
  showNavbar: boolean;
  showFooter: boolean;
  showNavCategories: boolean;
  setShowNavbar: (show: boolean) => void;
  setShowFooter: (show: boolean) => void;
  setShowNavCategories: (show: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [showNavbar, setShowNavbar] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showNavCategories, setShowNavCategories] = useState(true);

  return (
    <LayoutContext.Provider value={{ showNavbar, showFooter, showNavCategories, setShowNavbar, setShowFooter, setShowNavCategories }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
};