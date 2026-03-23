'use client'
import React, { useState } from 'react';
import { ChevronDown, Home, Music, Smartphone, HardDrive, Clock, TrendingUp, Percent, LucideIcon, X, BookOpen, Dumbbell, Shirt, ShoppingBasket, Sparkles, ToyBrick, Filter, Check } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Import store hooks conditionally to avoid errors
let useFilterStore: any, useSelectedFilters: any, useActiveFiltersCount: any;
type SectionKey = any;

try {
  const store = require('../store/filterStore');
  useFilterStore = store.useFilterStore;
  useSelectedFilters = store.useSelectedFilters;
  useActiveFiltersCount = store.useActiveFiltersCount;
  const key = store.SectionKey;
} catch (e) {
  // Store not available (for search page)
  useFilterStore = () => ({});
  useSelectedFilters = () => ({});
  useActiveFiltersCount = () => 0;
}

interface CategoryOption {
  label: string;
  icon?: LucideIcon;
}

interface Category {
  id: string;
  icon?: LucideIcon | null;
  label: string;
  count?: number;
  hasDropdown: boolean;
  isActive?: boolean;
  options?: CategoryOption[];
}

interface ProductSidebarFilterProps {
  isMobile?: boolean;
  // For search page usage
  searchMode?: boolean;
  filters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  // For home page usage (with store)
  useStore?: boolean;
}

