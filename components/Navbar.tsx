'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [mobileProductsMenuOpen, setMobileProductsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
    fetchCategories();
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProductsMenuOpen(false);
      }
    };

    if (productsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [productsMenuOpen]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const formatCategoryName = (category: string) => {
    if (category === 'all') return 'All';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleCategoryClick = (category: string) => {
    const url = category === 'all' ? '/products' : `/products?category=${category}`;
    router.push(url);
    setProductsMenuOpen(false);
    setMobileProductsMenuOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary-600">
              B2B Print
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {/* Products with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onMouseEnter={() => setProductsMenuOpen(true)}
                    onMouseLeave={() => setProductsMenuOpen(false)}
                    className={`text-gray-700 hover:text-primary-600 transition-colors flex items-center space-x-1 ${
                      pathname === '/products' ? 'text-primary-600 font-semibold' : ''
                    }`}
                  >
                    <span>Products</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${productsMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  {productsMenuOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      onMouseEnter={() => setProductsMenuOpen(true)}
                      onMouseLeave={() => setProductsMenuOpen(false)}
                    >
                      <button
                        onClick={() => handleCategoryClick('all')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          pathname === '/products' && !searchParams?.get('category')
                            ? 'text-primary-600 font-semibold bg-primary-50'
                            : 'text-gray-700'
                        }`}
                      >
                        All Products
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryClick(category)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            searchParams?.get('category') === category
                              ? 'text-primary-600 font-semibold bg-primary-50'
                              : 'text-gray-700'
                          }`}
                        >
                          {formatCategoryName(category)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Link
                  href="/cart"
                  className={`text-gray-700 hover:text-primary-600 transition-colors ${
                    pathname === '/cart' ? 'text-primary-600 font-semibold' : ''
                  }`}
                >
                  Cart
                </Link>
                <Link
                  href="/user/orders"
                  className={`text-gray-700 hover:text-primary-600 transition-colors ${
                    pathname.startsWith('/user/orders') ? 'text-primary-600 font-semibold' : ''
                  }`}
                >
                  Orders
                </Link>
                <Link
                  href="/user/quotes"
                  className={`text-gray-700 hover:text-primary-600 transition-colors ${
                    pathname.startsWith('/user/quotes') ? 'text-primary-600 font-semibold' : ''
                  }`}
                >
                  Quotes
                </Link>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{user.company_name}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            {user ? (
              <>
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{user.company_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                {/* Products with Sub-menu */}
                <div>
                  <button
                    onClick={() => setMobileProductsMenuOpen(!mobileProductsMenuOpen)}
                    className="w-full flex items-center justify-between py-2 text-gray-700 hover:text-primary-600"
                  >
                    <span>Products</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${mobileProductsMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  {mobileProductsMenuOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button
                        onClick={() => handleCategoryClick('all')}
                        className={`w-full text-left py-2 text-sm ${
                          pathname === '/products' && !searchParams?.get('category')
                            ? 'text-primary-600 font-semibold'
                            : 'text-gray-600 hover:text-primary-600'
                        }`}
                      >
                        All Products
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryClick(category)}
                          className={`w-full text-left py-2 text-sm ${
                            searchParams?.get('category') === category
                              ? 'text-primary-600 font-semibold'
                              : 'text-gray-600 hover:text-primary-600'
                          }`}
                        >
                          {formatCategoryName(category)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Link
                  href="/cart"
                  className="block py-2 text-gray-700 hover:text-primary-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Cart
                </Link>
                <Link
                  href="/user/orders"
                  className="block py-2 text-gray-700 hover:text-primary-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  href="/user/quotes"
                  className="block py-2 text-gray-700 hover:text-primary-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Quotes
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block py-2 text-gray-700 hover:text-primary-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="block py-2 text-primary-600 font-semibold hover:text-primary-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

