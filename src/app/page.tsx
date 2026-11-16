import { CampaignBanner } from "@/components/home/campaign-banner";
import { CategoryRail } from "@/components/home/category-rail";
import { EditorialPair } from "@/components/home/editorial-pair";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { Services } from "@/components/home/services";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <EditorialPair />
      <NewArrivals />
      <CampaignBanner />
      <CategoryRail />
      <FeaturedCollections />
      <Services />
    </main>
  );
}
