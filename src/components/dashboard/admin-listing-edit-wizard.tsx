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
import { useRouter } from "next/navigation";
import {
  formatDealSelection,
  ListPropertyDealStep,
  listingCategoryToPropertyType,
  type DealSelection,
  type ListingCategory,
} from "@/components/dashboard/list-property-deal-step";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { ListPropertyMediaStep } from "@/components/dashboard/list-property-media-step";
import { ListingCardPreview, listingPreviewFromMedia } from "@/components/property/listing-card-preview";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  LIST_PROPERTY_STEP_COUNT,
  LIST_PROPERTY_STEP_LABELS,
} from "@/lib/list-property-steps";
import { getCountryByCode, isWorldCountryCode, worldCountries } from "@/data/countries";
import { listPropertyDefaultForm, type ListPropertyDraftForm } from "@/lib/list-property-draft";
import {
  listingMediaToPropertyPayload,
  type ListingMediaItem,
} from "@/lib/list-property-media";
import {
  normalizeListPropertyFormForSubmit,
  validateListPropertyStep,
} from "@/lib/list-property-validation";
import { cn } from "@/lib/utils";
import type { Property, PropertyType, TransactionType } from "@/lib/types";

function propertyTypeToCategory(pt: PropertyType): ListingCategory {
  switch (pt) {
    case "land":
      return "land";
    case "commercial":
    case "office":
    case "retail":
    case "warehouse":
      return "commercial";
    case "project_unit":
      return "development";
    default:
      return "residential";
  }
}

function listingToForm(listing: Property): ListPropertyDraftForm {
  const desc = listing.description ?? "";
  const contactMatch = /Contact preference:\s*(.+?)\s*\u00b7\s*(\S+@\S+)/i.exec(desc);
  return {
    transactionType: listing.transactionType,
    propertyType: listing.propertyType,
    countryCode: listing.location.countrySlug
      ? worldCountries.find(
          (c) => c.name.toLowerCase() === listing.location.country.toLowerCase(),
        )?.code ?? listPropertyDefaultForm.countryCode
      : listPropertyDefaultForm.countryCode,
    city: listing.location.city,
    citySlug: listing.location.citySlug,
    district: listing.location.district,
    districtSlug: listing.location.districtSlug,
    commune: listing.location.commune ?? "",
    communeSlug: listing.location.communeSlug ?? "",
    address: listing.location.address,
    price: String(listing.price),
    currency: listing.currency,
    pricePeriod: listing.pricePeriod ?? "",
    bedrooms: listing.bedrooms != null ? String(listing.bedrooms) : "",
    bathrooms: listing.bathrooms != null ? String(listing.bathrooms) : "",
    areaSqm: listing.areaSqm != null ? String(listing.areaSqm) : "",
    title: listing.title,
    summary: listing.summary,
    description: contactMatch
      ? desc.replace(/\n*Contact preference:\s*.+$/, "").trim()
      : desc,
    imageUrl: listing.images?.[0]?.url ?? "",
    contactName: contactMatch?.[1] ?? "",
    contactEmail: contactMatch?.[2] ?? "",
  };
}

function listingToMedia(listing: Property): ListingMediaItem[] {
  const items: ListingMediaItem[] = [];
  for (const img of listing.images ?? []) {
    items.push({
      id: img.id,
      kind: "image",
      url: img.url,
      name: img.alt || "Photo",
      isCover: img.isCover,
    });
  }
  for (const vid of listing.videos ?? []) {
    items.push({
      id: vid.id,
      kind: "video",
      url: vid.url,
      name: vid.label || "Video",
      isCardPreview: vid.role === "card_preview",
    });
  }
  return items;
}

export type AdminEditWizardProps = {
  listing: Property;
  afterSavePath: string;
};

type EditWizardContextValue = {
  form: ListPropertyDraftForm;
  update: <K extends keyof ListPropertyDraftForm>(key: K, value: ListPropertyDraftForm[K]) => void;
  mediaItems: ListingMediaItem[];
  setMediaItems: (items: ListingMediaItem[]) => void;
  dealSelection: DealSelection | null;
  applyDealSelection: (next: DealSelection) => void;
  error: string;
  setError: (msg: string) => void;
  loading: boolean;
  submitAction: (action: "save" | "publish" | "reject") => Promise<void>;
  validateStep: (stepIndex: number) => boolean;
};

