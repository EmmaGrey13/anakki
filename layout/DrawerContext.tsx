import { createContext, useContext } from 'react';

export const DrawerContext = createContext<{ openDrawer: () => void }>({
  openDrawer: () => {},
});

export const useDrawer = () => useContext(DrawerContext);