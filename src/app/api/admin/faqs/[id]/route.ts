import { withId } from "@/lib/admin-crud";
import { faqCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withId(faqCrud.read);
export const PATCH = withId(faqCrud.update);
export const DELETE = withId(faqCrud.remove);
