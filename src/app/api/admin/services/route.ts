import { serviceCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = serviceCrud.list;
export const POST = serviceCrud.create;