const ProductSidebarFilter: React.FC<ProductSidebarFilterProps> = ({ 
  isMobile = false, 
  searchMode = false,
  filters = {},
  onFilterChange = () => {},
  onClearFilters = () => {},
  useStore = false
}) => {
  const [selectedDropdown, setSelectedDropdown] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // For home page with store
  const storeExpandedSections = useStore ? useFilterStore((state: any) => state.expandedSections) : {};
  const toggleSection = useStore ? useFilterStore((state: any) => state.toggleSection) : () => {};
  const clearAllFilters = useStore ? useFilterStore((state: any) => state.clearAllFilters) : () => {};
  const clearFilter = useStore ? useFilterStore((state: any) => state.clearFilter) : () => {};
  
  // For home page with store
  const {
    selectedCategory,
    selectedNewArrival,
    selectedBestSeller,
    selectedDiscount,
  } = useStore ? useSelectedFilters() : {
    selectedCategory: '',
    selectedNewArrival: '',
    selectedBestSeller: '',
    selectedDiscount: ''
  };

  const activeFiltersCount = useStore ? useActiveFiltersCount() : Object.values(filters).filter(Boolean).length;

  // For home page with store
  const setSelectedCategory = useStore ? useFilterStore((state: any) => state.setSelectedCategory) : () => {};
  const setSelectedNewArrival = useStore ? useFilterStore((state: any) => state.setSelectedNewArrival) : () => {};
  const setSelectedBestSeller = useStore ? useFilterStore((state: any) => state.setSelectedBestSeller) : () => {};
  const setSelectedDiscount = useStore ? useFilterStore((state: any) => state.setSelectedDiscount) : () => {};

  const handleOptionSelect = (section: string, option: string) => {
    if (searchMode) {
      onFilterChange(section, option);
    } else if (useStore) {
      switch (section) {
        case 'allProduct':
          setSelectedCategory(option);
          break;
        case 'newArrival':
          setSelectedNewArrival(option);
          break;
        case 'bestSeller':
          setSelectedBestSeller(option);
          break;
        case 'onDiscount':
          setSelectedDiscount(option);
          break;
      }
    }
    setSelectedDropdown(null);
  };

  const handleClearFilter = (section: string) => {
    if (searchMode) {
      onFilterChange(section, '');
    } else if (useStore) {
      clearFilter(section);
    }
  };

  const getSelectedValue = (section: string): string => {
    if (searchMode) {
      return filters[section] || '';
    } else if (useStore) {
      switch (section) {
        case 'allProduct':
          return selectedCategory;
        case 'newArrival':
          return selectedNewArrival;
        case 'bestSeller':
          return selectedBestSeller;
        case 'onDiscount':
          return selectedDiscount;
        default:
          return '';
      }
    }
    return '';
  };

  const categories: Category[] = [
    {
      id: searchMode ? 'category' : 'allProduct',
      icon: null,
      label: 'All Product',
      hasDropdown: true,
      isActive: searchMode ? !!filters.category : !!selectedCategory,
      options: [
        { label: 'Beauty', icon: Sparkles },
        { label: 'Grocery', icon: ShoppingBasket },
        { label: 'Electronics', icon: Smartphone },
        { label: 'Sports', icon: Dumbbell },
        { label: 'Home & Kitchen', icon: Home },
        { label: 'Clothing', icon: Shirt },
        { label: 'Books', icon: BookOpen },
        { label: 'Toys', icon: ToyBrick }
      ]
    },
    {
      id: searchMode ? 'newArrival' : 'newArrival',
      icon: Clock,
      label: 'New Arrival',
      hasDropdown: true,
      isActive: searchMode ? !!filters.newArrival : !!selectedNewArrival,
      options: [
        { label: 'This Week' },
        { label: 'This Month' },
        { label: 'Last 30 Days' },
        { label: 'Last 90 Days' }
      ]
    },
    {
      id: searchMode ? 'bestSeller' : 'bestSeller',
      icon: TrendingUp,
      label: 'Best Seller',
      hasDropdown: true,
      isActive: searchMode ? !!filters.bestSeller : !!selectedBestSeller,
      options: [
        { label: 'This Month' },
        { label: 'Past 3 Months' },
        { label: 'Past 6 Months' },
        { label: 'This Year' },
        { label: 'All Time' }
      ]
    },
    {
      id: searchMode ? 'discount' : 'onDiscount',
      icon: Percent,
      label: 'On Discount',
      hasDropdown: true,
      isActive: searchMode ? !!filters.discount : !!selectedDiscount,
      options: [
        { label: '10% or more' },
        { label: '20% or more' },
        { label: '30% or more' },
        { label: '50% or more' },
        { label: '70% or more' }
      ]
    }
  ];

  // Mobile Filter Modal Component
  const MobileFilterModal = () => (
    <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-10 px-3"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-md h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={useStore ? clearAllFilters : onClearFilters}
                className="text-red-600 hover:text-red-700 h-auto p-1"
              >
                Clear All
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="px-6 py-3 border-b bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const selectedValue = getSelectedValue(category.id);
                if (!selectedValue) return null;
                
                return (
                  <Badge key={category.id} variant="destructive" className="flex items-center gap-1">
                    <span>{category.label}: {selectedValue}</span>
                    <button
                      onClick={() => handleClearFilter(category.id)}
                      className="hover:bg-red-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters Content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const selectedValue = getSelectedValue(category.id);
              const isDropdownOpen = selectedDropdown === category.id;
              
              return (
                <div key={category.id} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() => setSelectedDropdown(isDropdownOpen ? null : category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      category.isActive 
                        ? 'bg-red-50 border-red-200 text-red-700' 
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        {IconComponent ? (
                          <IconComponent className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{category.label}</p>
                        {selectedValue && (
                          <p className="text-sm text-red-600">{selectedValue}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {selectedValue && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearFilter(category.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </button>

                  {/* Category Options */}
                  {isDropdownOpen && (
                    <div className="ml-6 space-y-1 bg-gray-50 rounded-lg p-2">
                      {category.options?.map((option) => {
                        const OptionIcon = option.icon;
                        const isSelected = selectedValue === option.label;
                        
                        return (
                          <button
                            key={option.label}
                            onClick={() => handleOptionSelect(category.id, option.label)}
                            className={`w-full flex items-center justify-between p-2 rounded-md transition-colors text-sm ${
                              isSelected 
                                ? 'bg-red-100 text-red-700 font-medium' 
                                : 'text-gray-600 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {OptionIcon && (
                                <OptionIcon className="w-4 h-4" />
                              )}
                              <span>{option.label}</span>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-white flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setIsFilterModalOpen(false)}
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isMobile) {
    return (
      <div className="w-full mb-4">
        {/* Mobile Filter Button */}
        <div className="flex items-center justify-between px-3 sm:px-0">
          <MobileFilterModal />
          
          {/* Quick filter chips */}
          {activeFiltersCount > 0 && (
            <ScrollArea className="flex-1 ml-3">
              <div className="flex gap-2 pb-2">
                {categories.map((category) => {
                  const selectedValue = getSelectedValue(category.id);
                  if (!selectedValue) return null;
                  
                  return (
                    <Badge key={category.id} variant="destructive" className="flex items-center gap-1 whitespace-nowrap">
                      <span>{selectedValue}</span>
                      <button
                        onClick={() => handleClearFilter(category.id)}
                        className="hover:bg-red-700 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-100 p-4 h-fit sticky top-4">
      {/* Header with clear button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Category
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h2>
        {activeFiltersCount > 0 && (
          <button
            onClick={useStore ? clearAllFilters : onClearFilters}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Clear
          </button>
        )}
      </div>
      
      <ScrollArea className="h-[300px] overflow-hidden">
        <div className="space-y-1 pr-2">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isExpanded = useStore 
              ? storeExpandedSections[category.id as SectionKey] 
              : selectedDropdown === category.id;
            const selectedValue = getSelectedValue(category.id);
            
            return (
              <div key={category.id}>
                <div 
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    category.isActive 
                      ? 'bg-red-50 border border-red-100' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (category.hasDropdown) {
                      if (useStore) {
                        toggleSection(category.id as SectionKey);
                      } else {
                        setSelectedDropdown(selectedDropdown === category.id ? null : category.id);
                      }
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {IconComponent ? (
                        <IconComponent className="w-4 h-4 text-gray-500" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                      )}
                    </div>
                    
                    <span className={`text-sm font-medium ${
                      category.isActive ? 'text-gray-800' : 'text-gray-600'
                    }`}>
                      {category.label}
                      {selectedValue && (
                        <span className="block text-xs text-red-600 font-normal">
                          {selectedValue}
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {category.count && !selectedValue && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center font-medium">
                        {category.count}
                      </span>
                    )}
                    
                    {selectedValue && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFilter(category.id);
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    
                    {category.hasDropdown && (
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`} 
                      />
                    )}
                  </div>
                </div>
                
                {category.hasDropdown && isExpanded && (
                  <div className="ml-8 mt-2 mb-2 space-y-2">
                    {category.options?.map((option) => {
                      const OptionIcon = option.icon;
                      const isSelected = selectedValue === option.label;
                      
                      return (
                        <div 
                          key={option.label}
                          className={`flex items-center p-2 rounded-md cursor-pointer text-sm ${
                            isSelected 
                              ? 'bg-red-100 text-red-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          onClick={() => handleOptionSelect(category.id, option.label)}
                        >
                          {OptionIcon && (
                            <OptionIcon className="w-3 h-3 mr-2" />
                          )}
                          {option.label}
                          {isSelected && (
                            <X className="w-3 h-3 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export default ProductSidebarFilter;