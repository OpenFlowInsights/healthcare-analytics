import { Button } from '../ui/Button';

export function CTASection() {
  return (
    <section className="bg-gradient-navy-blue py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-6">
          Ready to Transform Your Healthcare Analytics?
        </h2>
        <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
          Join leading ACOs and Medicare Advantage plans using OpenFlow Insights to maximize shared savings and improve patient outcomes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="primary">
            Schedule Your Demo
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
            View Case Studies
          </Button>
        </div>
      </div>
    </section>
  );
}
