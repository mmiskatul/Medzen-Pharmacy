import {
  Baby,
  Bike,
  ClipboardList,
  Droplets,
  HeartPulse,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Thermometer,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * Admin picks an icon by name, so the set is explicit rather than a
 * dynamic import of the whole icon library. Unknown names fall back to
 * the stethoscope instead of rendering nothing.
 */
const ICONS: Record<string, LucideIcon> = {
  Baby,
  Bike,
  ClipboardList,
  Droplets,
  HeartPulse,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Thermometer,
  Truck,
};

export const ICON_NAMES = Object.keys(ICONS);

export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Stethoscope;
  return <Icon className={className} aria-hidden />;
}
