"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api, ApiError } from "@/components/admin/api-client";
import { ImagePicker } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/field";
import { Card, CardHeader } from "@/components/ui/primitives";
import { DAY_LABELS, type SiteSettings } from "@/lib/settings";
import { filsFromInput, filsToInput } from "@/lib/utils";

const TABS = [
  { id: "general", label: "General" },
  { id: "contact", label: "Contact" },
  { id: "hours", label: "Opening hours" },
  { id: "home", label: "Homepage" },
  { id: "commerce", label: "Orders" },
  { id: "social", label: "Social" },
  { id: "seo", label: "SEO" },
  { id: "notifications", label: "Notifications" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabId>("general");
  const [values, setValues] = React.useState<SiteSettings>(initial);
  const [saving, setSaving] = React.useState(false);

  // Prices are edited in AED and stored in fils.
  const [deliveryFee, setDeliveryFee] = React.useState(
    filsToInput(initial.commerce.deliveryFeeFils),
  );
  const [freeOver, setFreeOver] = React.useState(
    filsToInput(initial.commerce.freeDeliveryOverFils),
  );
  const [recipients, setRecipients] = React.useState(
    initial.notifications.emailRecipients.join(", "),
  );

  function patch<K extends keyof SiteSettings>(
    section: K,
    changes: Partial<SiteSettings[K]>,
  ) {
    setValues((current) => ({
      ...current,
      [section]: { ...current[section], ...changes },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload: SiteSettings = {
        ...values,
        commerce: {
          ...values.commerce,
          deliveryFeeFils: filsFromInput(deliveryFee) ?? 0,
          freeDeliveryOverFils: filsFromInput(freeOver) ?? 0,
        },
        notifications: {
          ...values.notifications,
          emailRecipients: recipients
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean),
        },
      };

      await api.patch("/api/admin/settings", payload);
      toast.success("Settings saved. The website updates within a few minutes.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "The settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1 no-scrollbar"
        role="tablist"
        aria-label="Settings sections"
      >
        {TABS.map((item) => (
          <Button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            size="sm"
            variant={tab === item.id ? "subtle" : "ghost"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="space-y-5">
        {tab === "general" ? (
          <Card>
            <CardHeader
              title="Pharmacy details"
              description="Used across the website, the footer and structured data for search engines."
            />
            <div className="space-y-5 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Pharmacy name" htmlFor="s-name">
                  <Input
                    id="s-name"
                    value={values.general.pharmacyName}
                    onChange={(event) =>
                      patch("general", { pharmacyName: event.target.value })
                    }
                  />
                </Field>
                <Field label="Tagline" htmlFor="s-tagline" optional>
                  <Input
                    id="s-tagline"
                    value={values.general.tagline}
                    onChange={(event) => patch("general", { tagline: event.target.value })}
                  />
                </Field>
              </div>

              <Field label="Email" htmlFor="s-email" optional>
                <Input
                  id="s-email"
                  type="email"
                  value={values.general.email}
                  onChange={(event) => patch("general", { email: event.target.value })}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Address line 1" htmlFor="s-addr1">
                  <Input
                    id="s-addr1"
                    value={values.general.addressLine1}
                    onChange={(event) =>
                      patch("general", { addressLine1: event.target.value })
                    }
                  />
                </Field>
                <Field label="Address line 2" htmlFor="s-addr2" optional>
                  <Input
                    id="s-addr2"
                    value={values.general.addressLine2}
                    onChange={(event) =>
                      patch("general", { addressLine2: event.target.value })
                    }
                  />
                </Field>
                <Field label="City / area" htmlFor="s-city">
                  <Input
                    id="s-city"
                    value={values.general.city}
                    onChange={(event) => patch("general", { city: event.target.value })}
                  />
                </Field>
                <Field label="Country" htmlFor="s-country">
                  <Input
                    id="s-country"
                    value={values.general.country}
                    onChange={(event) => patch("general", { country: event.target.value })}
                  />
                </Field>
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <ImagePicker
                  value={values.general.logoKey ? [values.general.logoKey] : []}
                  onChange={(keys) => patch("general", { logoKey: keys[0] ?? null })}
                  folder="site"
                />
              </div>
            </div>
          </Card>
        ) : null}

        {tab === "contact" ? (
          <Card>
            <CardHeader
              title="Contact and WhatsApp"
              description="Change the WhatsApp number here and every button on the website follows it."
            />
            <div className="space-y-5 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Phone number"
                  htmlFor="s-phone"
                  hint="Shown as written, e.g. +971 56 997 0932."
                >
                  <Input
                    id="s-phone"
                    className="tnum"
                    value={values.contact.phone}
                    onChange={(event) => patch("contact", { phone: event.target.value })}
                  />
                </Field>
                <Field
                  label="WhatsApp number"
                  htmlFor="s-whatsapp"
                  hint="Digits only, country code first — 971569970932."
                >
                  <Input
                    id="s-whatsapp"
                    className="tnum"
                    inputMode="numeric"
                    value={values.contact.whatsapp}
                    onChange={(event) =>
                      patch("contact", { whatsapp: event.target.value })
                    }
                  />
                </Field>
              </div>

              <Field label="Google Maps link" htmlFor="s-maps" optional>
                <Input
                  id="s-maps"
                  value={values.contact.mapsLink}
                  onChange={(event) => patch("contact", { mapsLink: event.target.value })}
                />
              </Field>

              <Field
                label="Google Maps embed URL"
                htmlFor="s-mapsembed"
                optional
                hint="The src from the “Embed a map” share option. Leave empty to hide the map."
              >
                <Input
                  id="s-mapsembed"
                  value={values.contact.mapsEmbedUrl}
                  onChange={(event) =>
                    patch("contact", { mapsEmbedUrl: event.target.value })
                  }
                />
              </Field>
            </div>
          </Card>
        ) : null}

        {tab === "hours" ? (
          <Card>
            <CardHeader
              title="Opening hours"
              description="Days left closed are hidden from the website. Set them once the pharmacy confirms."
            />
            <div className="divide-y divide-line">
              {values.hours.map((day, index) => (
                <div
                  key={day.day}
                  className="flex flex-wrap items-center gap-4 px-5 py-3"
                >
                  <label className="flex w-40 cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(event) => {
                        const hours = [...values.hours];
                        hours[index] = { ...day, isOpen: event.target.checked };
                        setValues((current) => ({ ...current, hours }));
                      }}
                      className="size-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                    />
                    {DAY_LABELS[day.day]}
                  </label>

                  <div className="flex items-center gap-2">
                    <label htmlFor={`open-${day.day}`} className="sr-only">
                      {DAY_LABELS[day.day]} opening time
                    </label>
                    <Input
                      id={`open-${day.day}`}
                      type="time"
                      className="tnum h-10 w-32"
                      value={day.opensAt}
                      disabled={!day.isOpen}
                      onChange={(event) => {
                        const hours = [...values.hours];
                        hours[index] = { ...day, opensAt: event.target.value };
                        setValues((current) => ({ ...current, hours }));
                      }}
                    />
                    <span className="text-muted" aria-hidden>
                      –
                    </span>
                    <label htmlFor={`close-${day.day}`} className="sr-only">
                      {DAY_LABELS[day.day]} closing time
                    </label>
                    <Input
                      id={`close-${day.day}`}
                      type="time"
                      className="tnum h-10 w-32"
                      value={day.closesAt}
                      disabled={!day.isOpen}
                      onChange={(event) => {
                        const hours = [...values.hours];
                        hours[index] = { ...day, closesAt: event.target.value };
                        setValues((current) => ({ ...current, hours }));
                      }}
                    />
                  </div>

                  {!day.isOpen ? (
                    <span className="text-sm text-muted">Closed</span>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {tab === "home" ? (
          <>
            <Card>
              <CardHeader
                title="Homepage hero"
                description="The first thing a visitor reads."
              />
              <div className="space-y-5 p-5">
                <Field label="Eyebrow" htmlFor="s-eyebrow" optional>
                  <Input
                    id="s-eyebrow"
                    value={values.home.heroEyebrow}
                    onChange={(event) =>
                      patch("home", { heroEyebrow: event.target.value })
                    }
                  />
                </Field>
                <Field label="Headline" htmlFor="s-headline">
                  <Input
                    id="s-headline"
                    value={values.home.heroHeadline}
                    onChange={(event) =>
                      patch("home", { heroHeadline: event.target.value })
                    }
                  />
                </Field>
                <Field label="Supporting text" htmlFor="s-subline">
                  <Textarea
                    id="s-subline"
                    rows={3}
                    value={values.home.heroSubline}
                    onChange={(event) =>
                      patch("home", { heroSubline: event.target.value })
                    }
                  />
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Announcement bar"
                description="A single line across the top of every page."
              />
              <div className="space-y-5 p-5">
                <Field label="Message" htmlFor="s-announcement" optional>
                  <Input
                    id="s-announcement"
                    value={values.home.announcement}
                    onChange={(event) =>
                      patch("home", { announcement: event.target.value })
                    }
                    placeholder="Closed for Eid on 15–16 June"
                  />
                </Field>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-wash p-3.5">
                  <input
                    type="checkbox"
                    checked={values.home.announcementActive}
                    onChange={(event) =>
                      patch("home", { announcementActive: event.target.checked })
                    }
                    className="size-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-ink">
                    Show the announcement bar
                  </span>
                </label>
              </div>
            </Card>

            <Card>
              <CardHeader title="About page" />
              <div className="space-y-5 p-5">
                <Field label="Introduction" htmlFor="s-about-intro">
                  <Textarea
                    id="s-about-intro"
                    rows={4}
                    value={values.about.intro}
                    onChange={(event) => patch("about", { intro: event.target.value })}
                  />
                </Field>
                <Field label="Mission" htmlFor="s-about-mission">
                  <Textarea
                    id="s-about-mission"
                    rows={3}
                    value={values.about.mission}
                    onChange={(event) => patch("about", { mission: event.target.value })}
                  />
                </Field>
              </div>
            </Card>
          </>
        ) : null}

        {tab === "commerce" ? (
          <Card>
            <CardHeader
              title="Order requests"
              description="This website takes requests, not payments. Turn on payments only once a provider is configured."
            />
            <div className="space-y-5 p-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-3.5">
                <input
                  type="checkbox"
                  checked={values.commerce.showPrices}
                  onChange={(event) =>
                    patch("commerce", { showPrices: event.target.checked })
                  }
                  className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Show prices on the website
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Turn this off and products show “ask for price” instead.
                  </span>
                </span>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Delivery fee (AED)"
                  htmlFor="s-delivery"
                  hint="Leave at 0 to confirm the fee with each customer."
                >
                  <Input
                    id="s-delivery"
                    type="number"
                    min={0}
                    step="0.01"
                    className="tnum"
                    value={deliveryFee}
                    onChange={(event) => setDeliveryFee(event.target.value)}
                  />
                </Field>
                <Field
                  label="Free delivery over (AED)"
                  htmlFor="s-freeover"
                  hint="0 means no free-delivery threshold."
                >
                  <Input
                    id="s-freeover"
                    type="number"
                    min={0}
                    step="0.01"
                    className="tnum"
                    value={freeOver}
                    onChange={(event) => setFreeOver(event.target.value)}
                  />
                </Field>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-rx-line bg-rx-bg p-3.5">
                <input
                  type="checkbox"
                  checked={values.commerce.onlinePaymentsEnabled}
                  onChange={(event) =>
                    patch("commerce", { onlinePaymentsEnabled: event.target.checked })
                  }
                  className="mt-0.5 size-4 shrink-0 rounded border-rx-line text-rx focus:ring-rx"
                />
                <span>
                  <span className="block text-sm font-medium text-rx">
                    Online payments enabled
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-rx/90">
                    Only switch this on once a payment provider has been set up and
                    tested. Nothing on the website charges a card today.
                  </span>
                </span>
              </label>
            </div>
          </Card>
        ) : null}

        {tab === "social" ? (
          <Card>
            <CardHeader
              title="Social profiles"
              description="Only filled-in links appear in the footer."
            />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              {(["instagram", "facebook", "tiktok", "linkedin"] as const).map((key) => (
                <Field
                  key={key}
                  label={key[0]!.toUpperCase() + key.slice(1)}
                  htmlFor={`s-${key}`}
                  optional
                >
                  <Input
                    id={`s-${key}`}
                    value={values.social[key]}
                    placeholder="https://"
                    onChange={(event) => patch("social", { [key]: event.target.value })}
                  />
                </Field>
              ))}
            </div>
          </Card>
        ) : null}

        {tab === "seo" ? (
          <Card>
            <CardHeader
              title="Search engines"
              description="How the site appears in search results and when shared."
            />
            <div className="space-y-5 p-5">
              <Field
                label="Meta title"
                htmlFor="s-metatitle"
                hint="Around 60 characters works best."
              >
                <Input
                  id="s-metatitle"
                  maxLength={70}
                  value={values.seo.metaTitle}
                  onChange={(event) => patch("seo", { metaTitle: event.target.value })}
                />
              </Field>
              <Field
                label="Meta description"
                htmlFor="s-metadesc"
                hint="Around 155 characters. Say what the pharmacy does and where it is."
              >
                <Textarea
                  id="s-metadesc"
                  rows={3}
                  maxLength={180}
                  value={values.seo.metaDescription}
                  onChange={(event) =>
                    patch("seo", { metaDescription: event.target.value })
                  }
                />
              </Field>

              <div className="space-y-2">
                <Label>Share image</Label>
                <ImagePicker
                  value={values.seo.ogImageKey ? [values.seo.ogImageKey] : []}
                  onChange={(keys) => patch("seo", { ogImageKey: keys[0] ?? null })}
                  folder="site"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-3.5">
                <input
                  type="checkbox"
                  checked={values.seo.indexSite}
                  onChange={(event) => patch("seo", { indexSite: event.target.checked })}
                  className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Let search engines index this site
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Turn this off on a staging or preview deployment.
                  </span>
                </span>
              </label>
            </div>
          </Card>
        ) : null}

        {tab === "notifications" ? (
          <Card>
            <CardHeader
              title="Notification channels"
              description="Dashboard notifications are always on. These are the extra channels."
            />
            <div className="space-y-5 p-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-3.5">
                <input
                  type="checkbox"
                  checked={values.notifications.lowStockAlerts}
                  onChange={(event) =>
                    patch("notifications", { lowStockAlerts: event.target.checked })
                  }
                  className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-ink">
                  Alert me when stock reaches its low threshold
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-3.5">
                <input
                  type="checkbox"
                  checked={values.notifications.emailEnabled}
                  onChange={(event) =>
                    patch("notifications", { emailEnabled: event.target.checked })
                  }
                  className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Send email notifications
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Requires SMTP credentials in the server environment.
                  </span>
                </span>
              </label>

              <Field
                label="Email recipients"
                htmlFor="s-recipients"
                optional
                hint="Separate addresses with a comma."
              >
                <Input
                  id="s-recipients"
                  value={recipients}
                  onChange={(event) => setRecipients(event.target.value)}
                  placeholder="counter@example.com, manager@example.com"
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-wash p-3.5">
                <input
                  type="checkbox"
                  checked={values.notifications.whatsappEnabled}
                  onChange={(event) =>
                    patch("notifications", { whatsappEnabled: event.target.checked })
                  }
                  className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Send WhatsApp notifications
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Requires a WhatsApp Business API provider to be connected.
                  </span>
                </span>
              </label>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-line bg-wash/92 py-4 backdrop-blur-md">
        <Button loading={saving} onClick={save}>
          Save settings
        </Button>
      </div>
    </>
  );
}
