/* ==========================================================================
   Client helper for the /api/upload route handler. Keeps the ImgBB key on the
   server and gives the post-tuition form a simple promise-based API.
   ========================================================================== */

export type UploadResult = {
  url: string;
  displayUrl: string;
  thumbUrl: string;
  name: string;
};

export async function uploadBanner(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<UploadResult> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Image upload failed. Please try again.");
  }
  if (!payload.url) {
    throw new Error("The upload did not return an image URL.");
  }

  return {
    url: payload.url,
    displayUrl: payload.displayUrl || payload.url,
    thumbUrl: payload.thumbUrl || payload.url,
    name: payload.name || file.name,
  };
}
