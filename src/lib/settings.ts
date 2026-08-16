import { z } from "zod";

/**
 * Every piece of business content the pharmacy can change lives here and
 * is edited from Admin -> Settings / Content. Components read from this
 * document, so no phone number, address or headline is hard-coded in a
 * component. The defaults below are the details Medzen supplied.
 */

export const businessHourSchema = z.object({
  day: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  isOpen: z.boolean(),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
});

export const siteSettingsSchema = z.object({
  general: z.object({
    pharmacyName: z.string().min(1),
    tagline: z.string().default(""),
    logoKey: z.string().nullable().default(null),
    email: z.string().email().or(z.literal("")).default(""),
    addressLine1: z.string().default(""),
    addressLine2: z.string().default(""),
    city: z.string().default(""),
    country: z.string().default(""),
  }),
  contact: z.object({
    phone: z.string().min(1),
    // Digits only, country code first. The link builder formats it.
    whatsapp: z.string().min(6),
    mapsLink: z.string().default(""),
    mapsEmbedUrl: z.string().default(""),
  }),
  hours: z.array(businessHourSchema),
  social: z.object({
    instagram: z.string().default(""),
    facebook: z.string().default(""),
    tiktok: z.string().default(""),
    linkedin: z.string().default(""),
  }),
  seo: z.object({
    metaTitle: z.string().default(""),
    metaDescription: z.string().default(""),
    ogImageKey: z.string().nullable().default(null),
    indexSite: z.boolean().default(true),
  }),
  home: z.object({
    heroEyebrow: z.string().default(""),
    heroHeadline: z.string().default(""),
    heroSubline: z.string().default(""),
    heroImageKey: z.string().nullable().default(null),
    announcement: z.string().default(""),
    announcementActive: z.boolean().default(false),
  }),
  about: z.object({
    intro: z.string().default(""),
    mission: z.string().default(""),
  }),
  commerce: z.object({
    // Off by default: the site takes order *requests*, not payments.
    onlinePaymentsEnabled: z.boolean().default(false),
    showPrices: z.boolean().default(true),
    deliveryFeeFils: z.number().int().min(0).default(0),
    freeDeliveryOverFils: z.number().int().min(0).default(0),
  }),
  notifications: z.object({
    emailEnabled: z.boolean().default(false),
    emailRecipients: z.array(z.string().email()).default([]),
    whatsappEnabled: z.boolean().default(false),
    lowStockAlerts: z.boolean().default(true),
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type BusinessHour = z.infer<typeof businessHourSchema>;

export const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    pharmacyName: "Medzen Pharmacy",
    tagline: "Your trusted pharmacy partner in Dubai",
    logoKey: null,
    email: "",
    addressLine1: "Showroom S1, Ramool New Building",
    addressLine2: "Nad Al Hamr Road",
    city: "Umm Ramool, Dubai",
    country: "United Arab Emirates",
  },
  contact: {
    phone: "+971 56 997 0932",
    whatsapp: "971569970932",
    mapsLink:
      "https://www.google.com/maps/search/?api=1&query=Ramool+New+Building+Nad+Al+Hamar+Road+Umm+Ramool+Dubai",
    mapsEmbedUrl:
      "https://www.google.com/maps?q=Ramool%20New%20Building%2C%20Nad%20Al%20Hamar%20Road%2C%20Umm%20Ramool%2C%20Dubai&output=embed",
  },
  // Hours are a placeholder until the pharmacy confirms them; the
  // footer and contact page hide the block while every day is closed.
  hours: [
    { day: "monday", isOpen: false, opensAt: "09:00", closesAt: "23:00" },
    { day: "tuesday", isOpen: false, opensAt: "09:00", closesAt: "23:00" },
    { day: "wednesday", isOpen: false, opensAt: "09:00", closesAt: "23:00" },
    { day: "thursday", isOpen: false, opensAt: "09:00", closesAt: "23:00" },
    { day: "friday", isOpen: false, opensAt: "09:00", closesAt: "23:00" },
    { day: "saturday", isOpen: false, opensAt: "09:00", closesAt: "23:00" },
    { day: "sunday", isOpen: false, opensAt: "09:00", closesAt: "23:00" },
  ],
  social: { instagram: "", facebook: "", tiktok: "", linkedin: "" },
  seo: {
    metaTitle: "Medzen Pharmacy — Umm Ramool, Dubai",
    metaDescription:
      "Community pharmacy in Umm Ramool, Dubai. Send a prescription, check what is in stock, or message the pharmacy team on WhatsApp.",
    ogImageKey: null,
    indexSite: true,
  },
  home: {
    heroEyebrow: "Umm Ramool, Dubai",
    heroHeadline: "The pharmacy counter, one message away",
    heroSubline:
      "Send a prescription, ask whether something is in stock, or get pharmacy support from our team. We reply on WhatsApp during opening hours.",
    heroImageKey: null,
    announcement: "",
    announcementActive: false,
  },
  about: {
    intro:
      "Medzen Pharmacy is a community pharmacy on Nad Al Hamr Road in Umm Ramool, Dubai. We stock everyday health essentials, personal care and wellness products, and we support customers with prescriptions and pharmacy advice.",
    mission:
      "To make everyday pharmacy support easy to reach — clear answers, straightforward requests, and a team you can message directly.",
  },
  commerce: {
    onlinePaymentsEnabled: false,
    showPrices: true,
    deliveryFeeFils: 0,
    freeDeliveryOverFils: 0,
  },
  notifications: {
    emailEnabled: false,
    emailRecipients: [],
    whatsappEnabled: false,
    lowStockAlerts: true,
  },
};

export const DAY_LABELS: Record<BusinessHour["day"], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** Merges a stored document over the defaults so new keys never break. */
export function parseSettings(data: unknown): SiteSettings {
  const merged = deepMerge(DEFAULT_SETTINGS as unknown as Json, data as Json);
  const parsed = siteSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

function deepMerge(base: Json, override: Json): Json {
  if (
    override &&
    typeof override === "object" &&
    !Array.isArray(override) &&
    base &&
    typeof base === "object" &&
    !Array.isArray(base)
  ) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(override)) {
      out[key] = deepMerge(
        (base as Record<string, unknown>)[key] as Json,
        value as Json,
      );
    }
    return out;
  }
  return override === undefined ? base : override;
}
