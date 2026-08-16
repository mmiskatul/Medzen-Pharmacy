import { withId } from "@/lib/admin-crud";
import { categoryCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withId(categoryCrud.read);
export const PATCH = withId(categoryCrud.update);
export const DELETE = withId(categoryCrud.remove);
