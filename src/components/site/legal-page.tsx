import type { ReactNode } from "react";

/** Shared shell for the four policy pages: one column, generous measure. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page py-10 lg:py-14">
      <article className="mx-auto max-w-2xl">
        <header>
          <span className="eyebrow">Legal</span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">Last updated {updated}</p>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
            {intro}
          </p>
        </header>

        <div className="mt-9 space-y-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:text-[0.9375rem] [&_li]:leading-relaxed [&_li]:text-muted [&_p]:mt-2 [&_p]:text-[0.9375rem] [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </div>

        <p className="mt-10 rounded-xl border border-line bg-wash p-4 text-xs leading-relaxed text-muted">
          This page is a plain-language summary prepared for the website. It is
          not legal advice, and the pharmacy may update it as its practices or
          the applicable UAE regulations change.
        </p>
      </article>
    </div>
  );
}
