import { withId } from "@/lib/admin-crud";
import { bannerCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withId(bannerCrud.read);
export const PATCH = withId(bannerCrud.update);
export const DELETE = withId(bannerCrud.remove);
