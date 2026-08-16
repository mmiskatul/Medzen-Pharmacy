"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Boxes,
  FileText,
  MessageSquare,
  ShoppingCart,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/components/admin/api-client";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { cn, relativeTime } from "@/lib/utils";

type Notification = {
  id: string;
  type: "NEW_ORDER" | "NEW_PRESCRIPTION" | "LOW_STOCK" | "NEW_MESSAGE" | "NEW_CUSTOMER";
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const ICONS: Record<Notification["type"], LucideIcon> = {
  NEW_ORDER: ShoppingCart,
  NEW_PRESCRIPTION: FileText,
  LOW_STOCK: Boxes,
  NEW_MESSAGE: MessageSquare,
  NEW_CUSTOMER: UserPlus,
};

export function NotificationsList() {
  const router = useRouter();
  const [items, setItems] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [marking, setMarking] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Notification[]; unread: number }>(
        "/api/admin/notifications",
      );
      setItems(data.items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Notifications could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function markAll() {
    setMarking(true);
    try {
      await api.patch("/api/admin/notifications");
      setItems((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
      );
      // Refresh so the sidebar badge updates too.
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "They could not be marked as read.",
      );
    } finally {
      setMarking(false);
    }
  }

  async function markOne(id: string) {
    try {
      await api.patch(`/api/admin/notifications?id=${id}`);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      router.refresh();
    } catch {
      // A failed read-marker is not worth interrupting the user for.
    }
  }

  const unread = items.filter((item) => !item.readAt).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Nothing to catch up on"
        description="New orders, prescriptions, messages and low-stock alerts will show up here."
      />
    );
  }

  return (
    <>
      {unread > 0 ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="tnum text-sm text-muted">
            {unread} unread {unread === 1 ? "notification" : "notifications"}
          </p>
          <Button size="sm" variant="secondary" loading={marking} onClick={markAll}>
            Mark all read
          </Button>
        </div>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = ICONS[item.type] ?? Bell;
          const unreadItem = !item.readAt;
          const content = (
            <Card
              className={cn(
                "flex gap-4 p-4 transition-colors",
                unreadItem ? "border-brand-200 bg-brand-50/40" : "",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  unreadItem ? "bg-brand-100 text-brand-800" : "bg-wash text-muted",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.title}</p>
                {item.body ? (
                  <p className="mt-0.5 text-sm text-muted">{item.body}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted">{relativeTime(item.createdAt)}</p>
              </div>
              {unreadItem ? (
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600"
                  aria-label="Unread"
                />
              ) : null}
            </Card>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} onClick={() => void markOne(item.id)}>
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => void markOne(item.id)}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
