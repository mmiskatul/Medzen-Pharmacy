import { brandCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = brandCrud.list;
export const POST = brandCrud.create;
