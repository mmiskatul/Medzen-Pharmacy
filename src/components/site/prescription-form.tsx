"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Lock,
  MessageCircle,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/primitives";
import { whatsappLink } from "@/lib/whatsapp";

const ACCEPTED = ".jpg,.jpeg,.png,.pdf";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILES = 5;

type Errors = Record<string, string[]>;

export function PrescriptionForm({
  whatsapp,
  maxBytes,
}: {
  whatsapp: string;
  maxBytes: number;
}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const maxMb = Math.floor(maxBytes / (1024 * 1024));

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next: File[] = [];
    const problems: string[] = [];

    for (const file of Array.from(incoming)) {
      if (files.length + next.length >= MAX_FILES) {
        problems.push(`You can attach up to ${MAX_FILES} files.`);
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        problems.push(`${file.name} is not a JPG, PNG or PDF.`);
        continue;
      }
      if (file.size > maxBytes) {
        problems.push(`${file.name} is larger than ${maxMb} MB.`);
        continue;
      }
      next.push(file);
    }

    setErrors((current) => ({ ...current, files: problems }));
    if (next.length) setFiles((current) => [...current, ...next]);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (files.length === 0) {
      setErrors((current) => ({
        ...current,
        files: ["Attach at least one photo or PDF of your prescription."],
      }));
      return;
    }

    const form = new FormData(event.currentTarget);
    for (const file of files) form.append("files", file);

    setSubmitting(true);
    try {
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        data?: { reference: string };
        error?: string;
        fieldErrors?: Errors;
      };

      if (!response.ok || !payload.ok) {
        setErrors(payload.fieldErrors ?? {});
        setFormError(payload.error ?? "The request could not be sent.");
        return;
      }

      setErrors({});
      setReference(payload.data?.reference ?? null);
    } catch {
      setFormError(
        "We could not reach the pharmacy just now. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <Card className="p-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50">
          <CheckCircle2 className="size-6 text-brand-700" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">
          Your prescription request has been received
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Our pharmacy team will review it and contact you. Keep this reference
          for any follow-up.
        </p>
        <p className="tnum mt-4 inline-block rounded-xl border border-line bg-wash px-4 py-2 text-base font-semibold text-ink">
          {reference}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button asChild variant="whatsapp">
            <a
              href={whatsappLink(whatsapp, { kind: "prescription", reference })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Message the pharmacy
            </a>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-7">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {/* Honeypot: hidden from people, tempting to bots. */}
        <div aria-hidden className="hidden">
          <label htmlFor="rx-website">Website</label>
          <input id="rx-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="rx-name" error={errors.name?.[0]}>
            <Input
              id="rx-name"
              name="name"
              required
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              placeholder="As it appears on the prescription"
            />
          </Field>

          <Field
            label="Phone number"
            htmlFor="rx-phone"
            error={errors.phone?.[0]}
            hint="We reply on this number."
          >
            <Input
              id="rx-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={Boolean(errors.phone)}
              placeholder="+971 50 123 4567"
            />
          </Field>
        </div>

        <Field label="Email" htmlFor="rx-email" optional error={errors.email?.[0]}>
          <Input
            id="rx-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            placeholder="you@example.com"
          />
        </Field>

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Prescription file</p>

          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addFiles(event.dataTransfer.files);
            }}
            className="rounded-xl border-2 border-dashed border-line-strong bg-wash p-6 text-center transition-colors hover:border-brand-300"
          >
            <Upload className="mx-auto size-6 text-brand-700" aria-hidden />
            <p className="mt-3 text-sm text-ink">
              Drag a file here, or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-semibold text-brand-700 underline underline-offset-4"
              >
                choose a file
              </button>
            </p>
            <p className="mt-1 text-xs text-muted">
              JPG, PNG or PDF · up to {maxMb} MB each · up to {MAX_FILES} files
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              multiple
              className="sr-only"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          {files.length > 0 ? (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5"
                >
                  <FileText className="size-4 shrink-0 text-brand-700" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {file.name}
                  </span>
                  <span className="tnum shrink-0 text-xs text-muted">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((current) => current.filter((_, i) => i !== index))
                    }
                    className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {errors.files?.length ? (
            <ul className="space-y-1" role="alert">
              {errors.files.map((message) => (
                <li key={message} className="text-sm text-danger">
                  {message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Field
          label="Notes for the pharmacist"
          htmlFor="rx-notes"
          optional
          error={errors.notes?.[0]}
          hint="For example, which items you need first, or a preferred collection time."
        >
          <Textarea id="rx-notes" name="notes" rows={4} maxLength={1000} />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-4">
          <input
            type="checkbox"
            name="consent"
            value="true"
            required
            className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm leading-relaxed text-ink-soft">
            I agree to Medzen Pharmacy storing and reviewing this prescription so
            the pharmacy team can contact me about it. Read the{" "}
            <Link
              href="/prescription-policy"
              className="font-medium text-brand-700 underline underline-offset-4"
            >
              prescription policy
            </Link>
            .
          </span>
        </label>
        {errors.consent?.[0] ? (
          <p className="text-sm text-danger" role="alert">
            {errors.consent[0]}
          </p>
        ) : null}

        {formError ? (
          <p
            className="rounded-xl border border-red-200 bg-danger-bg px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" loading={submitting}>
            Send prescription request
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Lock className="size-3.5" aria-hidden />
            Encrypted upload, private to the pharmacy team
          </p>
        </div>
      </form>
    </Card>
  );
}
