'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  HomeIcon,
  ShoppingCartIcon,
  PackageIcon,
  BarChart3Icon,
  SettingsIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  Loader2,
  CreditCardIcon,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: <HomeIcon className="w-5 h-5" />,
    path: '/dashboard',
  },
  {
    title: 'Orders',
    icon: <ShoppingCartIcon className="w-5 h-5" />,
    path: '/dashboard/orders',
    badge: true, // Keep this true, we will control visibility manually
  },
  {
    title: 'Products',
    icon: <PackageIcon className="w-5 h-5" />,
    path: '/dashboard/products',
  },
  {
    title: 'Analytics',
    icon: <BarChart3Icon className="w-5 h-5" />,
    path: '/dashboard/analytics',
  },
  {
    title: 'Customers',
    icon: <UserIcon className="w-5 h-5" />,
    path: '/dashboard/customers',
  },
  {
    title: 'Settings',
    icon: <SettingsIcon className="w-5 h-5" />,
    path: '/dashboard/settings',
  },
];

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Add state for pending orders count
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Fetch the count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/seller/orders/pending-count');
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch pending orders', error);
      }
    };

    fetchPendingCount();

    // Optional: Re-fetch periodically (e.g., every 30 seconds)
    const interval = setInterval(fetchPendingCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/' });
  };

  // Logic: If we are ON the orders page, don't show the badge (it disappears)
  // If we are elsewhere, show the actual count
  const isOrdersPage = pathname === '/dashboard/orders';
  const displayCount = isOrdersPage ? 0 : pendingCount;

  return (
    <aside className={`
      bg-white border-r border-gray-200 transition-all duration-300
      ${collapsed ? 'w-20' : 'w-64'}
      h-screen sticky top-0 z-40
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed ? (
          <Link href="/" className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
            Vectra
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all
                ${isActive 
                  ? 'bg-black text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <div className={isActive ? 'text-white' : 'text-gray-500'}>
                {item.icon}
              </div>
              {!collapsed && (
                <span className="font-medium">{item.title}</span>
              )}
              
              {/* Logic: Only show badge if item has 'badge' enabled AND displayCount > 0 */}
              {item.badge && !collapsed && displayCount > 0 && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          ) : (
            <LogOutIcon className="w-5 h-5 text-gray-500" />
          )}
          {!collapsed && (
            <span className="font-medium">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}