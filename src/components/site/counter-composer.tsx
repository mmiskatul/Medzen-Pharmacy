"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileText, MessageCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildMessage, whatsappLink, type WhatsAppIntent } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * The counter composer — the site's signature element.
 *
 * A pharmacy visit starts with one of three sentences, so the hero asks
 * which one and then shows the exact message that will be sent. Nothing
 * is hidden behind the button: the customer reads the message first, and
 * the prescription route hands off to the secure upload form rather than
 * asking anyone to send clinical documents over chat.
 */

type Errand = "prescription" | "availability" | "advice";

const ERRANDS: {
  id: Errand;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  placeholder?: string;
}[] = [
  {
    id: "availability",
    label: "Check what's in stock",
    icon: Search,
    prompt: "What are you looking for?",
    placeholder: "e.g. Panadol Extra, vitamin D, baby formula",
  },
  {
    id: "prescription",
    label: "Send a prescription",
    icon: FileText,
    prompt: "Upload it securely, or tell us it's on the way.",
  },
  {
    id: "advice",
    label: "Ask the pharmacy team",
    icon: MessageCircle,
    prompt: "What would you like to ask?",
    placeholder: "e.g. Do you deliver to Nad Al Hamar?",
  },
];

export function CounterComposer({ whatsapp }: { whatsapp: string }) {
  const [errand, setErrand] = React.useState<Errand>("availability");
  const [value, setValue] = React.useState("");

  const active = ERRANDS.find((item) => item.id === errand)!;

  const intent = React.useMemo<WhatsAppIntent>(() => {
    const trimmed = value.trim();
    if (errand === "prescription") return { kind: "prescription" };
    if (!trimmed) return { kind: "general" };
    return errand === "availability"
      ? { kind: "availability", productName: trimmed }
      : {
          kind: "custom",
          message: `Hello Medzen Pharmacy, ${trimmed}`,
        };
  }, [errand, value]);

  const preview = buildMessage(intent);

  return (
    <div className="rounded-[20px] border border-line bg-white p-5 shadow-[var(--shadow-lift)] sm:p-6">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">
          What do you need today?
        </legend>

        <div className="mt-3.5 grid gap-2 sm:grid-cols-3">
          {ERRANDS.map((item) => {
            const Icon = item.icon;
            const selected = item.id === errand;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setErrand(item.id);
                  setValue("");
                }}
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[0.8125rem] font-medium transition-colors sm:flex-col sm:items-start sm:gap-2 sm:px-3.5 sm:py-3",
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-900"
                    : "border-line-strong bg-white text-ink-soft hover:border-brand-200 hover:bg-wash",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    selected ? "text-brand-600" : "text-muted",
                  )}
                />
                <span className="leading-snug">{item.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5">
        <label
          htmlFor="composer-input"
          className="block text-sm font-medium text-ink"
        >
          {active.prompt}
        </label>

        {errand === "prescription" ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm leading-relaxed text-muted">
              Prescriptions go through our encrypted upload form, not chat, so
              your document stays private and reaches the pharmacist directly.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/prescription">
                  Upload prescription
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <a
                  href={whatsappLink(whatsapp, intent)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle />
                  Tell us it&apos;s coming
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <input
              id="composer-input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={active.placeholder}
              maxLength={140}
              className="mt-2 h-11 w-full rounded-xl border border-line-strong px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
            />

            {/* The message preview: what you are about to send, verbatim. */}
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/70 p-3.5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-brand-800">
                Your message
              </p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-brand-900">
                {preview}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="whatsapp" size="lg">
                <a
                  href={whatsappLink(whatsapp, intent)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle />
                  Send on WhatsApp
                </a>
              </Button>
              {errand === "availability" ? (
                <Button asChild variant="secondary" size="lg">
                  <Link
                    href={
                      value.trim()
                        ? `/search?q=${encodeURIComponent(value.trim())}`
                        : "/products"
                    }
                  >
                    Browse the catalog
                  </Link>
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 border-t border-line pt-3.5 text-xs leading-relaxed text-muted">
        We reply during opening hours. For medical emergencies call 998 or go to
        the nearest emergency department.
      </p>
    </div>
  );
}
