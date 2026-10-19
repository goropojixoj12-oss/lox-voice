"use client";

import type { PropertyType, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ListingCategory = "land" | "residential" | "commercial" | "development";

export type DealSelection = {
  transactionType: TransactionType;
  category: ListingCategory;
};

type DealOption = {
  category: ListingCategory;
  label: string;
  hint: string;
};

type DealGroup = {
  transactionType: "sale" | "rent";
  title: string;
  subtitle: string;
  options: DealOption[];
};

export const LIST_PROPERTY_DEAL_GROUPS: DealGroup[] = [
  {
    transactionType: "sale",
    title: "Sale",
    subtitle: "List inventory for purchase or investment.",
    options: [
      {
        category: "land",
        label: "Land",
        hint: "Plots, tenure land, and development sites",
      },
      {
        category: "residential",
        label: "Residential",
        hint: "Homes, apartments, villas, and townhouses",
      },
      {
        category: "commercial",
        label: "Commercial",
        hint: "Offices, retail, shophouses, and warehouses",
      },
      {
        category: "development",
        label: "Development",
        hint: "New projects and off-plan units",
      },
    ],
  },
  {
    transactionType: "rent",
    title: "Rent",
    subtitle: "Long-term leases across Cambodia.",
    options: [
      {
        category: "land",
        label: "Land",
        hint: "Land leases and commercial plots",
      },
      {
        category: "residential",
        label: "Residential",
        hint: "Apartments, houses, and serviced homes",
      },
      {
        category: "commercial",
        label: "Commercial",
        hint: "Office floors, retail, and industrial space",
      },
    ],
  },
];

export function listingCategoryToPropertyType(category: ListingCategory): PropertyType {
  switch (category) {
    case "land":
      return "land";
    case "residential":
      return "apartment";
    case "commercial":
      return "commercial";
    case "development":
      return "project_unit";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function formatDealSelection(selection: DealSelection): string {
  const group = LIST_PROPERTY_DEAL_GROUPS.find((g) => g.transactionType === selection.transactionType);
  const option = group?.options.find((o) => o.category === selection.category);
  const deal = selection.transactionType === "sale" ? "Sale" : "Rent";
  return `${deal} · ${option?.label ?? selection.category}`;
}

type ListPropertyDealStepProps = {
  value: DealSelection | null;
  onChange: (next: DealSelection) => void;
};

export function ListPropertyDealStep({ value, onChange }: ListPropertyDealStepProps) {
  return (
    <div className="space-y-8">
      {LIST_PROPERTY_DEAL_GROUPS.map((group) => (
        <section key={group.transactionType}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[rgba(212,175,55,0.25)] pb-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
              {group.title}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">{group.subtitle}</p>
          </div>
          <ul
            className={cn(
              "mt-4 grid gap-3",
              group.transactionType === "sale" ? "sm:grid-cols-2" : "sm:grid-cols-3",
            )}
          >
            {group.options.map((option) => {
              const selected =
                value?.transactionType === group.transactionType &&
                value?.category === option.category;
              return (
                <li key={`${group.transactionType}-${option.category}`}>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        transactionType: group.transactionType,
                        category: option.category,
                      })
                    }
                    className={cn(
                      "h-full w-full rounded-[var(--radius-lg)] border px-4 py-4 text-left transition",
                      selected
                        ? "border-[rgba(212,175,55,0.75)] bg-[var(--color-mist)]/50 shadow-[0_0_0_1px_rgba(212,175,55,0.35)]"
                        : "border-[var(--color-border)] hover:border-[rgba(212,175,55,0.45)] hover:bg-[var(--color-mist)]/25",
                    )}
                  >
                    <span className="block font-semibold text-[var(--color-text)]">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-[var(--color-muted)]">
                      {option.hint}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
