import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "./prisma";
import { signApi, verifyApi, bearerFromHeader } from "./jwt";
import { AuthError } from "./auth";
import { can, type Permission } from "./rbac";

/**
 * Staff API bearer tokens. Each token is a long-lived JWT that names the
 * issuing user, the token row id, and a `jti`. The row in `StaffApiToken`
 * is the revocation key: marking `revokedAt` makes any subsequent
 * request with that JWT fail with a 401.
 *
 * The plaintext token is only ever shown once at issue time. We persist
 * a SHA-256 digest of it for diagnostics ("which token did what") but
 * cannot reconstruct it from the digest.
 */

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Issues a new API token. Returns the plaintext token exactly once. */
export async function issueApiToken(params: {
  userId: string;
  label: string;
}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  const jti = randomBytes(16).toString("base64url");
  const raw = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  // Insert first so the row id is known, then sign with the real
  // tokenId claim.
  const row = await prisma.staffApiToken.create({
    data: {
      jti,
      userId: user.id,
      label: params.label.slice(0, 120),
      tokenDigest: digest(raw),
      expiresAt,
    },
  });

  const token = signApi({
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenId: row.id,
    jti,
  });

  return { token, jti, expiresAt };
}

/**
 * Resolves a bearer-token-authenticated staff member from the request
 * Authorization header. Mirrors `requireUser` in shape but accepts a
 * permission list. Throws AuthError(401) when missing/invalid and
 * AuthError(403) when the resolved user lacks the permission.
 */
export async function requireApiUser(
  request: Request,
  permission?: Permission | Permission[],
) {
  const token = bearerFromHeader(request.headers.get("authorization"));
  if (!token) throw new AuthError(401, "Missing bearer token.");

  let claims;
  try {
    claims = verifyApi(token);
  } catch {
    throw new AuthError(401, "Invalid bearer token.");
  }

  const row = await prisma.staffApiToken.findUnique({
    where: { jti: claims.jti },
    include: { user: true },
  });
  if (!row) throw new AuthError(401, "Unknown bearer token.");
  if (row.revokedAt) throw new AuthError(401, "Bearer token has been revoked.");
  if (row.expiresAt.getTime() < Date.now()) throw new AuthError(401, "Bearer token has expired.");

  const user = row.user;
  if (!user.isActive || user.deletedAt) throw new AuthError(401, "Account is inactive.");

  // Record the access time without blocking the response.
  prisma.staffApiToken
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    extraPerms: user.extraPerms,
  };

  if (permission) {
    const ok = Array.isArray(permission)
      ? permission.every((p) => can(sessionUser, p))
      : can(sessionUser, permission);
    if (!ok) throw new AuthError(403, "Bearer token lacks the required permission.");
  }

  return { user: sessionUser, tokenId: row.id };
}