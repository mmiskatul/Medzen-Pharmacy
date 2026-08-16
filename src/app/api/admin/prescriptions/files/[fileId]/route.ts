import { NextResponse } from "next/server";

import { audit } from "@/lib/audit";
import { AuthError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { getObject, PRIVATE_PREFIX } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The only route that can read a prescription file.
 *
 * Guarantees:
 *  - requires a valid session AND the prescriptions.download permission;
 *  - takes a database file id, not a storage key, so a caller cannot
 *    address arbitrary objects;
 *  - refuses to serve anything stored outside the private prefix;
 *  - records every access in the audit log before the bytes are sent;
 *  - responds no-store and never caches at a proxy.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const user = await requireUser("prescriptions.download");
    const { fileId } = await params;

    const file = await prisma.prescriptionFile.findUnique({
      where: { id: fileId },
      select: {
        key: true,
        mimeType: true,
        originalName: true,
        sizeBytes: true,
        request: { select: { id: true, reference: true } },
      },
    });

    if (!file) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!file.key.startsWith(`${PRIVATE_PREFIX}/`)) {
      console.error("[prescriptions] refused a file stored outside private storage", fileId);
      return new NextResponse("Not found", { status: 404 });
    }

    const disposition =
      new URL(request.url).searchParams.get("download") === "1"
        ? "attachment"
        : "inline";

    const buffer = await getObject(file.key);

    await audit({
      user,
      action:
        disposition === "attachment"
          ? "prescription.file_downloaded"
          : "prescription.file_viewed",
      entity: "PrescriptionFile",
      entityId: fileId,
      meta: { requestReference: file.request.reference },
      ip: clientIp(request.headers),
    });

    // The filename is quoted and stripped of characters that could break
    // out of the header.
    const safeName = file.originalName.replace(/["\r\n\\]/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        // A PDF is rendered in an isolated context, never as page script.
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return new NextResponse(error.message, { status: error.status });
    }
    console.error("[prescriptions] file read failed", error);
    return new NextResponse("Not found", { status: 404 });
  }
}
