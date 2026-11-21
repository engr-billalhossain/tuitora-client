/** Client-safe browse filter types + URL helper (no database imports). */

export type BrowseFilterState = {
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

/** Serializes the filter state into a shareable /tuitions URL. */
export function browseHref(filters: BrowseFilterState, page = 1): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("search", filters.query.trim());
  if (filters.subject) params.set("subject", filters.subject);
  if (filters.classLevel) params.set("class", filters.classLevel);
  if (filters.location) params.set("location", filters.location);
  if (filters.modes.length) params.set("modes", filters.modes.join(","));
  if (filters.levels.length) params.set("levels", filters.levels.join(","));
  if (filters.feeActive) {
    if (filters.minFee > 0) params.set("minFee", String(filters.minFee));
    params.set("maxFee", String(filters.maxFee));
  }
  if (filters.days) params.set("days", filters.days);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/tuitions?${query}` : "/tuitions";
}
