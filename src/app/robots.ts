import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/env";
import { getSettings } from "@/lib/site-settings.server";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const base = publicEnv.siteUrl.replace(/\/$/, "");

  // A staging deployment can be closed to crawlers from Admin -> Settings
  // without a redeploy.
  if (!settings.seo.indexSite) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/cart", "/checkout", "/search"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
