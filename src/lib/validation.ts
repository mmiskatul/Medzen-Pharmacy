import { z } from "zod";

/**
 * Every request body in the app is parsed through one of these. Error
 * messages are written for the customer, not the developer: they say what
 * is wrong and what to do about it.
 */

// UAE mobile numbers, plus a tolerant international form for visitors.
const phoneRegex = /^(\+?\d{1,4}[\s-]?)?\d{7,12}$/;

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a phone number we can reach you on.")
  .max(24, "That phone number is too long.")
  .regex(phoneRegex, "Enter a valid phone number, for example +971 50 123 4567.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(80, "Names can be up to 80 characters.");

export const optionalEmail = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(160)
  .optional()
  .or(z.literal(""));

// ---------------------------------------------------------------- public forms

export const contactMessageSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmail,
  subject: z
    .string()
    .trim()
    .min(3, "Add a short subject.")
    .max(120, "Keep the subject under 120 characters."),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more so we can help.")
    .max(2000, "Messages can be up to 2000 characters."),
  // Honeypot. Real people never fill this in.
  website: z.string().max(0).optional(),
});

export const prescriptionRequestSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmail,
  notes: z
    .string()
    .trim()
    .max(1000, "Notes can be up to 1000 characters.")
    .optional()
    .or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Confirm you agree to the pharmacy handling your prescription.",
    }),
  }),
  website: z.string().max(0).optional(),
});

export const orderItemInputSchema = z.object({
  productId: z.string().uuid("That product is no longer available."),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1.")
    .max(50, "For quantities above 50, message the pharmacy directly."),
});

export const orderRequestSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    email: optionalEmail,
    fulfilment: z.enum(["DELIVERY", "COLLECTION"]),
    address: z.string().trim().max(400).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    items: z
      .array(orderItemInputSchema)
      .min(1, "Add at least one item before sending the request."),
    website: z.string().max(0).optional(),
  })
  .refine(
    (data) => data.fulfilment !== "DELIVERY" || (data.address ?? "").length > 5,
    { path: ["address"], message: "Add the delivery address." },
  );

export const loginSchema = z.object({
  email: z.string().trim().email("Enter the email address on your staff account."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------- admin forms

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only.");

export const productSchema = z.object({
  name: z.string().trim().min(2, "Add a product name.").max(160),
  slug: slugSchema,
  sku: z.string().trim().min(1, "Add a SKU.").max(64),
  summary: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  usageInfo: z.string().trim().max(3000).optional().or(z.literal("")),
  keyInfo: z.string().trim().max(3000).optional().or(z.literal("")),
  priceFils: z.coerce.number().int().min(0).nullable().optional(),
  compareAtFils: z.coerce.number().int().min(0).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  prescriptionRequired: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().trim().max(70).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(180).optional().or(z.literal("")),
  imageKeys: z.array(z.string()).max(6).default([]),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Add a category name.").max(80),
  slug: slugSchema,
  description: z.string().trim().max(600).optional().or(z.literal("")),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  imageKey: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const brandSchema = z.object({
  name: z.string().trim().min(1, "Add a brand name.").max(80),
  slug: slugSchema,
  description: z.string().trim().max(600).optional().or(z.literal("")),
  logoKey: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const inventoryAdjustSchema = z.object({
  delta: z.coerce
    .number()
    .int()
    .refine((n) => n !== 0, "Enter a positive or negative amount."),
  reason: z.enum([
    "RECEIVED",
    "SOLD",
    "DAMAGED",
    "EXPIRED",
    "CORRECTION",
    "RETURNED",
  ]),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const inventorySettingsSchema = z.object({
  lowStockAt: z.coerce.number().int().min(0).max(10000),
  batchNumber: z.string().trim().max(60).optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
  shelfLocation: z.string().trim().max(60).optional().or(z.literal("")),
});

export const orderUpdateSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  paymentStatus: z
    .enum(["UNPAID", "PAY_ON_DELIVERY", "PAID", "REFUNDED"])
    .optional(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const prescriptionUpdateSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "UNDER_REVIEW",
      "CLARIFICATION_REQUESTED",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
    ])
    .optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  resolutionMessage: z.string().trim().max(600).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const messageUpdateSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(2).max(80),
  slug: slugSchema,
  description: z.string().trim().min(10, "Describe the service.").max(600),
  icon: z.string().trim().max(40).default("Stethoscope"),
  ctaLabel: z.string().trim().max(40).optional().or(z.literal("")),
  ctaHref: z.string().trim().max(200).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const bannerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(240).optional().or(z.literal("")),
  imageKey: z.string().nullable().optional(),
  ctaLabel: z.string().trim().max(40).optional().or(z.literal("")),
  ctaHref: z.string().trim().max(200).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Add the question.").max(200),
  answer: z.string().trim().min(5, "Add the answer.").max(2000),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

export const testimonialSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  authorTitle: z.string().trim().max(80).optional().or(z.literal("")),
  body: z.string().trim().min(10).max(600),
  rating: z.coerce.number().int().min(1).max(5).nullable().optional(),
  // Publishing is gated on this: only reviews the pharmacy confirms are
  // genuine can go live.
  isVerified: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const staffSchema = z.object({
  name: nameSchema,
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum([
    "SUPER_ADMIN",
    "PHARMACY_ADMIN",
    "PHARMACIST",
    "CONTENT_MANAGER",
  ]),
  extraPerms: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(200)
    .optional()
    .or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
