import { categoryCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = categoryCrud.list;
export const POST = categoryCrud.create;
