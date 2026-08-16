"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { whatsappLink } from "@/lib/whatsapp";

/**
 * Floating contact button. Hidden on the cart and checkout routes, where
 * the page already owns a primary action and a second floating button
 * would compete with it.
 */
const HIDDEN_ON = ["/cart", "/checkout", "/admin"];

export function WhatsAppFab({ whatsapp }: { whatsapp: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Appears after the first scroll so it never covers the hero on load.
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_ON.some((path) => pathname.startsWith(path))) return null;

  return (
    <a
      href={whatsappLink(whatsapp, { kind: "general" })}
      target="_blank"
      rel="noopener noreferrer"
      data-visible={visible}
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2.5 rounded-full bg-brand-600 px-4 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-lift)] transition-all duration-300 hover:bg-brand-700 data-[visible=false]:pointer-events-none data-[visible=false]:translate-y-3 data-[visible=false]:opacity-0 sm:bottom-7 sm:right-7"
    >
      <MessageCircle className="size-5" aria-hidden />
      <span className="hidden sm:inline">Message the pharmacy</span>
      <span className="sr-only sm:hidden">Message the pharmacy on WhatsApp</span>
    </a>
  );
}
