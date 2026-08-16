import Link from "next/link";
import { Home, MessageCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/site-settings.server";
import { whatsappLink } from "@/lib/whatsapp";

export default async function NotFound() {
  const settings = await getSettings();

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="max-w-md text-center">
        <p className="tnum font-display text-5xl font-bold text-brand-200">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">
          That page isn&apos;t here
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          The link may be out of date, or the product may have been removed from
          the catalog. Try a search, or ask us directly.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Button asChild>
            <Link href="/">
              <Home />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/search">
              <Search />
              Search products
            </Link>
          </Button>
          <Button asChild variant="whatsapp">
            <a
              href={whatsappLink(settings.contact.whatsapp, { kind: "general" })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Ask the pharmacy
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
