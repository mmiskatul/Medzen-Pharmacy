import { withId } from "@/lib/admin-crud";
import { serviceCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withId(serviceCrud.read);
export const PATCH = withId(serviceCrud.update);
export const DELETE = withId(serviceCrud.remove);