const EditWizardContext = createContext<EditWizardContextValue | null>(null);

function useEditWizard() {
  const ctx = useContext(EditWizardContext);
  if (!ctx) throw new Error("AdminListingEditWizard must be within provider");
  return ctx;
}

export function AdminListingEditWizardProvider({
  listing,
  afterSavePath,
  children,
}: AdminEditWizardProps & { children: ReactNode }) {
  const router = useRouter();
  const [form, setForm] = useState<ListPropertyDraftForm>(() => listingToForm(listing));
  const [mediaItems, setMediaItems] = useState<ListingMediaItem[]>(() => listingToMedia(listing));
  const [dealSelection, setDealSelection] = useState<DealSelection | null>(() => ({
    transactionType: listing.transactionType === "short_stay" ? "rent" : listing.transactionType,
    category: propertyTypeToCategory(listing.propertyType),
  }));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = useCallback(
    <K extends keyof ListPropertyDraftForm>(key: K, value: ListPropertyDraftForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const applyDealSelection = useCallback((next: DealSelection) => {
    setDealSelection(next);
    setForm((prev) => ({
      ...prev,
      transactionType: next.transactionType,
      propertyType: listingCategoryToPropertyType(next.category),
      pricePeriod:
        next.transactionType === "sale"
          ? ""
          : prev.pricePeriod || "month",
    }));
  }, []);

  const validateStep = useCallback(
    (stepIndex: number) =>
      validateListPropertyStep(stepIndex, form, dealSelection, mediaItems),
    [dealSelection, form, mediaItems],
  );

  const submitAction = useCallback(
    async (action: "save" | "publish" | "reject") => {
      setLoading(true);
      setError("");
      const payloadForm = normalizeListPropertyFormForSubmit(form);
      const media = listingMediaToPropertyPayload(
        mediaItems,
        payloadForm.title || "Listing",
      );
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          title: payloadForm.title,
          summary: payloadForm.summary,
          description: `${payloadForm.description}\n\nContact preference: ${payloadForm.contactName} \u00b7 ${payloadForm.contactEmail}`,
          transactionType: payloadForm.transactionType,
          propertyType: payloadForm.propertyType,
          price: Number(payloadForm.price),
          currency: payloadForm.currency,
          pricePeriod:
            payloadForm.transactionType === "sale"
              ? null
              : payloadForm.pricePeriod || "month",
          bedrooms:
            payloadForm.bedrooms === "" ? null : Number(payloadForm.bedrooms),
          bathrooms:
            payloadForm.bathrooms === "" ? null : Number(payloadForm.bathrooms),
          areaSqm:
            payloadForm.areaSqm === "" ? null : Number(payloadForm.areaSqm),
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
        }),
      });
      setLoading(false);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not update listing");
        return;
      }
      router.push(afterSavePath);
      router.refresh();
    },
    [afterSavePath, form, listing.id, mediaItems, router],
  );

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
      submitAction,
      validateStep,
    }),
    [
      applyDealSelection,
      dealSelection,
      error,
      form,
      loading,
      mediaItems,
      submitAction,
      update,
      validateStep,
    ],
  );

  return (
    <EditWizardContext.Provider value={value}>{children}</EditWizardContext.Provider>
  );
}

