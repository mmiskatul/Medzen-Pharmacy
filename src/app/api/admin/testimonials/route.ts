import { testimonialCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = testimonialCrud.list;
export const POST = testimonialCrud.create;
