import { fail, ok, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { clientIp } from "@/lib/rate-limit";
import {
  buildKey,
  mediaUrl,
  PUBLIC_PREFIX,
  putObject,
  validateUpload,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOLDERS = new Set(["products", "categories", "brands", "banners", "site"]);

/**
 * Catalog image upload. Writes to the public prefix only — prescription
 * files have their own intake and never pass through here.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(["products.write", "cms.write", "settings.write"]);

    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "products");

    if (!(file instanceof File)) {
      return fail("Choose an image to upload.", 422);
    }
    if (!FOLDERS.has(folder)) {
      return fail("That upload destination is not recognised.", 422);
    }

    const { buffer, mimeType } = await validateUpload(file, "image");
    const key = buildKey(PUBLIC_PREFIX, folder, mimeType);
    const stored = await putObject(key, buffer, mimeType);

    await audit({
      user,
      action: "media.uploaded",
      entity: "Media",
      entityId: stored.key,
      meta: { folder, size: stored.size },
      ip: clientIp(request.headers),
    });

    return ok({ key: stored.key, url: mediaUrl(stored.key), size: stored.size }, { status: 201 });
  } catch (error) {
    return toResponse(error);
  }
}
