import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionUser } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * The authentication gate for every dashboard page. Middleware only checks
 * that a session cookie is present; this layout verifies the session
 * against the database on every request, so a revoked, expired or
 * deactivated account is rejected here regardless of the cookie.
 *
 * Per-page authorisation is separate: each page calls requireUser with the
 * permission it needs.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const unread = await unreadCount();

  return (
    <AdminShell user={user} unreadNotifications={unread}>
      {children}
    </AdminShell>
  );
}
