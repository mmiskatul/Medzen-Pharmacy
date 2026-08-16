/**
 * Single source of truth for every WhatsApp link in the app.
 *
 * No component builds a wa.me URL by hand and no phone number is written
 * into JSX — callers pass the pharmacy's configured number (from site
 * settings) plus an intent, and get back a link. Changing the number in
 * Admin -> Settings changes every button on the site.
 */

export type WhatsAppIntent =
  | { kind: "general" }
  | { kind: "product"; productName: string; sku?: string }
  | { kind: "availability"; productName: string }
  | { kind: "prescription"; reference?: string }
  | { kind: "order"; reference: string }
  | { kind: "service"; serviceName: string }
  | { kind: "cart"; lines: { name: string; quantity: number }[] }
  | { kind: "custom"; message: string };

const GREETING = "Hello Medzen Pharmacy";

export function buildMessage(intent: WhatsAppIntent): string {
  switch (intent.kind) {
    case "general":
      return `${GREETING}, I would like to know more about your products and services.`;
    case "product":
      return intent.sku
        ? `${GREETING}, I am interested in ${intent.productName} (ref ${intent.sku}). Is it currently available?`
        : `${GREETING}, I am interested in ${intent.productName}. Is it currently available?`;
    case "availability":
      return `${GREETING}, I would like to check the availability of ${intent.productName}.`;
    case "prescription":
      return intent.reference
        ? `${GREETING}, I have submitted a prescription request through your website (reference ${intent.reference}).`
        : `${GREETING}, I have submitted a prescription request through your website.`;
    case "order":
      return `${GREETING}, I placed order request ${intent.reference} on your website and would like to confirm it.`;
    case "service":
      return `${GREETING}, I would like to ask about ${intent.serviceName}.`;
    case "cart": {
      if (intent.lines.length === 0) return buildMessage({ kind: "general" });
      const list = intent.lines
        .map((line) => `• ${line.name} × ${line.quantity}`)
        .join("\n");
      return `${GREETING}, I would like to request the following items:\n${list}`;
    }
    case "custom":
      return intent.message;
  }
}

/** Strips spaces, dashes and a leading + so wa.me accepts the number. */
export function normaliseNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function whatsappLink(number: string, intent: WhatsAppIntent): string {
  const digits = normaliseNumber(number);
  const text = encodeURIComponent(buildMessage(intent));
  return `https://wa.me/${digits}?text=${text}`;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
