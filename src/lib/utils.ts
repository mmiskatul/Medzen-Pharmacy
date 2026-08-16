import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Money is stored as integer fils; formatting is the only place it becomes a decimal. */
export function formatPrice(
  fils: number | null | undefined,
  currency = "AED",
): string {
  if (fils === null || fils === undefined) return "Price on request";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(fils / 100);
}

export function filsFromInput(value: string | number): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

export function filsToInput(fils: number | null | undefined): string {
  if (fils === null || fils === undefined) return "";
  return (fils / 100).toFixed(2);
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Dubai",
  }).format(d);
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trimEnd()}…`;
}

/** MZ-YYDDD-XXXX. Readable over the phone, sortable by day. */
export function generateReference(prefix: "MZ" | "RX"): string {
  const now = new Date();
  const year = String(now.getUTCFullYear()).slice(-2);
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start) / 86_400_000);
  const random = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${year}${String(dayOfYear).padStart(3, "0")}-${random}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Masks all but the last three digits — used in list views of customer data. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\s/g, "");
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}${"•".repeat(Math.max(0, digits.length - 7))}${digits.slice(-3)}`;
}
