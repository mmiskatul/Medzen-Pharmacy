import "server-only";

import type { ZodSchema } from "zod";

import { fail, ok, parseJson, toResponse } from "./api";
import { audit } from "./audit";
import { requireUser } from "./auth";
import { prisma } from "./prisma";
import { clientIp } from "./rate-limit";
import type { Permission } from "./rbac";

/**
 * Factory for the admin resource endpoints.
 *
 * Fifteen resources share the same shape — list with search and paging,
 * create, read, update, delete — so they share one implementation. Each
 * route file supplies a config: which model, which permissions, which
 * schema, what is searchable. Authorisation and audit logging are applied
 * by the factory, so no resource can be added without them.
 */

// Prisma's generated delegates have no common supertype, so the model is
// reached dynamically. The surface used here is narrow and stable.
type Delegate = {
  findMany: (args: unknown) => Promise<unknown[]>;
  findFirst: (args: unknown) => Promise<unknown>;
  count: (args: unknown) => Promise<number>;
  create: (args: unknown) => Promise<{ id: string }>;
  update: (args: unknown) => Promise<{ id: string }>;
  delete: (args: unknown) => Promise<{ id: string }>;
};

export type CrudConfig<TCreate, TUpdate> = {
  model: string;
  entity: string;
  readPermission: Permission;
  writePermission: Permission;
  createSchema: ZodSchema<TCreate>;
  updateSchema: ZodSchema<TUpdate>;
  searchFields?: string[];
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  include?: Record<string, unknown>;
  listSelect?: Record<string, unknown>;
  /** Set when the model has a deletedAt column; delete becomes a soft delete. */
  softDelete?: boolean;
  defaultPerPage?: number;
  /** Maps validated input to Prisma data (slug generation, relation connects). */
  toData?: (input: TCreate | TUpdate) => Record<string, unknown>;
};

function delegate(model: string): Delegate {
  const client = prisma as unknown as Record<string, Delegate>;
  const found = client[model];
  if (!found) throw new Error(`Unknown Prisma model "${model}".`);
  return found;
}

function buildSearch(term: string, fields: string[]) {
  return {
    OR: fields.map((field) => ({
      [field]: { contains: term, mode: "insensitive" },
    })),
  };
}

export function createCrudHandlers<TCreate, TUpdate>(
  config: CrudConfig<TCreate, TUpdate>,
) {
  const table = delegate(config.model);
  const perPageDefault = config.defaultPerPage ?? 20;

  async function list(request: Request) {
    try {
      await requireUser(config.readPermission);
      const url = new URL(request.url);
      const term = url.searchParams.get("q")?.trim();
      const page = Math.max(
        1,
        Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1,
      );
      const perPage = Math.min(
        100,
        Math.max(
          1,
          Number.parseInt(
            url.searchParams.get("perPage") ?? String(perPageDefault),
            10,
          ) || perPageDefault,
        ),
      );

      const where: Record<string, unknown> = {};
      if (config.softDelete) where.deletedAt = null;
      if (term && config.searchFields?.length) {
        Object.assign(where, buildSearch(term, config.searchFields));
      }

      const [items, total] = await Promise.all([
        table.findMany({
          where,
          ...(config.listSelect
            ? { select: config.listSelect }
            : config.include
              ? { include: config.include }
              : {}),
          orderBy: config.orderBy ?? { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        table.count({ where }),
      ]);

      return ok({
        items,
        total,
        page,
        perPage,
        pageCount: Math.max(1, Math.ceil(total / perPage)),
      });
    } catch (error) {
      return toResponse(error);
    }
  }

  async function create(request: Request) {
    try {
      const user = await requireUser(config.writePermission);
      const parsed = await parseJson(request, config.createSchema);
      if (parsed.response) return parsed.response;

      const data = config.toData
        ? config.toData(parsed.data)
        : (parsed.data as Record<string, unknown>);

      const created = await table.create({ data });

      await audit({
        user,
        action: `${config.entity.toLowerCase()}.created`,
        entity: config.entity,
        entityId: created.id,
        meta: data,
        ip: clientIp(request.headers),
      });

      return ok(created, { status: 201 });
    } catch (error) {
      return toResponse(error);
    }
  }

  async function read(_request: Request, id: string) {
    try {
      await requireUser(config.readPermission);
      const where: Record<string, unknown> = { id };
      if (config.softDelete) where.deletedAt = null;

      const item = await table.findFirst({
        where,
        ...(config.include ? { include: config.include } : {}),
      });
      if (!item) return fail("That record no longer exists.", 404);
      return ok(item);
    } catch (error) {
      return toResponse(error);
    }
  }

  async function update(request: Request, id: string) {
    try {
      const user = await requireUser(config.writePermission);
      const parsed = await parseJson(request, config.updateSchema);
      if (parsed.response) return parsed.response;

      const data = config.toData
        ? config.toData(parsed.data)
        : (parsed.data as Record<string, unknown>);

      const updated = await table.update({ where: { id }, data });

      await audit({
        user,
        action: `${config.entity.toLowerCase()}.updated`,
        entity: config.entity,
        entityId: id,
        meta: data,
        ip: clientIp(request.headers),
      });

      return ok(updated);
    } catch (error) {
      return toResponse(error);
    }
  }

  async function remove(request: Request, id: string) {
    try {
      const user = await requireUser(config.writePermission);

      // Soft delete keeps historical orders and audit trails intact.
      if (config.softDelete) {
        await table.update({ where: { id }, data: { deletedAt: new Date() } });
      } else {
        await table.delete({ where: { id } });
      }

      await audit({
        user,
        action: `${config.entity.toLowerCase()}.deleted`,
        entity: config.entity,
        entityId: id,
        meta: { soft: Boolean(config.softDelete) },
        ip: clientIp(request.headers),
      });

      return ok({ id });
    } catch (error) {
      return toResponse(error);
    }
  }

  return { list, create, read, update, remove };
}

/** Adapts the id-taking handlers to Next's dynamic-segment signature. */
export function withId(
  handler: (request: Request, id: string) => Promise<Response>,
) {
  return async (
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    return handler(request, id);
  };
}
