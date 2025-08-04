import { CTASection } from "@/components/home/cta-section";
import { ExampleSection } from "@/components/home/example-section";
import { FeatureSection } from "@/components/home/feature-section";
import { HeroSection } from "@/components/home/hero-section";
import { PricingSection } from "@/components/home/pricing-section";
import { PublicListsSection } from "@/components/home/public-lists-section";
import { getPublicListsForHome } from "@/lib/dal/public-lists";

export default async function Home() {
  // 公開リストを取得
  const publicLists = await getPublicListsForHome(4);

  return (
    <main className="max-w-7xl mx-auto">
      <HeroSection />
      <FeatureSection />
      <PublicListsSection publicLists={publicLists} />
      <ExampleSection />
      <PricingSection />
      <CTASection />
    </main>
  );
}
