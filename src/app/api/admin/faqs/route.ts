import { faqCrud } from "@/lib/admin-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = faqCrud.list;
export const POST = faqCrud.create;
