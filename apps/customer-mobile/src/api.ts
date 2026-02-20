const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const apiBase = () => (API_BASE ? `${API_BASE.replace(/\/$/, '')}/api` : '');

/** Call before login to verify the app can reach the API. Throws with a clear message if not. */
export async function testConnection(): Promise<void> {
  const base = apiBase();
  if (!base) throw new Error('EXPO_PUBLIC_API_URL is not set in .env. Restart Expo after adding it.');
  const res = await fetch(`${base.replace(/\/api$/, '')}/api`, { method: 'GET' });
  if (!res.ok) throw new Error(`Server returned ${res.status}. API may be starting.`);
}

/** Public branding for welcome screen and login T&C/Privacy. No auth. */
export interface PublicBrandingResponse {
  businessName: string | null;
  logoUrl: string | null;
  termsAndConditions: string | null;
  privacyPolicy: string | null;
  /** Welcome screen background image (shown at 50% opacity). */
  welcomeBackgroundUrl: string | null;
}

export async function getPublicBranding(): Promise<PublicBrandingResponse> {
  const base = apiBase();
  if (!base) return { businessName: null, logoUrl: null, termsAndConditions: null, privacyPolicy: null, welcomeBackgroundUrl: null };
  try {
    const res = await fetch(`${base}/branding/public`);
    if (!res.ok) return { businessName: null, logoUrl: null, termsAndConditions: null, privacyPolicy: null, welcomeBackgroundUrl: null };
    const data = (await res.json()) as PublicBrandingResponse;
    return {
      businessName: data.businessName ?? null,
      logoUrl: data.logoUrl ?? null,
      termsAndConditions: data.termsAndConditions ?? null,
      privacyPolicy: data.privacyPolicy ?? null,
      welcomeBackgroundUrl: data.welcomeBackgroundUrl ?? null,
    };
  } catch {
    return { businessName: null, logoUrl: null, termsAndConditions: null, privacyPolicy: null, welcomeBackgroundUrl: null };
  }
}

/** Build full URL for branding logo or welcome background. API returns relative path (e.g. /api/assets/branding/xxx); prepend API base so the mobile app can load the image. */
export function brandingLogoFullUrl(logoUrl: string | null): string | null {
  if (!logoUrl?.trim()) return null;
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
  const base = API_BASE ? API_BASE.replace(/\/$/, '') : '';
  if (!base) return null;
  const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
  return `${base}${path}`;
}

/** Full URL for welcome background (same as logo URL builder). */
export function brandingWelcomeBackgroundFullUrl(url: string | null): string | null {
  return brandingLogoFullUrl(url);
}

/** Public carousel for home screen. No auth. */
export interface PublicCarouselResponse {
  imageUrls: string[];
}

export async function getPublicCarousel(): Promise<PublicCarouselResponse> {
  const base = apiBase();
  if (!base) return { imageUrls: [] };
  try {
    const res = await fetch(`${base}/carousel/public`);
    if (!res.ok) return { imageUrls: [] };
    const data = (await res.json()) as PublicCarouselResponse;
    return { imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [] };
  } catch {
    return { imageUrls: [] };
  }
}

