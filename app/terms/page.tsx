import { FileText } from "lucide-react";

import { InfoPage } from "@/components/InfoPage";

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of Service"
      icon={FileText}
      intro="By using MentorLagbe you agree to the following terms. Please read them carefully before posting or applying for a tuition."
      sections={[
        {
          heading: "Accounts",
          body: "You must provide accurate information when registering and are responsible for activity under your account. Roles and plan flags can only be changed through verified server routes.",
        },
        {
          heading: "Tuition listings",
          body: "Tutors are responsible for the accuracy of their listings. All posts are subject to admin approval and may be rejected or deactivated if they are misleading.",
        },
        {
          heading: "Applications",
          body: "Applications are requests, not guaranteed bookings. A tutor may accept or reject any application, and students may cancel a pending application at any time.",
        },
        {
          heading: "Payments",
          body: "PRO upgrades are processed by Stripe. Prices are shown before checkout and a transaction record is saved for every confirmed payment.",
        },
        {
          heading: "Acceptable use",
          body: "Do not post harmful, unlawful or misleading content, and do not attempt to bypass plan limits or access another user's data.",
        },
        {
          heading: "Changes",
          body: "We may update these terms as the platform evolves. Continued use of MentorLagbe after an update means you accept the revised terms.",
        },
      ]}
    />
  );
}
