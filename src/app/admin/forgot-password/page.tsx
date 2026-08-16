import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/site-settings.server";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

/**
 * Staff password resets go through a super admin rather than an emailed
 * link. That avoids putting a password-reset token in an inbox for an
 * account that can open prescription files.
 */
export default async function ForgotPasswordPage() {
  const settings = await getSettings();

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Logo />

        <span className="mt-10 grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <KeyRound className="size-5" aria-hidden />
        </span>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Staff passwords are reset by a super admin, not by email link. Ask a
          super admin to set a new password for your account from Admin →
          Staff, then sign in with it and change it.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          If you are the only super admin and cannot sign in, contact the
          pharmacy on {settings.contact.phone}.
        </p>

        <Button asChild variant="secondary" className="mt-7 w-full">
          <Link href="/admin/login">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
