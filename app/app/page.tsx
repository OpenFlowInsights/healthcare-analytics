import Navigation from '@/components/Navigation';
import { Hero } from '@/components/marketing/Hero';
import { DashboardPreview } from '@/components/marketing/DashboardPreview';
import { StatsBar } from '@/components/marketing/StatsBar';
import { FeaturesSection } from '@/components/marketing/FeaturesSection';
import { HowItWorksTimeline } from '@/components/marketing/HowItWorksTimeline';
import { CTASection } from '@/components/marketing/CTASection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navigation variant="light" />
      <main>
        <Hero />
        <DashboardPreview />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksTimeline />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
