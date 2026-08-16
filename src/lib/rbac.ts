import type { StaffRole } from "@prisma/client";

/**
 * Granular permissions. Roles are a convenience baseline; every check in
 * the app is made against a permission string, never against a role, so
 * a role's scope can change without touching call sites.
 */
export const PERMISSIONS = [
  "products.read",
  "products.write",
  "inventory.read",
  "inventory.write",
  "categories.write",
  "brands.write",
  "orders.read",
  "orders.update",
  "prescriptions.read",
  "prescriptions.update",
  "prescriptions.download",
  "customers.read",
  "messages.read",
  "messages.update",
  "cms.write",
  "analytics.read",
  "staff.read",
  "staff.write",
  "settings.write",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const CONTENT: Permission[] = [
  "cms.write",
  "products.read",
  "analytics.read",
];

const PHARMACIST: Permission[] = [
  "products.read",
  "inventory.read",
  "orders.read",
  "orders.update",
  "prescriptions.read",
  "prescriptions.update",
  "prescriptions.download",
  "customers.read",
  "messages.read",
  "messages.update",
];

const PHARMACY_ADMIN: Permission[] = [
  ...PHARMACIST,
  "products.write",
  "inventory.write",
  "categories.write",
  "brands.write",
  "analytics.read",
  "cms.write",
];

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  PHARMACY_ADMIN,
  PHARMACIST,
  CONTENT_MANAGER: CONTENT,
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  SUPER_ADMIN: "Super admin",
  PHARMACY_ADMIN: "Pharmacy admin",
  PHARMACIST: "Pharmacist / staff",
  CONTENT_MANAGER: "Content manager",
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  SUPER_ADMIN: "Every area, including staff accounts and settings.",
  PHARMACY_ADMIN:
    "Catalog, inventory, orders, prescriptions, customers and site content.",
  PHARMACIST:
    "Prescription review, orders, customers and messages. No catalog or settings changes.",
  CONTENT_MANAGER:
    "Website content, banners, services, FAQs and testimonials only.",
};

export type PermissionHolder = {
  role: StaffRole;
  extraPerms: string[];
};

export function permissionsFor(user: PermissionHolder): Set<Permission> {
  const set = new Set<Permission>(ROLE_PERMISSIONS[user.role]);
  for (const extra of user.extraPerms) {
    if ((PERMISSIONS as readonly string[]).includes(extra)) {
      set.add(extra as Permission);
    }
  }
  return set;
}

export function can(user: PermissionHolder, permission: Permission): boolean {
  return permissionsFor(user).has(permission);
}

export function canAny(
  user: PermissionHolder,
  permissions: Permission[],
): boolean {
  const set = permissionsFor(user);
  return permissions.some((p) => set.has(p));
}
