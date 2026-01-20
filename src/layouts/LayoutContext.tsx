import { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextType {
  showNavbar: boolean;
  showFooter: boolean;
  setShowNavbar: (show: boolean) => void;
  setShowFooter: (show: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [showNavbar, setShowNavbar] = useState(true);
  const [showFooter, setShowFooter] = useState(true);

  return (
    <LayoutContext.Provider value={{ showNavbar, showFooter, setShowNavbar, setShowFooter }}>
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