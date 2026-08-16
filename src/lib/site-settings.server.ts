import "server-only";

import { cache } from "react";

import { prisma } from "./prisma";
import { DEFAULT_SETTINGS, parseSettings, type SiteSettings } from "./settings";

/**
 * Request-scoped read of the settings document. `cache` means a page that
 * renders the navbar, footer and a WhatsApp button issues one query, not
 * three. Falls back to defaults so the site still renders if the database
 * is briefly unreachable.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { id: "default" } });
    if (!row) return DEFAULT_SETTINGS;
    return parseSettings(row.data);
  } catch {
    return DEFAULT_SETTINGS;
  }
});

export async function saveSettings(next: SiteSettings) {
  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: { id: "default", data: next as unknown as object },
    update: { data: next as unknown as object },
  });
}
