import { ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { clientIp } from "@/lib/rate-limit";
import { siteSettingsSchema } from "@/lib/settings";
import { getSettings, saveSettings } from "@/lib/site-settings.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser(["settings.write", "cms.write"]);
    return ok(await getSettings());
  } catch (error) {
    return toResponse(error);
  }
}

/**
 * Settings are replaced as a whole validated document — a partial write
 * cannot leave the site with, say, a phone number but no WhatsApp number.
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireUser("settings.write");
    const parsed = await parseJson(request, siteSettingsSchema);
    if (parsed.response) return parsed.response;

    // Re-parse so schema defaults are applied and the stored document is
    // always complete, even if the client omitted an optional key.
    const next = siteSettingsSchema.parse(parsed.data);
    await saveSettings(next);

    await audit({
      user,
      action: "settings.updated",
      entity: "SiteSetting",
      entityId: "default",
      meta: {
        pharmacyName: next.general.pharmacyName,
        whatsapp: next.contact.whatsapp,
      },
      ip: clientIp(request.headers),
    });

    return ok(next);
  } catch (error) {
    return toResponse(error);
  }
}
