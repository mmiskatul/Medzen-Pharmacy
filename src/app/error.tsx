"use client";

import * as React from "react";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary. The message stays generic on purpose — a failure
 * detail could leak schema or infrastructure information to a visitor.
 * The digest is shown so a customer can quote it when they call.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app] render error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          Something went wrong on our side
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          The page could not be loaded. Try again — if it keeps happening, call
          or message the pharmacy and we will help you directly.
        </p>
        {error.digest ? (
          <p className="tnum mt-4 inline-block rounded-lg border border-line bg-wash px-3 py-1.5 text-xs text-muted">
            Reference {error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Button onClick={reset}>
            <RefreshCw />
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <Home />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
