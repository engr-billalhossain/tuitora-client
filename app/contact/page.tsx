import { Mail } from "lucide-react";

import { InfoPage } from "@/components/InfoPage";

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Get in touch"
      title="Contact Us"
      icon={Mail}
      intro="Have a question about a tuition, your account or a payment? Reach out and we will get back to you."
      sections={[
        {
          heading: "Email",
          body: "support@mentorlagbe.com — for account help, tutor verification and billing questions.",
        },
        {
          heading: "Phone",
          body: "+880 1846918599 — Sunday to Friday, 9am to 6pm (Dhaka time).",
        },
        {
          heading: "Office",
          body: "Dhaka, Bangladesh — our team works remotely across the country to support students and tutors everywhere.",
        },
        {
          heading: "Tutor partnerships",
          body: "Want to feature a batch or partner with MentorLagbe? Email us with your subject and class levels and we will follow up.",
        },
        {
          heading: "Report an issue",
          body: "If a listing looks incorrect, open the tuition and contact us with its title. Our admins review every report.",
        },
        {
          heading: "Response time",
          body: "We aim to answer every message within one business day. Payment issues are treated as high priority.",
        },
      ]}
    />
  );
}
