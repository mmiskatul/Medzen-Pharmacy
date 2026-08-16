"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Package, Pencil, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { api, type ListResponse } from "@/components/admin/api-client";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import { Badge, Card, EmptyState, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import { formatPrice } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: "DRAFT" | "PUBLISHED";
  priceFils: number | null;
  prescriptionRequired: boolean;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  inventory: { quantity: number; lowStockAt: number } | null;
  images: { key: string }[];
};

type BulkAction = "publish" | "unpublish" | "delete" | "set_category";

export function ProductsTable({
  canWrite,
  categories,
  initialQuery,
}: {
  canWrite: boolean;
  categories: { id: string; name: string }[];
  initialQuery: string;
}) {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [term, setTerm] = React.useState(initialQuery);
  const [status, setStatus] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = React.useState<BulkAction>("publish");
  const [bulkCategory, setBulkCategory] = React.useState("");
  const [confirmBulk, setConfirmBulk] = React.useState(false);
  const [working, setWorking] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (term.trim()) params.set("q", term.trim());
      if (status) params.set("status", status);
      if (categoryId) params.set("categoryId", categoryId);

      const data = await api.get<ListResponse<Product>>(
        `/api/admin/products?${params.toString()}`,
      );
      setItems(data.items);
      setPageCount(data.pageCount);
      setTotal(data.total);
      setSelected(new Set());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Products could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, term, status, categoryId]);

  // Debounced so typing in the search box does not fire a request per key.
  React.useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) =>
      current.size === items.length ? new Set() : new Set(items.map((item) => item.id)),
    );
  }

  async function runBulk() {
    setWorking(true);
    try {
      const result = await api.post<{ affected: number }>("/api/admin/products/bulk", {
        ids: [...selected],
        action: bulkAction,
        ...(bulkAction === "set_category" ? { categoryId: bulkCategory || null } : {}),
      });
      toast.success(
        `${result.affected} ${result.affected === 1 ? "product" : "products"} updated`,
      );
      setConfirmBulk(false);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The bulk action could not be completed.",
      );
    } finally {
      setWorking(false);
    }
  }

  const stockLabel = (product: Product) => {
    if (!product.inventory) return { text: "—", tone: "muted" as const };
    const { quantity, lowStockAt } = product.inventory;
    if (quantity <= 0) return { text: "0", tone: "danger" as const };
    if (quantity <= lowStockAt) return { text: String(quantity), tone: "rx" as const };
    return { text: String(quantity), tone: "neutral" as const };
  };

  return (
    <>
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-line-strong px-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
              <Search className="size-4 shrink-0 text-muted" aria-hidden />
              <input
                id="product-search"
                value={term}
                onChange={(event) => {
                  setTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or SKU"
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/80"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label htmlFor="product-status" className="sr-only">
              Filter by status
            </label>
            <Select
              id="product-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </Select>
          </div>

          <div>
            <label htmlFor="product-category" className="sr-only">
              Filter by category
            </label>
            <Select
              id="product-category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {canWrite && selected.size > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="tnum text-sm font-medium text-brand-900">
            {selected.size} selected
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label htmlFor="bulk-action" className="sr-only">
              Bulk action
            </label>
            <Select
              id="bulk-action"
              className="h-9 w-auto"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value as BulkAction)}
            >
              <option value="publish">Publish</option>
              <option value="unpublish">Unpublish</option>
              <option value="set_category">Move to category</option>
              <option value="delete">Delete</option>
            </Select>

            {bulkAction === "set_category" ? (
              <>
                <label htmlFor="bulk-category" className="sr-only">
                  Destination category
                </label>
                <Select
                  id="bulk-category"
                  className="h-9 w-auto"
                  value={bulkCategory}
                  onChange={(event) => setBulkCategory(event.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </>
            ) : null}

            <Button
              size="sm"
              variant={bulkAction === "delete" ? "danger" : "primary"}
              onClick={() =>
                bulkAction === "delete" ? setConfirmBulk(true) : void runBulk()
              }
              loading={working && !confirmBulk}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="border-0 bg-white"
            icon={Package}
            title="No products match"
            description={
              term || status || categoryId
                ? "Try clearing the filters, or search for a different name or SKU."
                : "Add your first product to start building the catalog."
            }
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/admin/products/new">Add product</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                {canWrite ? (
                  <Th className="w-12">
                    <input
                      type="checkbox"
                      checked={selected.size === items.length && items.length > 0}
                      onChange={toggleAll}
                      aria-label="Select all products on this page"
                      className="size-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                    />
                  </Th>
                ) : null}
                <Th>Product</Th>
                <Th className="w-32">SKU</Th>
                <Th className="w-40">Category</Th>
                <Th className="w-28">Price</Th>
                <Th className="w-20">Stock</Th>
                <Th className="w-32">Status</Th>
                <Th className="w-24 text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => {
                const stock = stockLabel(product);
                const image = product.images[0]?.key;
                return (
                  <tr key={product.id} className="transition-colors hover:bg-wash">
                    {canWrite ? (
                      <Td>
                        <input
                          type="checkbox"
                          checked={selected.has(product.id)}
                          onChange={() => toggle(product.id)}
                          aria-label={`Select ${product.name}`}
                          className="size-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                        />
                      </Td>
                    ) : null}

                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-wash">
                          {image ? (
                            <Image
                              src={`/api/media/${image}`}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="grid h-full place-items-center text-muted">
                              <ImageOff className="size-4" aria-hidden />
                            </span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium text-ink">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="truncate hover:underline"
                            >
                              {product.name}
                            </Link>
                            {product.prescriptionRequired ? (
                              <ShieldAlert
                                className="size-3.5 shrink-0 text-rx"
                                aria-label="Prescription required"
                              />
                            ) : null}
                          </p>
                          {product.brand ? (
                            <p className="truncate text-xs text-muted">
                              {product.brand.name}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Td>

                    <Td className="tnum text-xs">{product.sku}</Td>
                    <Td className="text-xs">
                      {product.category?.name ?? <span className="text-muted">—</span>}
                    </Td>
                    <Td className="tnum">{formatPrice(product.priceFils)}</Td>
                    <Td>
                      <Badge tone={stock.tone}>{stock.text}</Badge>
                    </Td>
                    <Td>
                      <StatusBadge status={product.status} />
                    </Td>
                    <Td className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={`/admin/products/${product.id}`}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil />
                        </Link>
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="tnum text-sm text-muted">
            Page {page} of {pageCount} · {total} products
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        title={`Delete ${selected.size} ${selected.size === 1 ? "product" : "products"}?`}
        description="They are removed from the website. Past orders that include them stay intact."
        confirmLabel="Delete products"
        loading={working}
        onConfirm={runBulk}
      />
    </>
  );
}
