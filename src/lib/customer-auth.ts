import "server-only";

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

import { env } from "./env";
import { prisma } from "./prisma";
import { signCustomer, verifyCustomer } from "./jwt";

export const CUSTOMER_COOKIE = "medzen_customer";

export type CustomerUser = {
  id: string;
  email: string;
  name: string;
};

/**
 * Customer sessions use a separate JWT audience from /admin. The cookie
 * is the JWT itself; the CustomerSession row, keyed by `jti`, is the
 * revocation list. Customer login is opt-in: a customer without a
 * session can still place orders and submit prescriptions, they just
 * can't view their history without re-authenticating each time.
 */

const MAGIC_LINK_TTL_SECONDS = () => env.AUD_MAGIC_LINK_TTL_MINUTES * 60;
const REMEMBER_TTL_SECONDS = () => env.AUD_CUSTOMER_REMEMBER_TTL_HOURS * 60 * 60;

/**
 * Issues a magic-link token. The token is short-lived (default 30 min),
 * so it can be safely emailed. Verifying the token creates a long-lived
 * remember-me cookie session.
 */
export async function issueMagicLinkToken(email: string) {
  const normalized = email.toLowerCase().trim();
  const customer = await prisma.customer.findFirst({
    where: { email: normalized, deletedAt: null },
    select: { id: true, email: true, name: true, deletedAt: true },
  });
  if (!customer || customer.deletedAt) return null;
  if (!customer) {
    // Don't reveal whether the email exists — the helper returns a
    // valid-looking token shape either way and the caller logs + drops.
    return null;
  }
  const jti = randomBytes(16).toString("base64url");
  return signCustomer(
    {
      sub: customer.id,
      email: customer.email ?? normalized,
      purpose: "magic-link",
      jti,
    },
    MAGIC_LINK_TTL_SECONDS(),
  );
}

/**
 * Exchanges a magic-link token for a long-lived customer cookie
 * session. Returns the CustomerUser on success, or null on any
 * verification failure.
 */
export async function redeemMagicLink(token: string): Promise<CustomerUser | null> {
  let claims;
  try {
    claims = verifyCustomer(token);
  } catch {
    return null;
  }
  if (claims.purpose !== "magic-link") return null;

  const customer = await prisma.customer.findUnique({
    where: { id: claims.sub },
    select: { id: true, email: true, name: true, deletedAt: true },
  });
  if (!customer || customer.deletedAt) return null;

  const jti = randomBytes(16).toString("base64url");
  const expiresAt = new Date(Date.now() + REMEMBER_TTL_SECONDS() * 1000);
  const sessionToken = signCustomer(
    {
      sub: customer.id,
      email: customer.email ?? claims.email,
      purpose: "remember-me",
      jti,
    },
    REMEMBER_TTL_SECONDS(),
  );

  await prisma.customerSession.create({
    data: {
      jti,
      customerId: customer.id,
      expiresAt,
    },
  });

  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { id: customer.id, email: customer.email ?? claims.email, name: customer.name };
}

export async function getCustomer(): Promise<CustomerUser | null> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  let claims;
  try {
    claims = verifyCustomer(token);
  } catch {
    return null;
  }
  if (claims.purpose !== "remember-me") return null;

  const session = await prisma.customerSession.findUnique({
    where: { jti: claims.jti },
    include: { customer: true },
  });
  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  const customer = session.customer;
  if (customer.deletedAt) return null;

  return {
    id: customer.id,
    email: customer.email ?? claims.email,
    name: customer.name,
  };
}

export async function destroyCustomerSession() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) {
    try {
      const claims = verifyCustomer(token);
      await prisma.customerSession
        .updateMany({ where: { jti: claims.jti }, data: { revokedAt: new Date() } })
        .catch(() => undefined);
    } catch {
      // Cookie was already invalid — nothing to revoke.
    }
  }
  jar.delete(CUSTOMER_COOKIE);
}