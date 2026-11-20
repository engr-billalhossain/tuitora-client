export { cn } from "cn";

/**
 * Only http(s) URLs are safe to drop into a CSS `url()` or an <img src>.
 * Anything else (e.g. a `javascript:` string saved by an admin) is ignored.
 */
export function safeImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : "";
}

/**
 * Card background style for a tuition banner. A dark gradient keeps the white
 * text readable while still letting the uploaded image show through at the top.
 */
export function bannerBackgroundStyle(value: unknown) {
  const url = safeImageUrl(value);
  if (!url) return undefined;

  return {
    backgroundImage: `linear-gradient(180deg, rgba(8,13,15,0.55) 0%, rgba(8,13,15,0.82) 55%, rgba(13,21,24,0.96) 100%), url(${JSON.stringify(url)})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
