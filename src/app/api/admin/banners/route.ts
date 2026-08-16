import { bannerCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = bannerCrud.list;
export const POST = bannerCrud.create;
