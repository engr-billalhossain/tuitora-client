import Banner from "@/components/Banner"
import Footer from "@/components/Footre"
import { FeaturedTuitions } from "@/components/home/FeaturedTuitions"
import { HowItWorks } from "@/components/home/HowItWorks"
import { MostAppliedSubjects } from "@/components/home/MostAppliedSubjects"
import { PricingSection } from "@/components/home/PricingSection"
import { TopTutorsAndReviews } from "@/components/home/TopTutorsAndReviews"

export default function Page() {
  return (
    <div>
      <Banner />
      <FeaturedTuitions />
      <HowItWorks />
      <MostAppliedSubjects />
      <TopTutorsAndReviews />
      <PricingSection />
      <Footer />
    </div>
  )
}
