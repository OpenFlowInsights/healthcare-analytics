import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">
              Open Flow Insights
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Analytics consulting for healthcare organizations. We make your data work for you — not the other way around.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm mb-4">
              Services
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  All Services
                </Link>
              </li>
              <li>
                <Link href="/services#data-warehousing" className="hover:text-white transition-colors">
                  Data Warehousing
                </Link>
              </li>
              <li>
                <Link href="/services#custom-dashboards" className="hover:text-white transition-colors">
                  Custom Dashboards
                </Link>
              </li>
              <li>
                <Link href="/services#risk-adjustment" className="hover:text-white transition-colors">
                  Risk Adjustment
                </Link>
              </li>
              <li>
                <Link href="/services#quality-reporting" className="hover:text-white transition-colors">
                  Quality Reporting
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboards */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm mb-4">
              Dashboards
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboards" className="hover:text-white transition-colors">
                  Dashboard Gallery
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  ACO Performance
                </Link>
              </li>
              <li>
                <Link href="/drug-spending" className="hover:text-white transition-colors">
                  Drug Spending
                </Link>
              </li>
              <li>
                <a
                  href="https://partd-dashboard.vercel.app/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Part D Analytics
                </a>
              </li>
            </ul>
          </div>

          {/* Company & Resources */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/data-tools" className="hover:text-white transition-colors">
                  Data Tools
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 Open Flow Insights LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
