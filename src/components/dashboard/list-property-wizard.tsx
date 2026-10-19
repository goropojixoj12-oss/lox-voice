"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  formatDealSelection,
  ListPropertyDealStep,
  listingCategoryToPropertyType,
  type DealSelection,
} from "@/components/dashboard/list-property-deal-step";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  LIST_PROPERTY_STEP_COUNT,
  LIST_PROPERTY_STEP_LABELS,
  listPropertyStepPath,
} from "@/lib/list-property-steps";
import type { PropertyType, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

type ListPropertyForm = {
  transactionType: TransactionType;
  propertyType: PropertyType;
  city: string;
  citySlug: string;
  district: string;
  districtSlug: string;
  address: string;
  price: string;
  currency: string;
  pricePeriod: "" | "month" | "night" | "year";
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  title: string;
  summary: string;
  description: string;
  imageUrl: string;
  contactName: string;
  contactEmail: string;
};

type WizardContextValue = {
  form: ListPropertyForm;
  update: <K extends keyof ListPropertyForm>(key: K, value: ListPropertyForm[K]) => void;
  dealSelection: DealSelection | null;
  applyDealSelection: (next: DealSelection) => void;
  error: string;
  setError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  validateStep: (stepIndex: number) => boolean;
  submit: () => Promise<void>;
};

const WizardContext = createContext<WizardContextValue | null>(null);

function useListPropertyWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("ListPropertyWizard must be used within ListPropertyWizardProvider");
  }
  return ctx;
}

const defaultForm: ListPropertyForm = {
  transactionType: "sale",
  propertyType: "apartment",
  city: "Phnom Penh",
  citySlug: "phnom-penh",
  district: "BKK 1",
  districtSlug: "bkk-1",
  address: "",
  price: "",
  currency: "USD",
  pricePeriod: "",
  bedrooms: "2",
  bathrooms: "1",
  areaSqm: "80",
  title: "",
  summary: "",
  description: "",
  imageUrl: "/media/photos/photo-1502672260266-1c1ef2d93688.jpg",
  contactName: "",
  contactEmail: "",
};

export function ListPropertyWizardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [form, setForm] = useState<ListPropertyForm>(defaultForm);
  const [dealSelection, setDealSelection] = useState<DealSelection | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = useCallback(<K extends keyof ListPropertyForm>(key: K, value: ListPropertyForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyDealSelection = useCallback(
    (next: DealSelection) => {
      setDealSelection(next);
      setForm((prev) => {
        const nextForm = {
          ...prev,
          transactionType: next.transactionType,
          propertyType: listingCategoryToPropertyType(next.category),
        };
        if (next.transactionType === "sale") {
          nextForm.pricePeriod = "";
        } else if (!nextForm.pricePeriod) {
          nextForm.pricePeriod = "month";
        }
        return nextForm;
      });
    },
    [],
  );

  const validateStep = useCallback(
    (stepIndex: number) => {
      switch (stepIndex) {
        case 0:
          return dealSelection != null;
        case 1:
          return Boolean(form.city && form.district && form.address.length >= 3);
        case 2:
          return Number(form.price) > 0;
        case 3:
          return (
            form.title.length >= 8 &&
            form.summary.length >= 12 &&
            form.description.length >= 40
          );
        case 4:
          return form.imageUrl.startsWith("http") || form.imageUrl.startsWith("/media/");
        case 5:
          return form.contactName.length >= 2 && form.contactEmail.includes("@");
        default:
          return true;
      }
    },
    [dealSelection, form],
  );

  const submit = useCallback(async () => {
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
        pricePeriod: form.transactionType === "sale" ? null : form.pricePeriod || "month",
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
  }, [form, router]);

  const value = useMemo(
    () => ({
      form,
      update,
      dealSelection,
      applyDealSelection,
      error,
      setError,
      loading,
      setLoading,
      validateStep,
      submit,
    }),
    [
      applyDealSelection,
      dealSelection,
      error,
      form,
      loading,
      submit,
      update,
      validateStep,
    ],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function ListPropertyWizard({ stepIndex }: { stepIndex: number }) {
  const router = useRouter();
  const {
    form,
    update,
    dealSelection,
    applyDealSelection,
    error,
    setError,
    loading,
    validateStep,
    submit,
  } = useListPropertyWizard();

  const pathname = usePathname();
  const step = Math.min(LIST_PROPERTY_STEP_COUNT - 1, Math.max(0, stepIndex));
  const progress = ((step + 1) / LIST_PROPERTY_STEP_COUNT) * 100;
  const currentStepPath = listPropertyStepPath(step + 1);

  useEffect(() => {
    if (pathname !== currentStepPath) {
      router.replace(currentStepPath);
    }
  }, [currentStepPath, pathname, router]);

  function goToStep(index: number) {
    const href = listPropertyStepPath(index + 1);
    router.replace(href);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        List a property
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Seven-step wizard with validation and moderation status. Each step has its own link you can
        bookmark or share within your desk.
      </p>

      <nav
        className="mt-4 flex flex-wrap gap-2 text-xs"
        aria-label="Listing wizard steps"
      >
        {LIST_PROPERTY_STEP_LABELS.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (index <= step) goToStep(index);
              }}
              disabled={index > step}
              className={cn(
                "rounded-full border px-3 py-1 transition",
                active &&
                  "border-[rgba(212,175,55,0.75)] bg-[var(--color-mist)] text-[var(--color-accent-soft)]",
                done &&
                  !active &&
                  "border-[var(--color-border)] text-[var(--color-text)] hover:border-[rgba(212,175,55,0.45)]",
                !active && !done && "border-[var(--color-border)] text-[var(--color-muted)] opacity-60",
              )}
            >
              {listPropertyStepPath(index + 1).split("/").pop()} · {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Step {step + 1} of {LIST_PROPERTY_STEP_COUNT}: {LIST_PROPERTY_STEP_LABELS[step]}
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
                    update("pricePeriod", e.target.value as ListPropertyForm["pricePeriod"])
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
              <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} />
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
            onClick={() => goToStep(step - 1)}
          >
            Back
          </Button>
          {step < LIST_PROPERTY_STEP_COUNT - 1 ? (
            <Button
              type="button"
              onClick={() => {
                if (!validateStep(step)) {
                  setError(
                    step === 0
                      ? "Choose a deal type and category to continue."
                      : "Please complete the required fields for this step.",
                  );
                  return;
                }
                setError("");
                goToStep(step + 1);
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
