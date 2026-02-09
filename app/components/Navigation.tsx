'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Pill, Home } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
    },
    {
      href: '/dashboard',
      label: 'ACO Dashboard',
      icon: BarChart3,
    },
    {
      href: '/drug-spending',
      label: 'Drug Spending',
      icon: Pill,
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OFI</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Open Flow Insights
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
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
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
