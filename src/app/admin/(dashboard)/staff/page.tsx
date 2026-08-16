import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

import { StaffManager } from "./staff-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff & roles" };

export default async function StaffPage() {
  const user = await requireUser("staff.read");

  return (
    <>
      <PageHeader
        title="Staff & roles"
        description="Who can sign in and what each person can reach. Roles set the baseline; extra permissions are added on top."
      />
      <StaffManager canWrite={can(user, "staff.write")} currentUserId={user.id} />
    </>
  );
}
