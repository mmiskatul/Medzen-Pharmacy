import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/site/logo";
import { Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Logo />

          <h1 className="mt-10 font-display text-2xl font-bold tracking-tight">
            Staff sign in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This area is for Medzen Pharmacy staff. Customers can{" "}
            <Link
              href="/"
              className="font-medium text-brand-700 underline underline-offset-4"
            >
              return to the website
            </Link>
            .
          </p>

          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-72" />}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden />
            Sign-in attempts are rate limited and recorded. Accounts lock
            temporarily after repeated failures.
          </p>
        </div>
      </div>

      <div className="relative hidden bg-brand-900 lg:block">
        <div className="flex h-full flex-col justify-end p-14">
          <blockquote className="max-w-md">
            <p className="font-display text-2xl font-bold leading-snug text-white">
              Prescriptions, stock and orders — handled in one place.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-brand-100">
              Every prescription file is stored privately and every view is
              recorded. Your role decides exactly which areas you can open.
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
