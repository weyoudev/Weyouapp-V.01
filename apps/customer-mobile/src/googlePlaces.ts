const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export interface PlaceDetails {
  addressLine: string;
  pincode: string;
  googlePlaceUrl: string;
}

export async function fetchPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  if (!GOOGLE_API_KEY || !query.trim()) return [];
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmed)}&key=${GOOGLE_API_KEY}&components=country:in`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      predictions?: { place_id: string; description: string }[];
      status?: string;
    };
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];
    return (data.predictions ?? []).map((p) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  } catch {
    return [];
  }
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_API_KEY || !placeId) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_address,address_components&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      result?: {
        formatted_address?: string;
        address_components?: { long_name: string; short_name: string; types: string[] }[];
      };
      status?: string;
    };
    if (data.status !== 'OK' || !data.result) return null;
    const addr = data.result.formatted_address ?? '';
    const components = data.result.address_components ?? [];
    const postal = components.find((c) => c.types.includes('postal_code'));
    const pincode = postal?.long_name ?? '';
    const googlePlaceUrl = `https://www.google.com/maps/place?q=place_id:${placeId}`;
    return {
      addressLine: addr,
      pincode,
      googlePlaceUrl,
    };
  } catch {
    return null;
  }
}

/** Extract lat,lng from a Google Maps URL. Supports @lat,lng, ?q=lat,lng, and !3dlat!4dlng (place URLs). */
export function parseLatLngFromMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  // Format 1: @lat,lng or @lat,lng,zoom (e.g. /@12.97,77.59,15z)
  let match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  // Format 2: !3dLAT!4dLNG (place page embedded data)
  match = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  // Format 3: ?q=lat,lng or &q=lat,lng
  match = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  return null;
}

export interface ReverseGeocodeResult {
  addressLine: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
}

/** Reverse geocode lat,lng using OpenStreetMap Nominatim (no API key required). */
export async function reverseGeocodeNominatim(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'WeYouApp/1.0 (address lookup)' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: {
        road?: string;
        house_number?: string;
        neighbourhood?: string;
        suburb?: string;
        village?: string;
        town?: string;
        city?: string;
        state_district?: string;
        state?: string;
        postcode?: string;
        country?: string;
      };
      display_name?: string;
    };
    const addr = data.address ?? {};
    const streetPart = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const street = streetPart || addr.road || '';
    const area = addr.neighbourhood ?? addr.suburb ?? addr.village ?? addr.state_district ?? '';
    const city = addr.city ?? addr.town ?? addr.village ?? addr.state_district ?? addr.state ?? '';
    const pincode = addr.postcode ?? '';
    const addressLine =
      data.display_name ??
      [street, area, city, addr.state, addr.country].filter(Boolean).join(', ');
    return {
      addressLine,
      street,
      area,
      city,
      pincode,
    };
  } catch {
    return null;
  }
}

/** Reverse geocode lat,lng to address components using Google Geocoding API (requires API key). */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      results?: {
        formatted_address?: string;
        address_components?: { long_name: string; short_name: string; types: string[] }[];
      }[];
      status?: string;
    };
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    const result = data.results[0];
    const components = result.address_components ?? [];
    const get = (...types: string[]) => components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? '';
    const streetNumber = get('street_number');
    const route = get('route');
    const street = [streetNumber, route].filter(Boolean).join(' ');
    const sublocality = get('sublocality', 'sublocality_level_1', 'neighborhood');
    const locality = get('locality');
    const city = locality || get('administrative_area_level_2');
    const area = sublocality || locality || city;
    const pincode = get('postal_code');
    const addressLine = result.formatted_address ?? [street, area, city].filter(Boolean).join(', ');
    return {
      addressLine,
      street,
      area,
      city,
      pincode,
    };
  } catch {
    return null;
  }
}

/** Reverse geocode: uses Nominatim (no key) first; falls back to Google if key is set and Nominatim returns empty. */
export async function reverseGeocodeAddress(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const fromNominatim = await reverseGeocodeNominatim(lat, lng);
  if (fromNominatim && (fromNominatim.addressLine || fromNominatim.city || fromNominatim.pincode))
    return fromNominatim;
  return reverseGeocode(lat, lng);
}
