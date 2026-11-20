"use client";

import * as React from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { useSession } from "@/lib/auth-client";
import {
  APPLICATIONS_CHANGED_EVENT,
  CLASS_LEVEL_OPTIONS,
  LOCATION_OPTIONS,
  SORT_OPTIONS,
  SUBJECT_OPTIONS,
  daysValue,
  feeValue,
  getBrowseData,
  matchesClassLevel,
  matchesSubject,
  sortTuitions,
  type BrowseTuition,
} from "@/lib/tuitions";
import { cn } from "@/lib/utils";
import { TuitionCard } from "@/components/tuitions/TuitionCard";

const PAGE_SIZE = 12;

/** Slider ceiling follows the actual listings, so high real fees stay visible. */
function feeCeilingFor(list: BrowseTuition[]) {
  const max = list.reduce((highest, item) => Math.max(highest, feeValue(item.fee)), 0);
  return Math.max(300, Math.ceil(max / 100) * 100);
}

type Filters = {
  query: string;
  subject: string;
  classLevel: string;
  location: string;
  modes: string[];
  levels: string[];
  minFee: number;
  maxFee: number;
  feeActive: boolean;
  days: string;
  sort: string;
};

const DEFAULT_FILTERS: Filters = {
  query: "",
  subject: "",
  classLevel: "",
  location: "",
  modes: [],
  levels: [],
  minFee: 0,
  maxFee: 300,
  feeActive: false,
  days: "",
  sort: "newest",
};

const DAY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1 Day" },
  { value: "2", label: "2 Days" },
  { value: "3", label: "3 Days" },
  { value: "4", label: "4 Days" },
  { value: "5", label: "5 Days" },
];

function normalizeClassParam(value: string) {
  if (/^class-[678]$/.test(value)) return "class-6-8";
  if (/^class-(9|10)$/.test(value)) return "ssc";
  if (value === "class-11" || value === "class-12") return "hsc";
  if (value === "admission") return "university";
  return value;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="border-b border-white/[0.07] py-4 first:pt-0 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-[12px] font-bold text-white"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg py-0.5 text-[11px] font-semibold text-gray-300 transition-colors hover:text-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-white/20 accent-[#B6F70B]"
      />
      <span className="min-w-0 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] font-semibold text-gray-500">{count}</span>
      )}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
}) {
  return (
    <div className="relative flex min-w-0 items-center">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-[#B6F70B]" />
      )}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full min-w-0 appearance-none rounded-xl border border-white/10 bg-[#141C21] pr-9 text-[11px] font-semibold text-gray-200 outline-none transition-colors focus:border-[#B6F70B]/50",
          Icon ? "pl-9" : "pl-3"
        )}
      >
        {placeholder && (
          <option value="" className="bg-[#141C21]">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#141C21] text-gray-200"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-gray-500" />
    </div>
  );
}

export type TuitionBrowserProps = {
  initialQuery?: string;
  initialClass?: string;
  initialMode?: string;
};

function buildInitialFilters({
  initialQuery = "",
  initialClass = "",
  initialMode = "",
}: TuitionBrowserProps): Filters {
  return {
    ...DEFAULT_FILTERS,
    query: initialQuery,
    classLevel: normalizeClassParam(initialClass),
    modes:
      initialMode === "online" || initialMode === "offline" ? [initialMode] : [],
  };
}

