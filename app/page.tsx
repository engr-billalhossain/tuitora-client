import Banner from "@/components/Banner"
import Footer from "@/components/Footre"
import { MostAppliedSubjects } from "@/components/home/MostAppliedSubjects"
import { TopTutorsAndReviews } from "@/components/home/TopTutorsAndReviews"

export default function Page() {
  return (
    <div>
      <Banner />
      <MostAppliedSubjects />
      <TopTutorsAndReviews />
      <Footer />
    </div>
  )
}
