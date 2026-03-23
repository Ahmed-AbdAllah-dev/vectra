'use client'
import { Search, ShoppingCart, User, X, Menu, Home, ShoppingBag, Store } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Add loading state to prevent flash of wrong UI
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const handleLogin = () => {
    router.push('/login')
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  // Only show UI once session status is determined
  if (isLoading) {
    return (
      <nav className="relative z-20 flex-shrink-0 pt-2 sm:pt-4 px-3 sm:px-6">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl sm:rounded-2xl mx-2 sm:mx-4 lg:mx-8">
          <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16 px-4 sm:px-6 lg:px-8">
            {/* Loading skeleton */}
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  const isAuthenticated = !!session?.user;
  const userRole = session?.user?.role; // 'buyer' or 'seller'
  const isSeller = userRole === 'seller';
  const isBuyer = userRole === 'buyer';

  return (
    <nav className="relative z-20 flex-shrink-0 pt-2 sm:pt-4 px-3 sm:px-6">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl sm:rounded-2xl mx-2 sm:mx-4 lg:mx-8">
          <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              Vectra
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
              <Link href="/discount" className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Discount
              </Link>
              <Link href="/" className="text-xs sm:text-sm text-gray-900 hover:text-gray-700 font-medium transition-colors">
                Home
              </Link>
              <Link href="/blog" className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Blog
              </Link>
              
              {/* Seller Dashboard link for sellers */}
              {isAuthenticated && isSeller && (
                <Link href="/dashboard" className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Dashboard
                </Link>
              )}
            </div>

            {/* Auth State - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <button className="p-1.5 lg:p-2 text-gray-700 hover:text-gray-900 transition-colors">
                    <Search className="h-4 w-4 lg:h-5 lg:w-5" />
                  </button>
                  
                  {/* Cart for both buyers AND sellers */}
                  <Link href="/cart" className="p-1.5 lg:p-2 text-gray-700 hover:text-gray-900 transition-colors">
                    <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Link>
                  
                  <div className="relative group">
                    <button className="p-1.5 lg:p-2 text-gray-700 hover:text-gray-900 transition-colors">
                      <User className="h-4 w-4 lg:h-5 lg:w-5" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                      
                      {/* Different profile/dashboard links based on role */}
                      {isBuyer && (
                        <Link 
                          href="/profile"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          My Profile
                        </Link>
                      )}
                      
                      {isSeller && (
                        <>
                          <Link 
                            href="/dashboard"
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <Store className="w-4 h-4 mr-2" />
                            Seller Dashboard
                          </Link>
                          <Link 
                            href="/profile"
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Buyer Profile
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/cart" className="p-1.5 lg:p-2 text-gray-700 hover:text-gray-900 transition-colors">
                    <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Link>
                  <button
                    onClick={handleLogin}
                    className="bg-black text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-800 transition-colors"
                  >
                    Login
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-700 hover:text-gray-900 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="px-4 py-2 space-y-1">
                <Link href="/discount" className="block text-sm text-gray-700 hover:text-gray-900 font-medium py-1.5" onClick={closeMobileMenu}>
                  Discount
                </Link>
                <Link href="/" className="block text-sm text-gray-900 hover:text-gray-700 font-medium py-1.5" onClick={closeMobileMenu}>
                  Home
                </Link>
                <Link href="/blog" className="block text-sm text-gray-700 hover:text-gray-900 font-medium py-1.5" onClick={closeMobileMenu}>
                  Blog
                </Link>
                
                {/* Seller Dashboard link for sellers */}
                {isAuthenticated && isSeller && (
                  <Link href="/dashboard" className="block text-sm text-gray-700 hover:text-gray-900 font-medium py-1.5" onClick={closeMobileMenu}>
                    Dashboard
                  </Link>
                )}

                {/* Auth State - Mobile */}
                <div className="pt-2 border-t border-gray-200">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <button className="p-1.5 text-gray-700 hover:text-gray-900 transition-colors">
                          <Search className="h-4 w-4" />
                        </button>
                        <Link href="/cart" className="p-1.5 text-gray-700 hover:text-gray-900 transition-colors" onClick={closeMobileMenu}>
                          <ShoppingCart className="h-4 w-4" />
                        </Link>
                        {isBuyer && (
                          <Link href="/profile" className="p-1.5 text-gray-700 hover:text-gray-900 transition-colors" onClick={closeMobileMenu}>
                            <User className="h-4 w-4" />
                          </Link>
                        )}
                        {isSeller && (
                          <Link href="/dashboard" className="p-1.5 text-gray-700 hover:text-gray-900 transition-colors" onClick={closeMobileMenu}>
                            <Store className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }}
                        className="text-sm text-gray-700 hover:text-gray-900"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Link href="/cart" className="p-1.5 text-gray-700 hover:text-gray-900 transition-colors" onClick={closeMobileMenu}>
                        <ShoppingCart className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          handleLogin();
                          closeMobileMenu();
                        }}
                        className="bg-black text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-800 transition-colors"
                      >
                        Login
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Additional links for authenticated users on mobile */}
                {isAuthenticated && (
                  <div className="pt-2 space-y-1">
                    {isBuyer && (
                      <Link href="/profile" className="block text-sm text-gray-700 hover:text-gray-900 font-medium py-1.5" onClick={closeMobileMenu}>
                        <ShoppingBag className="w-4 h-4 inline mr-2" />
                        My Profile
                      </Link>
                    )}
                    {isSeller && (
                      <>
                        <Link href="/dashboard" className="block text-sm text-gray-700 hover:text-gray-900 font-medium py-1.5" onClick={closeMobileMenu}>
                          <Store className="w-4 h-4 inline mr-2" />
                          Seller Dashboard
                        </Link>
                        <Link href="/profile" className="block text-sm text-gray-700 hover:text-gray-900 font-medium py-1.5" onClick={closeMobileMenu}>
                          <ShoppingBag className="w-4 h-4 inline mr-2" />
                          Buyer Profile
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
  );
}