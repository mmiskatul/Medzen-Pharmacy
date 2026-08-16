"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError, type FieldErrors, type ListResponse } from "@/components/admin/api-client";
import { ImagePicker } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/field";
import { Card, EmptyState, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import { slugify } from "@/lib/utils";

/**
 * Table plus create/edit dialog for the resources that share a shape:
 * categories, brands, services, banners, FAQs and testimonials. Each
 * screen supplies a field spec and a column spec; validation errors come
 * back from the API and are attached to the matching field.
 */

export type FieldSpec =
  | { name: string; label: string; type: "text" | "number" | "date"; hint?: string; placeholder?: string; optional?: boolean }
  | { name: string; label: string; type: "textarea"; rows?: number; hint?: string; optional?: boolean }
  | { name: string; label: string; type: "slug"; from: string; hint?: string }
  | { name: string; label: string; type: "checkbox"; hint?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; hint?: string }
  | {
      name: string;
      label: string;
      type: "image";
      folder: "products" | "categories" | "brands" | "banners" | "site";
      hint?: string;
    };

export type ColumnSpec<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

type Row = { id: string } & Record<string, unknown>;

export function ResourceManager<T extends Row>({
  endpoint,
  singular,
  plural,
  fields,
  columns,
  defaults,
  emptyIcon,
  emptyDescription,
  canWrite,
  toForm,
}: {
  endpoint: string;
  singular: string;
  plural: string;
  fields: FieldSpec[];
  columns: ColumnSpec<T>[];
  defaults: Record<string, unknown>;
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyDescription: string;
  canWrite: boolean;
  toForm?: (row: T) => Record<string, unknown>;
}) {
  const [rows, setRows] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<T | null>(null);
  const [form, setForm] = React.useState<Record<string, unknown>>(defaults);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<T | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ListResponse<T>>(`${endpoint}?perPage=100`);
      setRows(data.items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `${plural} could not be loaded.`,
      );
    } finally {
      setLoading(false);
    }
  }, [endpoint, plural]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(defaults);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    setForm(toForm ? toForm(row) : { ...defaults, ...row });
    setErrors({});
    setDialogOpen(true);
  }

  function setValue(name: string, value: unknown) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      // Slug fields track their source until the record exists, then stop
      // so a published URL never changes underneath a customer.
      if (!editing) {
        for (const field of fields) {
          if (field.type === "slug" && field.from === name) {
            next[field.name] = slugify(String(value ?? ""));
          }
        }
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      if (editing) {
        await api.patch(`${endpoint}/${editing.id}`, form);
        toast.success(`${singular} updated`);
      } else {
        await api.post(endpoint, form);
        toast.success(`${singular} created`);
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors ?? {});
        toast.error(error.message);
      } else {
        toast.error(`The ${singular.toLowerCase()} could not be saved.`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.remove(`${endpoint}/${deleting.id}`);
      toast.success(`${singular} deleted`);
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `The ${singular.toLowerCase()} could not be deleted.`,
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      {canWrite ? (
        <div className="mb-4 flex justify-end">
          <Button onClick={openCreate}>
            <Plus />
            Add {singular.toLowerCase()}
          </Button>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            className="border-0 bg-white"
            icon={emptyIcon}
            title={`No ${plural.toLowerCase()} yet`}
            description={emptyDescription}
            action={
              canWrite ? (
                <Button onClick={openCreate}>
                  <Plus />
                  Add {singular.toLowerCase()}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <Th key={column.header} className={column.className}>
                    {column.header}
                  </Th>
                ))}
                {canWrite ? (
                  <Th className="w-28 text-right">
                    <span className="sr-only">Actions</span>
                  </Th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-wash">
                  {columns.map((column) => (
                    <Td key={column.header} className={column.className}>
                      {column.cell(row)}
                    </Td>
                  ))}
                  {canWrite ? (
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row)}
                          aria-label={`Edit ${singular.toLowerCase()}`}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(row)}
                          aria-label={`Delete ${singular.toLowerCase()}`}
                          className="hover:bg-danger-bg hover:text-danger"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </Td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={editing ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}
          description={
            editing
              ? "Changes go live on the website as soon as you save."
              : `Add a ${singular.toLowerCase()} to the website.`
          }
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={save}>
                {editing ? "Save changes" : `Create ${singular.toLowerCase()}`}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {fields.map((field) => {
              const id = `field-${field.name}`;
              const error = errors[field.name]?.[0];
              const value = form[field.name];

              if (field.type === "checkbox") {
                return (
                  <label
                    key={field.name}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-3.5"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => setValue(field.name, event.target.checked)}
                      className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">
                        {field.label}
                      </span>
                      {field.hint ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                          {field.hint}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              }

              if (field.type === "image") {
                return (
                  <div key={field.name} className="space-y-2">
                    <Label>{field.label}</Label>
                    <ImagePicker
                      value={typeof value === "string" && value ? [value] : []}
                      onChange={(keys) => setValue(field.name, keys[0] ?? null)}
                      folder={field.folder}
                    />
                  </div>
                );
              }

              return (
                <Field
                  key={field.name}
                  label={field.label}
                  htmlFor={id}
                  error={error}
                  hint={"hint" in field ? field.hint : undefined}
                  optional={"optional" in field ? field.optional : undefined}
                >
                  {field.type === "textarea" ? (
                    <Textarea
                      id={id}
                      rows={field.rows ?? 3}
                      value={String(value ?? "")}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      aria-invalid={Boolean(error)}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      id={id}
                      value={String(value ?? "")}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      aria-invalid={Boolean(error)}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={id}
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={String(value ?? "")}
                      placeholder={"placeholder" in field ? field.placeholder : undefined}
                      onChange={(event) =>
                        setValue(
                          field.name,
                          field.type === "number"
                            ? event.target.value === ""
                              ? ""
                              : Number(event.target.value)
                            : event.target.value,
                        )
                      }
                      aria-invalid={Boolean(error)}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete this ${singular.toLowerCase()}?`}
        description="It will be removed from the website. Existing orders and records that reference it are not affected."
        confirmLabel={`Delete ${singular.toLowerCase()}`}
        loading={removing}
        onConfirm={confirmDelete}
      />
    </>
  );
}
