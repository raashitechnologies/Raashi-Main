/**
 * Return the D1-backed application ID used by both list and detail endpoints.
 * Never interpolate an absent value into a route: `/undefined` and `/null`
 * would otherwise look like valid detail URLs and hide a malformed API record.
 */
export function getApplicationId(
  application: { id?: unknown },
  context: string,
): string | null {
  const id = application.id;

  if (
    typeof id === "string" &&
    id.trim().length > 0 &&
    id !== "undefined" &&
    id !== "null"
  ) {
    return id;
  }

  if (import.meta.env.DEV) {
    // Deliberately omit applicant data from the diagnostic; the field list is
    // enough to identify an API-contract problem during development.
    console.error("Malformed application record: missing a valid id", {
      context,
      receivedId: id,
      fields: Object.keys(application),
    });
  }

  return null;
}