export function AdminListingEditWizard({
  listingStatus,
}: {
  listingStatus: string;
}) {
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
    submitAction,
    validateStep,
  } = useEditWizard();

  const [step, setStep] = useState(0);
  const progress = ((step + 1) / LIST_PROPERTY_STEP_COUNT) * 100;

  return (
    <div className="notranslate max-w-3xl">
      <nav
        className="flex flex-wrap gap-2 text-xs"
        aria-label="Listing edit steps"
      >
        {LIST_PROPERTY_STEP_LABELS.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "rounded-full border px-3 py-1 transition",
                active &&
                  "border-[rgba(212,175,55,0.75)] bg-[var(--color-mist)] text-[var(--color-accent-soft)]",
                done &&
                  !active &&
                  "border-[var(--color-border)] text-[var(--color-text)] hover:border-[rgba(212,175,55,0.45)]",
                !active &&
                  !done &&
                  "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[rgba(212,175,55,0.45)]",
              )}
            >
              step{index + 1} \u00b7 {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Step {step + 1} of {LIST_PROPERTY_STEP_COUNT}: {LIST_PROPERTY_STEP_LABELS[step]}
        {dealSelection ? (
          <span className="text-[var(--color-accent-soft)]">
            {" "}\u00b7 {formatDealSelection(dealSelection)}
          </span>
        ) : null}
      </p>

      <div className="mt-4 rounded-[var(--radius-xl)] seaps-card p-5 md:p-6">
        {step === 0 ? (
          <ListPropertyDealStep value={dealSelection} onChange={applyDealSelection} />
        ) : null}

        {step === 1 ? (
          <div className="grid gap-3">
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Select
                id="edit-country"
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
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={form.city}
                onChange={(e) => {
                  update("city", e.target.value);
                  update("citySlug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
              />
            </div>
            <div>
              <Label htmlFor="edit-district">District</Label>
              <Input
                id="edit-district"
                value={form.district}
                onChange={(e) => {
                  update("district", e.target.value);
                  update("districtSlug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
              />
            </div>
            <div>
              <Label htmlFor="edit-commune">Commune (required)</Label>
              <Input
                id="edit-commune"
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
              <Label htmlFor="edit-address">Address / area note (required)</Label>
              <Input
                id="edit-address"
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
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-currency">Currency</Label>
              <Select
                id="edit-currency"
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
              >
                {["USD", "KHR"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            {form.transactionType !== "sale" ? (
              <div>
                <Label>Price period</Label>
                <Select
                  value={form.pricePeriod}
                  onChange={(e) =>
                    update("pricePeriod", e.target.value as ListPropertyDraftForm["pricePeriod"])
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
              <Label>{dealSelection?.category === "land" ? "Land area (m\u00b2)" : "Area (m\u00b2)"}</Label>
              <Input value={form.areaSqm} onChange={(e) => update("areaSqm", e.target.value)} />
            </div>
            <div className="sm:col-span-2 mt-4 border-t border-[var(--color-border)] pt-4">
              <p className="text-sm font-semibold text-[var(--color-accent-soft)]">Commission & assignment</p>
            </div>
            <div>
              <Label>Agent commission (%)</Label>
              <Input
                inputMode="numeric"
                value={String((form as Record<string, unknown>).commissionAgent ?? "")}
                onChange={(e) => update("commissionAgent" as keyof ListPropertyDraftForm, e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <Label>Company income (%) — admin only</Label>
              <Input
                inputMode="numeric"
                value={String((form as Record<string, unknown>).commissionCompany ?? "")}
                onChange={(e) => update("commissionCompany" as keyof ListPropertyDraftForm, e.target.value)}
                placeholder="e.g. 2"
              />
              <p className="mt-1 text-xs text-red-500">Only admin can see this value</p>
            </div>
            <div className="sm:col-span-2">
              <Label>Assigned agent ID</Label>
              <Input
                value={String((form as Record<string, unknown>).assignedAgentId ?? "")}
                onChange={(e) => update("assignedAgentId" as keyof ListPropertyDraftForm, e.target.value)}
                placeholder="Agent user ID (from Employees list)"
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-3">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-summary">Summary</Label>
              <Input
                id="edit-summary"
                value={form.summary}
                onChange={(e) => update("summary", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
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
                      id: "edit-preview",
                      slug: "edit-preview",
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
              <Label htmlFor="edit-contactName">Contact name</Label>
              <Input
                id="edit-contactName"
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-contactEmail">Contact email</Label>
              <Input
                id="edit-contactEmail"
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
              Contact: {form.contactName} \u00b7 {form.contactEmail}
            </p>
            <p className="rounded-[var(--radius-md)] bg-[var(--color-mist)] p-3">
              Current status: <strong>{listingStatus}</strong>. Use the buttons below to save,
              approve, or reject.
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          {step < LIST_PROPERTY_STEP_COUNT - 1 ? (
            <Button
              type="button"
              onClick={() => {
                if (!validateStep(step)) {
                  setError(
                    `Complete this step before continuing.`,
                  );
                  return;
                }
                setError("");
                setStep(step + 1);
              }}
            >
              Continue
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void submitAction("save")}
        >
          {loading ? "Saving\u2026" : "Save edits"}
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={() => void submitAction("publish")}
        >
          {loading ? "Publishing\u2026" : "Approve & publish"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void submitAction("reject")}
        >
          {loading ? "Rejecting\u2026" : "Reject"}
        </Button>
      </div>
    </div>
  );
}
