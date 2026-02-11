'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';

interface NavigationProps {
  variant?: 'light' | 'dark';
}

export default function Navigation({ variant }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardsOpen, setDashboardsOpen] = useState(false);

  // Auto-detect variant based on pathname if not explicitly set
  const isDashboardPage = pathname === '/dashboard' || pathname === '/drug-spending';
  const effectiveVariant = variant || (isDashboardPage ? 'dark' : 'light');

  const dashboardLinks = [
    { href: '/dashboard', label: 'ACO Performance', external: false },
    { href: '/drug-spending', label: 'Drug Spending', external: false },
    { href: 'https://partd-dashboard.vercel.app/dashboard', label: 'Part D Analytics', external: true },
    { href: '#', label: 'SnowQuery', disabled: true },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12 Q 6 8, 9 12 T 15 12" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                    <path d="M3 9 Q 6 5, 9 9 T 15 9" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.75"/>
                    <path d="M3 15 Q 6 11, 9 15 T 15 15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:inline font-heading">
                  Open Flow Insights
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/services"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/services'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Services
            </Link>

            {/* Dashboards Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDashboardsOpen(true)}
              onMouseLeave={() => setDashboardsOpen(false)}
            >
              <button
                className={`flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname.includes('/dashboard') || pathname.includes('/drug-spending')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>Dashboards</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {dashboardsOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                  {dashboardLinks.map((link) => (
                    link.disabled ? (
                      <div
                        key={link.href}
                        className="px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center justify-between"
                      >
                        <span>{link.label}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Soon</span>
                      </div>
                    ) : link.external ? (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/blog"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/blog' || pathname.startsWith('/blog/')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Blog
            </Link>

            <Link
              href="/about"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/about'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              About
            </Link>

            <div className="ml-4">
              <Button size="sm" variant="primary">
                Book a Demo
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/services'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Services
            </Link>

            {/* Mobile Dashboards Section */}
            <div className="px-3 py-2">
              <div className="text-sm font-semibold text-gray-900 mb-2">Dashboards</div>
              {dashboardLinks.map((link) => (
                link.disabled ? (
                  <div
                    key={link.href}
                    className="px-3 py-2 text-sm text-gray-400 flex items-center justify-between"
                  >
                    <span>{link.label}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Soon</span>
                  </div>
                ) : link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/blog' || pathname.startsWith('/blog/')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Blog
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/about'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              About
            </Link>

            <div className="px-3 pt-4">
              <Button size="sm" variant="primary" className="w-full">
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
