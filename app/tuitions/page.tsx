import { TuitionBrowser } from "@/components/tuitions/TuitionBrowser";
import { getServerBrowseData, type BrowseFilterState } from "@/lib/browse";
import type { BrowseQuery } from "@/lib/tuitionDb";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value?: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function list(value?: string | string[]): string[] {
  return first(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function number(value?: string | string[]): number | undefined {
  const raw = first(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Maps the homepage search params onto canonical browse filters. */
function normalizeClass(value: string): string {
  if (/^class-[678]$/.test(value)) return "class-6-8";
  if (/^class-(9|10)$/.test(value)) return "ssc";
  if (value === "class-11" || value === "class-12") return "hsc";
  if (value === "admission") return "university";
  return value;
}

export default async function TuitionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const modes = list(params.modes);
  const bannerMode = first(params.mode);
  if (bannerMode === "online" || bannerMode === "offline") modes.push(bannerMode);

  const classLevel = normalizeClass(first(params.classLevel) || first(params.class));
  const levels = list(params.levels);

  const allModes = [...new Set(modes)];
  const allLevels = [...new Set(levels)];

  const query: BrowseQuery = {
    search: first(params.search) || first(params.q),
    subject: first(params.subject),
    classLevel,
    location: first(params.location),
    modes: allModes,
    levels: allLevels,
    minFee: number(params.minFee),
    maxFee: number(params.maxFee),
    days: first(params.days),
    sort: first(params.sort) || "newest",
    page: number(params.page) || 1,
    limit: 12,
  };

  // The filtering and pagination run on the server before any markup is sent.
  const result = await getServerBrowseData(query);

  return (
    <TuitionBrowser
      key={`${query.search}|${query.classLevel}|${allModes.join(",")}|${allLevels.join(",")}|${query.subject}|${query.page}|${query.sort}`}
      initialQuery={query.search || ""}
      initialClass={classLevel}
      initialMode={bannerMode}
      initialFilters={
        {
          query: query.search || "",
          subject: query.subject || "",
          classLevel,
          location: query.location || "",
          modes: allModes,
          levels: allLevels,
          minFee: query.minFee ?? 0,
          maxFee: query.maxFee ?? 0,
          feeActive: query.minFee !== undefined || query.maxFee !== undefined,
          days: query.days || "",
          sort: query.sort || "newest",
        } satisfies BrowseFilterState
      }
      initialTuitions={result.tuitions}
      pagination={result.pagination}
      facets={result.facets}
    />
  );
}
