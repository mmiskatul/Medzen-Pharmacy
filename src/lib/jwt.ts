import "server-only";

import jwt from "jsonwebtoken";

import { env } from "./env";

/**
 * JWT helper. One file, one signing primitive, four audiences.
 *
 *  admin           — replaces the previous opaque-token cookie for /admin.
 *                    Subject = user id. Carries role + extraPerms so the
 *                    middleware doesn't need a DB hit on every request.
 *                    The Session table remains as the revocation list,
 *                    keyed by the JWT's `jti` (or a hash of it), so we
 *                    keep server-side revocation for "log out everywhere".
 *  order_status    — short customer-facing bearer token returned with
 *                    order/prescription submissions. Lets a customer
 *                    come back to a status page without an account.
 *  customer        — magic-link click target + long-lived remember-me
 *                    cookie for signed-in customers.
 *  api             — long-lived bearer token issued to staff from
 *                    /api/admin/api-tokens for scripts / CLIs.
 *
 * Each audience has its own TTL knob and (optionally) its own secret. If
 * an `AUD_*_SECRET` is not set we fall back to the primary JWT_SECRET.
 */
export type Audience = "admin" | "order_status" | "customer" | "api";

export type AdminClaims = {
  sub: string; // user id
  email: string;
  name: string;
  role: string;
  extraPerms: string[];
  jti: string;
};

export type OrderStatusClaims = {
  sub: string; // order or prescriptionRequest id
  kind: "order" | "prescription";
  jti: string;
};

export type CustomerClaims = {
  sub: string; // customer id (or email when pre-registration)
  email: string;
  purpose: "magic-link" | "remember-me";
  jti: string;
};

export type ApiClaims = {
  sub: string; // user id
  email: string;
  role: string;
  tokenId: string; // StaffApiToken.id (revocation key)
  jti: string;
};

export class JwtError extends Error {
  constructor(
    public readonly reason:
      | "expired"
      | "invalid-signature"
      | "wrong-audience"
      | "wrong-issuer"
      | "malformed",
    message?: string,
  ) {
    super(message ?? reason);
    this.name = "JwtError";
  }
}

function secretFor(audience: Audience): string {
  switch (audience) {
    case "admin":
      return env.AUD_ADMIN_SECRET ?? env.JWT_SECRET;
    case "order_status":
      return env.AUD_ORDER_STATUS_SECRET ?? env.JWT_SECRET;
    case "customer":
      return env.AUD_CUSTOMER_SECRET ?? env.JWT_SECRET;
    case "api":
      return env.AUD_API_SECRET ?? env.JWT_SECRET;
  }
}

function ttlSeconds(audience: Audience, overrideSeconds?: number): number {
  if (overrideSeconds !== undefined) return overrideSeconds;
  switch (audience) {
    case "admin":
      return env.AUD_ADMIN_TTL_HOURS * 60 * 60;
    case "order_status":
      return env.AUD_ORDER_STATUS_TTL_HOURS * 60 * 60;
    case "customer":
      // The customer audience has two TTLs (magic-link minutes,
      // remember-me hours). Callers pass overrideSeconds.
      return 60 * 60;
    case "api":
      return env.AUD_API_TTL_HOURS * 60 * 60;
  }
}

function mapJwtError(err: unknown): never {
  if (err instanceof jwt.TokenExpiredError) {
    throw new JwtError("expired", "Token has expired.");
  }
  if (err instanceof jwt.JsonWebTokenError) {
    const msg = err.message.toLowerCase();
    if (msg.includes("audience")) throw new JwtError("wrong-audience");
    if (msg.includes("issuer")) throw new JwtError("wrong-issuer");
    if (msg.includes("signature")) throw new JwtError("invalid-signature");
    throw new JwtError("malformed");
  }
  throw err;
}

function sign<T extends object>(
  audience: Audience,
  payload: T,
  ttlOverrideSeconds?: number,
): string {
  return jwt.sign(payload, secretFor(audience), {
    algorithm: "HS256",
    audience,
    issuer: env.JWT_ISSUER,
    expiresIn: ttlSeconds(audience, ttlOverrideSeconds),
  });
}

function verify<T extends object>(audience: Audience, token: string): T {
  try {
    return jwt.verify(token, secretFor(audience), {
      algorithms: ["HS256"],
      audience,
      issuer: env.JWT_ISSUER,
    }) as T;
  } catch (err) {
    mapJwtError(err);
  }
}

// ---------------------------------------------------------------- public API

/** Mint an admin session JWT. The Session row (jti) keeps revocation alive. */
export function signAdmin(claims: Omit<AdminClaims, "jti"> & { jti: string }) {
  return sign<AdminClaims>("admin", claims);
}

export function verifyAdmin(token: string): AdminClaims {
  return verify<AdminClaims>("admin", token);
}

/** Customer-facing bearer token for tracking an order or prescription. */
export function signOrderStatus(claims: Omit<OrderStatusClaims, "jti"> & { jti: string }) {
  return sign<OrderStatusClaims>("order_status", claims);
}

export function verifyOrderStatus(token: string): OrderStatusClaims {
  return verify<OrderStatusClaims>("order_status", token);
}

/** Magic-link or remember-me token for a customer. */
export function signCustomer(
  claims: Omit<CustomerClaims, "jti"> & { jti: string },
  ttlSecondsOverride: number,
) {
  return sign<CustomerClaims>("customer", claims, ttlSecondsOverride);
}

export function verifyCustomer(token: string): CustomerClaims {
  return verify<CustomerClaims>("customer", token);
}

/** Long-lived bearer token for staff scripts / CLIs. */
export function signApi(claims: Omit<ApiClaims, "jti"> & { jti: string }) {
  return sign<ApiClaims>("api", claims);
}

export function verifyApi(token: string): ApiClaims {
  return verify<ApiClaims>("api", token);
}

/** Read a bearer token from an Authorization header. Returns null if absent. */
export function bearerFromHeader(header: string | null | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(" ", 2);
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value.trim() || null;
}
