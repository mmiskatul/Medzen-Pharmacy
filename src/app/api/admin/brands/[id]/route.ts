import { withId } from "@/lib/admin-crud";
import { brandCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withId(brandCrud.read);
export const PATCH = withId(brandCrud.update);
export const DELETE = withId(brandCrud.remove);
