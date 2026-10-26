"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  formatDealSelection,
  ListPropertyDealStep,
  listingCategoryToPropertyType,
  type DealSelection,
} from "@/components/dashboard/list-property-deal-step";
import { ListPropertyMediaStep } from "@/components/dashboard/list-property-media-step";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { getCountryByCode, worldCountries } from "@/data/countries";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import {
  countryCodeFromPropertyLocation,
  inferDealSelection,
  parseOptionalNumber,
  propertyToListingMedia,
} from "@/lib/admin-listing-edit";
import type { ListingMediaItem } from "@/lib/list-property-media";
import {
  amenityOptions,
  furnishingLabels,
  propertyTypeLabels,
  transactionLabels,
  verificationLabels,
} from "@/lib/labels";
import type { AmenityKey, Furnishing, Property, PropertyType, SellerType, TransactionType, VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const sectionClass = "space-y-3 border-t border-[var(--color-border)] pt-5 first:border-t-0 first:pt-0";
const sectionTitleClass =
  "font-[family-name:var(--font-display)] text-lg text-[var(--color-accent-soft)]";

const PROPERTY_TYPES = Object.keys(propertyTypeLabels) as PropertyType[];
const TRANSACTION_TYPES: TransactionType[] = ["sale", "rent", "short_stay"];
const SELLER_TYPES: SellerType[] = ["owner", "agent", "developer"];
const VERIFICATION_STATUSES: VerificationStatus[] = ["unverified", "verified", "premium"];
const FURNISHING_OPTIONS = Object.keys(furnishingLabels) as Furnishing[];

function slugifyField(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export function AdminListingModerationForm({ listing }: { listing: Property }) {
  const router = useRouter();
  const initialDeal = useMemo(() => inferDealSelection(listing), [listing]);

  const [dealSelection, setDealSelection] = useState<DealSelection | null>(initialDeal);
  const [transactionType, setTransactionType] = useState<TransactionType>(listing.transactionType);
  const [propertyType, setPropertyType] = useState<PropertyType>(listing.propertyType);
  const [countryCode, setCountryCode] = useState(
    countryCodeFromPropertyLocation(listing.location.country),
  );
  const [city, setCity] = useState(listing.location.city);
  const [citySlug, setCitySlug] = useState(listing.location.citySlug);
  const [district, setDistrict] = useState(listing.location.district);
  const [districtSlug, setDistrictSlug] = useState(listing.location.districtSlug);
  const [commune, setCommune] = useState(listing.location.commune ?? "");
  const [communeSlug, setCommuneSlug] = useState(listing.location.communeSlug ?? "");
  const [address, setAddress] = useState(listing.location.address);
  const [lat, setLat] = useState(String(listing.location.lat));
  const [lng, setLng] = useState(String(listing.location.lng));

  const [price, setPrice] = useState(String(listing.price));
  const [currency, setCurrency] = useState(listing.currency);
  const [pricePeriod, setPricePeriod] = useState(listing.pricePeriod ?? "");
  const [bedrooms, setBedrooms] = useState(
    listing.bedrooms != null ? String(listing.bedrooms) : "",
  );
  const [bathrooms, setBathrooms] = useState(
    listing.bathrooms != null ? String(listing.bathrooms) : "",
  );
  const [areaSqm, setAreaSqm] = useState(listing.areaSqm != null ? String(listing.areaSqm) : "");
  const [landSqm, setLandSqm] = useState(listing.landSqm != null ? String(listing.landSqm) : "");
  const [furnishing, setFurnishing] = useState<Furnishing | "">(listing.furnishing ?? "");

  const [title, setTitle] = useState(listing.title);
  const [summary, setSummary] = useState(listing.summary);
  const [description, setDescription] = useState(listing.description);
  const [slug, setSlug] = useState(listing.slug);

  const [amenities, setAmenities] = useState<Set<AmenityKey>>(new Set(listing.amenities));
  const [verification, setVerification] = useState<VerificationStatus>(listing.verification);
  const [sellerType, setSellerType] = useState<SellerType>(listing.sellerType);
  const [isFeatured, setIsFeatured] = useState(Boolean(listing.isFeatured));
  const [isPremium, setIsPremium] = useState(Boolean(listing.isPremium));

  const [mediaItems, setMediaItems] = useState<ListingMediaItem[]>(() =>
    propertyToListingMedia(listing),
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  function applyDeal(next: DealSelection) {
    setDealSelection(next);
    setTransactionType(next.transactionType);
    setPropertyType(listingCategoryToPropertyType(next.category));
    if (next.transactionType === "sale") {
      setPricePeriod("");
    } else if (!pricePeriod) {
      setPricePeriod("month");
    }
  }

  function toggleAmenity(key: AmenityKey) {
    setAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function buildPayload(action: "save" | "publish" | "reject" | "reopen") {
    const priceNum = Number(price);
    return {
      action,
      slug,
      title,
      summary,
      description,
      transactionType,
      propertyType,
      price: priceNum,
      currency,
      pricePeriod:
        transactionType === "sale"
          ? null
          : pricePeriod === "month" || pricePeriod === "night" || pricePeriod === "year"
            ? pricePeriod
            : null,
      bedrooms: parseOptionalNumber(bedrooms),
      bathrooms: parseOptionalNumber(bathrooms),
      areaSqm: parseOptionalNumber(areaSqm),
      landSqm: parseOptionalNumber(landSqm),
      furnishing: furnishing || null,
      amenities: [...amenities],
      verification,
      sellerType,
      isFeatured,
      isPremium,
      countryCode,
      city,
      citySlug,
      district,
      districtSlug,
      commune: commune || "—",
      communeSlug: communeSlug || slugifyField(commune || "area"),
      address,
      lat: parseOptionalNumber(lat) ?? 0,
      lng: parseOptionalNumber(lng) ?? 0,
      mediaItems,
    };
  }

  async function submit(action: "save" | "publish" | "reject" | "reopen") {
    setLoading(action);
    setError("");
    const res = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(action)),
    });
    setLoading(null);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not update listing");
      return;
    }
    router.push(adminDeskPath("listings"));
    router.refresh();
  }

  const showBedBath = propertyType !== "land";
  const countryName = getCountryByCode(countryCode)?.name ?? listing.location.country;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit("save");
      }}
    >
      <p className="text-sm text-[var(--color-muted)]">
        Status: <strong className="text-[var(--color-text)]">{listing.status}</strong>
        {dealSelection ? (
          <>
            {" "}
            · <span className="text-[var(--color-accent-soft)]">{formatDealSelection(dealSelection)}</span>
          </>
        ) : null}
      </p>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Category &amp; deal type</h2>
        <ListPropertyDealStep value={dealSelection} onChange={applyDeal} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="mod-transaction">Transaction</Label>
            <Select
              id="mod-transaction"
              value={transactionType}
              onChange={(e) => {
                const next = e.target.value as TransactionType;
                setTransactionType(next);
                if (next === "sale") setPricePeriod("");
              }}
            >
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {transactionLabels[t]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="mod-property-type">Property type</Label>
            <Select
              id="mod-property-type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {propertyTypeLabels[t]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Location</h2>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="mod-country">Country</Label>
            <Select
              id="mod-country"
              className="notranslate max-h-none"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            >
              {worldCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="mod-city">City</Label>
              <Input
                id="mod-city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setCitySlug(slugifyField(e.target.value));
                }}
              />
            </div>
            <div>
              <Label htmlFor="mod-city-slug">City slug</Label>
              <Input id="mod-city-slug" value={citySlug} onChange={(e) => setCitySlug(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="mod-district">District</Label>
              <Input
                id="mod-district"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setDistrictSlug(slugifyField(e.target.value));
                }}
              />
            </div>
            <div>
              <Label htmlFor="mod-district-slug">District slug</Label>
              <Input
                id="mod-district-slug"
                value={districtSlug}
                onChange={(e) => setDistrictSlug(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="mod-commune">Commune / sangkat</Label>
              <Input
                id="mod-commune"
                value={commune}
                onChange={(e) => {
                  setCommune(e.target.value);
                  setCommuneSlug(slugifyField(e.target.value));
                }}
              />
            </div>
            <div>
              <Label htmlFor="mod-commune-slug">Commune slug</Label>
              <Input
                id="mod-commune-slug"
                value={communeSlug}
                onChange={(e) => setCommuneSlug(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="mod-address">Address / area note</Label>
            <Input id="mod-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="mod-lat">Latitude</Label>
              <Input id="mod-lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="mod-lng">Longitude</Label>
              <Input id="mod-lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            Preview: {address}
            {commune ? `, ${commune}` : ""}, {district}, {city}, {countryName}
          </p>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Pricing &amp; size</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="mod-price">Price</Label>
            <Input id="mod-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="mod-currency">Currency</Label>
            <Select id="mod-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {["USD", "KHR"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          {transactionType !== "sale" ? (
            <div>
              <Label htmlFor="mod-price-period">Price period</Label>
              <Select
                id="mod-price-period"
                value={pricePeriod}
                onChange={(e) => setPricePeriod(e.target.value)}
              >
                <option value="month">Month</option>
                <option value="night">Night</option>
                <option value="year">Year</option>
              </Select>
            </div>
          ) : null}
          {showBedBath ? (
            <>
              <div>
                <Label htmlFor="mod-bedrooms">Bedrooms</Label>
                <Input
                  id="mod-bedrooms"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mod-bathrooms">Bathrooms</Label>
                <Input
                  id="mod-bathrooms"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </div>
            </>
          ) : null}
          <div>
            <Label htmlFor="mod-area">{propertyType === "land" ? "Land area (m²)" : "Area (m²)"}</Label>
            <Input id="mod-area" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="mod-land">Land size (m²)</Label>
            <Input id="mod-land" value={landSqm} onChange={(e) => setLandSqm(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="mod-furnishing">Furnishing</Label>
            <Select
              id="mod-furnishing"
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value as Furnishing | "")}
            >
              <option value="">Not set</option>
              {FURNISHING_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {furnishingLabels[f]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Listing copy</h2>
        <div>
          <Label htmlFor="mod-slug">URL slug</Label>
          <Input id="mod-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="mod-title">Title</Label>
          <Input id="mod-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="mod-summary">Summary</Label>
          <Input id="mod-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="mod-description">Description</Label>
          <Textarea
            id="mod-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Amenities</h2>
        <ul className="flex flex-wrap gap-2">
          {amenityOptions.map(({ value, label }) => {
            const on = amenities.has(value);
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => toggleAmenity(value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    on
                      ? "border-[rgba(212,175,55,0.75)] bg-[var(--color-mist)]"
                      : "border-[var(--color-border)] hover:border-[rgba(212,175,55,0.45)]",
                  )}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Photos &amp; video</h2>
        <ListPropertyMediaStep
          items={mediaItems}
          onChange={setMediaItems}
          listingTitle={title || listing.title}
        />
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Platform flags</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="mod-verification">Verification</Label>
            <Select
              id="mod-verification"
              value={verification}
              onChange={(e) => setVerification(e.target.value as VerificationStatus)}
            >
              {VERIFICATION_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {verificationLabels[v]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="mod-seller">Seller type</Label>
            <Select
              id="mod-seller"
              value={sellerType}
              onChange={(e) => setSellerType(e.target.value as SellerType)}
            >
              {SELLER_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Featured listing
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
            />
            Premium badge
          </label>
        </div>
      </section>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
        <Button type="submit" variant="outline" disabled={loading != null}>
          {loading === "save" ? "Saving…" : "Save edits"}
        </Button>
        <Button type="button" disabled={loading != null} onClick={() => void submit("publish")}>
          {loading === "publish" ? "Publishing…" : "Approve & publish"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading != null}
          onClick={() => void submit("reject")}
        >
          {loading === "reject" ? "Rejecting…" : "Reject"}
        </Button>
        {listing.status === "rejected" ? (
          <Button
            type="button"
            variant="outline"
            disabled={loading != null}
            onClick={() => void submit("reopen")}
          >
            {loading === "reopen" ? "Re-opening…" : "Re-open (pending)"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
