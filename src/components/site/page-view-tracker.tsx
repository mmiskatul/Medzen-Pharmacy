"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Sends one count per page view. No identifier is generated or stored, so
 * this cannot be used to follow an individual around the site — see the
 * endpoint for what actually gets written. Cart and checkout are skipped
 * entirely.
 */
const SKIP = ["/cart", "/checkout", "/admin"];

export function PageViewTracker() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (SKIP.some((path) => pathname.startsWith(path))) return;

    const controller = new AbortController();
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // A missed count is not worth surfacing to the visitor.
    });

    return () => controller.abort();
  }, [pathname]);

  return null;
}
