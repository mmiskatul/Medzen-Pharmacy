"use client";

import * as React from "react";
import { Plus, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError, type FieldErrors } from "@/components/admin/api-client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge, Card, EmptyState, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import {
  PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type Permission,
} from "@/lib/rbac";
import { formatDate, relativeTime } from "@/lib/utils";

type StaffRole = keyof typeof ROLE_LABELS;

type Staff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  extraPerms: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
};

const ROLES = Object.keys(ROLE_LABELS) as StaffRole[];

export function StaffManager({
  canWrite,
  currentUserId,
}: {
  canWrite: boolean;
  currentUserId: string;
}) {
  const [items, setItems] = React.useState<Staff[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Staff | null>(null);
  const [removing, setRemoving] = React.useState<Staff | null>(null);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    role: "PHARMACIST" as StaffRole,
    extraPerms: [] as string[],
    isActive: true,
    password: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Staff[] }>("/api/admin/staff");
      setItems(data.items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Staff could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      role: "PHARMACIST",
      extraPerms: [],
      isActive: true,
      password: "",
    });
    setErrors({});
    setOpen(true);
  }

  function openEdit(person: Staff) {
    setEditing(person);
    setForm({
      name: person.name,
      email: person.email,
      role: person.role,
      extraPerms: person.extraPerms,
      isActive: person.isActive,
      password: "",
    });
    setErrors({});
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        extraPerms: form.extraPerms,
        isActive: form.isActive,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editing) {
        await api.patch(`/api/admin/staff/${editing.id}`, payload);
        toast.success(
          form.password
            ? "Account updated. Their other sessions have been signed out."
            : "Account updated",
        );
      } else {
        await api.post("/api/admin/staff", payload);
        toast.success("Staff account created");
      }
      setOpen(false);
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors ?? {});
        toast.error(error.message);
      } else {
        toast.error("The account could not be saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setDeleting(true);
    try {
      await api.remove(`/api/admin/staff/${removing.id}`);
      toast.success("Account deactivated");
      setRemoving(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The account could not be deactivated.",
      );
    } finally {
      setDeleting(false);
    }
  }

  // Baseline permissions come from the role; only the extras are editable,
  // so a checkbox that the role already grants is shown as fixed.
  const baseline = new Set<Permission>(ROLE_PERMISSIONS[form.role]);

  return (
    <>
      {canWrite ? (
        <div className="mb-4 flex justify-end">
          <Button onClick={openCreate}>
            <Plus />
            Add staff account
          </Button>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="border-0 bg-white"
            icon={Users}
            title="No staff accounts"
            description="Create accounts for the people who work the counter and manage the catalog."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th className="w-48">Role</Th>
                <Th className="w-36">Last signed in</Th>
                <Th className="w-32">Status</Th>
                {canWrite ? (
                  <Th className="w-40 text-right">
                    <span className="sr-only">Actions</span>
                  </Th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {items.map((person) => {
                const locked =
                  person.lockedUntil && new Date(person.lockedUntil) > new Date();
                return (
                  <tr key={person.id} className="transition-colors hover:bg-wash">
                    <Td>
                      <p className="font-medium text-ink">
                        {person.name}
                        {person.id === currentUserId ? (
                          <span className="ml-2 text-xs font-normal text-muted">
                            (you)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted">{person.email}</p>
                    </Td>
                    <Td>
                      <Badge tone="neutral">{ROLE_LABELS[person.role]}</Badge>
                      {person.extraPerms.length > 0 ? (
                        <p className="tnum mt-1 text-xs text-muted">
                          +{person.extraPerms.length} extra
                        </p>
                      ) : null}
                    </Td>
                    <Td className="text-xs">
                      {person.lastLoginAt ? (
                        relativeTime(person.lastLoginAt)
                      ) : (
                        <span className="text-muted">Never</span>
                      )}
                    </Td>
                    <Td>
                      {locked ? (
                        <Badge tone="rx">Locked</Badge>
                      ) : (
                        <Badge tone={person.isActive ? "brand" : "muted"}>
                          {person.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      )}
                    </Td>
                    {canWrite ? (
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(person)}>
                            Edit
                          </Button>
                          {person.id !== currentUserId ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-danger-bg hover:text-danger"
                              onClick={() => setRemoving(person)}
                            >
                              Deactivate
                            </Button>
                          ) : null}
                        </div>
                      </Td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? "Edit staff account" : "New staff account"}
          description={
            editing
              ? "Changing the password signs this person out everywhere."
              : "Choose the smallest role that lets them do their job."
          }
          className="max-w-xl"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={save}>
                {editing ? "Save changes" : "Create account"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="staff-name" error={errors.name?.[0]}>
                <Input
                  id="staff-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Email" htmlFor="staff-email" error={errors.email?.[0]}>
                <Input
                  id="staff-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </Field>
            </div>

            <Field label="Role" htmlFor="staff-role" hint={ROLE_DESCRIPTIONS[form.role]}>
              <Select
                id="staff-role"
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as StaffRole,
                  }))
                }
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={editing ? "New password" : "Password"}
              htmlFor="staff-password"
              error={errors.password?.[0]}
              optional={Boolean(editing)}
              hint="At least 12 characters. Share it with them directly, not by email."
            >
              <Input
                id="staff-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-3.5">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
                className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  Account is active
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Turning this off signs them out and blocks sign-in.
                </span>
              </span>
            </label>

            <fieldset className="rounded-xl border border-line p-4">
              <legend className="flex items-center gap-1.5 px-1 text-sm font-medium text-ink">
                <ShieldCheck className="size-3.5 text-brand-600" aria-hidden />
                Extra permissions
              </legend>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                The role already grants the greyed-out items. Tick anything extra
                this person needs.
              </p>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {PERMISSIONS.map((permission) => {
                  const fromRole = baseline.has(permission);
                  return (
                    <label
                      key={permission}
                      className={
                        fromRole
                          ? "flex cursor-not-allowed items-center gap-2 text-xs text-muted"
                          : "flex cursor-pointer items-center gap-2 text-xs text-ink-soft"
                      }
                    >
                      <input
                        type="checkbox"
                        disabled={fromRole}
                        checked={fromRole || form.extraPerms.includes(permission)}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            extraPerms: event.target.checked
                              ? [...current.extraPerms, permission]
                              : current.extraPerms.filter((item) => item !== permission),
                          }))
                        }
                        className="size-3.5 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                      />
                      <code className="tnum">{permission}</code>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {editing ? (
              <p className="text-xs text-muted">
                Account created {formatDate(editing.createdAt)}.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(value) => !value && setRemoving(null)}
        title={`Deactivate ${removing?.name}?`}
        description="They are signed out immediately and cannot sign in again. Their past actions stay in the audit log."
        confirmLabel="Deactivate account"
        loading={deleting}
        onConfirm={confirmRemove}
      />
    </>
  );
}
