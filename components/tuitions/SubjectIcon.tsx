import {
  Atom,
  BookOpen,
  Code,
  Dna,
  FlaskConical,
  GraduationCap,
  Languages,
  Library,
  type LucideIcon,
} from "lucide-react";

import type { SubjectIconKey } from "@/lib/tuitions";
import { cn } from "@/lib/utils";

const ICONS: Record<SubjectIconKey, { Icon: LucideIcon; tone: string }> = {
  math: {
    Icon: Library,
    tone: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  },
  physics: {
    Icon: Atom,
    tone: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  },
  chemistry: {
    Icon: FlaskConical,
    tone: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  },
  biology: {
    Icon: Dna,
    tone: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  },
  programming: {
    Icon: Code,
    tone: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  },
  english: {
    Icon: BookOpen,
    tone: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  },
  bangla: {
    Icon: Languages,
    tone: "border-teal-400/25 bg-teal-400/10 text-teal-300",
  },
  economics: {
    Icon: GraduationCap,
    tone: "border-blue-400/25 bg-blue-400/10 text-blue-300",
  },
  science: {
    Icon: FlaskConical,
    tone: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
  },
};

export function SubjectIconTile({
  icon,
  className,
  iconClassName,
}: {
  icon: SubjectIconKey;
  className?: string;
  iconClassName?: string;
}) {
  const entry = ICONS[icon] ?? ICONS.math;
  const Icon = entry.Icon;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border",
        entry.tone,
        className ?? "h-10 w-10"
      )}
    >
      <Icon className={iconClassName ?? "h-5 w-5"} strokeWidth={2} />
    </span>
  );
}
