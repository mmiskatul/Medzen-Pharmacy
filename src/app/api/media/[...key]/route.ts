import { NextResponse } from "next/server";

import { getObject, PUBLIC_PREFIX, assertSafeKey } from "@/lib/storage";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

/**
 * Serves catalog media only. Anything outside the public prefix — most
 * importantly every prescription file — is refused here regardless of
 * what key is requested.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.join("/");

  if (!key.startsWith(`${PUBLIC_PREFIX}/`)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    assertSafeKey(key);
    const buffer = await getObject(key);
    const extension = key.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
