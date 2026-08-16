import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Medzen Admin" },
  robots: { index: false, follow: false, nocache: true },
};

// Nothing under /admin may be statically rendered or cached.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
