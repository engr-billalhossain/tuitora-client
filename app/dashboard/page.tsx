"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useSession } from "@/lib/auth-client";

/** Sends every role to its own dashboard. The dashboard layout also guards
 *  this route, so unauthenticated visitors are taken to /sign-in. */
export default function DashboardIndexPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending || !session?.user) return;
    const role = session.user.role;
    const target =
      role === "admin"
        ? "/dashboard/admin"
        : role === "tutor" || role === "teacher"
          ? "/dashboard/tutor"
          : "/dashboard/student";
    router.replace(target);
  }, [isPending, session?.user, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-white">
      <Loader2 className="h-6 w-6 animate-spin text-[#B6F70B]" />
    </div>
  );
}
