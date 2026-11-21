import { Route } from "lucide-react";

import { InfoPage } from "@/components/InfoPage";

export default function HowItWorksPage() {
  return (
    <InfoPage
      eyebrow="Simple by design"
      title="How MentorLagbe Works"
      icon={Route}
      intro="Whether you are a student looking for guidance or a tutor building a batch, MentorLagbe keeps the whole journey transparent and easy to follow."
      sections={[
        {
          heading: "1. Create your account",
          body: "Sign up as a student or a tutor in under a minute. Choose your role, verify your email and you are ready to go. Every new account starts on the Free plan.",
        },
        {
          heading: "2. Explore or post tuitions",
          body: "Students search approved batches by subject, class level and online/offline mode. Tutors create a detailed tuition post with a banner, schedule and monthly fee.",
        },
        {
          heading: "3. Admin review",
          body: "Every tuition is reviewed by our admin team. Only approved, active listings appear in the public catalogue, so students always see quality batches.",
        },
        {
          heading: "4. Apply & connect",
          body: "Students pick a time slot, add a learning note and apply. Tutors accept or reject each request from their dashboard, and accepted students can leave a review.",
        },
        {
          heading: "5. Upgrade when you need more",
          body: "Free tutors can publish up to two batches and free students can apply to five. PRO unlocks unlimited posts or applications plus a verified badge, paid securely with Stripe.",
        },
        {
          heading: "6. Manage everything in one place",
          body: "Your role-based dashboard shows stats, applications, tuition CRUD, transactions and profile settings, all responsive on mobile, tablet and desktop.",
        },
      ]}
    />
  );
}
