'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
 
  const router = useRouter();

  const handleSearch = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (searchQuery.trim()) {
      // Redirect to search page with query parameters
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&page=1`);
    }
  };
  

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  const handleLogin = () => {
    signIn(undefined, { callbackUrl: '/' })
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }


  return (
    <div className="h-screen max-h-screen w-full relative overflow-hidden flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/hero-bg.jpg')` // Replace with your actual image path
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Navigation Header - Fixed Height */}
      <Navbar/>
      {/* Main Hero Content - Uses Remaining Space */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center min-h-0 px-4 sm:px-6 pb-8 sm:pb-0">
        
        {/* Main Heading */}
        <div className="text-center max-w-5xl mx-auto mb-8 sm:mb-12 -mt-16 sm:mt-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-gray-900 tracking-tight leading-tight">
            Give All You Need
          </h1>
        </div>
        
        {/* Search Bar - Higher on Mobile to avoid keyboard */}
        <div className="w-full max-w-sm sm:max-w-2xl mx-auto">
          <div className="flex bg-white/95 backdrop-blur-sm rounded-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="relative flex-1">
              <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="start searching"
          className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-xl bg-transparent focus:outline-none placeholder-gray-400 text-gray-900"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      
      <button
        onClick={handleSearch}
        className="bg-black text-white px-6 sm:px-8 lg:px-10 py-4 sm:py-5 lg:py-6 hover:bg-gray-800 transition-colors font-medium text-base sm:text-lg lg:text-xl whitespace-nowrap"
      >
        search
      </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;