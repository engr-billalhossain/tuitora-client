import { ShieldCheck } from "lucide-react";

import { InfoPage } from "@/components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      icon={ShieldCheck}
      intro="We collect only the data needed to run MentorLagbe, and we never sell your personal information."
      sections={[
        {
          heading: "What we store",
          body: "Your name, email, role, plan, optional phone, bio and profile image, plus tuition listings, applications and payment records.",
        },
        {
          heading: "How we use it",
          body: "To authenticate you, show relevant tuitions, match students with tutors, process payments and keep the platform safe.",
        },
        {
          heading: "Images",
          body: "Profile and banner images you upload are stored through ImgBB and displayed using their public URL. You may replace or remove them at any time.",
        },
        {
          heading: "Payments",
          body: "Card details are handled entirely by Stripe. MentorLagbe never receives or stores your full card number.",
        },
        {
          heading: "Your choices",
          body: "You can update your profile from your dashboard and ask support to remove your account and associated data.",
        },
        {
          heading: "Contact",
          body: "Questions about privacy can be sent to support@mentorlagbe.com.",
        },
      ]}
    />
  );
}
