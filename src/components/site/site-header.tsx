"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, MessageCircle, Phone, Search, ShoppingBag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { useCart } from "@/components/site/cart-provider";
import { cn } from "@/lib/utils";
import { telLink, whatsappLink } from "@/lib/whatsapp";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/prescription", label: "Prescription" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader({
  whatsapp,
  phone,
  announcement,
}: {
  whatsapp: string;
  phone: string;
  announcement?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Route changes close every overlay, so back/forward never strands one open.
  React.useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = term.trim();
    if (!value) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
    setSearchOpen(false);
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40">
      {announcement ? (
        <div className="bg-brand-900 px-4 py-2 text-center text-[0.8125rem] font-medium text-brand-100">
          {announcement}
        </div>
      ) : null}

      <div className="border-b border-line bg-white/92 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-3 lg:h-[4.5rem]">
          <Logo />

          <nav
            className="ml-8 hidden items-center gap-1 lg:flex"
            aria-label="Main"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "text-brand-800"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                {item.label}
                {isActive(item.href) ? (
                  <span className="absolute inset-x-3 -bottom-[1.4rem] h-0.5 rounded-full bg-brand-600" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((open) => !open)}
              aria-expanded={searchOpen}
              aria-controls="header-search"
              aria-label="Search products"
            >
              <Search />
            </Button>

            <Link
              href="/cart"
              className="relative grid size-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-wash hover:text-ink"
              aria-label={
                cart.count > 0
                  ? `Request basket, ${cart.count} item${cart.count === 1 ? "" : "s"}`
                  : "Request basket, empty"
              }
            >
              <ShoppingBag className="size-4" />
              {cart.ready && cart.count > 0 ? (
                <span className="tnum absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[0.625rem] font-bold text-white">
                  {cart.count}
                </span>
              ) : null}
            </Link>

            <a
              href={telLink(phone)}
              className="hidden size-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-wash hover:text-ink sm:grid"
              aria-label={`Call the pharmacy on ${phone}`}
            >
              <Phone className="size-4" />
            </a>

            <Button asChild variant="whatsapp" size="sm" className="hidden sm:inline-flex">
              <a
                href={whatsappLink(whatsapp, { kind: "general" })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                WhatsApp
              </a>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>
          </div>
        </div>

        {searchOpen ? (
          <div id="header-search" className="border-t border-line bg-white">
            <form onSubmit={submitSearch} className="container-page py-3" role="search">
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-line-strong px-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
                <Search className="size-4 shrink-0 text-muted" aria-hidden />
                <input
                  id="site-search"
                  ref={searchRef}
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Search by product, brand or category"
                  className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/80"
                  autoComplete="off"
                />
                <Button type="submit" size="sm" disabled={!term.trim()}>
                  Search
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </div>

      {/* Mobile drawer. The four things a pharmacy visitor needs most —
          search, prescription, call, WhatsApp — stay above the fold. */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-xl px-3.5 py-3 text-[0.9375rem] font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-800"
                      : "text-ink-soft hover:bg-wash",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="grid gap-2 border-t border-line p-4">
              <Button asChild variant="primary">
                <Link href="/prescription">Send a prescription</Link>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="secondary">
                  <a href={telLink(phone)}>
                    <Phone />
                    Call
                  </a>
                </Button>
                <Button asChild variant="whatsapp">
                  <a
                    href={whatsappLink(whatsapp, { kind: "general" })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
