/** When false, the site serves no property listings (public, agent, or admin). */
export const PROPERTY_LISTINGS_ENABLED = false;

export function propertyListingsEnabled(): boolean {
  return PROPERTY_LISTINGS_ENABLED;
}

export const LISTINGS_DISABLED_MESSAGE =
  "Property listings are not published on this site. Contact SEAPS for tailored options.";
