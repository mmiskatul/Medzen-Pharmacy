"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

type Errors = Record<string, string[]>;

export function ContactForm() {
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: Errors;
      };

      if (!response.ok || !result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? "The message could not be sent.");
        return;
      }

      setErrors({});
      setSent(true);
    } catch {
      setFormError(
        "We could not reach the pharmacy just now. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-line bg-white p-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50">
          <CheckCircle2 className="size-6 text-brand-700" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">
          Message sent
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Our team will get back to you on the number or email you provided. For
          anything urgent, call or message us on WhatsApp.
        </p>
        <Button
          variant="secondary"
          className="mt-5"
          onClick={() => setSent(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-line bg-white p-6 sm:p-7"
    >
      <div aria-hidden className="hidden">
        <label htmlFor="ct-website">Website</label>
        <input id="ct-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="ct-name" error={errors.name?.[0]}>
          <Input
            id="ct-name"
            name="name"
            required
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
          />
        </Field>
        <Field label="Phone number" htmlFor="ct-phone" error={errors.phone?.[0]}>
          <Input
            id="ct-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="+971 50 123 4567"
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="ct-email" optional error={errors.email?.[0]}>
        <Input
          id="ct-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
        />
      </Field>

      <Field label="Subject" htmlFor="ct-subject" error={errors.subject?.[0]}>
        <Input
          id="ct-subject"
          name="subject"
          required
          placeholder="Product availability, delivery, opening hours…"
          aria-invalid={Boolean(errors.subject)}
        />
      </Field>

      <Field label="Message" htmlFor="ct-message" error={errors.message?.[0]}>
        <Textarea
          id="ct-message"
          name="message"
          rows={5}
          required
          maxLength={2000}
          aria-invalid={Boolean(errors.message)}
        />
      </Field>

      <p className="text-xs leading-relaxed text-muted">
        Please do not include medical details in this form. For anything about a
        prescription, use the secure prescription upload instead.
      </p>

      {formError ? (
        <p
          className="rounded-xl border border-red-200 bg-danger-bg px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={submitting}>
        Send message
      </Button>
    </form>
  );
}
