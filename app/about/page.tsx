import { HeartHandshake } from "lucide-react";

import { InfoPage } from "@/components/InfoPage";

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About us"
      title="About MentorLagbe"
      icon={HeartHandshake}
      intro="MentorLagbe is a tuition and mentorship marketplace that connects motivated students with verified tutors for online and offline batches."
      sections={[
        {
          heading: "Our mission",
          body: "Make quality academic support easy to find, compare and join. We believe every student deserves a mentor who fits their goals, schedule and budget.",
        },
        {
          heading: "Verified by design",
          body: "Tutors publish detailed batches and an admin team approves every listing before it goes live. Ratings and reviews come from real students who joined a batch.",
        },
        {
          heading: "For tutors",
          body: "Post a tuition, track applicants and manage your batches from a dedicated dashboard. PRO tutors get unlimited posts, a verified badge and featured placement.",
        },
        {
          heading: "For students",
          body: "Search by subject, class level and mode, apply with a learning note and follow every application through to acceptance from one simple dashboard.",
        },
        {
          heading: "Built for every device",
          body: "The platform is fully responsive, with a consistent dark theme, equal-sized cards and a shared design language across every page and dashboard.",
        },
        {
          heading: "Security first",
          body: "Authentication is powered by BetterAuth with MongoDB. Billing is handled by Stripe, and privileged fields such as role and plan can only be changed by verified server routes.",
        },
      ]}
    />
  );
}
