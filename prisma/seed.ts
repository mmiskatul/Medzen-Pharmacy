/**
 * Development seed.
 *
 * Everything created here is flagged `isDemo: true` so it can be removed
 * before the site goes live:
 *
 *     npx tsx prisma/seed.ts --clean
 *
 * Two deliberate omissions:
 *  - No testimonials. Reviews must come from real customers, so the
 *    testimonial table is left empty and the homepage section stays hidden.
 *  - No demo prescription files. Prescription requests are seeded with
 *    metadata only; nothing pretends to be a real person's document.
 */

import { randomBytes } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO = { isDemo: true };

function fils(aed: number) {
  return Math.round(aed * 100);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function monthsAhead(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

function reference(prefix: "MZ" | "RX", index: number) {
  return `${prefix}-DEMO-${String(index).padStart(4, "0")}`;
}

// ---------------------------------------------------------------- content

const CATEGORIES = [
  { name: "Medicines", slug: "medicines", icon: "Pill", sortOrder: 1, description: "Everyday over-the-counter medicines and pharmacy-only lines." },
  { name: "Vitamins & Supplements", slug: "vitamins-supplements", icon: "Sparkles", sortOrder: 2, description: "Daily vitamins, minerals and food supplements." },
  { name: "Personal Care", slug: "personal-care", icon: "Droplets", sortOrder: 3, description: "Daily hygiene and personal care essentials." },
  { name: "Skin Care", slug: "skin-care", icon: "Sparkles", sortOrder: 4, description: "Cleansers, moisturisers and sun protection." },
  { name: "Baby Care", slug: "baby-care", icon: "Baby", sortOrder: 5, description: "Formula, nappies and gentle care for little ones." },
  { name: "Health Devices", slug: "health-devices", icon: "Thermometer", sortOrder: 6, description: "Thermometers, monitors and home health equipment." },
  { name: "Oral Care", slug: "oral-care", icon: "HeartPulse", sortOrder: 7, description: "Toothpaste, brushes, mouthwash and interdental care." },
  { name: "First Aid", slug: "first-aid", icon: "ShieldCheck", sortOrder: 8, description: "Dressings, antiseptics and everyday first aid supplies." },
];

const BRANDS = [
  "Panadol", "Centrum", "Nivea", "Cetaphil", "Aptamil",
  "Omron", "Sensodyne", "Hansaplast", "Vichy", "Bepanthen",
];

const SERVICES = [
  { title: "Prescription support", slug: "prescription-support", icon: "ClipboardList", description: "Send your prescription through the website and our pharmacist will review it and contact you about what we can dispense.", ctaLabel: "Upload a prescription", ctaHref: "/prescription", sortOrder: 1 },
  { title: "Pharmacy consultation", slug: "pharmacy-consultation", icon: "Stethoscope", description: "Ask our pharmacy team about a product, a dosage question or which everyday remedy suits you.", ctaLabel: "Ask a question", ctaHref: "", sortOrder: 2 },
  { title: "Medication availability requests", slug: "availability-requests", icon: "Pill", description: "Not sure whether we stock something? Send us the name and we will check the shelf and our suppliers.", ctaLabel: "Check availability", ctaHref: "", sortOrder: 3 },
  { title: "Vitamins & supplements", slug: "vitamins-and-supplements", icon: "Sparkles", description: "Daily vitamins, minerals and supplements, with help choosing what fits your routine.", ctaLabel: "Browse the range", ctaHref: "/products?category=vitamins-supplements", sortOrder: 4 },
  { title: "Baby & mother care", slug: "baby-and-mother-care", icon: "Baby", description: "Formula, nappies, skincare and feeding essentials for babies and new mothers.", ctaLabel: "Browse baby care", ctaHref: "/products?category=baby-care", sortOrder: 5 },
  { title: "Home delivery requests", slug: "home-delivery-requests", icon: "Truck", description: "Ask us about delivery to your address in Umm Ramool and the surrounding areas. We confirm timing and any fee with you first.", ctaLabel: "Ask about delivery", ctaHref: "", sortOrder: 6 },
];

const FAQS = [
  { question: "Do I need to send my prescription before I visit?", answer: "No, but it helps. If you upload it first, our pharmacist can check what we have in stock and have it ready, so you are not waiting at the counter.", category: "Prescriptions", sortOrder: 1 },
  { question: "Is my prescription kept private?", answer: "Yes. Uploaded files are stored in private storage with no public link, and only authorised pharmacy staff can open them. Every view is recorded in our internal log.", category: "Prescriptions", sortOrder: 2 },
  { question: "Can I pay on the website?", answer: "Not at the moment. You send us a request, we confirm what is available and the total, and payment happens at the counter or on delivery.", category: "Orders", sortOrder: 3 },
  { question: "Do you deliver?", answer: "Ask us about your area. Where delivery is available we confirm the timing and any fee with you before we dispatch.", category: "Delivery", sortOrder: 4 },
  { question: "The product I need is not listed. Can you get it?", answer: "Often, yes. Send us the product name on WhatsApp and we will check with our suppliers and tell you how long it would take.", category: "Products", sortOrder: 5 },
  { question: "Can you tell me which medicine to take?", answer: "We can explain what a product is and how it is normally used, and our pharmacist can advise on over-the-counter options. We do not diagnose conditions — for that, please see a doctor.", category: "Advice", sortOrder: 6 },
];

type SeedProduct = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string;
  price: number | null;
  summary: string;
  rx?: boolean;
  featured?: boolean;
  stock: number;
};

const PRODUCTS: SeedProduct[] = [
  { name: "Panadol Extra 500mg Tablets", slug: "panadol-extra-500mg-tablets", sku: "MED-1001", category: "medicines", brand: "Panadol", price: 18.5, summary: "Paracetamol with caffeine for headaches and everyday pain.", featured: true, stock: 64 },
  { name: "Panadol Advance 500mg Tablets", slug: "panadol-advance-500mg", sku: "MED-1002", category: "medicines", brand: "Panadol", price: 16, summary: "Fast-dissolving paracetamol tablets, 24 pack.", stock: 40 },
  { name: "Panadol Cold & Flu Day", slug: "panadol-cold-flu-day", sku: "MED-1003", category: "medicines", brand: "Panadol", price: 24, summary: "Daytime relief for cold and flu symptoms.", stock: 12 },
  { name: "Oral Rehydration Sachets", slug: "oral-rehydration-sachets", sku: "MED-1004", category: "medicines", brand: "Panadol", price: 21, summary: "Electrolyte sachets to replace fluids and salts.", stock: 3 },
  { name: "Antihistamine Tablets 10mg", slug: "antihistamine-tablets-10mg", sku: "MED-1005", category: "medicines", brand: "Panadol", price: null, summary: "Non-drowsy allergy relief. Pharmacist advice recommended.", rx: true, stock: 0 },

  { name: "Centrum Adults Multivitamin", slug: "centrum-adults-multivitamin", sku: "VIT-2001", category: "vitamins-supplements", brand: "Centrum", price: 89, summary: "Daily multivitamin and mineral tablets, 100 pack.", featured: true, stock: 30 },
  { name: "Centrum Women Multivitamin", slug: "centrum-women-multivitamin", sku: "VIT-2002", category: "vitamins-supplements", brand: "Centrum", price: 92, summary: "Daily formula with iron, calcium and vitamin D.", stock: 22 },
  { name: "Vitamin D3 1000 IU Softgels", slug: "vitamin-d3-1000iu-softgels", sku: "VIT-2003", category: "vitamins-supplements", brand: "Centrum", price: 55, summary: "Supports bones, teeth and normal immune function.", featured: true, stock: 48 },
  { name: "Omega-3 Fish Oil 1000mg", slug: "omega-3-fish-oil-1000mg", sku: "VIT-2004", category: "vitamins-supplements", brand: "Centrum", price: 76, summary: "High-strength omega-3 softgels, 60 pack.", stock: 18 },
  { name: "Vitamin C 1000mg Effervescent", slug: "vitamin-c-1000mg-effervescent", sku: "VIT-2005", category: "vitamins-supplements", brand: "Centrum", price: 34, summary: "Orange-flavoured effervescent tablets, 20 pack.", stock: 5 },

  { name: "Nivea Soft Moisturising Cream", slug: "nivea-soft-moisturising-cream", sku: "PC-3001", category: "personal-care", brand: "Nivea", price: 27.5, summary: "Light cream with jojoba oil for face, hands and body.", stock: 55 },
  { name: "Nivea Roll-On Deodorant", slug: "nivea-roll-on-deodorant", sku: "PC-3002", category: "personal-care", brand: "Nivea", price: 19, summary: "48-hour protection, alcohol free.", stock: 70 },
  { name: "Hand Sanitiser Gel 500ml", slug: "hand-sanitiser-gel-500ml", sku: "PC-3003", category: "personal-care", brand: "Nivea", price: 22, summary: "70% alcohol gel with a pump dispenser.", stock: 26 },

  { name: "Cetaphil Gentle Skin Cleanser", slug: "cetaphil-gentle-skin-cleanser", sku: "SK-4001", category: "skin-care", brand: "Cetaphil", price: 68, summary: "Soap-free cleanser for sensitive skin, 250ml.", featured: true, stock: 33 },
  { name: "Cetaphil Moisturising Lotion", slug: "cetaphil-moisturising-lotion", sku: "SK-4002", category: "skin-care", brand: "Cetaphil", price: 79, summary: "Lightweight daily lotion for dry, sensitive skin.", stock: 21 },
  { name: "Vichy Capital Soleil SPF 50+", slug: "vichy-capital-soleil-spf50", sku: "SK-4003", category: "skin-care", brand: "Vichy", price: 115, summary: "Very high sun protection for face, 50ml.", featured: true, stock: 14 },
  { name: "Bepanthen Soothing Cream 30g", slug: "bepanthen-soothing-cream-30g", sku: "SK-4004", category: "skin-care", brand: "Bepanthen", price: 33, summary: "For dry, irritated skin and minor everyday grazes.", stock: 41 },

  { name: "Aptamil Stage 1 Infant Formula", slug: "aptamil-stage-1-infant-formula", sku: "BB-5001", category: "baby-care", brand: "Aptamil", price: 89, summary: "From birth, 400g tin. Follow the pack instructions.", featured: true, stock: 25 },
  { name: "Aptamil Stage 2 Follow-On Formula", slug: "aptamil-stage-2-follow-on", sku: "BB-5002", category: "baby-care", brand: "Aptamil", price: 92, summary: "From 6 months, 400g tin.", stock: 17 },
  { name: "Baby Wipes Sensitive 72 Pack", slug: "baby-wipes-sensitive-72", sku: "BB-5003", category: "baby-care", brand: "Nivea", price: 14, summary: "Fragrance-free wipes for delicate skin.", stock: 88 },
  { name: "Baby Nappies Size 3 (Medium)", slug: "baby-nappies-size-3", sku: "BB-5004", category: "baby-care", brand: "Aptamil", price: 62, summary: "Jumbo pack for 6–10kg.", stock: 4 },

  { name: "Omron Digital Blood Pressure Monitor", slug: "omron-digital-bp-monitor", sku: "DEV-6001", category: "health-devices", brand: "Omron", price: 285, summary: "Upper-arm monitor with memory for two users.", featured: true, stock: 8 },
  { name: "Digital Thermometer", slug: "digital-thermometer", sku: "DEV-6002", category: "health-devices", brand: "Omron", price: 39, summary: "Fast oral, underarm and rectal readings.", stock: 31 },
  { name: "Fingertip Pulse Oximeter", slug: "fingertip-pulse-oximeter", sku: "DEV-6003", category: "health-devices", brand: "Omron", price: 129, summary: "Reads blood oxygen saturation and pulse rate.", stock: 11 },
  { name: "Blood Glucose Test Strips (50)", slug: "blood-glucose-test-strips-50", sku: "DEV-6004", category: "health-devices", brand: "Omron", price: null, summary: "Compatible strips. Ask us which meter you have.", rx: true, stock: 9 },

  { name: "Sensodyne Repair & Protect", slug: "sensodyne-repair-and-protect", sku: "OR-7001", category: "oral-care", brand: "Sensodyne", price: 31, summary: "Daily toothpaste for sensitive teeth, 75ml.", stock: 60 },
  { name: "Sensodyne Soft Toothbrush", slug: "sensodyne-soft-toothbrush", sku: "OR-7002", category: "oral-care", brand: "Sensodyne", price: 17, summary: "Soft bristles for sensitive teeth and gums.", stock: 44 },
  { name: "Antibacterial Mouthwash 500ml", slug: "antibacterial-mouthwash-500ml", sku: "OR-7003", category: "oral-care", brand: "Sensodyne", price: 28, summary: "Alcohol-free daily mouthwash.", stock: 2 },

  { name: "Hansaplast Plasters Assorted (40)", slug: "hansaplast-plasters-assorted-40", sku: "FA-8001", category: "first-aid", brand: "Hansaplast", price: 21, summary: "Water-resistant plasters in assorted sizes.", stock: 73 },
  { name: "Sterile Gauze Swabs (25)", slug: "sterile-gauze-swabs-25", sku: "FA-8002", category: "first-aid", brand: "Hansaplast", price: 18, summary: "Individually wrapped sterile swabs.", stock: 29 },
  { name: "Antiseptic Solution 250ml", slug: "antiseptic-solution-250ml", sku: "FA-8003", category: "first-aid", brand: "Hansaplast", price: 24, summary: "For cleaning minor cuts and grazes.", stock: 16 },
];

// ---------------------------------------------------------------- helpers

async function clean() {
  console.log("Removing demo data…");
  // Order matters: children before parents.
  await prisma.orderItem.deleteMany({ where: { order: { isDemo: true } } });
  await prisma.orderEvent.deleteMany({ where: { order: { isDemo: true } } });
  await prisma.order.deleteMany({ where: DEMO });
  await prisma.prescriptionNote.deleteMany({ where: { request: { isDemo: true } } });
  await prisma.prescriptionFile.deleteMany({ where: { request: { isDemo: true } } });
  await prisma.prescriptionRequest.deleteMany({ where: DEMO });
  await prisma.inventoryTransaction.deleteMany({
    where: { inventory: { product: { isDemo: true } } },
  });
  await prisma.inventory.deleteMany({ where: { product: { isDemo: true } } });
  await prisma.productImage.deleteMany({ where: { product: { isDemo: true } } });
  await prisma.product.deleteMany({ where: DEMO });
  await prisma.category.deleteMany({ where: DEMO });
  await prisma.brand.deleteMany({ where: DEMO });
  await prisma.service.deleteMany({ where: DEMO });
  await prisma.faq.deleteMany({ where: DEMO });
  await prisma.banner.deleteMany({ where: DEMO });
  await prisma.contactMessage.deleteMany({ where: DEMO });
  await prisma.customer.deleteMany({ where: DEMO });
  await prisma.user.deleteMany({ where: DEMO });
  console.log("Demo data removed. Real records were left untouched.");
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@medzen.local").toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists — leaving the password alone.`);
    return;
  }

  // A password is only generated when none is configured, and it is printed
  // once. Nothing is ever committed to the repository.
  const generated = !process.env.SEED_ADMIN_PASSWORD;
  const password =
    process.env.SEED_ADMIN_PASSWORD || randomBytes(12).toString("base64url");

  await prisma.user.create({
    data: {
      email,
      name: "Medzen Super Admin",
      role: "SUPER_ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
      isDemo: true,
    },
  });

  console.log("\n────────────────────────────────────────────");
  console.log(" Development admin account created");
  console.log(` Email:    ${email}`);
  console.log(` Password: ${password}`);
  if (generated) {
    console.log(" This password is shown once. Store it now.");
  }
  console.log("────────────────────────────────────────────\n");
}

