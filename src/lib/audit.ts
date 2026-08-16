import "server-only";

import { prisma } from "./prisma";
import type { SessionUser } from "./auth";

/** Keys whose values are never written to the audit trail. */
const REDACTED = new Set([
  "password",
  "passwordHash",
  "token",
  "tokenHash",
  "notes",
  "resolutionMessage",
  "message",
  "body",
]);

function redact(meta: Record<string, unknown> | undefined) {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    out[key] = REDACTED.has(key) ? "[redacted]" : value;
  }
  return out;
}

/**
 * Records a staff action. Audit writes never block the caller's response
 * and never throw — a logging failure must not fail a pharmacy workflow.
 */
export async function audit(params: {
  user: SessionUser | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.user?.id ?? null,
        actorLabel: params.user ? `${params.user.name} (${params.user.email})` : "system",
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        meta: redact(params.meta) as object | undefined,
        ip: params.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record", params.action, error);
  }
}
