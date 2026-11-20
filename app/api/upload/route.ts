import { NextResponse } from "next/server";

/* ==========================================================================
   POST /api/upload — uploads an image to ImgBB using the server-side API key.

   The key deliberately lives only on the server (IMAGEBB_API_KEY, not
   NEXT_PUBLIC_*) so browsers never see it. The browser sends the file here as
   multipart form data, we forward it to ImgBB as base64 and hand the resulting
   public URL back to the caller.
   ========================================================================== */

const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";
const MAX_FILE_SIZE = 32 * 1024 * 1024; // ImgBB's per-image limit
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.IMAGEBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Image upload is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP and GIF images are supported." },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The image is too large. Maximum size is 32 MB." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const uploadBody = new FormData();
    uploadBody.set("key", apiKey);
    uploadBody.set("image", base64);
    uploadBody.set("name", file.name || "tuition-banner");

    const response = await fetch(IMGBB_ENDPOINT, {
      method: "POST",
      body: uploadBody,
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as {
      data?: { url?: string; display_url?: string; thumb?: { url?: string } };
      error?: { message?: string };
    };

    const url = payload.data?.url || payload.data?.display_url;
    if (!response.ok || !url) {
      console.error("ImgBB upload failed:", payload.error?.message ?? response.status);
      return NextResponse.json(
        { error: payload.error?.message || "Image upload failed. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url,
      displayUrl: payload.data?.display_url || url,
      thumbUrl: payload.data?.thumb?.url || url,
      name: file.name || "tuition-banner",
    });
  } catch (error) {
    console.error("Failed to upload image:", error);
    return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 500 });
  }
}
