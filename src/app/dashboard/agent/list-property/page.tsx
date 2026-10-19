"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatDealSelection,
  ListPropertyDealStep,
  listingCategoryToPropertyType,
  type DealSelection,
} from "@/components/dashboard/list-property-deal-step";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { PropertyType, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const steps = [
  "Deal & category",
  "Location",
  "Price & specs",
  "Description",
  "Photos",
  "Contact",
  "Preview",
];

export default function ListPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dealSelection, setDealSelection] = useState<DealSelection | null>(null);
  const [form, setForm] = useState({
    transactionType: "sale" as TransactionType,
    propertyType: "apartment" as PropertyType,
    city: "Phnom Penh",
    citySlug: "phnom-penh",
    district: "BKK 1",
    districtSlug: "bkk-1",
    address: "",
    price: "",
    currency: "USD",
    pricePeriod: "" as "" | "month" | "night" | "year",
    bedrooms: "2",
    bathrooms: "1",
    areaSqm: "80",
    title: "",
    summary: "",
    description: "",
    imageUrl: "/media/photos/photo-1502672260266-1c1ef2d93688.jpg",
    contactName: "",
    contactEmail: "",
  });

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyDealSelection(next: DealSelection) {
    setDealSelection(next);
    update("transactionType", next.transactionType);
    update("propertyType", listingCategoryToPropertyType(next.category));
    if (next.transactionType === "sale") {
      update("pricePeriod", "");
    } else if (!form.pricePeriod) {
      update("pricePeriod", "month");
    }
  }

  function validateStep() {
    switch (step) {
      case 0:
        return dealSelection != null;
      case 1:
        return form.city && form.district && form.address.length >= 3;
      case 2:
        return Number(form.price) > 0;
      case 3:
        return form.title.length >= 8 && form.summary.length >= 12 && form.description.length >= 40;
      case 4:
        return form.imageUrl.startsWith("http") || form.imageUrl.startsWith("/media/");
      case 5:
        return form.contactName.length >= 2 && form.contactEmail.includes("@");
      default:
        return true;
    }
  }

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        summary: form.summary,
        description: `${form.description}\n\nContact preference: ${form.contactName} · ${form.contactEmail}`,
        transactionType: form.transactionType,
        propertyType: form.propertyType,
        price: Number(form.price),
        currency: form.currency,
        pricePeriod:
          form.transactionType === "sale" ? null : form.pricePeriod || "month",
        bedrooms: form.bedrooms === "" ? null : Number(form.bedrooms),
        bathrooms: form.bathrooms === "" ? null : Number(form.bathrooms),
        areaSqm: form.areaSqm === "" ? null : Number(form.areaSqm),
        city: form.city,
        citySlug: form.citySlug,
        district: form.district,
        districtSlug: form.districtSlug,
        address: form.address,
        imageUrl: form.imageUrl,
      }),
    });
    setLoading(false);
    if (res.status === 401) {
      setError("Sign in as owner or agent before submitting a listing.");
      router.push("/auth/login");
      return;
    }
    if (!res.ok) {
      setError("Could not submit listing. Check required fields and try again.");
      return;
    }
    const data = (await res.json()) as { listing: { slug: string } };
    router.push(`/property/${data.listing.slug}`);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        List a property
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Seven-step wizard with validation and moderation status. Choose how the listing is offered,
        then complete location and details.
      </p>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Step {step + 1} of {steps.length}: {steps[step]}
        {dealSelection ? (
          <span className="text-[var(--color-accent-soft)]">
            {" "}
            · {formatDealSelection(dealSelection)}
          </span>
        ) : null}
      </p>

      <div className="mt-6 rounded-[var(--radius-xl)] seaps-card p-5 md:p-6">
        {step === 0 ? (
          <ListPropertyDealStep value={dealSelection} onChange={applyDealSelection} />
        ) : null}

        {step === 1 ? (
          <div className="grid gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => {
                  update("city", e.target.value);
                  update("citySlug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
              />
            </div>
            <div>
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => {
                  update("district", e.target.value);
                  update("districtSlug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
              />
            </div>
            <div>
              <Label htmlFor="address">Address / area note</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street or neighborhood descriptor"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                id="currency"
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
              >
                {["USD", "KHR"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            {form.transactionType !== "sale" ? (
              <div>
                <Label>Price period</Label>
                <Select
                  value={form.pricePeriod}
                  onChange={(e) =>
                    update("pricePeriod", e.target.value as "" | "month" | "night" | "year")
                  }
                >
                  <option value="month">Month</option>
                  <option value="night">Night</option>
                  <option value="year">Year</option>
                </Select>
              </div>
            ) : null}
            {dealSelection?.category !== "land" ? (
              <>
                <div>
                  <Label>Bedrooms</Label>
                  <Input
                    value={form.bedrooms}
                    onChange={(e) => update("bedrooms", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bathrooms</Label>
                  <Input
                    value={form.bathrooms}
                    onChange={(e) => update("bathrooms", e.target.value)}
                  />
                </div>
              </>
            ) : null}
            <div className={cn(dealSelection?.category === "land" && "sm:col-span-2")}>
              <Label>{dealSelection?.category === "land" ? "Land area (m²)" : "Area (m²)"}</Label>
              <Input value={form.areaSqm} onChange={(e) => update("areaSqm", e.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Input
                id="summary"
                value={form.summary}
                onChange={(e) => update("summary", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <Label htmlFor="imageUrl">Cover image URL</Label>
            <Input
              id="imageUrl"
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
            />
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Local path like /media/photos/….jpg or a full https URL. Recommended: under 5MB,
              jpg/png/webp.
            </p>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-3">
            <div>
              <Label htmlFor="contactName">Contact name</Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-2 text-sm">
            <p className="text-lg font-semibold">{form.title || "Untitled listing"}</p>
            <p>{dealSelection ? formatDealSelection(dealSelection) : form.transactionType}</p>
            <p>
              {form.address}, {form.district}, {form.city}
            </p>
            <p>
              {form.price} {form.currency}
              {form.pricePeriod ? ` / ${form.pricePeriod}` : ""}
            </p>
            <p className="text-[var(--color-muted)]">{form.summary}</p>
            <p className="text-[var(--color-muted)]">{form.description}</p>
            <p>
              Contact: {form.contactName} · {form.contactEmail}
            </p>
            <p className="rounded-[var(--radius-md)] bg-[var(--color-mist)] p-3">
              Submitting will set status to <strong>pending</strong> moderation.
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={() => {
                if (!validateStep()) {
                  setError(
                    step === 0
                      ? "Choose a deal type and category to continue."
                      : "Please complete the required fields for this step.",
                  );
                  return;
                }
                setError("");
                setStep((s) => s + 1);
              }}
            >
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={loading}>
              {loading ? "Submitting…" : "Submit for moderation"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
