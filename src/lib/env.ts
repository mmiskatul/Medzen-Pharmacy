import { z } from "zod";

/**
 * Server-side environment. Parsed once at module load so a
 * misconfigured deployment fails fast instead of at first request.
 * Never import this from a Client Component.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),

  // ---------------------------------------------------------------- jwt
  // One secret signs every audience. Override per-flow with the
  // AUD_*_SECRET / *_TTL_HOURS knobs if a flow needs stronger isolation.
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ISSUER: z.string().default("medzen-pharmacy"),
  // Admin session — replaces the opaque-token cookie for /admin sign-ins.
  AUD_ADMIN_SECRET: z.string().min(32).optional(),
  AUD_ADMIN_TTL_HOURS: z.coerce.number().int().positive().default(12),
  // Customer order/prescription status lookup — returned with the
  // submission response so the customer can come back without an account.
  AUD_ORDER_STATUS_SECRET: z.string().min(32).optional(),
  AUD_ORDER_STATUS_TTL_HOURS: z.coerce.number().int().positive().default(24 * 30 * 6), // ~6 months
  // Customer magic-link / remember-me — signs the email-link click and
  // the long-lived "remember me" cookie.
  AUD_CUSTOMER_SECRET: z.string().min(32).optional(),
  AUD_MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  AUD_CUSTOMER_REMEMBER_TTL_HOURS: z
    .coerce.number()
    .int()
    .positive()
    .default(24 * 14), // 14 days
  // Staff API bearer tokens — issued via /api/admin/api-tokens, used by
  // scripts and CLI tools calling the admin REST API.
  AUD_API_SECRET: z.string().min(32).optional(),
  AUD_API_TTL_HOURS: z.coerce.number().int().positive().default(24 * 90),
  STORAGE_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().optional(),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@medzen.local"),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

function read() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n  ");
    throw new Error(`Invalid server environment.\n  ${detail}`);
  }
  return parsed.data;
}

export const env = read();

/** Values that are safe to render into the browser bundle. */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  defaultWhatsapp: process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP ?? "971569970932",
  mapsEmbedUrl: process.env.NEXT_PUBLIC_MAPS_EMBED_URL ?? "",
};
