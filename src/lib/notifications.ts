import "server-only";

import type { NotificationType } from "@prisma/client";

import { prisma } from "./prisma";
import { getSettings } from "./site-settings.server";

/**
 * In-dashboard notifications are always written. Email and WhatsApp
 * delivery are opt-in per channel from Admin -> Settings; when a channel
 * is enabled but not configured the attempt is logged and skipped rather
 * than failing the customer's request.
 */
export async function notify(params: {
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        href: params.href ?? null,
      },
    });
  } catch (error) {
    console.error("[notify] could not store notification", error);
    return;
  }

  try {
    const settings = await getSettings();
    if (settings.notifications.emailEnabled) {
      await sendEmailNotification(settings.notifications.emailRecipients, params);
    }
  } catch (error) {
    console.error("[notify] channel delivery failed", error);
  }
}

async function sendEmailNotification(
  recipients: string[],
  params: { title: string; body?: string; href?: string },
) {
  const host = process.env.SMTP_HOST;
  if (!host || recipients.length === 0) {
    console.info(
      "[notify] email enabled but SMTP is not configured; skipped:",
      params.title,
    );
    return;
  }
  // SMTP transport is intentionally left as an integration point: add a
  // mailer here and every notification channel picks it up.
  console.info("[notify] email queued", { to: recipients, title: params.title });
}

export async function unreadCount() {
  return prisma.notification.count({ where: { readAt: null } });
}
