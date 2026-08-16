import { NextResponse } from "next/server";

import { randomBytes } from "node:crypto";

import { fail, ok, parseForm, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { signOrderStatus } from "@/lib/jwt";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { clientIp, LIMITS, rateLimit } from "@/lib/rate-limit";
import {
  buildKey,
  PRIVATE_PREFIX,
  putObject,
  validateUpload,
} from "@/lib/storage";
import { generateReference } from "@/lib/utils";
import { prescriptionRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 5;

/**
 * Public prescription intake.
 *
 * Files go straight to the private storage prefix under random keys; the
 * response returns a reference only. Nothing in the response, and nothing
 * anywhere on the public site, can be used to reach the uploaded file.
 */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`rx:${ip}`, LIMITS.prescription.limit, LIMITS.prescription.windowMs);
    if (!limit.ok) {
      return fail(
        "You have sent several requests already. Message us on WhatsApp if it is urgent.",
        429,
        undefined,
        { headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const form = await request.formData();

    // Honeypot: respond as though it worked, store nothing.
    if (form.get("website")) {
      return ok({ reference: generateReference("RX") });
    }

    const parsed = parseForm(form, prescriptionRequestSchema);
    if (parsed.response) return parsed.response;
    const data = parsed.data;

    const uploads = form.getAll("files").filter((f): f is File => f instanceof File);
    if (uploads.length === 0) {
      return fail("Attach at least one photo or PDF of your prescription.", 422, {
        files: ["Attach at least one photo or PDF of your prescription."],
      });
    }
    if (uploads.length > MAX_FILES) {
      return fail(`You can attach up to ${MAX_FILES} files.`, 422, {
        files: [`You can attach up to ${MAX_FILES} files.`],
      });
    }

    // Validate every file before writing any of them, so a partial
    // upload never leaves orphaned objects in storage.
    const validated = [];
    for (const file of uploads) {
      const { buffer, mimeType } = await validateUpload(file, "prescription");
      validated.push({ file, buffer, mimeType });
    }

    const stored = [];
    for (const item of validated) {
      const key = buildKey(PRIVATE_PREFIX, "prescriptions", item.mimeType);
      const object = await putObject(key, item.buffer, item.mimeType);
      stored.push({
        key: object.key,
        originalName: item.file.name.slice(0, 160),
        mimeType: object.mimeType,
        sizeBytes: object.size,
        checksumSha256: object.checksumSha256,
      });
    }

    const reference = generateReference("RX");
    const email = data.email ? data.email : null;

    // Link to an existing customer by phone, or create one, so staff see
    // a person's history in one place.
    const customer = await prisma.customer.upsert({
      where: { phone: data.phone },
      create: { name: data.name, phone: data.phone, email },
      update: { name: data.name, ...(email ? { email } : {}) },
    });

    const created = await prisma.prescriptionRequest.create({
      data: {
        reference,
        customerId: customer.id,
        customerName: data.name,
        customerPhone: data.phone,
        customerEmail: email,
        notes: data.notes || null,
        files: { create: stored },
      },
      select: { id: true, reference: true },
    });

    await notify({
      type: "NEW_PRESCRIPTION",
      title: `New prescription request ${created.reference}`,
      body: `${data.name} · ${data.phone}`,
      href: `/admin/prescriptions/${created.id}`,
    });

    await audit({
      user: null,
      action: "prescription.submitted",
      entity: "PrescriptionRequest",
      entityId: created.id,
      meta: { reference: created.reference, fileCount: stored.length },
      ip,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          reference: created.reference,
          // JWT lets the customer come back to /status/[token] without
          // needing an account. Treat it like a magic link.
          statusToken: signOrderStatus({
            sub: created.id,
            kind: "prescription",
            jti: randomBytes(16).toString("base64url"),
          }),
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return toResponse(error);
  }
}
