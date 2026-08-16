import "server-only";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { StaffRole, User } from "@prisma/client";

import { env } from "./env";
import { signAdmin, verifyAdmin } from "./jwt";
import { prisma } from "./prisma";
import { can, canAny, type Permission } from "./rbac";

export const SESSION_COOKIE = "medzen_session";
const BCRYPT_ROUNDS = 12;

/** Lockout policy — a burst of wrong passwords parks the account briefly. */
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  extraPerms: string[];
};

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/**
 * Sessions are JWTs. The cookie carries the signed token; the database
 * row keyed by the JWT's `jti` is the revocation list. A signed-out
 * session simply marks `revokedAt` on the row, and `getSessionUser`
 * refuses any JWT whose `jti` has been revoked.
 *
 * This keeps the "log out everywhere" guarantee the previous opaque-
 * token design offered while letting every admin request be verified
 * without a database read.
 */
export async function createSession(
  userId: string,
  meta: { ip?: string; userAgent?: string; remember?: boolean } = {},
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const jti = randomBytes(16).toString("base64url");
  const hours = meta.remember ? env.SESSION_TTL_HOURS * 14 : env.SESSION_TTL_HOURS;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const token = signAdmin({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    extraPerms: user.extraPerms,
    jti,
  });

  await prisma.session.create({
    data: {
      jti,
      userId,
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt, jti };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const claims = verifyAdmin(token);
      await prisma.session
        .updateMany({ where: { jti: claims.jti }, data: { revokedAt: new Date() } })
        .catch(() => undefined);
    } catch {
      // Cookie was malformed or already invalid — nothing to revoke.
    }
  }
  jar.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Resolves the signed-in staff member, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let claims;
  try {
    claims = verifyAdmin(token);
  } catch {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { jti: claims.jti },
    include: { user: true },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  const user = session.user;
  if (!user.isActive || user.deletedAt) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    extraPerms: user.extraPerms,
  };
}

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Throws AuthError(401) when signed out, AuthError(403) when unauthorised. */
export async function requireUser(permission?: Permission | Permission[]) {
  const user = await getSessionUser();
  if (!user) throw new AuthError(401, "Sign in to continue.");
  if (permission) {
    const ok = Array.isArray(permission)
      ? canAny(user, permission)
      : can(user, permission);
    if (!ok) {
      throw new AuthError(403, "Your role does not have access to this area.");
    }
  }
  return user;
}

// ---------------------------------------------------------------- login flow

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; reason: "invalid" | "locked" | "inactive"; retryAfter?: Date };

export async function attemptLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Always spend a comparable amount of time so the response does not
  // reveal whether the address exists.
  if (!user) {
    await bcrypt.compare(password, "$2a$12$" + "x".repeat(53));
    return { ok: false, reason: "invalid" };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "locked", retryAfter: user.lockedUntil };
  }

  if (!user.isActive || user.deletedAt) {
    return { ok: false, reason: "inactive" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failed = user.failedLogins + 1;
    const lock =
      failed >= MAX_FAILED_LOGINS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: lock ? 0 : failed, lockedUntil: lock },
    });
    return lock
      ? { ok: false, reason: "locked", retryAfter: lock }
      : { ok: false, reason: "invalid" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  return { ok: true, user };
}
