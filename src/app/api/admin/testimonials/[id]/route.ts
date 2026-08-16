import { withId } from "@/lib/admin-crud";
import { testimonialCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withId(testimonialCrud.read);
export const PATCH = withId(testimonialCrud.update);
export const DELETE = withId(testimonialCrud.remove);
