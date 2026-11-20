import { Suspense } from "react";

import { TuitionDetails } from "@/components/tuitions/TuitionDetails";

export default function TuitionDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080D0F]" />}>
      <TuitionDetails />
    </Suspense>
  );
}
