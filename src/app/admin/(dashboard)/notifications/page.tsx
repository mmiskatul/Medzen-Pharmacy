import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";

import { NotificationsList } from "./notifications-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="Notifications"
        description="New orders, prescription requests, messages and stock alerts."
      />
      <NotificationsList />
    </>
  );
}
