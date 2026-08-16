import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { Prisma } from "@prisma/client";

import { AuthError } from "./auth";
import { UploadError } from "./storage";

/**
 * Uniform API envelope. Client code never sees a stack trace, a Prisma
 * error code or a database constraint name — those are logged server-side
 * and replaced with a sentence the user can act on.
 */

export type FieldErrors = Record<string, string[]>;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true as const, data }, init);
}

export function fail(
  message: string,
  status = 400,
  fieldErrors?: FieldErrors,
  init?: ResponseInit,
) {
  return NextResponse.json(
    { ok: false as const, error: message, fieldErrors },
    { ...init, status },
  );
}

export function zodFieldErrors(error: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Parses JSON against a schema and returns either data or a ready response. */
export async function parseJson<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T; response?: never } | { data?: never; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: fail("The request body could not be read.", 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      response: fail(
        "Check the highlighted fields and try again.",
        422,
        zodFieldErrors(parsed.error),
      ),
    };
  }
  return { data: parsed.data };
}

export function parseForm<T>(
  form: FormData,
  schema: ZodSchema<T>,
): { data: T; response?: never } | { data?: never; response: NextResponse } {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (value instanceof File) continue;
    if (value === "true") raw[key] = true;
    else if (value === "false") raw[key] = false;
    else raw[key] = value;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      response: fail(
        "Check the highlighted fields and try again.",
        422,
        zodFieldErrors(parsed.error),
      ),
    };
  }
  return { data: parsed.data };
}

/** Wraps a route handler so every thrown error becomes a sanitised response. */
export function handle(
  fn: (request: Request, context: never) => Promise<Response>,
) {
  return async (request: Request, context: never): Promise<Response> => {
    try {
      return await fn(request, context);
    } catch (error) {
      return toResponse(error);
    }
  };
}

export function toResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return fail(error.message, error.status);
  }
  if (error instanceof UploadError) {
    return fail(error.message, 400);
  }
  if (error instanceof ZodError) {
    return fail(
      "Check the highlighted fields and try again.",
      422,
      zodFieldErrors(error),
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ");
      return fail(
        target
          ? `Another record already uses that ${target}.`
          : "That value is already in use.",
        409,
      );
    }
    if (error.code === "P2025") {
      return fail("That record no longer exists.", 404);
    }
  }

  // Anything else is unexpected: log the detail, return nothing revealing.
  console.error("[api] unhandled error", error);
  return fail("Something went wrong on our side. Try again in a moment.", 500);
}