/** Build full URL for carousel image (imageUrl from API is e.g. /api/assets/carousel/xxx). */
export function carouselImageFullUrl(imageUrl: string): string {
  if (!imageUrl?.trim()) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  const base = API_BASE ? API_BASE.replace(/\/$/, '') : '';
  if (!base) return imageUrl;
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${base}${path}`;
}

// --- Auth (Twilio via backend) ---
export interface VerifyOtpResponse {
  token: string;
  user: { id: string; phone: string; role: string };
}

const REQUEST_TIMEOUT_MS = 15000;

async function parseErrorResponse(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return data.message ?? res.statusText ?? `Request failed (${res.status})`;
  } catch {
    return res.statusText || `Request failed (${res.status})`;
  }
}

export async function requestOtp(phone: string): Promise<{ requestId: string }> {
  const base = apiBase();
  if (!base) {
    throw new Error(
      'API URL not set. Add EXPO_PUBLIC_API_URL in apps/customer-mobile/.env (e.g. http://YOUR_PC_IP:3006), then restart Expo.'
    );
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/auth/customer/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const msg = await parseErrorResponse(res);
      throw new Error(msg);
    }
    return res.json() as Promise<{ requestId: string }>;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error(
          'Request timed out. Check: 1) API running (npm run dev:api:3006) 2) EXPO_PUBLIC_API_URL in .env = http://YOUR_PC_IP:3006 3) Phone on same WiFi. Restart Expo after .env change.'
        );
      }
      if (err.message === 'Network request failed' || err.message.includes('Network')) {
        throw new Error(
          'Cannot reach server. In .env set EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3006 (run ipconfig for IP). Same WiFi, API running. Restart Expo.'
        );
      }
    }
    throw err;
  }
}

export async function verifyOtp(
  phone: string,
  otp: string,
  requestId?: string
): Promise<VerifyOtpResponse> {
  const base = apiBase();
  if (!base) throw new Error('API URL not set. Set EXPO_PUBLIC_API_URL in .env and restart Expo.');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/auth/customer/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone.trim(),
        otp,
        requestId: requestId ?? phone.trim(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const msg = await parseErrorResponse(res);
      throw new Error(msg);
    }
    return res.json() as Promise<VerifyOtpResponse>;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Verification timed out. Check network and try again.');
    }
    if (err instanceof Error && (err.message === 'Network request failed' || err.message.includes('Network'))) {
      throw new Error('Cannot reach server. Check EXPO_PUBLIC_API_URL and WiFi.');
    }
    throw err;
  }
}

export interface ActiveSubscriptionItem {
  id: string;
  planId: string;
  planName: string;
  planDescription?: string | null;
  /** Address this subscription is tied to (pickup/delivery only at this address). */
  addressId: string | null;
  validityStartDate: string;
  validTill: string;
  remainingPickups: number;
  remainingKg: number | null;
  remainingItems: number | null;
  maxPickups: number;
  kgLimit: number | null;
  itemsLimit: number | null;
  hasActiveOrder: boolean;
}

export interface PastSubscriptionItem {
  id: string;
  planId: string;
  planName: string;
  validityStartDate: string;
  validTill: string;
  inactivatedAt: string;
  remainingPickups: number;
  usedPickups: number;
  maxPickups: number;
  usedKg: number;
  usedItemsCount: number;
  kgLimit: number | null;
  itemsLimit: number | null;
}

export interface MeResponse {
  user: { id: string; phone: string | null; role: string; name: string | null; email: string | null };
  defaultAddress?: { id: string; pincode: string };
  activeSubscriptions?: ActiveSubscriptionItem[];
  pastSubscriptions?: PastSubscriptionItem[];
  activeSubscription?: ActiveSubscriptionItem;
}

export async function getMe(token: string): Promise<MeResponse> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json() as Promise<MeResponse>;
}

export async function updateMe(
  token: string,
  body: { name?: string; email?: string }
): Promise<void> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? 'Failed to update profile');
  }
}

/** Register Expo push token so the backend can send lock-screen notifications (booking confirmed, order picked up, invoice, payment, delivered, etc.). */
export async function registerPushToken(token: string, pushToken: string): Promise<{ ok: boolean }> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/me/push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pushToken }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? 'Failed to register push token');
  }
  return res.json() as Promise<{ ok: boolean }>;
}

export interface BackendAddress {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  houseNo?: string | null;
  streetArea?: string | null;
  city?: string | null;
  pincode: string;
  isDefault: boolean;
  googleMapUrl?: string | null;
}

export async function listAddresses(token: string): Promise<BackendAddress[]> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load addresses');
  return res.json() as Promise<BackendAddress[]>;
}

export async function createAddress(
  token: string,
  body: {
    label: string;
    addressLine: string;
    pincode: string;
    isDefault?: boolean;
    googleMapUrl?: string | null;
    houseNo?: string | null;
    streetArea?: string | null;
    city?: string | null;
  }
): Promise<{ id: string; pincode: string }> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? 'Failed to save address');
  }
  return res.json() as Promise<{ id: string; pincode: string }>;
}

export async function updateAddress(
  token: string,
  id: string,
  body: {
    label?: string;
    addressLine?: string;
    pincode?: string;
    isDefault?: boolean;
    googleMapUrl?: string | null;
    houseNo?: string | null;
    streetArea?: string | null;
    city?: string | null;
  }
): Promise<BackendAddress> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/addresses/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? 'Failed to update address');
  }
  return res.json() as Promise<BackendAddress>;
}

export async function deleteAddress(token: string, id: string): Promise<void> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/addresses/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? 'Failed to delete address');
  }
}

// --- Serviceability & feedback (no auth) ---
export interface ServiceabilityResult {
  pincode: string;
  serviceable: boolean;
  message?: string;
  /** Set when serviceable; branch that serves this pincode. */
  branchId?: string | null;
  branchName?: string | null;
}

export async function checkServiceability(pincode: string): Promise<ServiceabilityResult> {
  const base = apiBase();
  if (!base) {
    return { pincode, serviceable: false, message: 'Backend not linked. Set EXPO_PUBLIC_API_URL in .env and restart the app.' };
  }
  const res = await fetch(`${base}/serviceability?pincode=${encodeURIComponent(pincode)}`);
  const data = (await res.json()) as ServiceabilityResult & { message?: string[]; statusCode?: number };
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message as string) || 'Request failed';
    return { pincode, serviceable: false, message: msg };
  }
  return {
    pincode,
    serviceable: data.serviceable,
    message: data.message,
    branchId: data.branchId ?? undefined,
    branchName: data.branchName ?? undefined,
  };
}

// --- Slot availability (public) ---
export interface SlotAvailability {
  isServiceable: boolean;
  isHoliday: boolean;
  branchName?: string;
  operatingHours?: { startTime: string; endTime: string };
  timeSlots: string[];
}

export async function getSlotAvailability(
  pincode: string,
  date: string
): Promise<SlotAvailability> {
  const base = apiBase();
  if (!base) {
    return { isServiceable: false, isHoliday: false, timeSlots: [] };
  }
  const res = await fetch(
    `${base}/slots/availability?pincode=${encodeURIComponent(pincode)}&date=${encodeURIComponent(date)}`
  );
  const data = (await res.json()) as SlotAvailability;
  return data;
}

// --- Subscription plans (customer JWT) ---
export interface AvailablePlanItem {
  id: string;
  name: string;
  description: string | null;
  redemptionMode: string;
  variant: string;
  validityDays: number;
  maxPickups: number;
  kgLimit: number | null;
  itemsLimit: number | null;
  pricePaise: number;
  isRedeemable: boolean;
  reason?: 'ALREADY_REDEEMED';
  /** Empty = plan for all branches. Non-empty = plan only for these branch IDs. */
  branchIds?: string[];
}

export async function getAvailablePlans(token: string): Promise<AvailablePlanItem[]> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/subscriptions/plans/available`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load subscription plans');
  return res.json() as Promise<AvailablePlanItem[]>;
}

