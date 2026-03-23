'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  CalendarIcon,
  ChevronDownIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardHeader() {
  const [currentDate, setCurrentDate] = useState('');
  const { data: session, status } = useSession();

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (status === 'loading') {
    return (
      <header className="h-16 border-b border-gray-200 bg-white animate-pulse" />
    );
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section: Title and Date */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">
              <CalendarIcon className="inline w-4 h-4 mr-1" />
              {currentDate}
            </p>
          </div>
        </div>

        {/* Right Section: User Profile Only */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/settings" className="flex items-center space-x-3 group cursor-pointer">
            {/* Profile Image Circle */}
            <div className="relative w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-transparent group-hover:border-black transition-colors">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-black text-white flex items-center justify-center">
                  <span className="text-xs font-semibold">
                    {getInitials(session?.user?.name)}
                  </span>
                </div>
              )}
            </div>
            
            {/* User Info (Hidden on small screens) */}
            <div className="hidden md:block text-left">
              <p className="font-medium text-gray-900 truncate max-w-[150px]">
                {session?.user?.name || 'User Account'}
              </p>
              <p className="text-sm text-gray-600 truncate max-w-[150px]">
                {session?.user?.email || 'user@example.com'}
              </p>
            </div>
            
            <ChevronDownIcon className="w-5 h-5 text-gray-600 hidden md:block" />
          </Link>
        </div>
      </div>
    </header>
  );
}