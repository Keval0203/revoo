export interface FacilityLocation {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Validates whether latitude and longitude coordinates are valid numbers
 * within valid geographic ranges (-90 to 90 for lat, -180 to 180 for lng).
 */
export function isValidCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * Generates a Google Maps directions URL for a given facility location.
 * - Uses coordinates if valid.
 * - Falls back to formatted address string if coordinates are missing/invalid.
 * - Returns null if neither coordinates nor address fields exist.
 */
export function getGoogleMapsDirectionsUrl(
  facility: FacilityLocation | null | undefined
): string | null {
  if (!facility) return null;

  const { latitude, longitude, name, address, city, state, country } = facility;

  // Case 1: Valid latitude & longitude coordinates
  if (isValidCoordinates(latitude, longitude)) {
    const params = new URLSearchParams({
      api: '1',
      destination: `${latitude},${longitude}`,
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  // Case 2: Address fallback
  const addressParts = [name, address, city, state, country]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0);

  if (addressParts.length === 0) {
    return null;
  }

  const destinationAddress = addressParts.join(', ');
  const params = new URLSearchParams({
    api: '1',
    destination: destinationAddress,
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
