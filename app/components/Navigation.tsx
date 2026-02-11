'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Pill, Home, Menu, X, LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';

interface NavigationProps {
  variant?: 'light' | 'dark';
}

interface NavLink {
  href: string;
  label: string;
  icon?: LucideIcon;
}

export default function Navigation({ variant }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-detect variant based on pathname if not explicitly set
  const isDashboardPage = pathname === '/dashboard' || pathname === '/drug-spending';
  const effectiveVariant = variant || (isDashboardPage ? 'dark' : 'light');

  // Links based on variant
  const lightLinks: NavLink[] = [
    { href: '/dashboards', label: 'Dashboards' },
    { href: '/blog', label: 'Blog' },
    { href: '#', label: 'About' },
  ];

  const darkLinks: NavLink[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'ACO Dashboard', icon: BarChart3 },
    { href: '/drug-spending', label: 'Drug Spending', icon: Pill },
  ];

  const links: NavLink[] = effectiveVariant === 'light' ? lightLinks : darkLinks;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OFI</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:inline">
                  OpenFlow Insights
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {effectiveVariant === 'light' && (
              <div className="ml-4">
                <Button size="sm" variant="primary">
                  Book a Demo
                </Button>
              </div>
            )}
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
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {effectiveVariant === 'light' && (
              <div className="px-3 pt-2">
                <Button size="sm" variant="primary" className="w-full">
                  Book a Demo
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
