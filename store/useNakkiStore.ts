import { create } from 'zustand';

type NakkiState = {
  isNakkiActive: boolean;
  setNakkiActive: (active: boolean) => void;
};

export const useNakkiStore = create<NakkiState>((set) => ({
  isNakkiActive: false,
  setNakkiActive: (active: boolean) => set({ isNakkiActive: active }),
}));