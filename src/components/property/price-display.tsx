import { formatPrice } from "@/lib/utils";
import type { Property } from "@/lib/types";

export function PriceDisplay({
  property,
  className,
}: {
  property: Pick<Property, "price" | "currency" | "pricePeriod">;
  className?: string;
}) {
  return (
    <p className={className}>
      {formatPrice(property.price, property.currency, {
        period: property.pricePeriod,
        compact: property.price >= 1_000_000,
      })}
    </p>
  );
}
