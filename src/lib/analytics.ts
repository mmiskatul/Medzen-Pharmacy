import "server-only";

import { prisma } from "./prisma";

/**
 * Dashboard metrics.
 *
 * Everything here is aggregate. There is no visitor-level table to query
 * — page views are stored as a path plus a day bucket, so no individual's
 * browsing can be reconstructed, and no health information is inferred
 * from what someone looked at.
 */

export type DashboardStats = {
  orders: { total: number; pending: number; last30: number };
  prescriptions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  products: { total: number; published: number; lowStock: number; outOfStock: number; expiringSoon: number };
  messages: { total: number; unread: number };
  customers: { total: number; last30: number };
  revenue: { completedFils: number; last30Fils: number };
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const expiringBy = new Date();
  expiringBy.setDate(expiringBy.getDate() + 90);

  const [
    ordersTotal,
    ordersPending,
    ordersLast30,
    rxTotal,
    rxPending,
    rxApproved,
    rxRejected,
    productsTotal,
    productsPublished,
    outOfStock,
    expiringSoon,
    lowStockRows,
    messagesTotal,
    messagesUnread,
    customersTotal,
    customersLast30,
    revenueAll,
    revenue30,
  ] = await Promise.all([
    prisma.order.count({ where: { deletedAt: null } }),
    prisma.order.count({ where: { deletedAt: null, status: "PENDING" } }),
    prisma.order.count({ where: { deletedAt: null, createdAt: { gte: since30 } } }),
    prisma.prescriptionRequest.count(),
    prisma.prescriptionRequest.count({
      where: { status: { in: ["PENDING", "UNDER_REVIEW", "CLARIFICATION_REQUESTED"] } },
    }),
    prisma.prescriptionRequest.count({ where: { status: "APPROVED" } }),
    prisma.prescriptionRequest.count({ where: { status: "REJECTED" } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    prisma.inventory.count({
      where: { quantity: { lte: 0 }, product: { deletedAt: null } },
    }),
    prisma.inventory.count({
      where: { expiryDate: { not: null, lte: expiringBy }, product: { deletedAt: null } },
    }),
    // Low stock compares quantity against each row's own threshold, so it
    // is resolved in application code rather than a SQL filter.
    prisma.inventory.findMany({
      where: { quantity: { gt: 0 }, product: { deletedAt: null } },
      select: { quantity: true, lowStockAt: true },
    }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null, createdAt: { gte: since30 } } }),
    prisma.order.aggregate({
      where: { deletedAt: null, status: "COMPLETED" },
      _sum: { totalFils: true },
    }),
    prisma.order.aggregate({
      where: { deletedAt: null, status: "COMPLETED", createdAt: { gte: since30 } },
      _sum: { totalFils: true },
    }),
  ]);

  return {
    orders: { total: ordersTotal, pending: ordersPending, last30: ordersLast30 },
    prescriptions: {
      total: rxTotal,
      pending: rxPending,
      approved: rxApproved,
      rejected: rxRejected,
    },
    products: {
      total: productsTotal,
      published: productsPublished,
      lowStock: lowStockRows.filter((row) => row.quantity <= row.lowStockAt).length,
      outOfStock,
      expiringSoon,
    },
    messages: { total: messagesTotal, unread: messagesUnread },
    customers: { total: customersTotal, last30: customersLast30 },
    revenue: {
      completedFils: revenueAll._sum.totalFils ?? 0,
      last30Fils: revenue30._sum.totalFils ?? 0,
    },
  };
}

export type TimeSeriesPoint = { date: string; orders: number; revenueFils: number };

export async function getDashboardAnalytics(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [orders, topProducts, topSearches, pageViews] = await Promise.all([
    prisma.order.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true, totalFils: true, status: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { deletedAt: null, createdAt: { gte: since } } },
      _sum: { quantity: true, lineFils: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.searchQuery.groupBy({
      by: ["term"],
      where: { createdAt: { gte: since } },
      _count: { term: true },
      orderBy: { _count: { term: "desc" } },
      take: 8,
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { day: { gte: since } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 8,
    }),
  ]);

  // Bucket by local day, filling gaps so the chart has no missing columns.
  const buckets = new Map<string, TimeSeriesPoint>();
  for (let index = 0; index < days; index += 1) {
    const day = new Date(since);
    day.setDate(day.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, { date: key, orders: 0, revenueFils: 0 });
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    if (order.status === "COMPLETED") bucket.revenueFils += order.totalFils;
  }

  return {
    series: [...buckets.values()],
    topProducts: topProducts.map((row) => ({
      name: row.productName,
      quantity: row._sum.quantity ?? 0,
      revenueFils: row._sum.lineFils ?? 0,
    })),
    topSearches: topSearches.map((row) => ({
      term: row.term,
      count: row._count.term,
    })),
    topPages: pageViews.map((row) => ({
      path: row.path,
      views: row._sum.count ?? 0,
    })),
  };
}
