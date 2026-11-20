import { TuitionBrowser } from "@/components/tuitions/TuitionBrowser";

type TuitionSearchParams = Promise<{
  search?: string | string[];
  class?: string | string[];
  mode?: string | string[];
}>;

export default async function TuitionsPage({
  searchParams,
}: {
  searchParams: TuitionSearchParams;
}) {
  const params = await searchParams;
  const first = (value?: string | string[]) =>
    Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

  const initialQuery = first(params.search);
  const initialClass = first(params.class);
  const initialMode = first(params.mode);

  return (
    <TuitionBrowser
      key={`${initialQuery}|${initialClass}|${initialMode}`}
      initialQuery={initialQuery}
      initialClass={initialClass}
      initialMode={initialMode}
    />
  );
}
