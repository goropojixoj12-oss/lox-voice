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
import { ListPropertyMediaStep } from "@/components/dashboard/list-property-media-step";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { ListingCardPreview, listingPreviewFromMedia } from "@/components/property/listing-card-preview";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useListPropertyDesk } from "@/components/dashboard/list-property-desk-provider";
import { withActingAgentUser } from "@/lib/agent-desk-api-client";
import {
  LIST_PROPERTY_STEP_COUNT,
  LIST_PROPERTY_STEP_LABELS,
  listPropertyStepPathForBase,
} from "@/lib/list-property-steps";
import { getCountryByCode, isWorldCountryCode, worldCountries } from "@/data/countries";
import {
  clearListPropertyDraft,
  listPropertyDefaultForm,
  loadListPropertyDraft,
  saveListPropertyDraft,
  type ListPropertyDraftForm,
} from "@/lib/list-property-draft";
import {
  listingMediaToPropertyPayload,
  type ListingMediaItem,
} from "@/lib/list-property-media";
import {
  firstInvalidListPropertyStep,
  formatListingApiIssues,
  listPropertyStepErrorMessage,
  normalizeListPropertyFormForSubmit,
  validateListPropertyStep,
} from "@/lib/list-property-validation";
import { cn } from "@/lib/utils";

type ListPropertyForm = ListPropertyDraftForm;

