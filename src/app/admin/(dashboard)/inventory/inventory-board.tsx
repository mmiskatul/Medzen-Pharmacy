"use client";

import * as React from "react";
import { Boxes, History, Minus, Plus, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError, type FieldErrors } from "@/components/admin/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Card, EmptyState, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import { formatDate, relativeTime } from "@/lib/utils";

type InventoryRow = {
  id: string;
  quantity: number;
  lowStockAt: number;
  batchNumber: string | null;
  expiryDate: string | null;
  shelfLocation: string | null;
  product: { id: string; name: string; sku: string; status: string };
};

type Movement = {
  id: string;
  delta: number;
  quantityAfter: number;
  reason: string;
  note: string | null;
  createdAt: string;
  user: { name: string } | null;
};

const FILTERS = [
  { value: "", label: "All stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
  { value: "expiring", label: "Expiring in 90 days" },
] as const;

const REASONS = [
  { value: "RECEIVED", label: "Stock received" },
  { value: "SOLD", label: "Sold at the counter" },
  { value: "RETURNED", label: "Returned by customer" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CORRECTION", label: "Stock count correction" },
] as const;

export function InventoryBoard({
  canWrite,
  initialFilter,
}: {
  canWrite: boolean;
  initialFilter: string;
}) {
  const [rows, setRows] = React.useState<InventoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState(initialFilter);
  const [term, setTerm] = React.useState("");

  const [adjusting, setAdjusting] = React.useState<InventoryRow | null>(null);
  const [editing, setEditing] = React.useState<InventoryRow | null>(null);
  const [history, setHistory] = React.useState<{ row: InventoryRow; movements: Movement[] } | null>(null);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [saving, setSaving] = React.useState(false);

  const [delta, setDelta] = React.useState("1");
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [reason, setReason] = React.useState<string>("RECEIVED");
  const [note, setNote] = React.useState("");
  const [settingsForm, setSettingsForm] = React.useState({
    lowStockAt: 5,
    batchNumber: "",
    expiryDate: "",
    shelfLocation: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("filter", filter);
      if (term.trim()) params.set("q", term.trim());
      const data = await api.get<{ items: InventoryRow[] }>(
        `/api/admin/inventory?${params.toString()}`,
      );
      setRows(data.items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Stock could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter, term]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openAdjust(row: InventoryRow) {
    setAdjusting(row);
    setDelta("1");
    setDirection(1);
    setReason("RECEIVED");
    setNote("");
    setErrors({});
  }

  function openSettings(row: InventoryRow) {
    setEditing(row);
    setSettingsForm({
      lowStockAt: row.lowStockAt,
      batchNumber: row.batchNumber ?? "",
      expiryDate: row.expiryDate ? row.expiryDate.slice(0, 10) : "",
      shelfLocation: row.shelfLocation ?? "",
    });
    setErrors({});
  }

  async function openHistory(row: InventoryRow) {
    try {
      const data = await api.get<{ transactions: Movement[] }>(
        `/api/admin/inventory/${row.id}`,
      );
      setHistory({ row, movements: data.transactions });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Stock history could not be loaded.",
      );
    }
  }

  async function submitAdjust() {
    if (!adjusting) return;
    setSaving(true);
    setErrors({});
    try {
      const amount = Math.abs(Number.parseInt(delta, 10) || 0) * direction;
      await api.patch(`/api/admin/inventory/${adjusting.id}`, {
        kind: "adjust",
        delta: amount,
        reason,
        note,
      });
      toast.success(
        `${adjusting.product.name}: ${amount > 0 ? "+" : ""}${amount} recorded`,
      );
      setAdjusting(null);
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors ?? {});
        toast.error(error.message);
      } else {
        toast.error("The adjustment could not be saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitSettings() {
    if (!editing) return;
    setSaving(true);
    setErrors({});
    try {
      await api.patch(`/api/admin/inventory/${editing.id}`, {
        kind: "settings",
        ...settingsForm,
      });
      toast.success("Stock settings saved");
      setEditing(null);
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors ?? {});
        toast.error(error.message);
      } else {
        toast.error("The settings could not be saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  function stockTone(row: InventoryRow) {
    if (row.quantity <= 0) return "danger" as const;
    if (row.quantity <= row.lowStockAt) return "rx" as const;
    return "brand" as const;
  }

  function expiryTone(value: string | null) {
    if (!value) return null;
    const days = (new Date(value).getTime() - Date.now()) / 86_400_000;
    if (days < 0) return "danger" as const;
    if (days < 90) return "rx" as const;
    return "neutral" as const;
  }

  return (
    <>
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="stock-search" className="sr-only">
              Search stock
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-line-strong px-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
              <Search className="size-4 shrink-0 text-muted" aria-hidden />
              <input
                id="stock-search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search by product name or SKU"
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/80"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label htmlFor="stock-filter" className="sr-only">
              Filter stock
            </label>
            <Select
              id="stock-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="sm:w-56"
            >
              {FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            className="border-0 bg-white"
            icon={Boxes}
            title="Nothing to show"
            description={
              filter
                ? "No stock matches this filter — which is usually good news."
                : "Stock records appear here once you add products to the catalog."
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th className="w-24">In stock</Th>
                <Th className="w-28">Low at</Th>
                <Th className="w-36">Batch</Th>
                <Th className="w-36">Expires</Th>
                <Th className="w-40 text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expiry = expiryTone(row.expiryDate);
                return (
                  <tr key={row.id} className="transition-colors hover:bg-wash">
                    <Td>
                      <p className="font-medium text-ink">{row.product.name}</p>
                      <p className="tnum text-xs text-muted">
                        {row.product.sku}
                        {row.shelfLocation ? ` · ${row.shelfLocation}` : ""}
                      </p>
                    </Td>
                    <Td>
                      <Badge tone={stockTone(row)}>
                        <span className="tnum">{row.quantity}</span>
                      </Badge>
                    </Td>
                    <Td className="tnum text-muted">{row.lowStockAt}</Td>
                    <Td className="tnum text-xs">
                      {row.batchNumber ?? <span className="text-muted">—</span>}
                    </Td>
                    <Td className="text-xs">
                      {row.expiryDate ? (
                        <Badge tone={expiry ?? "neutral"}>
                          {formatDate(row.expiryDate)}
                        </Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void openHistory(row)}
                          aria-label={`Stock history for ${row.product.name}`}
                        >
                          <History />
                        </Button>
                        {canWrite ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openSettings(row)}
                              aria-label={`Stock settings for ${row.product.name}`}
                            >
                              <Settings2 />
                            </Button>
                            <Button
                              size="sm"
                              variant="subtle"
                              onClick={() => openAdjust(row)}
                            >
                              Adjust
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Adjust stock */}
      <Dialog open={Boolean(adjusting)} onOpenChange={(open) => !open && setAdjusting(null)}>
        <DialogContent
          title="Adjust stock"
          description={adjusting?.product.name}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setAdjusting(null)}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={submitAdjust}>
                Record adjustment
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-wash p-4">
              <p className="text-sm text-muted">Currently in stock</p>
              <p className="tnum mt-1 font-display text-2xl font-bold text-ink">
                {adjusting?.quantity ?? 0}
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-ink">Direction</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  variant={direction === 1 ? "subtle" : "secondary"}
                  onClick={() => {
                    setDirection(1);
                    setReason("RECEIVED");
                  }}
                  aria-pressed={direction === 1}
                >
                  <Plus />
                  Add stock
                </Button>
                <Button
                  variant={direction === -1 ? "subtle" : "secondary"}
                  onClick={() => {
                    setDirection(-1);
                    setReason("SOLD");
                  }}
                  aria-pressed={direction === -1}
                >
                  <Minus />
                  Remove stock
                </Button>
              </div>
            </fieldset>

            <Field label="Quantity" htmlFor="adj-qty" error={errors.delta?.[0]}>
              <Input
                id="adj-qty"
                type="number"
                min={1}
                className="tnum"
                value={delta}
                onChange={(event) => setDelta(event.target.value)}
              />
            </Field>

            <Field label="Reason" htmlFor="adj-reason" error={errors.reason?.[0]}>
              <Select
                id="adj-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                {REASONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Note" htmlFor="adj-note" optional>
              <Textarea
                id="adj-note"
                rows={2}
                value={note}
                maxLength={300}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>

            <p className="text-xs text-muted">
              New level:{" "}
              <span className="tnum font-medium text-ink">
                {Math.max(
                  0,
                  (adjusting?.quantity ?? 0) +
                    Math.abs(Number.parseInt(delta, 10) || 0) * direction,
                )}
              </span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock settings */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent
          title="Stock settings"
          description={editing?.product.name}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={submitSettings}>
                Save settings
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field
              label="Low stock threshold"
              htmlFor="inv-low"
              error={errors.lowStockAt?.[0]}
              hint="You are alerted when stock reaches this level."
            >
              <Input
                id="inv-low"
                type="number"
                min={0}
                className="tnum"
                value={settingsForm.lowStockAt}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    lowStockAt: Number(event.target.value),
                  }))
                }
              />
            </Field>

            <Field label="Batch number" htmlFor="inv-batch" optional>
              <Input
                id="inv-batch"
                className="tnum"
                value={settingsForm.batchNumber}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    batchNumber: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Expiry date" htmlFor="inv-expiry" optional>
              <Input
                id="inv-expiry"
                type="date"
                value={settingsForm.expiryDate}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    expiryDate: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Shelf location" htmlFor="inv-shelf" optional>
              <Input
                id="inv-shelf"
                value={settingsForm.shelfLocation}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    shelfLocation: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement history */}
      <Dialog open={Boolean(history)} onOpenChange={(open) => !open && setHistory(null)}>
        <DialogContent
          title="Stock movements"
          description={history?.row.product.name}
          className="max-w-xl"
        >
          {history && history.movements.length > 0 ? (
            <ul className="divide-y divide-line">
              {history.movements.map((movement) => (
                <li key={movement.id} className="flex items-start gap-4 py-3">
                  <span
                    className={
                      movement.delta > 0
                        ? "tnum shrink-0 font-semibold text-brand-700"
                        : "tnum shrink-0 font-semibold text-danger"
                    }
                  >
                    {movement.delta > 0 ? "+" : ""}
                    {movement.delta}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      {REASONS.find((r) => r.value === movement.reason)?.label ??
                        movement.reason}
                    </p>
                    {movement.note ? (
                      <p className="text-xs text-muted">{movement.note}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted">
                      {movement.user?.name ?? "System"} ·{" "}
                      {relativeTime(movement.createdAt)} · left{" "}
                      <span className="tnum">{movement.quantityAfter}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              No movements recorded for this product yet.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
