import Link from 'next/link';
import { Button } from '../ui/Button';

export function Hero() {
  return (
    <section className="relative bg-gradient-navy-blue overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6 animate-fadeInUp">
            Turn Your Healthcare Data Into{' '}
            <span className="text-sky-400">Shared Savings</span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto animate-fadeInUp delay-200">
            Custom SaaS dashboards and analytics for MSSP ACOs, Medicare Advantage plans, and healthcare organizations.
            We build the data infrastructure and insights you need to maximize performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp delay-400">
            <Button size="lg" variant="primary">
              Schedule a Demo
            </Button>
            <Link href="/dashboards">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Dashboards
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy-950/20 pointer-events-none" />
    </section>
  );
}