type WizardContextValue = {
  form: ListPropertyForm;
  update: <K extends keyof ListPropertyForm>(key: K, value: ListPropertyForm[K]) => void;
  mediaItems: ListingMediaItem[];
  setMediaItems: (items: ListingMediaItem[]) => void;
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

export function ListPropertyWizardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const desk = useListPropertyDesk();
  const [form, setForm] = useState<ListPropertyForm>(listPropertyDefaultForm);
  const [mediaItems, setMediaItems] = useState<ListingMediaItem[]>([]);
  const [dealSelection, setDealSelection] = useState<DealSelection | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const draft = loadListPropertyDraft();
    if (draft) {
      setForm(draft.form);
      setDealSelection(draft.dealSelection);
      setMediaItems(draft.mediaItems);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveListPropertyDraft({ form, dealSelection, mediaItems });
  }, [dealSelection, draftReady, form, mediaItems]);

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
    (stepIndex: number) => validateListPropertyStep(stepIndex, form, dealSelection, mediaItems),
    [dealSelection, form, mediaItems],
  );

  const submit = useCallback(async () => {
    const invalid = firstInvalidListPropertyStep(form, dealSelection, mediaItems);
    if (invalid != null) {
      setError(listPropertyStepErrorMessage(invalid));
      router.replace(listPropertyStepPathForBase(desk.base, invalid + 1));
      return;
    }

    setLoading(true);
    setError("");
    const payloadForm = normalizeListPropertyFormForSubmit(form);
    const media = listingMediaToPropertyPayload(mediaItems, payloadForm.title || "Listing");
    const res = await fetch(
      "/api/properties",
      withActingAgentUser(desk.actingUserId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        title: payloadForm.title,
        summary: payloadForm.summary,
        description: `${payloadForm.description}\n\nContact preference: ${payloadForm.contactName} · ${payloadForm.contactEmail}`,
        transactionType: payloadForm.transactionType,
        propertyType: payloadForm.propertyType,
        price: Number(payloadForm.price),
        currency: payloadForm.currency,
        pricePeriod: payloadForm.transactionType === "sale" ? null : payloadForm.pricePeriod || "month",
        bedrooms: payloadForm.bedrooms === "" ? null : Number(payloadForm.bedrooms),
        bathrooms: payloadForm.bathrooms === "" ? null : Number(payloadForm.bathrooms),
        areaSqm: payloadForm.areaSqm === "" ? null : Number(payloadForm.areaSqm),
        countryCode: payloadForm.countryCode,
        city: payloadForm.city,
        citySlug: payloadForm.citySlug,
        district: payloadForm.district,
        districtSlug: payloadForm.districtSlug,
        commune: payloadForm.commune,
        communeSlug: payloadForm.communeSlug,
        address: payloadForm.address,
        images: media.images,
        videos: media.videos,
        cardPreviewVideoUrl: media.cardPreviewVideoUrl,
        ...(desk.actingUserId ? { createdByUserId: desk.actingUserId } : {}),
      }),
      }),
    );
    setLoading(false);
    if (res.status === 401) {
      setError("Sign in as owner or agent before submitting a listing.");
      router.push("/auth/login");
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string; issues?: unknown };
      const detail = formatListingApiIssues(data.issues);
      setError(
        detail ??
          data.error ??
          "Could not submit listing. Check required fields and try again.",
      );
      return;
    }
    clearListPropertyDraft();
    router.push(desk.afterSubmitPath);
  }, [dealSelection, desk.actingUserId, desk.afterSubmitPath, desk.base, form, mediaItems, router]);

  const value = useMemo(
    () => ({
      form,
      update,
      mediaItems,
      setMediaItems,
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
      mediaItems,
      submit,
      update,
      validateStep,
    ],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function ListPropertyWizard({ stepIndex }: { stepIndex: number }) {
  const router = useRouter();
  const desk = useListPropertyDesk();
  const {
    form,
    update,
    mediaItems,
    setMediaItems,
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
  const currentStepPath = listPropertyStepPathForBase(desk.base, step + 1);

  useEffect(() => {
    if (pathname !== currentStepPath) {
      router.replace(currentStepPath);
    }
  }, [currentStepPath, pathname, router]);

  useEffect(() => {
    const invalid = firstInvalidListPropertyStep(form, dealSelection, mediaItems);
    if (invalid == null || invalid >= step) return;
    setError(listPropertyStepErrorMessage(invalid));
    goToStep(invalid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect once per invalid earlier step
  }, [step, form, dealSelection, mediaItems]);

  function goToStep(index: number) {
    const href = listPropertyStepPathForBase(desk.base, index + 1);
    router.replace(href);
  }

  return (
    <div className="notranslate max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        List a property
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Seven-step wizard with validation and moderation status. Each step has its own link you can
        bookmark or share within your desk. Your entries are saved automatically in this browser as
        you go.
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
              {listPropertyStepPathForBase(desk.base, index + 1).split("/").pop()} · {label}
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
              <Label htmlFor="list-country">Country</Label>
              <Select
                id="list-country"
                className="notranslate max-h-none"
                value={form.countryCode}
                onChange={(e) => update("countryCode", e.target.value.toUpperCase())}
              >
                {worldCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </div>
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
              <Label htmlFor="commune">Commune (required)</Label>
              <Input
                id="commune"
                required
                value={form.commune}
                onChange={(e) => {
                  update("commune", e.target.value);
                  update("communeSlug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                placeholder="Sangkat / commune name"
              />
            </div>
            <div>
              <Label htmlFor="address">Address / area note (required)</Label>
              <Input
                id="address"
                required
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
              <RichTextEditor
                content={form.description}
                onChange={(html) => update("description", html)}
                placeholder="Write a detailed description — formatting, images, and videos are supported…"
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <ListPropertyMediaStep
              items={mediaItems}
              onChange={setMediaItems}
              listingTitle={form.title}
              uploadUserId={desk.actingUserId}
              actingUserId={desk.actingUserId}
            />
            {mediaItems.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Card preview (site-wide)
                </p>
                <div className="relative aspect-[4/3] max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
                  <ListingCardPreview
                    property={{
                      ...listingPreviewFromMedia(form.title || "Listing", mediaItems),
                      id: "draft",
                      slug: "draft",
                      summary: "",
                      description: "",
                      transactionType: form.transactionType,
                      propertyType: form.propertyType,
                      status: "draft",
                      verification: "unverified",
                      sellerType: "agent",
                      price: 0,
                      currency: form.currency,
                      pricePeriod: null,
                      bedrooms: null,
                      bathrooms: null,
                      areaSqm: null,
                      landSqm: null,
                      furnishing: null,
                      amenities: [],
                      location: {
                        country: "",
                        countrySlug: "",
                        city: form.city,
                        citySlug: form.citySlug,
                        district: form.district,
                        districtSlug: form.districtSlug,
                        address: form.address,
                        lat: 0,
                        lng: 0,
                      },
                      publishedAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }}
                  />
                </div>
              </div>
            ) : null}
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
              {form.address}
              {form.commune ? `, ${form.commune}` : ""}, {form.district}, {form.city}
              {getCountryByCode(form.countryCode)
                ? `, ${getCountryByCode(form.countryCode)!.name}`
                : ""}
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
                  setError(listPropertyStepErrorMessage(step));
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
