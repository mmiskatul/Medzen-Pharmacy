"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError, type FieldErrors } from "@/components/admin/api-client";
import { ImagePicker } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/field";
import { Card, CardHeader } from "@/components/ui/primitives";
import { filsFromInput, slugify } from "@/lib/utils";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  summary: string;
  description: string;
  keyInfo: string;
  usageInfo: string;
  price: string;
  compareAt: string;
  categoryId: string;
  brandId: string;
  prescriptionRequired: boolean;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  imageKeys: string[];
};

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  summary: "",
  description: "",
  keyInfo: "",
  usageInfo: "",
  price: "",
  compareAt: "",
  categoryId: "",
  brandId: "",
  prescriptionRequired: false,
  status: "DRAFT",
  isFeatured: false,
  metaTitle: "",
  metaDescription: "",
  imageKeys: [],
};

export function ProductEditor({
  initial,
  categories,
  brands,
  canWrite,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const isNew = !initial.id;

  const [values, setValues] = React.useState(initial);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      // The slug follows the name only until the product is saved; after
      // that the URL is stable so existing links keep working.
      if (key === "name" && isNew) next.slug = slugify(String(value));
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setErrors({});

    const payload = {
      name: values.name,
      slug: values.slug,
      sku: values.sku,
      summary: values.summary,
      description: values.description,
      keyInfo: values.keyInfo,
      usageInfo: values.usageInfo,
      priceFils: filsFromInput(values.price),
      compareAtFils: filsFromInput(values.compareAt),
      categoryId: values.categoryId || null,
      brandId: values.brandId || null,
      prescriptionRequired: values.prescriptionRequired,
      status: values.status,
      isFeatured: values.isFeatured,
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,
      imageKeys: values.imageKeys,
    };

    try {
      if (isNew) {
        const created = await api.post<{ id: string }>("/api/admin/products", payload);
        toast.success("Product created");
        router.push(`/admin/products/${created.id}`);
        router.refresh();
      } else {
        await api.patch(`/api/admin/products/${initial.id}`, payload);
        toast.success("Product saved");
        router.refresh();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors ?? {});
        toast.error(error.message);
      } else {
        toast.error("The product could not be saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await api.remove(`/api/admin/products/${initial.id}`);
      toast.success("Product deleted");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The product could not be deleted.",
      );
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Basics" description="What the customer sees first." />
            <div className="space-y-5 p-5">
              <Field label="Product name" htmlFor="p-name" error={errors.name?.[0]}>
                <Input
                  id="p-name"
                  value={values.name}
                  onChange={(event) => set("name", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="URL slug"
                  htmlFor="p-slug"
                  error={errors.slug?.[0]}
                  hint={`/products/${values.slug || "…"}`}
                >
                  <Input
                    id="p-slug"
                    value={values.slug}
                    onChange={(event) => set("slug", slugify(event.target.value))}
                    disabled={!canWrite}
                  />
                </Field>
                <Field label="SKU" htmlFor="p-sku" error={errors.sku?.[0]}>
                  <Input
                    id="p-sku"
                    value={values.sku}
                    onChange={(event) => set("sku", event.target.value)}
                    className="tnum"
                    disabled={!canWrite}
                  />
                </Field>
              </div>

              <Field
                label="Short summary"
                htmlFor="p-summary"
                optional
                error={errors.summary?.[0]}
                hint="One line, shown on product cards and in search results."
              >
                <Input
                  id="p-summary"
                  value={values.summary}
                  maxLength={200}
                  onChange={(event) => set("summary", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="p-description"
                optional
                error={errors.description?.[0]}
              >
                <Textarea
                  id="p-description"
                  rows={5}
                  value={values.description}
                  onChange={(event) => set("description", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>

              <Field
                label="Key information"
                htmlFor="p-keyinfo"
                optional
                error={errors.keyInfo?.[0]}
                hint="Pack size, strength, storage — facts from the manufacturer."
              >
                <Textarea
                  id="p-keyinfo"
                  rows={3}
                  value={values.keyInfo}
                  onChange={(event) => set("keyInfo", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>

              <Field
                label="How to use"
                htmlFor="p-usage"
                optional
                error={errors.usageInfo?.[0]}
                hint="Manufacturer directions only. Do not write medical advice here."
              >
                <Textarea
                  id="p-usage"
                  rows={3}
                  value={values.usageInfo}
                  onChange={(event) => set("usageInfo", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Images"
              description="The first image is used on cards and in search results."
            />
            <div className="p-5">
              <ImagePicker
                value={values.imageKeys}
                onChange={(keys) => set("imageKeys", keys)}
                folder="products"
                multiple
                max={6}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Search engine listing"
              description="Leave these empty and the product name and summary are used."
            />
            <div className="space-y-5 p-5">
              <Field label="Meta title" htmlFor="p-metatitle" optional>
                <Input
                  id="p-metatitle"
                  value={values.metaTitle}
                  maxLength={70}
                  onChange={(event) => set("metaTitle", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>
              <Field label="Meta description" htmlFor="p-metadesc" optional>
                <Textarea
                  id="p-metadesc"
                  rows={2}
                  maxLength={180}
                  value={values.metaDescription}
                  onChange={(event) => set("metaDescription", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Visibility" />
            <div className="space-y-5 p-5">
              <Field label="Status" htmlFor="p-status">
                <Select
                  id="p-status"
                  value={values.status}
                  onChange={(event) =>
                    set("status", event.target.value as "DRAFT" | "PUBLISHED")
                  }
                  disabled={!canWrite}
                >
                  <option value="DRAFT">Draft — not on the website</option>
                  <option value="PUBLISHED">Published — live</option>
                </Select>
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-3.5">
                <input
                  type="checkbox"
                  checked={values.isFeatured}
                  onChange={(event) => set("isFeatured", event.target.checked)}
                  disabled={!canWrite}
                  className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Feature on the homepage
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Appears in the “Picked by our team” row.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-rx-line bg-rx-bg p-3.5">
                <input
                  type="checkbox"
                  checked={values.prescriptionRequired}
                  onChange={(event) => set("prescriptionRequired", event.target.checked)}
                  disabled={!canWrite}
                  className="mt-0.5 size-4 shrink-0 rounded border-rx-line text-rx focus:ring-rx"
                />
                <span>
                  <span className="block text-sm font-medium text-rx">
                    Prescription required
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-rx/90">
                    Shows the regulatory notice on the product page and flags the
                    item on any order that includes it.
                  </span>
                </span>
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader title="Pricing" description="Amounts in AED." />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field
                label="Price"
                htmlFor="p-price"
                optional
                error={errors.priceFils?.[0]}
                hint="Leave empty for “price on request”."
              >
                <Input
                  id="p-price"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className="tnum"
                  value={values.price}
                  onChange={(event) => set("price", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>
              <Field label="Was price" htmlFor="p-compare" optional>
                <Input
                  id="p-compare"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className="tnum"
                  value={values.compareAt}
                  onChange={(event) => set("compareAt", event.target.value)}
                  disabled={!canWrite}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Organisation" />
            <div className="space-y-5 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="p-category">Category</Label>
                <Select
                  id="p-category"
                  value={values.categoryId}
                  onChange={(event) => set("categoryId", event.target.value)}
                  disabled={!canWrite}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-brand">Brand</Label>
                <Select
                  id="p-brand"
                  value={values.brandId}
                  onChange={(event) => set("brandId", event.target.value)}
                  disabled={!canWrite}
                >
                  <option value="">No brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {!isNew ? (
            <Card>
              <CardHeader title="Links" />
              <div className="space-y-2 p-5">
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/products/${values.slug}`} target="_blank">
                    <ExternalLink />
                    View on the website
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/admin/inventory">Manage stock</Link>
                </Button>
                {canWrite ? (
                  <Button
                    variant="ghost"
                    className="w-full text-danger hover:bg-danger-bg"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 />
                    Delete product
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {canWrite ? (
        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-line bg-white/92 py-4 backdrop-blur-md">
          <Button asChild variant="secondary">
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button loading={saving} onClick={save}>
            {isNew ? "Create product" : "Save changes"}
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this product?"
        description="It disappears from the website immediately. Past orders that include it are not affected."
        confirmLabel="Delete product"
        loading={deleting}
        onConfirm={remove}
      />
    </>
  );
}
