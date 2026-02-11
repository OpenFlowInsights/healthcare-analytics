import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">
              OpenFlow Insights
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Transform healthcare data into shared savings with custom SaaS dashboards and analytics.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm mb-4">
              Services
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboards" className="hover:text-white transition-colors">
                  Custom Dashboards
                </Link>
              </li>
              <li>
                <Link href="/dashboards" className="hover:text-white transition-colors">
                  ACO Analytics
                </Link>
              </li>
              <li>
                <Link href="/dashboards" className="hover:text-white transition-colors">
                  Part D Intelligence
                </Link>
              </li>
              <li>
                <Link href="/dashboards" className="hover:text-white transition-colors">
                  Risk Adjustment
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm mb-4">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/dashboards" className="hover:text-white transition-colors">
                  Dashboard Showcase
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Schedule Demo
                </a>
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
          <p>&copy; {new Date().getFullYear()} OpenFlow Insights. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
