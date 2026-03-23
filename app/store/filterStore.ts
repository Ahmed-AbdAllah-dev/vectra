// store/filterStore.ts
import { create } from 'zustand';

export type SectionKey = 'allProduct' | 'newArrival' | 'bestSeller' | 'onDiscount';

export interface FilterState {
  // Active filters
  selectedCategory: string;
  selectedNewArrival: string;
  selectedBestSeller: string;
  selectedDiscount: string;
  
  // UI state
  expandedSections: Record<SectionKey, boolean>;
  
  // categories

  // Actions
  setSelectedCategory: (category: string) => void;
  setSelectedNewArrival: (timeframe: string) => void;
  setSelectedBestSeller: (timeframe: string) => void;
  setSelectedDiscount: (discount: string) => void;
  toggleSection: (section: SectionKey) => void;
  clearAllFilters: () => void;
  clearFilter: (filterType: SectionKey) => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  // Initial state
  selectedCategory: '',
  selectedNewArrival: '',
  selectedBestSeller: '',
  selectedDiscount: '',
 
  expandedSections: {
    allProduct: false,
    newArrival: false,
    bestSeller: false,
    onDiscount: false,
  },

  // Actions
  setSelectedCategory: (category: string) =>
    set((state) => ({
      selectedCategory: state.selectedCategory === category ? '' : category,
    })),

  setSelectedNewArrival: (timeframe: string) =>
    set((state) => ({
      selectedNewArrival: state.selectedNewArrival === timeframe ? '' : timeframe,
    })),

  setSelectedBestSeller: (timeframe: string) =>
    set((state) => ({
      selectedBestSeller: state.selectedBestSeller === timeframe ? '' : timeframe,
    })),

  setSelectedDiscount: (discount: string) =>
    set((state) => ({
      selectedDiscount: state.selectedDiscount === discount ? '' : discount,
    })),

  toggleSection: (section: SectionKey) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section],
      },
    })),

  clearAllFilters: () =>
    set({
      selectedCategory: '',
      selectedNewArrival: '',
      selectedBestSeller: '',
      selectedDiscount: '',
    }),

  clearFilter: (filterType: SectionKey) =>
    set((state) => {
      switch (filterType) {
        case 'allProduct':
          return { selectedCategory: '' };
        case 'newArrival':
          return { selectedNewArrival: '' };
        case 'bestSeller':
          return { selectedBestSeller: '' };
        case 'onDiscount':
          return { selectedDiscount: '' };
        default:
          return state;
      }
    }),
}));

// Selector hooks for better performance
export const useSelectedFilters = () => {
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const selectedNewArrival = useFilterStore((state) => state.selectedNewArrival);
  const selectedBestSeller = useFilterStore((state) => state.selectedBestSeller);
  const selectedDiscount = useFilterStore((state) => state.selectedDiscount);

  return {
    selectedCategory,
    selectedNewArrival,
    selectedBestSeller,
    selectedDiscount,
  };
};

export const useActiveFiltersCount = () => {
  const filters = useSelectedFilters();
  return Object.values(filters).filter(Boolean).length;
};