async function main() {
  if (process.argv.includes("--clean")) {
    await clean();
    return;
  }

  console.log("Seeding demo data…");

  await seedAdmin();

  // Settings: created only if absent, so a configured site is never reset.
  const existingSettings = await prisma.siteSetting.findUnique({
    where: { id: "default" },
  });
  if (!existingSettings) {
    const { DEFAULT_SETTINGS } = await import("../src/lib/settings");
    await prisma.siteSetting.create({
      data: { id: "default", data: DEFAULT_SETTINGS as unknown as Prisma.InputJsonValue },
    });
    console.log("Created the default settings document.");
  }

  const categories = new Map<string, string>();
  for (const category of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, ...DEMO },
      update: {},
    });
    categories.set(category.slug, row.id);
  }

  const brands = new Map<string, string>();
  for (const name of BRANDS) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const row = await prisma.brand.upsert({
      where: { slug },
      create: { name, slug, ...DEMO },
      update: {},
    });
    brands.set(name, row.id);
  }

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      create: { ...service, isActive: true, ...DEMO },
      update: {},
    });
  }

  for (const faq of FAQS) {
    const exists = await prisma.faq.findFirst({ where: { question: faq.question } });
    if (!exists) {
      await prisma.faq.create({ data: { ...faq, isPublished: true, ...DEMO } });
    }
  }

  const productIds: { id: string; name: string; sku: string; price: number | null; rx: boolean }[] = [];

  for (const product of PRODUCTS) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        summary: product.summary,
        description: `${product.summary}\n\nDemo catalog entry for development. Replace this description with the manufacturer's own product information before going live.`,
        keyInfo: "Store below 30°C. Keep out of reach of children. Read the label before use.",
        priceFils: product.price === null ? null : fils(product.price),
        categoryId: categories.get(product.category) ?? null,
        brandId: brands.get(product.brand) ?? null,
        prescriptionRequired: product.rx ?? false,
        isFeatured: product.featured ?? false,
        status: "PUBLISHED",
        viewCount: Math.floor(Math.random() * 400),
        ...DEMO,
        inventory: {
          create: {
            quantity: product.stock,
            lowStockAt: 5,
            batchNumber: `B${randomBytes(3).toString("hex").toUpperCase()}`,
            // A couple of near-term dates so the expiring filter has something
            // to show in development.
            expiryDate: monthsAhead(product.stock < 10 ? 2 : 18),
          },
        },
      },
      select: { id: true, name: true, sku: true, priceFils: true, prescriptionRequired: true },
    });

    productIds.push({
      id: created.id,
      name: created.name,
      sku: created.sku,
      price: created.priceFils,
      rx: created.prescriptionRequired,
    });
  }

  // ---------------------------------------------------------------- people

  const customerSeeds = [
    { name: "Demo Customer One", phone: "+971500000101" },
    { name: "Demo Customer Two", phone: "+971500000102" },
    { name: "Demo Customer Three", phone: "+971500000103" },
    { name: "Demo Customer Four", phone: "+971500000104" },
  ];

  const customers = [];
  for (const seed of customerSeeds) {
    customers.push(
      await prisma.customer.upsert({
        where: { phone: seed.phone },
        create: { ...seed, email: null, ...DEMO },
        update: {},
      }),
    );
  }

  // ---------------------------------------------------------------- orders

  const statuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "COMPLETED", "CANCELLED"] as const;

  for (let index = 1; index <= 14; index += 1) {
    const ref = reference("MZ", index);
    if (await prisma.order.findUnique({ where: { reference: ref } })) continue;

    const customer = customers[index % customers.length]!;
    const lineCount = 1 + (index % 3);
    const picked = productIds
      .filter((product) => product.price !== null)
      .slice((index * 3) % 20, ((index * 3) % 20) + lineCount);

    if (picked.length === 0) continue;

    const items = picked.map((product, position) => {
      const quantity = 1 + ((index + position) % 3);
      const unitFils = product.price ?? 0;
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitFils,
        quantity,
        lineFils: unitFils * quantity,
        prescriptionRequired: product.rx,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineFils, 0);
    const status = statuses[index % statuses.length]!;
    const createdAt = daysAgo(index * 2);

    await prisma.order.create({
      data: {
        reference: ref,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        fulfilment: index % 2 === 0 ? "DELIVERY" : "COLLECTION",
        deliveryAddress:
          index % 2 === 0 ? "Demo address, Umm Ramool, Dubai" : null,
        subtotalFils: subtotal,
        deliveryFils: 0,
        totalFils: subtotal,
        status,
        paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
        createdAt,
        ...DEMO,
        items: { create: items },
        events: {
          create: {
            status: "PENDING",
            message: "Request received from the website.",
            createdAt,
          },
        },
      },
    });
  }

  // ------------------------------------------------------- prescriptions

  const rxStatuses = ["PENDING", "UNDER_REVIEW", "APPROVED", "COMPLETED", "CLARIFICATION_REQUESTED"] as const;

  for (let index = 1; index <= 6; index += 1) {
    const ref = reference("RX", index);
    if (await prisma.prescriptionRequest.findUnique({ where: { reference: ref } })) continue;

    const customer = customers[index % customers.length]!;
    await prisma.prescriptionRequest.create({
      data: {
        reference: ref,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        notes: "Demo request. No file is attached to seeded records.",
        status: rxStatuses[index % rxStatuses.length]!,
        createdAt: daysAgo(index * 3),
        ...DEMO,
      },
    });
  }

  // ---------------------------------------------------------- messages

  const messageSeeds = [
    { subject: "Delivery to Al Rashidiya", message: "Do you deliver to Al Rashidiya, and what time do deliveries usually arrive?" },
    { subject: "Product availability", message: "Do you stock infant formula stage 2? Demo enquiry for development." },
    { subject: "Opening hours on Friday", message: "What time do you open on Friday? Demo enquiry for development." },
  ];

  for (const [index, seed] of messageSeeds.entries()) {
    const exists = await prisma.contactMessage.findFirst({
      where: { subject: seed.subject, isDemo: true },
    });
    if (exists) continue;
    const customer = customers[index]!;
    await prisma.contactMessage.create({
      data: {
        name: customer.name,
        phone: customer.phone,
        subject: seed.subject,
        message: seed.message,
        status: index === 0 ? "NEW" : index === 1 ? "IN_PROGRESS" : "RESOLVED",
        createdAt: daysAgo(index + 1),
        ...DEMO,
      },
    });
  }

  const counts = await Promise.all([
    prisma.product.count({ where: DEMO }),
    prisma.order.count({ where: DEMO }),
    prisma.prescriptionRequest.count({ where: DEMO }),
    prisma.customer.count({ where: DEMO }),
  ]);

  console.log(
    `\nSeeded ${counts[0]} products, ${counts[1]} orders, ${counts[2]} prescription requests, ${counts[3]} customers.`,
  );
  console.log("No testimonials were seeded — only genuine customer reviews belong there.");
  console.log("Remove everything with: npx tsx prisma/seed.ts --clean\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
