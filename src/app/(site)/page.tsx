import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
} from "lucide-react";

import { CounterComposer } from "@/components/site/counter-composer";
import { FaqList } from "@/components/site/faq-list";
import { ProductCard } from "@/components/site/product-card";
import { ServiceIcon } from "@/components/site/service-icon";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import {
  getActiveCategories,
  getActiveServices,
  getFeaturedProducts,
  getPublishedFaqs,
  getPublishedTestimonials,
} from "@/lib/queries";
import { getSettings } from "@/lib/site-settings.server";
import { telLink, whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, categories, featured, services, faqs, testimonials] =
    await Promise.all([
      getSettings(),
      getActiveCategories(),
      getFeaturedProducts(8),
      getActiveServices(),
      getPublishedFaqs(),
      getPublishedTestimonials(),
    ]);

  const { general, contact, home, commerce } = settings;

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="shelf-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />

        <div className="container-page relative grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-20">
          <div className="rise-in">
            <span className="eyebrow">
              <MapPin className="size-3.5" aria-hidden />
              {home.heroEyebrow || "Umm Ramool, Dubai"}
            </span>

            <h1 className="mt-5 max-w-xl font-display text-[2.25rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {home.heroHeadline || "The pharmacy counter, one message away"}
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-[1.0625rem]">
              {home.heroSubline}
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Button asChild size="lg">
                <Link href="/products">
                  Browse products
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/prescription">
                  <FileText />
                  Upload prescription
                </Link>
              </Button>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-7 sm:grid-cols-3">
              {[
                { term: "Talk to us", detail: "WhatsApp or call", icon: MessageCircle },
                { term: "Prescriptions", detail: "Encrypted upload", icon: ShieldCheck },
                { term: "Find us", detail: "Nad Al Hamr Road", icon: Store },
              ].map((item) => (
                <div key={item.term}>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                    <item.icon className="size-3.5 text-brand-600" aria-hidden />
                    {item.term}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rise-in [animation-delay:120ms]">
            <CounterComposer whatsapp={contact.whatsapp} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- trust highlights */}
      <section className="border-b border-line bg-wash">
        <div className="container-page grid gap-px overflow-hidden py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: MessageCircle,
              title: "Quick to reach",
              body: "Message the pharmacy directly on WhatsApp during opening hours.",
            },
            {
              icon: ShieldCheck,
              title: "Prescriptions handled properly",
              body: "Uploads are encrypted and reviewed by our pharmacy team before anything is dispensed.",
            },
            {
              icon: Sparkles,
              title: "Everyday essentials",
              body: "Personal care, vitamins, baby care and wellness products alongside the dispensary.",
            },
            {
              icon: Clock3,
              title: "Ask before you travel",
              body: "Check availability first so you are not making the trip for nothing.",
            },
          ].map((item) => (
            <div key={item.title} className="px-1 py-4 sm:px-5 lg:py-2">
              <item.icon className="size-5 text-brand-700" aria-hidden />
              <h2 className="mt-3 text-[0.9375rem] font-semibold text-ink">
                {item.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- categories */}
      {categories.length > 0 ? (
        <section className="container-page py-16 lg:py-20">
          <SectionHeading
            eyebrow="Shop by aisle"
            title="What we stock"
            description="Browse the categories our pharmacy carries. Availability changes, so check a product page or message us before travelling."
            action={
              <Button asChild variant="secondary">
                <Link href="/products">
                  All products
                  <ArrowRight />
                </Link>
              </Button>
            }
          />

          <ul className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
                    <ServiceIcon name={category.icon ?? "Pill"} className="size-5" />
                  </span>
                  <span className="mt-3.5 text-sm font-semibold text-ink">
                    {category.name}
                  </span>
                  <span className="tnum mt-1 text-xs text-muted">
                    {category.productCount}{" "}
                    {category.productCount === 1 ? "product" : "products"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ---------------------------------------------- featured products */}
      <section className="border-y border-line bg-wash">
        <div className="container-page py-16 lg:py-20">
          <SectionHeading
            eyebrow="On the shelf"
            title="Picked by our team"
            description="A selection from the catalog. Every product page shows whether a prescription is required."
            action={
              <Button asChild variant="secondary">
                <Link href="/products">
                  See everything
                  <ArrowRight />
                </Link>
              </Button>
            }
          />

          {featured.length > 0 ? (
            <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showPrice={commerce.showPrices}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-9 bg-white"
              icon={Store}
              title="The catalog is being set up"
              description="Products will appear here once the pharmacy publishes them. In the meantime, message us and we will check availability for you."
              action={
                <Button asChild variant="whatsapp">
                  <a
                    href={whatsappLink(contact.whatsapp, { kind: "general" })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle />
                    Ask on WhatsApp
                  </a>
                </Button>
              }
            />
          )}
        </div>
      </section>

      {/* ------------------------------------------ prescription upload CTA */}
      <section className="container-page py-16 lg:py-20">
        <div className="overflow-hidden rounded-[20px] border border-line bg-brand-900">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-brand-100">
                <ShieldCheck className="size-3.5" aria-hidden />
                Encrypted upload
              </span>
              <h2 className="mt-4 max-w-lg font-display text-2xl font-bold leading-tight text-white sm:text-[2rem]">
                Send your prescription before you come in
              </h2>
              <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-brand-100">
                Upload a photo or PDF and our pharmacy team will review it and
                contact you. Files are stored privately and are never published
                on this website.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Button asChild size="lg" className="bg-white text-brand-900 hover:bg-brand-50">
                  <Link href="/prescription">
                    Upload prescription
                    <ArrowRight />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-white/25 bg-transparent text-white hover:border-white/50 hover:bg-white/10 hover:text-white"
                >
                  <a href={telLink(contact.phone)}>
                    <Phone />
                    Call the pharmacy
                  </a>
                </Button>
              </div>
            </div>

            <ol className="grid gap-3">
              {[
                "Upload a clear photo or PDF of your prescription.",
                "A pharmacist reviews it and checks what we can dispense.",
                "We contact you to confirm collection or delivery.",
              ].map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3.5 rounded-xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <span className="tnum grid size-7 shrink-0 place-items-center rounded-lg bg-brand-600 text-[0.8125rem] font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-brand-100">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- services */}
      {services.length > 0 ? (
        <section className="border-y border-line bg-wash">
          <div className="container-page py-16 lg:py-20">
            <SectionHeading
              eyebrow="How we help"
              title="Pharmacy services"
              description="The support our team offers day to day."
              action={
                <Button asChild variant="secondary">
                  <Link href="/services">
                    All services
                    <ArrowRight />
                  </Link>
                </Button>
              }
            />
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 6).map((service) => (
                <Card key={service.id} className="p-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <ServiceIcon name={service.icon} className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {service.description}
                  </p>
                  <a
                    href={
                      service.ctaHref ||
                      whatsappLink(contact.whatsapp, {
                        kind: "service",
                        serviceName: service.title,
                      })
                    }
                    target={service.ctaHref ? undefined : "_blank"}
                    rel={service.ctaHref ? undefined : "noopener noreferrer"}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
                  >
                    {service.ctaLabel || "Ask about this"}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </a>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ----------------------------------------------------- why medzen */}
      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <SectionHeading
            eyebrow="Why Medzen"
            title="A pharmacy that answers"
            description="We are a neighbourhood pharmacy, not a call centre. The person who replies to your message is the person behind the counter."
            className="lg:sticky lg:top-28 lg:self-start"
          />

          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Professional support",
                body: "Our pharmacy team reviews every prescription request before anything is prepared.",
              },
              {
                title: "Convenient communication",
                body: "WhatsApp, phone or the website — use whichever is easiest for you.",
              },
              {
                title: "Quality products",
                body: "Health, personal care and wellness ranges kept current on the shelf.",
              },
              {
                title: "Customer-centred service",
                body: "Straight answers about what we have, what we can order and how long it takes.",
              },
              {
                title: "Easy prescription requests",
                body: "Send it from your phone in under a minute; no account needed.",
              },
              {
                title: "Local to Umm Ramool",
                body: "On Nad Al Hamr Road, easy to reach from Al Rashidiya and Nad Al Hamar.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <h3 className="text-[0.9375rem] font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------ how it works */}
      <section className="border-y border-line bg-wash">
        <div className="container-page py-16 lg:py-20">
          <SectionHeading
            eyebrow="Step by step"
            title="How an order request works"
            description="From basket to counter. No online payment — you confirm with the pharmacy first."
            align="center"
          />

          {/* Numbered because the order genuinely matters: each step
              depends on the one before it. */}
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              {
                title: "Build your request",
                body: "Add what you need to the basket, or send us a prescription.",
              },
              {
                title: "Send it to us",
                body: "Add your contact details and choose delivery or collection.",
              },
              {
                title: "We confirm",
                body: "The pharmacy checks stock and messages you with the total.",
              },
              {
                title: "Collect or receive",
                body: "Pick it up at the counter or arrange delivery with our team.",
              },
            ].map((step, index) => (
              <li key={step.title} className="relative rounded-2xl border border-line bg-white p-5">
                <span className="tnum text-xs font-bold tracking-[0.1em] text-brand-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-[0.9375rem] font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------- testimonials */}
      {testimonials.length > 0 ? (
        <section className="container-page py-16 lg:py-20">
          <SectionHeading
            eyebrow="In their words"
            title="What customers tell us"
            align="center"
          />
          <div className="mt-9 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.id}
                className="flex flex-col rounded-2xl border border-line bg-white p-5"
              >
                <Quote className="size-5 text-brand-300" aria-hidden />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                  {testimonial.body}
                </blockquote>
                <figcaption className="mt-4 border-t border-line pt-3.5">
                  <p className="text-sm font-semibold text-ink">
                    {testimonial.authorName}
                  </p>
                  {testimonial.authorTitle ? (
                    <p className="text-xs text-muted">{testimonial.authorTitle}</p>
                  ) : null}
                  {testimonial.rating ? (
                    <p className="mt-1.5 flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={
                            index < testimonial.rating!
                              ? "size-3.5 fill-brand-500 text-brand-500"
                              : "size-3.5 text-line-strong"
                          }
                          aria-hidden
                        />
                      ))}
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------------------- faq */}
      {faqs.length > 0 ? (
        <section className="border-y border-line bg-wash">
          <div className="container-page grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
            <SectionHeading
              eyebrow="Questions"
              title="Before you ask"
              description="If your question is not here, message us and we will answer it directly."
              className="lg:sticky lg:top-28 lg:self-start"
            />
            <FaqList faqs={faqs} />
          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------------- location */}
      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Find us"
              title="Umm Ramool, Dubai"
              description="Showroom S1 in the Ramool New Building on Nad Al Hamr Road."
            />
            <address className="mt-6 space-y-1 text-[0.9375rem] not-italic leading-relaxed text-ink-soft">
              <p className="font-semibold text-ink">{general.pharmacyName}</p>
              <p>{general.addressLine1}</p>
              <p>{general.addressLine2}</p>
              <p>{general.city}</p>
              <p>{general.country}</p>
            </address>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild>
                <a href={telLink(contact.phone)}>
                  <Phone />
                  {contact.phone}
                </a>
              </Button>
              {contact.mapsLink ? (
                <Button asChild variant="secondary">
                  <a
                    href={contact.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin />
                    Get directions
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {contact.mapsEmbedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-line">
              <iframe
                src={contact.mapsEmbedUrl}
                title={`Map showing ${general.pharmacyName} in ${general.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full border-0 lg:h-[420px]"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* ----------------------------------------------------- contact CTA */}
      <section className="container-page pb-20">
        <Card className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center lg:p-10">
          <div>
            <Badge tone="brand">We reply during opening hours</Badge>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink">
              Not sure if we have it? Just ask.
            </h2>
            <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
              Send us the product name and we will tell you whether it is on the
              shelf, on order, or something we can source for you.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Button asChild variant="whatsapp" size="lg">
              <a
                href={whatsappLink(contact.whatsapp, { kind: "general" })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                WhatsApp us
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">Contact page</Link>
            </Button>
          </div>
        </Card>
      </section>
    </>
  );
}
