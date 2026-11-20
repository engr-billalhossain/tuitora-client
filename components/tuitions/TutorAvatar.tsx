/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const GRADIENTS = [
  "from-[#B6F70B] to-[#3E7A00]",
  "from-[#7DD3FC] to-[#1D4ED8]",
  "from-[#FCA5A5] to-[#9F1239]",
  "from-[#FCD34D] to-[#B45309]",
  "from-[#C4B5FD] to-[#5B21B6]",
  "from-[#6EE7B7] to-[#047857]",
];

export function TutorAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const gradient = GRADIENTS[name.length % GRADIENTS.length];
  const showImage = Boolean(src) && !failed;

  if (showImage) {
    return (
      <img
        src={src as string}
        alt={name}
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-extrabold text-[#0B1100]",
        gradient,
        className
      )}
    >
      {initials(name) || "T"}
    </span>
  );
}
