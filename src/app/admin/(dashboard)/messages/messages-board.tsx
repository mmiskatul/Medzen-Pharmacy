"use client";

import * as React from "react";
import { Mail, MessageCircle, Phone, Search } from "lucide-react";
import { toast } from "sonner";

import { api, type ListResponse } from "@/components/admin/api-client";
import { MESSAGE_STATUSES, StatusBadge, statusLabel } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/utils";
import { telLink } from "@/lib/whatsapp";

type Message = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
};

export function MessagesBoard({ canUpdate }: { canUpdate: boolean }) {
  const [items, setItems] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState("");
  const [term, setTerm] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ perPage: "50" });
      if (status) params.set("status", status);
      if (term.trim()) params.set("q", term.trim());
      const data = await api.get<ListResponse<Message>>(
        `/api/admin/messages?${params.toString()}`,
      );
      setItems(data.items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Messages could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [status, term]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function setMessageStatus(message: Message, next: Message["status"]) {
    setBusyId(message.id);
    try {
      await api.patch(`/api/admin/messages/${message.id}`, { status: next });
      setItems((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, status: next } : item,
        ),
      );
      toast.success(`Marked ${statusLabel(next).toLowerCase()}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The message could not be updated.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="message-search" className="sr-only">
              Search messages
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-line-strong px-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
              <Search className="size-4 shrink-0 text-muted" aria-hidden />
              <input
                id="message-search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search by name, subject or phone"
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/80"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label htmlFor="message-status" className="sr-only">
              Filter by status
            </label>
            <Select
              id="message-status"
              className="sm:w-48"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All messages</option>
              {MESSAGE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {statusLabel(option)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No messages here"
          description={
            status || term
              ? "Nothing matches this filter."
              : "Messages sent from the contact form will land here."
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((message) => (
            <li key={message.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[0.9375rem] font-semibold text-ink">
                      {message.subject}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {message.name} · {relativeTime(message.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={message.status} />
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {message.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  <Button asChild size="sm" variant="secondary">
                    <a href={telLink(message.phone)}>
                      <Phone />
                      {message.phone}
                    </a>
                  </Button>
                  {message.email ? (
                    <Button asChild size="sm" variant="secondary">
                      <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}>
                        <Mail />
                        Reply by email
                      </a>
                    </Button>
                  ) : null}

                  {canUpdate ? (
                    <div className="ml-auto flex gap-2">
                      {message.status !== "IN_PROGRESS" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busyId === message.id}
                          onClick={() => setMessageStatus(message, "IN_PROGRESS")}
                        >
                          Mark in progress
                        </Button>
                      ) : null}
                      {message.status !== "RESOLVED" ? (
                        <Button
                          size="sm"
                          variant="subtle"
                          loading={busyId === message.id}
                          onClick={() => setMessageStatus(message, "RESOLVED")}
                        >
                          Mark resolved
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