export function TuitionBrowser(initial: TuitionBrowserProps) {
  const { data: session } = useSession();

  const [tuitions, setTuitions] = React.useState<BrowseTuition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [backendReachable, setBackendReachable] = React.useState(true);
  // Initial filters come from the home-page search form / navbar links.
  const [draft, setDraft] = React.useState<Filters>(() =>
    buildInitialFilters(initial)
  );
  const [applied, setApplied] = React.useState<Filters>(() =>
    buildInitialFilters(initial)
  );
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [page, setPage] = React.useState(1);

  const loadTuitions = React.useCallback(() => {
    let active = true;
    getBrowseData(session?.user?.name)
      .then((result) => {
        if (!active) return;
        setTuitions(result.tuitions);
        setBackendReachable(result.backendReachable);
        const ceiling = feeCeilingFor(result.tuitions);
        setDraft((previous) =>
          previous.feeActive ? previous : { ...previous, maxFee: ceiling }
        );
        setApplied((previous) =>
          previous.feeActive ? previous : { ...previous, maxFee: ceiling }
        );
      })
      .catch((error) => {
        console.error("Failed to load tuitions:", error);
        if (active) setTuitions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.name]);

  React.useEffect(() => loadTuitions(), [loadTuitions]);

  // A booking anywhere removes that tuition from every student's listings.
  React.useEffect(() => {
    const sync = () => loadTuitions();
    window.addEventListener(APPLICATIONS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APPLICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [loadTuitions]);

  const feeCeiling = React.useMemo(() => feeCeilingFor(tuitions), [tuitions]);

  function updateDraft<K extends keyof Filters>(key: K, value: Filters[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function updateFee(key: "minFee" | "maxFee", value: number) {
    setDraft((previous) => ({ ...previous, [key]: value, feeActive: true }));
  }

  function applyFilters() {
    setApplied({ ...draft });
    setPage(1);
  }

  function resetFilters() {
    const reset = { ...DEFAULT_FILTERS, maxFee: feeCeiling };
    setDraft(reset);
    setApplied(reset);
    setPage(1);
  }

  function changeSort(value: string) {
    const next = { ...draft, sort: value };
    setDraft(next);
    setApplied(next);
    setPage(1);
  }

  const filtered = React.useMemo(() => {
    const result = tuitions.filter((tuition) => {
      const query = applied.query.trim().toLowerCase();
      if (query) {
        const haystack = [
          tuition.title,
          tuition.subject,
          tuition.tutorName,
          tuition.classLevel,
          tuition.description,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (
        applied.subject &&
        !matchesSubject(tuition.subject, applied.subject)
      ) {
        return false;
      }
      if (
        applied.classLevel &&
        !matchesClassLevel(tuition.classLevel, applied.classLevel)
      ) {
        return false;
      }
      if (applied.location) {
        if (applied.location === "Online") {
          if (tuition.mode.toLowerCase() !== "online") return false;
        } else if (
          !tuition.location.toLowerCase().includes(applied.location.toLowerCase())
        ) {
          return false;
        }
      }
      if (
        applied.modes.length &&
        !applied.modes.includes(tuition.mode.toLowerCase())
      ) {
        return false;
      }
      if (
        applied.levels.length &&
        !applied.levels.some((level) =>
          matchesClassLevel(tuition.classLevel, level)
        )
      ) {
        return false;
      }
      if (applied.feeActive) {
        const fee = feeValue(tuition.fee);
        if (fee < applied.minFee || fee > applied.maxFee) return false;
      }
      if (
        applied.days &&
        daysValue(tuition.days) !== Number.parseInt(applied.days, 10)
      ) {
        return false;
      }
      return true;
    });
    return sortTuitions(result, applied.sort);
  }, [tuitions, applied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const firstItem = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const counts = React.useMemo(
    () => ({
      online: tuitions.filter((item) => item.mode.toLowerCase() === "online")
        .length,
      offline: tuitions.filter((item) => item.mode.toLowerCase() === "offline")
        .length,
      "class-6-8": tuitions.filter((item) =>
        matchesClassLevel(item.classLevel, "class-6-8")
      ).length,
      ssc: tuitions.filter((item) => matchesClassLevel(item.classLevel, "ssc"))
        .length,
      hsc: tuitions.filter((item) => matchesClassLevel(item.classLevel, "hsc"))
        .length,
      university: tuitions.filter((item) =>
        matchesClassLevel(item.classLevel, "university")
      ).length,
    }),
    [tuitions]
  );

  function toggleListValue(key: "modes" | "levels", value: string) {
    const current = draft[key];
    updateDraft(
      key,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  const subjectSelectOptions = SUBJECT_OPTIONS.map((value) => ({
    value,
    label: value,
  }));
  const locationSelectOptions = LOCATION_OPTIONS.map((value) => ({
    value,
    label: value,
  }));
  const sortSelectOptions = SORT_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <div className="min-h-screen bg-[#080D0F] pb-16 text-white">
      <div className="mx-auto max-w-[1440px] px-4 pt-7 sm:px-8 lg:px-12">
        {/* Page heading */}
        <div className="mb-5">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#B6F70B] uppercase">
            Explore tuitions
          </p>
          <h1 className="mt-1.5 text-[26px] leading-tight font-extrabold tracking-tight text-white sm:text-[30px]">
            Find a tuition that fits you
          </h1>
          <p className="mt-1.5 text-[12px] text-gray-400">
            Browse all posted tuitions, compare details and request a booking
            in a few clicks.
          </p>
        </div>

        {/* Top search bar */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
          className="rounded-2xl border border-white/[0.07] bg-[#10191D] p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] sm:p-3"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#B6F70B]" />
              <input
                type="search"
                value={draft.query}
                onChange={(event) => updateDraft("query", event.target.value)}
                placeholder="Search by subject, class, location or tutor name..."
                aria-label="Search tuitions"
                className="h-10 w-full rounded-xl border border-white/10 bg-[#141C21] pr-3 pl-9 text-[11px] text-gray-200 outline-none transition-colors placeholder:text-gray-500 focus:border-[#B6F70B]/50"
              />
            </div>
            <Select
              ariaLabel="Filter by subject"
              value={draft.subject}
              onChange={(value) => updateDraft("subject", value)}
              options={subjectSelectOptions}
            />
            <Select
              ariaLabel="Filter by class level"
              value={draft.classLevel}
              onChange={(value) => updateDraft("classLevel", value)}
              options={CLASS_LEVEL_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
            <Select
              ariaLabel="Filter by location"
              value={draft.location}
              onChange={(value) => updateDraft("location", value)}
              options={locationSelectOptions}
            />
            <button
              type="submit"
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#B6F70B] px-6 text-[12px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42]"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </form>

        {!loading && !backendReachable && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-[11px] font-semibold text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not reach the server. Showing only tuitions saved in this
            browser.
          </div>
        )}

        {/* Filters + results */}
        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-white/[0.07] bg-[#10191D] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] lg:sticky lg:top-[86px]">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-white">
                <SlidersHorizontal className="h-4 w-4 text-[#B6F70B]" />
                Filters
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-bold text-[#B6F70B] transition-colors hover:text-[#C9FF42]"
              >
                Reset
              </button>
            </div>

            <div className="mt-4">
              <FilterSection title="Tuition Mode">
                <FilterCheckbox
                  label="Online (Zoom / Meet)"
                  count={counts.online}
                  checked={draft.modes.includes("online")}
                  onChange={() => toggleListValue("modes", "online")}
                />
                <FilterCheckbox
                  label="Offline (In-Person)"
                  count={counts.offline}
                  checked={draft.modes.includes("offline")}
                  onChange={() => toggleListValue("modes", "offline")}
                />
              </FilterSection>

              <FilterSection title="Class Level">
                {CLASS_LEVEL_OPTIONS.filter((option) => option.value).map(
                  (option) => (
                    <FilterCheckbox
                      key={option.value}
                      label={option.label}
                      count={counts[option.value as keyof typeof counts]}
                      checked={draft.levels.includes(option.value)}
                      onChange={() => toggleListValue("levels", option.value)}
                    />
                  )
                )}
              </FilterSection>

              <FilterSection title="Monthly Fee (USD)">
                <div className="relative mt-1 h-5">
                  <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-[#2A363D]" />
                  <div
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#B6F70B]"
                    style={{
                      left: `${(draft.minFee / feeCeiling) * 100}%`,
                      right: `${100 - (draft.maxFee / feeCeiling) * 100}%`,
                    }}
                  />
                  <input
                    type="range"
                    aria-label="Minimum monthly fee"
                    min={0}
                    max={feeCeiling}
                    value={draft.minFee}
                    onChange={(event) =>
                      updateFee(
                        "minFee",
                        Math.min(Number(event.target.value), draft.maxFee)
                      )
                    }
                    className="dual-range absolute inset-0 h-5 w-full"
                  />
                  <input
                    type="range"
                    aria-label="Maximum monthly fee"
                    min={0}
                    max={feeCeiling}
                    value={draft.maxFee}
                    onChange={(event) =>
                      updateFee(
                        "maxFee",
                        Math.max(Number(event.target.value), draft.minFee)
                      )
                    }
                    className="dual-range absolute inset-0 h-5 w-full"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-9 min-w-0 flex-1 items-center gap-1 rounded-lg border border-white/10 bg-[#141C21] px-2.5">
                    <span className="text-[11px] text-gray-500">$</span>
                    <input
                      type="number"
                      min={0}
                      max={draft.maxFee}
                      value={draft.minFee}
                      onChange={(event) =>
                        updateFee(
                          "minFee",
                          Math.min(Number(event.target.value), draft.maxFee)
                        )
                      }
                      aria-label="Minimum fee"
                      className="w-full min-w-0 bg-transparent text-[11px] font-semibold text-gray-200 outline-none"
                    />
                  </div>
                  <span className="text-gray-600">–</span>
                  <div className="flex h-9 min-w-0 flex-1 items-center gap-1 rounded-lg border border-white/10 bg-[#141C21] px-2.5">
                    <span className="text-[11px] text-gray-500">$</span>
                    <input
                      type="number"
                      min={draft.minFee}
                      max={feeCeiling}
                      value={draft.maxFee}
                      onChange={(event) =>
                        updateFee(
                          "maxFee",
                          Math.max(Number(event.target.value), draft.minFee)
                        )
                      }
                      aria-label="Maximum fee"
                      className="w-full min-w-0 bg-transparent text-[11px] font-semibold text-gray-200 outline-none"
                    />
                  </div>
                </div>
              </FilterSection>

              <FilterSection title="Days Per Week">
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <select
                    aria-label="Filter by days per week"
                    value={draft.days}
                    onChange={(event) => updateDraft("days", event.target.value)}
                    className="h-9 w-full appearance-none rounded-lg border border-white/10 bg-[#141C21] pr-8 pl-8 text-[11px] font-semibold text-gray-300 outline-none focus:border-[#B6F70B]/50"
                  >
                    {DAY_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-[#141C21]"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                </div>
              </FilterSection>

              <FilterSection title="Quick filters">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "online", label: "Online" },
                    { key: "offline", label: "Offline" },
                    { key: "hsc", label: "HSC" },
                    { key: "ssc", label: "SSC" },
                  ].map((chip) => {
                    const isMode = chip.key === "online" || chip.key === "offline";
                    const active = isMode
                      ? draft.modes.includes(chip.key)
                      : draft.levels.includes(chip.key);
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() =>
                          toggleListValue(
                            isMode ? "modes" : "levels",
                            chip.key
                          )
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors",
                          active
                            ? "border-[#B6F70B]/50 bg-[#B6F70B]/10 text-[#B6F70B]"
                            : "border-white/10 bg-[#141C21] text-gray-400 hover:text-white"
                        )}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>
            </div>

            <button
              type="button"
              onClick={applyFilters}
              className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#B6F70B] text-[12px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42]"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
          </aside>

          {/* Results */}
          <section className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-gray-400">
                {loading ? (
                  "Loading tuitions..."
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-bold text-white">{firstItem}</span> –{" "}
                    <span className="font-bold text-white">{lastItem}</span> of{" "}
                    <span className="font-bold text-white">{filtered.length}</span>{" "}
                    Tuitions
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500">
                  Sort by:
                </span>
                <div className="relative">
                  <select
                    aria-label="Sort tuitions"
                    value={draft.sort}
                    onChange={(event) => changeSort(event.target.value)}
                    className="h-9 appearance-none rounded-lg border border-white/10 bg-[#141C21] pr-8 pl-3 text-[11px] font-semibold text-gray-200 outline-none focus:border-[#B6F70B]/50"
                  >
                    {sortSelectOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-[#141C21]"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                </div>
                <div className="flex items-center rounded-lg border border-white/10 bg-[#141C21] p-0.5">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                      view === "grid"
                        ? "bg-[#B6F70B] text-[#0B1100]"
                        : "text-gray-500 hover:text-white"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                      view === "list"
                        ? "bg-[#B6F70B] text-[#0B1100]"
                        : "text-gray-500 hover:text-white"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-56 animate-pulse rounded-2xl border border-white/[0.06] bg-[#10191D]"
                  />
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#10191D] px-6 py-20 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
                  <Search className="h-6 w-6 text-[#B6F70B]" />
                </span>
                <h2 className="mt-4 text-[15px] font-extrabold text-white">
                  No tuitions found
                </h2>
                <p className="mt-1.5 max-w-sm text-[12px] text-gray-500">
                  Try changing your search or clearing a few filters to see more
                  results.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#B6F70B] px-4 text-[11px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "mt-4 grid gap-4",
                    view === "grid"
                      ? "md:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {pageItems.map((tuition) => (
                    <TuitionCard
                      key={tuition.id}
                      tuition={tuition}
                      view={view}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    aria-label="Tuition pages"
                    className="mt-7 flex items-center justify-center gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#141C21] text-gray-300 transition-colors hover:border-[#B6F70B]/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                      (pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          aria-current={currentPage === pageNumber ? "page" : undefined}
                          className={cn(
                            "h-8 w-8 rounded-lg border text-[11px] font-bold transition-colors",
                            currentPage === pageNumber
                              ? "border-[#B6F70B] bg-[#B6F70B] text-[#0B1100]"
                              : "border-white/10 bg-[#141C21] text-gray-300 hover:border-[#B6F70B]/40"
                          )}
                        >
                          {pageNumber}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setPage((value) => Math.min(totalPages, value + 1))
                      }
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#141C21] text-gray-300 transition-colors hover:border-[#B6F70B]/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
