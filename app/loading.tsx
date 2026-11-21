/** Shared skeleton shown while a route segment streams in. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050B0E] px-6 py-10 text-white sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-[#B6F70B]/20" />
            <div className="h-10 w-full animate-pulse rounded bg-white/10" />
            <div className="h-10 w-4/5 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-6 flex gap-3">
              <div className="h-10 w-36 animate-pulse rounded-full bg-white/10" />
              <div className="h-10 w-36 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
          <div className="h-[260px] animate-pulse rounded-2xl bg-[#10191D]" />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-[200px] animate-pulse rounded-2xl bg-[#10191D]"
            />
          ))}
        </div>
      </div>
      <span className="sr-only" role="status">
        Loading
      </span>
    </div>
  );
}
