import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { v2 as cloudinary } from "cloudinary";

import { env } from "./env";

/**
 * Two prefixes with different exposure rules:
 *
 *  public/*  — product, category, brand and banner images. Served through
 *              /api/media/[...key], cacheable, safe to link.
 *  private/* — prescription uploads. Never served by the media route; the
 *              only reader is /api/admin/prescriptions/files/[fileId],
 *              which authorises the request first. Keys carry 32 bytes of
 *              entropy so they are not guessable even if one leaks.
 */
export const PUBLIC_PREFIX = "public";
export const PRIVATE_PREFIX = "private";

export type StoredObject = {
  key: string;
  size: number;
  checksumSha256: string;
  mimeType: string;
};

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const PRESCRIPTION_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

/** Magic-number check — the declared Content-Type is not trusted. */
function sniff(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (buffer.subarray(0, 5).toString("latin1") === "%PDF-") {
    return "application/pdf";
  }
  const riff = buffer.subarray(0, 4).toString("latin1");
  const webp = buffer.subarray(8, 12).toString("latin1");
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  if (buffer.subarray(4, 12).toString("latin1").startsWith("ftypavif")) {
    return "image/avif";
  }
  return null;
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export type UploadKind = "image" | "prescription";

export async function validateUpload(
  file: File,
  kind: UploadKind,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (file.size === 0) {
    throw new UploadError("That file is empty. Choose another file.");
  }
  if (file.size > env.MAX_UPLOAD_BYTES) {
    const mb = Math.floor(env.MAX_UPLOAD_BYTES / (1024 * 1024));
    throw new UploadError(`Files must be ${mb} MB or smaller.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniff(buffer);
  if (!sniffed) {
    throw new UploadError(
      "That file type is not supported. Upload a JPG, PNG or PDF.",
    );
  }

  const allowed = kind === "image" ? IMAGE_TYPES : PRESCRIPTION_TYPES;
  if (!allowed.has(sniffed)) {
    throw new UploadError(
      kind === "image"
        ? "Images must be JPG, PNG, WebP or AVIF."
        : "Prescriptions must be a JPG, PNG or PDF.",
    );
  }

  // Defence in depth against polyglot files: reject any upload whose
  // bytes contain an HTML/script opener near the head.
  const head = buffer.subarray(0, 512).toString("latin1").toLowerCase();
  if (head.includes("<script") || head.includes("<!doctype html")) {
    throw new UploadError("That file could not be accepted.");
  }

  return { buffer, mimeType: sniffed };
}

function extensionFor(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export function buildKey(prefix: string, folder: string, mimeType: string) {
  const id = randomBytes(24).toString("hex");
  return `${prefix}/${folder}/${id}.${extensionFor(mimeType)}`;
}

/** Rejects traversal and any key outside the two known prefixes. */
export function assertSafeKey(key: string) {
  if (
    !key ||
    key.includes("..") ||
    key.startsWith("/") ||
    key.includes("\\") ||
    !/^[a-z0-9/_.-]+$/i.test(key)
  ) {
    throw new UploadError("Invalid storage key.");
  }
  if (!key.startsWith(`${PUBLIC_PREFIX}/`) && !key.startsWith(`${PRIVATE_PREFIX}/`)) {
    throw new UploadError("Invalid storage key.");
  }
}

// ---------------------------------------------------------------- drivers

interface StorageDriver {
  put(key: string, body: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

const localDriver: StorageDriver = {
  async put(key, body) {
    const full = path.resolve(env.STORAGE_LOCAL_DIR, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  },
  async get(key) {
    return readFile(path.resolve(env.STORAGE_LOCAL_DIR, key));
  },
  async remove(key) {
    await unlink(path.resolve(env.STORAGE_LOCAL_DIR, key)).catch(() => undefined);
  },
};

/**
 * Cloudinary driver.
 *
 * The application key (`public/<folder>/<id>.<ext>`) is reused as the
 * Cloudinary `public_id` — Cloudinary allows slashes inside public_ids
 * and treats them as a folder-style path. Uploads for the private prefix
 * use `type: "private"`, which makes them unreachable via any public
 * delivery URL; reads go through a signed, short-lived URL minted with
 * `private_download_url`. Public-prefix uploads are stored as the
 * default public type, but the app still routes every read through its
 * own `/api/media/[...key]` route, so no raw Cloudinary URL is ever
 * surfaced to a browser.
 *
 * PDFs are uploaded as `resource_type: "raw"` because Cloudinary stores
 * non-image assets under that resource type; everything else goes under
 * `image`.
 */
function cloudinaryConfigured() {
  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  } = env;
  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "STORAGE_DRIVER is cloudinary but the CLOUDINARY_* variables are not set.",
    );
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function cloudinaryResourceType(mimeType: string) {
  return mimeType === "application/pdf" ? "raw" : "image";
}

function cloudinaryFolder() {
  return env.CLOUDINARY_FOLDER?.replace(/^\/+|\/+$/g, "") || undefined;
}

function cloudinaryPublicId(key: string) {
  const folder = cloudinaryFolder();
  return folder ? `${folder}/${key}` : key;
}

const cloudinaryDriver: StorageDriver = {
  async put(key, body, mimeType) {
    cloudinaryConfigured();
    const resourceType = cloudinaryResourceType(mimeType);
    const dataUri = `data:${mimeType};base64,${body.toString("base64")}`;
    await cloudinary.uploader.upload(dataUri, {
      public_id: cloudinaryPublicId(key),
      resource_type: resourceType,
      overwrite: false,
      unique_filename: false,
      type: key.startsWith(`${PRIVATE_PREFIX}/`) ? "private" : "upload",
      // The key already contains 24 random bytes; let Cloudinary keep it.
      invalidate: false,
    });
  },
  async get(key) {
    cloudinaryConfigured();
    const isPrivate = key.startsWith(`${PRIVATE_PREFIX}/`);
    const format = key.split(".").pop()?.toLowerCase();
    // The key's extension tells us which Cloudinary resource_type the
    // object lives under: PDFs are `raw`, everything else is `image`.
    const primaryType: "raw" | "image" =
      format === "pdf" ? "raw" : "image";

    const download = (rt: "raw" | "image") =>
      isPrivate
        ? cloudinary.utils.private_download_url(
            cloudinaryPublicId(key),
            // For `raw` resource_type Cloudinary requires a format; for
            // `image` it is a transformation hint, so we pass the
            // original encoding to avoid forced conversion.
            rt === "raw" ? format ?? "bin" : format ?? "",
            {
              resource_type: rt,
              type: "private",
              expires_at: Math.floor(Date.now() / 1000) + 60,
            },
          )
        : cloudinary.url(cloudinaryPublicId(key), {
            resource_type: rt,
            secure: true,
          });

    const url = download(primaryType);
    let res = await fetch(url);
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
    // Fall back to the other resource type — covers the rare case
    // where the extension and the actual upload didn't match.
    const fallbackType: "raw" | "image" =
      primaryType === "raw" ? "image" : "raw";
    res = await fetch(download(fallbackType));
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
    throw new Error(
      `Cloudinary fetch failed for ${key} with status ${res.status}.`,
    );
  },
  async remove(key) {
    cloudinaryConfigured();
    // Try both resource types so we never leave orphans if the caller
    // records the wrong mime in the future.
    for (const resourceType of ["image", "raw"] as const) {
      try {
        await cloudinary.uploader.destroy(cloudinaryPublicId(key), {
          resource_type: resourceType,
          type: key.startsWith(`${PRIVATE_PREFIX}/`) ? "private" : "upload",
          invalidate: true,
        });
      } catch {
        // swallow — the other resource_type or a missing asset is fine
      }
    }
  },
};

const driver: StorageDriver =
  env.STORAGE_DRIVER === "cloudinary" ? cloudinaryDriver : localDriver;

// ---------------------------------------------------------------- api

export async function putObject(
  key: string,
  buffer: Buffer,
  mimeType: string,
): Promise<StoredObject> {
  assertSafeKey(key);
  await driver.put(key, buffer, mimeType);
  return {
    key,
    size: buffer.byteLength,
    checksumSha256: createHash("sha256").update(buffer).digest("hex"),
    mimeType,
  };
}

export async function getObject(key: string): Promise<Buffer> {
  assertSafeKey(key);
  return driver.get(key);
}

export async function removeObject(key: string): Promise<void> {
  assertSafeKey(key);
  await driver.remove(key);
}

/** Public URL for catalog media. Private keys are rejected outright. */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (!key.startsWith(`${PUBLIC_PREFIX}/`)) return null;
  return `/api/media/${key}`;
}
