"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  DollarSign,
  Loader2,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import { useSession } from "@/lib/auth-client";
import { createBooking } from "@/lib/actions/postTuitions";
import {
  APPLICATIONS_CHANGED_EVENT,
  hasApplied,
  saveApplication,
  type BrowseTuition,
} from "@/lib/tuitions";
import { cn } from "@/lib/utils";
import { TutorAvatar } from "@/components/tuitions/TutorAvatar";

export function BookButton({
  tuition,
  variant = "card",
  className,
}: {
  tuition: BrowseTuition;
  variant?: "card" | "details";
  className?: string;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  const [slotId, setSlotId] = React.useState("");

  const availableSlots = React.useMemo(
    () => tuition.availableSlots ?? [],
    [tuition.availableSlots]
  );

  React.useEffect(() => {
    const sync = () => setApplied(hasApplied(tuition.id));
    sync();
    window.addEventListener(APPLICATIONS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APPLICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [tuition.id]);

  // Stale selections are treated as "nothing chosen" without a render-time reset.
  const selectedSlot =
    availableSlots.find((slot) => slot.id === slotId) ?? null;

  React.useEffect(() => {
    if (!dialogOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialogOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen]);

  // Keep the page perfectly still while the dialog is open.
  React.useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [dialogOpen]);

  const handleClick = () => {
    if (applied) {
      toast.info("You have already requested this tuition.");
      return;
    }
    if (availableSlots.length === 0) {
      toast.info("No time slots are available for this tuition.");
      return;
    }
    if (isPending) {
      toast.info("Checking your session, please try again in a moment.");
      return;
    }
    if (!session?.user) {
      toast.error("Please log in to book this tuition.");
      const callback = encodeURIComponent(`/tuitions/${tuition.id}`);
      router.push(`/sign-in?callbackURL=${callback}`);
      return;
    }

    const role = session.user.role;
    if (role && role !== "student") {
      toast.error("Only students can book a tuition.");
      return;
    }

    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (confirming || !selectedSlot) return;
    setConfirming(true);
    try {
      await createBooking(tuition.id, selectedSlot.id);
      saveApplication({
        tuitionId: tuition.id,
        slotId: selectedSlot.id,
        slotLabel: `${selectedSlot.start}–${selectedSlot.end} (${selectedSlot.duration})`,
        tuitionTitle: tuition.title,
        tutorName: tuition.tutorName,
        fee: tuition.fee,
        studentName: session?.user?.name,
        studentEmail: session?.user?.email,
      });
      setApplied(true);
      setDialogOpen(false);
      toast.success(`Booking confirmed for ${selectedSlot.label}!`);
    } catch (bookingError) {
      toast.error(
        bookingError instanceof Error
          ? bookingError.message
          : "Could not save your booking. Please try again."
      );
    } finally {
      setConfirming(false);
    }
  };

  const dialog = dialogOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDialogOpen(false);
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`booking-title-${tuition.id}`}
          className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#11191D] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        >
          <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#B6F70B]/15 blur-3xl" />

          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            aria-label="Close booking dialog"
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative max-h-[85vh] overflow-y-auto p-5 sm:p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6F70B]/30 bg-[#B6F70B]/10 px-3 py-1 text-[10px] font-bold tracking-wide text-[#B6F70B] uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Student booking
            </span>

            <h2
              id={`booking-title-${tuition.id}`}
              className="mt-4 pr-8 text-[18px] leading-snug font-extrabold text-white"
            >
              Choose your time slot
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
              These are the slots offered by the tutor. Pick one to reserve it —
              a booked slot disappears for everyone.
            </p>

            <div className="mt-4 rounded-xl border border-white/[0.07] bg-[#0D1417] p-3.5">
              <div className="flex items-center gap-3">
                <TutorAvatar
                  name={tuition.tutorName}
                  src={tuition.tutorImage}
                  className="h-9 w-9 text-[11px]"
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[12px] font-bold text-white">
                    {tuition.tutorName}
                    {tuition.verified && (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                    )}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    {tuition.title}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 text-[11px] font-semibold text-gray-300">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-[#B6F70B]" />$
                  {tuition.fee} / month
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-[#B6F70B]" />
                  {tuition.days}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-300">
                <Clock3 className="h-3.5 w-3.5 text-[#B6F70B]" />
                Available slots ({availableSlots.length})
              </p>
              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label="Available time slots"
              >
                {availableSlots.map((slot) => {
                  const active = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSlotId(slot.id)}
                      className={cn(
                        "rounded-xl border p-2.5 text-left transition-colors",
                        active
                          ? "border-[#B6F70B] bg-[#B6F70B]/10"
                          : "border-white/10 bg-[#141C21] hover:border-[#B6F70B]/40"
                      )}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-white">
                          {slot.label}
                        </span>
                        {active && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                        )}
                      </span>
                      <span className="mt-1 block text-[10px] font-semibold text-[#B6F70B]">
                        {slot.start} – {slot.end}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-gray-500">
                        {slot.duration}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 text-[12px] font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming || !selectedSlot}
                className="flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-[#B6F70B] text-[12px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div className={cn("w-full min-w-0", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={applied}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#C7F529] font-extrabold text-[#0B1100] shadow-[0_4px_18px_rgba(182,247,11,0.18)] transition-colors hover:bg-[#D6FF4A] disabled:cursor-default disabled:border disabled:border-[#B6F70B]/30 disabled:bg-[#B6F70B]/10 disabled:text-[#B6F70B] disabled:shadow-none text-[13px]"
        )}
      >
        {applied ? (
          <>
            <CheckCircle2 className="h-[18px] w-[18px]" />
            Applied
          </>
        ) : (
          <>
            <Send className="h-[18px] w-[18px]" />
            {variant === "details" ? "Select a slot & Apply" : "Select slot & Apply"}
          </>
        )}
      </button>

      {dialog}
    </div>
  );
}