export interface PurchaseSubscriptionResult {
  subscriptionId: string;
  planName: string;
  validityStartDate: string;
  validTill: string;
  remainingPickups: number;
}

export async function purchaseSubscription(
  token: string,
  planId: string,
  addressId: string
): Promise<PurchaseSubscriptionResult> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId, addressId }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string; code?: string };
    throw new Error(err.message ?? 'Purchase failed');
  }
  return res.json() as Promise<PurchaseSubscriptionResult>;
}

/** Subscription detail for Plans → tap on a plan (active or completed). */
export interface SubscriptionDetailResponse {
  id: string;
  planId: string;
  planName: string | null;
  planDescription: string | null;
  active: boolean;
  validityStartDate: string;
  validTill: string;
  remainingPickups: number;
  remainingKg: number | null;
  remainingItems: number | null;
  maxPickups: number;
  kgLimit: number | null;
  itemsLimit: number | null;
  usedKg: number;
  usedItemsCount: number;
  addressId: string | null;
  /** PAID = admin confirmed payment; DUE = not yet confirmed. */
  paymentStatus: 'PAID' | 'DUE';
  invoice: { id: string; code: string; pdfUrl: string | null; issuedAt: string | null } | null;
}

export async function getSubscriptionDetail(token: string, subscriptionId: string): Promise<SubscriptionDetailResponse | null> {
  const base = apiBase();
  if (!base) return null;
  const res = await fetch(`${base}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<SubscriptionDetailResponse>;
}

// --- Orders (customer JWT) ---
export interface OrderSummary {
  id: string;
  status: string;
  serviceType: string;
  orderType?: string;
  orderSource?: string | null;
  subscriptionId?: string | null;
  pickupDate: string;
  timeWindow: string;
  createdAt: string;
  /** Amount to collect (paise); from final invoice when issued, else ACK. */
  amountToPayPaise?: number | null;
  /** Payment status: CAPTURED = paid, PENDING/DUE = unpaid, FAILED = payment failed. */
  paymentStatus?: string;
  /** Address ID for this order (used to block edit/delete of address when it has active orders). */
  addressId?: string;
  /** Subscription utilisation from invoice (ACK or final): weight in kg. */
  subscriptionUsageKg?: number | null;
  /** Subscription utilisation from invoice: items count. */
  subscriptionUsageItems?: number | null;
}

export interface OrderDetail extends OrderSummary {
  orderType: string;
  serviceTypes: string[];
  addressId: string;
  pincode: string;
  estimatedWeightKg: number | null;
  actualWeightKg: number | null;
  confirmedAt: string | null;
  pickedUpAt: string | null;
  inProgressAt: string | null;
  readyAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  /** CAPTURED = paid. */
  paymentStatus?: string;
}

/** Invoice line item (amounts in paise). */
export interface OrderInvoiceItem {
  id: string;
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface OrderInvoice {
  id: string;
  type: string;
  status: string;
  subtotal?: number;
  tax?: number;
  total: number;
  discountPaise?: number;
  issuedAt: string | null;
  pdfUrl: string;
  items?: OrderInvoiceItem[];
}

export async function createOrder(
  token: string,
  body: {
    addressId: string;
    pickupDate: string;
    timeWindow: string;
    selectedServices?: string[];
    estimatedWeightKg?: number;
    /** For subscription booking: use existing subscription. */
    orderType?: 'INDIVIDUAL' | 'SUBSCRIPTION';
    subscriptionId?: string | null;
  }
): Promise<{ orderId: string }> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const orderType = body.orderType ?? (body.subscriptionId ? 'SUBSCRIPTION' : 'INDIVIDUAL');
  const payload: Record<string, unknown> = {
    orderType,
    addressId: body.addressId,
    pickupDate: body.pickupDate,
    timeWindow: body.timeWindow,
    estimatedWeightKg: body.estimatedWeightKg ?? undefined,
  };
  if (orderType === 'SUBSCRIPTION' && body.subscriptionId) {
    payload.subscriptionId = body.subscriptionId;
  } else {
    payload.selectedServices = body.selectedServices ?? ['WASH_FOLD'];
  }
  const res = await fetch(`${base}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json()) as { message?: string; error?: { message?: string | string[] } };
    const msg = body?.error?.message ?? body?.message;
    const str = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create order');
    throw new Error(str);
  }
  return res.json() as Promise<{ orderId: string }>;
}

