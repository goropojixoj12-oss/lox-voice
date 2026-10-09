"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { propertyTypeLabels } from "@/lib/labels";
import type { PropertyType, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const steps = [
  "Deal type",
  "Property type",
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
  const [form, setForm] = useState({
    transactionType: "sale" as TransactionType,
    propertyType: "apartment" as PropertyType,
    city: "Lisbon",
    citySlug: "lisbon",
    district: "Chiado",
    districtSlug: "chiado",
    address: "",
    price: "",
    currency: "EUR",
    pricePeriod: "" as "" | "month" | "night" | "year",
    bedrooms: "2",
    bathrooms: "1",
    areaSqm: "80",
    title: "",
    summary: "",
    description: "",
    imageUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
    contactName: "",
    contactEmail: "",
  });

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep() {
    switch (step) {
      case 2:
        return form.city && form.district && form.address.length >= 3;
      case 3:
        return Number(form.price) > 0;
      case 4:
        return form.title.length >= 8 && form.summary.length >= 12 && form.description.length >= 40;
      case 5:
        return form.imageUrl.startsWith("http");
      case 6:
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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-primary)]">
        List a property
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Eight-step wizard with validation and moderation status. Sign in as owner or agent to
        submit.
      </p>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Step {step + 1} of {steps.length}: {steps[step]}
      </p>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        {step === 0 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["sale", "Sale"],
                ["rent", "Long-term rent"],
                ["short_stay", "Short stay"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update("transactionType", value)}
                className={cn(
                  "rounded-[var(--radius-md)] border px-4 py-4 text-left",
                  form.transactionType === value
                    ? "border-[var(--color-primary)] bg-[var(--color-mist)]"
                    : "border-[var(--color-border)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <label>
            <Label>Property type</Label>
            <Select
              value={form.propertyType}
              onChange={(e) => update("propertyType", e.target.value as PropertyType)}
            >
              {Object.entries(propertyTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        ) : null}

        {step === 2 ? (
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

        {step === 3 ? (
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
                {["EUR", "USD", "AED", "SGD", "ZAR"].map((c) => (
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
            <div>
              <Label>Area (m²)</Label>
              <Input value={form.areaSqm} onChange={(e) => update("areaSqm", e.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
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

        {step === 5 ? (
          <div>
            <Label htmlFor="imageUrl">Cover image URL</Label>
            <Input
              id="imageUrl"
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
            />
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Direct uploads require S3-compatible storage. For demo, paste an https image URL
              (Unsplash recommended). Max practical size guidance: under 5MB, jpg/png/webp.
            </p>
          </div>
        ) : null}

        {step === 6 ? (
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

        {step === 7 ? (
          <div className="space-y-2 text-sm">
            <p className="text-lg font-semibold">{form.title || "Untitled listing"}</p>
            <p>
              {form.transactionType} · {form.propertyType}
            </p>
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
                  setError("Please complete the required fields for this step.");
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
