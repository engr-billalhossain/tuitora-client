"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export function ReviewForm({
  tuitionId,
  tutorName,
  onReviewed,
  onCancel,
}: {
  tuitionId: string;
  tutorName: string;
  onReviewed?: () => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!rating) {
      setError("Please choose a star rating.");
      toast.error("Please choose a star rating.");
      return;
    }
    setBusy(true);
    try {
      await createReview({ tuitionId, rating, comment });
      setDone(true);
      toast.success("Review submitted — thanks for the feedback!", {
        description: `Your review of ${tutorName} is now public.`,
      });
      onReviewed?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save your review.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#B6F70B]/25 bg-[#B6F70B]/5 px-4 py-3 text-[12px] font-semibold text-[#B6F70B]">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Thanks! Your review of {tutorName} is now public.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/[0.07] bg-[#0F171B] p-4"
    >
      <Label htmlFor={`rating-${tuitionId}`} className="text-[11px] font-bold text-white">
        How was {tutorName}?
      </Label>
      <div className="mt-2 flex items-center gap-1" id={`rating-${tuitionId}`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            aria-pressed={rating === value}
            className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#B6F70B]"
          >
            <Star
              className={cn(
                "h-5 w-5 text-gray-600 transition-colors",
                value <= rating && "fill-amber-400 text-amber-400"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-[11px] font-semibold text-gray-400">
          {rating ? `${rating} / 5` : "Select a rating"}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label
          htmlFor={`comment-${tuitionId}`}
          className="text-[11px] font-bold text-white"
        >
          Your review
        </Label>
        <Textarea
          id={`comment-${tuitionId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share how the classes helped you…"
          maxLength={500}
          className="min-h-[84px] resize-y rounded-xl border-white/10 bg-[#141C21] text-[12px] text-white placeholder:text-gray-500 focus-visible:border-[#B6F70B]/50 focus-visible:ring-[#B6F70B]/30"
        />
      </div>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-rose-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={busy}
          className="h-9 rounded-lg bg-[#B6F70B] px-4 text-[11px] font-extrabold text-[#0B1100] hover:bg-[#C9FF42] disabled:opacity-60"
        >
          {busy ? "Saving…" : "Submit review"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-9 rounded-lg px-4 text-[11px] font-bold text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
