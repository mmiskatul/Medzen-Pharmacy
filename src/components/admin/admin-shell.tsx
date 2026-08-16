"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { NAV_GROUPS } from "@/components/admin/nav-config";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABELS, permissionsFor } from "@/lib/rbac";
import { cn, initials } from "@/lib/utils";

export function AdminShell({
  user,
  unreadNotifications,
  children,
}: {
  user: SessionUser;
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const granted = React.useMemo(() => permissionsFor(user), [user]);

  const groups = React.useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => granted.has(item.permission)),
      })).filter((group) => group.items.length > 0),
    [granted],
  );

  React.useEffect(() => {
    setSidebarOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch {
      toast.error("Sign out failed. Try again.");
      setSigningOut(false);
    }
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <Logo suffix="Admin" />
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </Button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">
              {group.label}
            </p>
            <ul className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-50 text-brand-800"
                          : "text-ink-soft hover:bg-wash hover:text-ink",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-brand-700" : "text-muted",
                        )}
                      />
                      {item.label}
                      {item.href === "/admin/notifications" && unreadNotifications > 0 ? (
                        <span className="tnum ml-auto rounded-full bg-brand-600 px-1.5 py-0.5 text-[0.625rem] font-bold text-white">
                          {unreadNotifications}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-wash"
        >
          <ExternalLink className="size-4 text-muted" />
          View the website
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-wash">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line lg:block">
        {sidebar}
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/40"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-[var(--shadow-lift)]">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/92 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </Button>

            <form
              className="hidden max-w-sm flex-1 sm:block"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("q");
                const term = String(value ?? "").trim();
                if (term) router.push(`/admin/products?q=${encodeURIComponent(term)}`);
              }}
            >
              <label htmlFor="admin-search" className="sr-only">
                Search products
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-line-strong px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
                <Search className="size-4 shrink-0 text-muted" aria-hidden />
                <input
                  id="admin-search"
                  name="q"
                  placeholder="Search products by name or SKU"
                  className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/80"
                  autoComplete="off"
                />
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1.5">
              <Link
                href="/admin/notifications"
                className="relative grid size-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-wash"
                aria-label={
                  unreadNotifications > 0
                    ? `Notifications, ${unreadNotifications} unread`
                    : "Notifications"
                }
              >
                <Bell className="size-4" />
                {unreadNotifications > 0 ? (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-brand-600 ring-2 ring-white" />
                ) : null}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-wash"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-brand-800 text-xs font-bold text-white">
                    {initials(user.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-tight text-ink">
                      {user.name}
                    </span>
                    <span className="block text-xs leading-tight text-muted">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </span>
                  <ChevronDown className="size-4 text-muted" aria-hidden />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-lift)]"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-medium text-ink">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={signOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-wash disabled:opacity-60"
                    >
                      <LogOut className="size-4 text-muted" />
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
