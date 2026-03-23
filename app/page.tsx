
import Hero from './components/hero';
import ProductGrid from './components/ProductGrid';
import ProductSidebarFilter from './components/ProductSidebarFilter';

export default function ProductsPage() {
  return (
    <div>
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Filter (visible on mobile) */}
        <div className="block lg:hidden">
          <ProductSidebarFilter isMobile={true} />
        </div>

        {/* Desktop Layout */}
        <div className="flex gap-8">
          {/* Desktop Sidebar (hidden on mobile) */}
          <div className="hidden lg:block">
            <ProductSidebarFilter useStore={true} isMobile={false}/>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1">
            <ProductGrid />
          </div>
        </div>
      </div>
    </div>
  );
}