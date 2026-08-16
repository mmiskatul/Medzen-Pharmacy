import {
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  GalleryHorizontal,
  LayoutDashboard,
  MessageSquare,
  Package,
  Quote,
  ScrollText,
  Settings,
  ShoppingCart,
  Stethoscope,
  Tags,
  Award,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/rbac";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
};

export type NavGroup = { label: string; items: NavItem[] };

/**
 * The sidebar is filtered by permission, so a pharmacist never sees a
 * Settings link they cannot open. Every entry names the permission that
 * gates both the link and the page behind it.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        permission: "orders.read",
      },
    ],
  },
  {
    label: "Pharmacy",
    items: [
      {
        href: "/admin/prescriptions",
        label: "Prescriptions",
        icon: FileText,
        permission: "prescriptions.read",
      },
      {
        href: "/admin/orders",
        label: "Orders",
        icon: ShoppingCart,
        permission: "orders.read",
      },
      {
        href: "/admin/customers",
        label: "Customers",
        icon: UsersRound,
        permission: "customers.read",
      },
      {
        href: "/admin/messages",
        label: "Messages",
        icon: MessageSquare,
        permission: "messages.read",
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/admin/products",
        label: "Products",
        icon: Package,
        permission: "products.read",
      },
      {
        href: "/admin/inventory",
        label: "Inventory",
        icon: Boxes,
        permission: "inventory.read",
      },
      {
        href: "/admin/categories",
        label: "Categories",
        icon: Tags,
        permission: "products.read",
      },
      {
        href: "/admin/brands",
        label: "Brands",
        icon: Award,
        permission: "products.read",
      },
    ],
  },
  {
    label: "Website",
    items: [
      {
        href: "/admin/services",
        label: "Services",
        icon: Stethoscope,
        permission: "cms.write",
      },
      {
        href: "/admin/banners",
        label: "Banners",
        icon: GalleryHorizontal,
        permission: "cms.write",
      },
      {
        href: "/admin/testimonials",
        label: "Testimonials",
        icon: Quote,
        permission: "cms.write",
      },
      {
        href: "/admin/faqs",
        label: "FAQs",
        icon: ClipboardList,
        permission: "cms.write",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: Bell,
        permission: "orders.read",
      },
      {
        href: "/admin/staff",
        label: "Staff & roles",
        icon: Users,
        permission: "staff.read",
      },
      {
        href: "/admin/audit",
        label: "Audit log",
        icon: ScrollText,
        permission: "audit.read",
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: Settings,
        permission: "settings.write",
      },
    ],
  },
];
