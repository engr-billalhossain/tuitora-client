import { LifeBuoy } from "lucide-react";

import { InfoPage } from "@/components/InfoPage";

export default function HelpPage() {
  return (
    <InfoPage
      eyebrow="Help center"
      title="Help Center"
      icon={LifeBuoy}
      intro="Quick answers to the questions we hear most often. If you still need a hand, our support team is only an email away."
      sections={[
        {
          heading: "How do I apply for a tuition?",
          body: "Open any approved tuition, choose an available time slot, add a short learning note and confirm. Your application stays pending until the tutor reviews it.",
        },
        {
          heading: "How many tuitions can I apply to?",
          body: "Free students can have up to five active applications. PRO students have no limit and receive priority responses from tutors.",
        },
        {
          heading: "How do I become a tutor?",
          body: "Sign up with the Tutor role, then post a tuition from your dashboard. An admin reviews it before it becomes visible to students.",
        },
        {
          heading: "Where can I see my applications?",
          body: "Open your dashboard and choose My Applications. You can cancel any application that is still pending.",
        },
        {
          heading: "How does PRO billing work?",
          body: "PRO is a secure one-time upgrade through Stripe. Your plan is activated automatically once payment is confirmed.",
        },
        {
          heading: "Contact support",
          body: "Email support@mentorlagbe.com or call +880 1846918599. We are based in Dhaka, Bangladesh and usually reply within one business day.",
        },
      ]}
    />
  );
}
