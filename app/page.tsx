import { CTASection } from "@/components/home/cta-section";
import { ExampleSection } from "@/components/home/example-section";
import { FeatureSection } from "@/components/home/feature-section";
import { HeroSection } from "@/components/home/hero-section";
import { PricingSection } from "@/components/home/pricing-section";
import { UserVoiceSection } from "@/components/home/user-voice-section";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FeatureSection />
      <ExampleSection />
      <UserVoiceSection />
      <PricingSection />
      <CTASection />
    </main>
  );
}