export async function listOrders(token: string): Promise<OrderSummary[]> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json() as Promise<OrderSummary[]>;
}

export async function getOrder(token: string, orderId: string): Promise<OrderDetail> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load order');
  return res.json() as Promise<OrderDetail>;
}

export async function listOrderInvoices(
  token: string,
  orderId: string
): Promise<OrderInvoice[]> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/orders/${orderId}/invoices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load invoices');
  return res.json() as Promise<OrderInvoice[]>;
}

/** Full URL to open invoice PDF (used with Bearer token). */
export function invoicePdfUrl(invoiceId: string): string {
  const base = apiBase();
  return base ? `${base}/invoices/${invoiceId}/pdf` : '';
}

/** Fetch invoice PDF with auth and return as base64 for in-app preview (WebView often cannot display PDF from URL on mobile). */
export async function fetchInvoicePdfBase64(invoiceId: string, token: string): Promise<string> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const url = `${base}/invoices/${invoiceId}/pdf`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load invoice');
  const arrayBuffer = await res.arrayBuffer();
  const { encode: encodeBase64 } = await import('base64-arraybuffer');
  return encodeBase64(arrayBuffer);
}

export async function submitAreaRequest(body: {
  pincode: string;
  addressLine: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}): Promise<{ id: string; status: string }> {
  const base = apiBase();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}/feedback/area-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? 'Failed to submit request');
  }
  return res.json() as Promise<{ id: string; status: string }>;
}

