import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

import { MessagesBoard } from "./messages-board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser("messages.read");

  return (
    <>
      <PageHeader
        title="Messages"
        description="Enquiries from the website contact form. Reply by phone or email, then mark them resolved."
      />
      <MessagesBoard canUpdate={can(user, "messages.update")} />
    </>
  );
}
