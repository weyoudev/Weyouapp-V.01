'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import { z } from 'zod';
import { ExternalLink } from 'lucide-react';
import { TIME_SLOT_OPTIONS, DEFAULT_TIME_SLOT } from '@/lib/time-slots';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AddressRecord = { id: string; label?: string; addressLine?: string; pincode: string };

const SERVICE_TYPES = [
  'WASH_FOLD',
  'WASH_IRON',
  'STEAM_IRON',
  'DRY_CLEAN',
  'HOME_LINEN',
  'SHOES',
  'ADD_ONS',
] as const;
const OTP_DEV = '123456';

/** Check if pincode is serviceable (public API, no auth). */
async function checkServiceability(
  pincode: string
): Promise<{ serviceable: boolean; message?: string }> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/serviceability?pincode=${encodeURIComponent(pincode)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return {
      serviceable: !!data?.serviceable,
      message: data?.message,
    };
  } catch {
    return { serviceable: false, message: 'Could not check serviceability' };
  }
}

async function apiWithToken<T>(
  method: string,
  path: string,
  customerToken: string,
  body?: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: unknown }> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = data?.error?.message ?? `HTTP ${res.status}`;
      return { ok: false, error: new Error(msg) };
    }
    return { ok: true, data: data as T };
  } catch (e) {
    return { ok: false, error: e };
  }
}

type PlanRecord = {
  id: string;
  name: string;
  validityDays: number;
  maxPickups: number;
  pricePaise: number;
  isRedeemable: boolean;
  reason?: 'ALREADY_REDEEMED';
};

function BuySubscriptionCard({
  customerToken,
  activePlanIds = [],
  onPurchased,
  onError,
}: {
  customerToken: string;
  /** Plan IDs the customer already has an active subscription for; these will be disabled. */
  activePlanIds?: string[];
  onPurchased: () => void;
  onError: (err: unknown) => void;
}) {
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [fetchPlansLoading, setFetchPlansLoading] = useState(false);
  const [paymentGateOpen, setPaymentGateOpen] = useState(false);

  const loadPlans = useCallback(async () => {
    setFetchPlansLoading(true);
    onError(null);
    const result = await apiWithToken<PlanRecord[]>('GET', '/subscriptions/plans/available', customerToken);
    setFetchPlansLoading(false);
    if (result.ok) setPlans(result.data);
    else onError(result.error);
  }, [customerToken, onError]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (selectedPlanId && activePlanIds.includes(selectedPlanId)) {
      setSelectedPlanId(null);
    }
  }, [activePlanIds, selectedPlanId]);

  useEffect(() => {
    const notRedeemable = plans.find((p) => p.id === selectedPlanId && !p.isRedeemable);
    if (notRedeemable) setSelectedPlanId(null);
  }, [plans, selectedPlanId]);

  const doPurchase = async (paymentSuccess: boolean) => {
    if (!selectedPlanId) return;
    setPaymentGateOpen(false);
    if (!paymentSuccess) {
      toast.error('Payment failed');
      onError(new Error('Payment failed'));
      return;
    }
    setBuyLoading(true);
    onError(null);
    const result = await apiWithToken<{ id: string }>('POST', '/subscriptions', customerToken, { planId: selectedPlanId });
    setBuyLoading(false);
    if (result.ok) {
      toast.success('Subscription activated');
      onPurchased();
    } else {
      const errMsg = result.error instanceof Error ? result.error.message : String(result.error);
      toast.error(errMsg || 'Purchase failed');
      onError(result.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy subscription</CardTitle>
        <CardDescription>
          Fetch plans, select one. Pay & activate opens dummy gateway: choose Payment success or Payment failed. On success, subscription is added to customer profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fetchPlansLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}
        {!fetchPlansLoading && plans.length === 0 && <p className="text-sm text-muted-foreground">No plans available.</p>}
        {!fetchPlansLoading && plans.length > 0 && (
          <>
            <div className="space-y-2">
              {plans.map((p) => {
                const alreadyActive = activePlanIds.includes(p.id);
                const alreadyUsed = !p.isRedeemable && p.reason === 'ALREADY_REDEEMED';
                const disabled = alreadyActive || alreadyUsed;
                return (
                  <label
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 rounded border p-2',
                      disabled ? 'cursor-not-allowed opacity-60 bg-muted/50' : 'cursor-pointer',
                    )}
                  >
                    <input
                      type="radio"
                      name="plan"
                      checked={selectedPlanId === p.id}
                      onChange={() => !disabled && setSelectedPlanId(p.id)}
                      disabled={disabled}
                    />
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {p.validityDays}d · {p.maxPickups} pickups · ₹{(p.pricePaise / 100).toFixed(0)}
                    </span>
                    {alreadyActive && (
                      <span className="ml-auto text-xs font-medium text-muted-foreground">Already active</span>
                    )}
                    {alreadyUsed && !alreadyActive && (
                      <span className="ml-auto text-xs font-medium text-muted-foreground">Already used</span>
                    )}
                  </label>
                );
              })}
            </div>
            <Button
              onClick={() => setPaymentGateOpen(true)}
              disabled={
                buyLoading ||
                !selectedPlanId ||
                (!!selectedPlanId && !plans.find((p) => p.id === selectedPlanId)?.isRedeemable)
              }
            >
              {buyLoading ? 'Purchasing…' : 'Pay & activate'}
            </Button>
            {paymentGateOpen && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-3">
                <p className="text-sm font-medium">Dummy payment gateway</p>
                <p className="text-xs text-muted-foreground">Choose outcome to simulate:</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => doPurchase(true)} disabled={buyLoading}>
                    Payment success
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => doPurchase(false)} disabled={buyLoading}>
                    Payment failed
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPaymentGateOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Parse raw input (e.g. +918971690163 or 8971690163) to { countryCode: '+91', mobile: '10 digits' }. */
function parsePhoneInput(raw: string): { countryCode: string; mobile: string } {
  const digits = raw.replace(/\D/g, '');
  const ten =
    digits.length >= 12 && digits.startsWith('91')
      ? digits.slice(2, 12)
      : digits.slice(-10);
  const mobile = ten.length >= 10 ? ten.slice(0, 10) : ten;
  return { countryCode: '+91', mobile };
}

/** Combine country code + mobile for API (e.g. +91 + 9876543210 => +919876543210). */
function combinePhone(countryCode: string, mobile: string): string {
  const cc = (countryCode.trim().replace(/\D/g, '') || '91').slice(0, 3);
  const prefix = cc ? `+${cc}` : '+91';
  const digits = mobile.replace(/\D/g, '').slice(0, 10);
  return prefix + digits;
}

export default function CustomerSimulatorPage() {
  const searchParams = useSearchParams();
  const phoneFromUrl = searchParams.get('phone') ?? '';
  const parsedFromUrl = parsePhoneInput(phoneFromUrl || '9999999999');
  const [countryCode, setCountryCode] = useState(parsedFromUrl.countryCode);
  const [mobile, setMobile] = useState(parsedFromUrl.mobile.length === 10 ? parsedFromUrl.mobile : '9999999999');
  const phone = combinePhone(countryCode, mobile);
  const [step, setStep] = useState<'login' | 'onboarding' | 'me' | 'address' | 'form' | 'done'>('login');

  useEffect(() => {
    const parsed = parsePhoneInput(phoneFromUrl);
    if (parsed.mobile.length === 10) {
      setCountryCode(parsed.countryCode);
      setMobile(parsed.mobile);
    }
  }, [phoneFromUrl]);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  type ActiveSubItem = {
    id: string;
    planId?: string;
    planName?: string;
    validityStartDate?: string;
    validTill?: string;
    remainingPickups?: number;
    remainingKg?: number | null;
    remainingItems?: number | null;
    maxPickups?: number;
    kgLimit?: number | null;
    itemsLimit?: number | null;
    /** True when this subscription has an order not yet delivered/cancelled. */
    hasActiveOrder?: boolean;
  };
  const [me, setMe] = useState<{
    user: { id: string; phone: string | null; role: string; name?: string | null; email?: string | null };
    defaultAddress?: { id: string; pincode: string };
    /** All active subscriptions (customer picks one per order). */
    activeSubscriptions?: ActiveSubItem[];
    /** First active subscription (backward compat). */
    activeSubscription?: ActiveSubItem;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const BOOKABLE_SERVICES = ['WASH_FOLD', 'WASH_IRON', 'STEAM_IRON', 'DRY_CLEAN'] as const;
  type BookingType = 'subscription' | 'individual';
  const [bookingType, setBookingType] = useState<BookingType>('individual');
  const [selectedServices, setSelectedServices] = useState<(typeof BOOKABLE_SERVICES)[number][]>(['WASH_FOLD']);
  const [timeWindow, setTimeWindow] = useState(DEFAULT_TIME_SLOT);
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [estimatedWeightKg, setEstimatedWeightKg] = useState(3);

  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [addressPincode, setAddressPincode] = useState('');

  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingEmail, setOnboardingEmail] = useState('');

  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  /** When subscription booking: which subscription to use (order is dedicated to this subscription). */
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [addAddressModalOpen, setAddAddressModalOpen] = useState(false);
  const [addAddressLoading, setAddAddressLoading] = useState(false);
  const [confirmOrderOtpOpen, setConfirmOrderOtpOpen] = useState(false);
  const [confirmOrderOtp, setConfirmOrderOtp] = useState('');
  const [confirmOrderOtpLoading, setConfirmOrderOtpLoading] = useState(false);
  const [confirmOrderRequestId, setConfirmOrderRequestId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const isToday = pickupDate === today;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const timeSlotOptions = isToday
    ? TIME_SLOT_OPTIONS.filter((opt) => {
        const [start] = opt.value.split('-');
        const [h, m] = start.split(':').map(Number);
        const slotStartMinutes = h * 60 + m;
        return slotStartMinutes > currentMinutes;
      })
    : TIME_SLOT_OPTIONS;

  const phoneSchema = z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Enter mobile with +91 (e.g. +91 9876543210)');

  const fetchAddresses = useCallback(async () => {
    if (!customerToken) return;
    setAddressesLoading(true);
    const result = await apiWithToken<AddressRecord[]>('GET', '/addresses', customerToken);
    setAddressesLoading(false);
    if (result.ok) {
      // Show only customer's saved addresses; exclude Walk-in addresses (from walk-in order flow).
      const savedAddresses = result.data.filter(
        (a) => (a.label || '').trim().toLowerCase() !== 'walk-in'
      );
      setAddresses(savedAddresses);
      setSelectedAddressId((prev) =>
        prev && savedAddresses.some((a) => a.id === prev) ? prev : savedAddresses[0]?.id ?? null
      );
    }
  }, [customerToken]);

  useEffect(() => {
    if (step === 'form' && customerToken) fetchAddresses();
  }, [step, customerToken, fetchAddresses]);

  useEffect(() => {
    if (me?.defaultAddress && addresses.length > 0 && !selectedAddressId) {
      const defaultId = me.defaultAddress.id;
      if (addresses.some((a) => a.id === defaultId)) setSelectedAddressId(defaultId);
      else setSelectedAddressId(addresses[0]?.id ?? null);
    }
  }, [me?.defaultAddress, addresses, selectedAddressId]);

  useEffect(() => {
    if (isToday && timeSlotOptions.length > 0 && !timeSlotOptions.some((o) => o.value === timeWindow)) {
      setTimeWindow(timeSlotOptions[0]!.value);
    }
  }, [pickupDate]);

  const activeSubscriptions = me?.activeSubscriptions ?? (me?.activeSubscription ? [me.activeSubscription] : []);
  useEffect(() => {
    if (bookingType === 'individual') {
      setSelectedSubscriptionId(null);
      return;
    }
    if (activeSubscriptions.length === 1 && !selectedSubscriptionId && !activeSubscriptions[0]?.hasActiveOrder) {
      setSelectedSubscriptionId(activeSubscriptions[0]!.id);
    }
    if (activeSubscriptions.length > 0 && selectedSubscriptionId && !activeSubscriptions.some((s) => s.id === selectedSubscriptionId)) {
      const firstAvailable = activeSubscriptions.find((s) => !s.hasActiveOrder);
      setSelectedSubscriptionId(firstAvailable?.id ?? null);
    }
    if (selectedSubscriptionId && activeSubscriptions.some((s) => s.id === selectedSubscriptionId && s.hasActiveOrder)) {
      setSelectedSubscriptionId(null);
    }
  }, [bookingType, activeSubscriptions, selectedSubscriptionId]);

  useEffect(() => {
    if (!confirmOrderOtpOpen || !phone) return;
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return;
    let cancelled = false;
    (async () => {
      try {
        const reqRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/customer/otp/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: parsed.data }),
        });
        const reqData = await reqRes.json();
        if (!cancelled && reqRes.ok && reqData?.requestId) {
          setConfirmOrderRequestId(reqData.requestId);
        }
      } catch {
        // ignore; user can still enter dev OTP
      }
    })();
    return () => {
      cancelled = true;
      setConfirmOrderRequestId(null);
    };
  }, [confirmOrderOtpOpen, phone]);

  const handleOtpLogin = async () => {
    setError(null);
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(new Error(parsed.error.errors[0]?.message ?? 'Invalid phone'));
      return;
    }
    setLoading(true);
    try {
      const reqRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/customer/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: parsed.data }),
      });
      const reqData = await reqRes.json();
      if (!reqRes.ok) {
        setError(new Error(reqData?.error?.message ?? `HTTP ${reqRes.status}`));
        return;
      }
      const verifyRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/customer/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: parsed.data,
          otp: OTP_DEV,
          requestId: reqData.requestId,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(new Error(verifyData?.error?.message ?? 'Invalid OTP'));
        return;
      }
      const token = verifyData.token as string;
      setCustomerToken(token);
      const meRes = await apiWithToken<typeof me>('GET', '/me', token);
      if (meRes.ok) {
        setMe(meRes.data);
        const needsOnboarding =
          !meRes.data.user.name?.trim() ||
          !meRes.data.user.email?.trim() ||
          !meRes.data.defaultAddress;
        setStep(needsOnboarding ? 'onboarding' : (meRes.data.defaultAddress ? 'form' : 'address'));
        if (needsOnboarding) {
          setOnboardingName(meRes.data.user.name ?? '');
          setOnboardingEmail(meRes.data.user.email ?? '');
          toast.success('Please complete your profile');
        } else {
          toast.success('Customer logged in');
        }
      } else {
        setStep('me');
        toast.success('Customer logged in');
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToken) return;
    const nameVal = onboardingName.trim();
    const emailVal = onboardingEmail.trim();
    const addressLineVal = addressLine.trim();
    const pincodeVal = addressPincode.trim().replace(/\s/g, '');
    if (!nameVal) {
      setError(new Error('Name is required'));
      return;
    }
    if (!emailVal) {
      setError(new Error('Email is required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setError(new Error('Enter a valid email address'));
      return;
    }
    if (!pincodeVal) {
      setError(new Error('Pincode is required'));
      return;
    }
    if (!/^\d{6}$/.test(pincodeVal)) {
      setError(new Error('Pincode must be exactly 6 digits'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const serviceability = await checkServiceability(pincodeVal);
      if (!serviceability.serviceable) {
        setError(new Error(serviceability.message ?? 'We do not serve this pincode yet.'));
        setLoading(false);
        return;
      }
      const patchRes = await apiWithToken<unknown>('PATCH', '/me', customerToken, {
        name: nameVal,
        email: emailVal,
      });
      if (!patchRes.ok) {
        setError(patchRes.error as Error);
        setLoading(false);
        return;
      }
      const label = addressLabel.trim() || 'Home';
      const createAddrRes = await apiWithToken<{ id: string; pincode: string }>(
        'POST',
        '/addresses',
        customerToken,
        {
          label,
          addressLine: addressLineVal || label,
          pincode: pincodeVal,
          isDefault: true,
        }
      );
      if (!createAddrRes.ok) {
        setError(createAddrRes.error as Error);
        setLoading(false);
        return;
      }
      const meResult = await apiWithToken<typeof me>('GET', '/me', customerToken);
      if (meResult.ok) setMe(meResult.data);
      await fetchAddresses();
      setStep('form');
      toast.success('Profile saved. You can now create an order.');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchMe = async () => {
    if (!customerToken) return;
    setError(null);
    setLoading(true);
    try {
      const result = await apiWithToken<typeof me>('GET', '/me', customerToken);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMe(result.data);
      setStep(result.data.defaultAddress ? 'form' : 'address');
      toast.success('Loaded customer profile');
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const addressIdForOrder = selectedAddressId ?? me?.defaultAddress?.id;

  const doCreateOrder = async () => {
    if (!customerToken || !addressIdForOrder) return;
    const orderType = bookingType === 'subscription' ? 'SUBSCRIPTION' : 'INDIVIDUAL';
    const body: Record<string, unknown> = {
      orderType,
      addressId: addressIdForOrder,
      pickupDate,
      timeWindow,
    };
    if (orderType === 'INDIVIDUAL') {
      body.selectedServices = selectedServices;
      body.estimatedWeightKg = Number(estimatedWeightKg) || undefined;
    } else {
      body.subscriptionId = selectedSubscriptionId!;
    }
    const result = await apiWithToken<{ orderId: string; orderType?: string }>('POST', '/orders', customerToken, body);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrderId(result.data.orderId);
    setStep('done');
    toast.success('Order created');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToken) {
      setError(new Error('Missing customer token'));
      return;
    }
    if (!addressIdForOrder) {
      setError(new Error('Select an address or add one'));
      return;
    }
    if (bookingType === 'individual' && selectedServices.length === 0) {
      setError(new Error('Select at least one service for individual booking'));
      return;
    }
    if (bookingType === 'subscription' && !selectedSubscriptionId) {
      setError(new Error('Select one subscription for this order'));
      return;
    }
    setError(null);
    setConfirmOrderOtp('');
    setConfirmOrderOtpOpen(true);
  };

  const handleConfirmOrderWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpVal = confirmOrderOtp.trim();
    if (!otpVal) {
      setError(new Error('Enter OTP'));
      return;
    }
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(new Error('Invalid phone in session'));
      return;
    }
    setError(null);
    setConfirmOrderOtpLoading(true);
    try {
      let requestId = confirmOrderRequestId;
      if (!requestId) {
        const reqRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/customer/otp/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: parsed.data }),
        });
        const reqData = await reqRes.json();
        if (!reqRes.ok) {
          setError(new Error(reqData?.error?.message ?? `HTTP ${reqRes.status}`));
          setConfirmOrderOtpLoading(false);
          return;
        }
        requestId = reqData.requestId;
      }
      const verifyRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/customer/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: parsed.data,
          otp: otpVal,
          requestId,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(new Error(verifyData?.error?.message ?? 'Invalid OTP'));
        setConfirmOrderOtpLoading(false);
        return;
      }
      setConfirmOrderOtpOpen(false);
      setConfirmOrderOtp('');
      setConfirmOrderRequestId(null);
      await doCreateOrder();
    } catch (e) {
      setError(e);
    } finally {
      setConfirmOrderOtpLoading(false);
    }
  };

  const closeConfirmOrderOtpDialog = () => {
    setConfirmOrderOtpOpen(false);
    setConfirmOrderOtp('');
    setConfirmOrderRequestId(null);
    setError(null);
  };

  const handleAddAddress = async (e: React.FormEvent, fromModal: boolean) => {
    e.preventDefault();
    if (!customerToken) return;
    const label = addressLabel.trim() || 'Home';
    const addressLineVal = addressLine.trim();
    const pincodeVal = addressPincode.trim().replace(/\s/g, '');
    if (!pincodeVal) {
      setError(new Error('Pincode is required'));
      return;
    }
    if (!/^\d{6}$/.test(pincodeVal)) {
      setError(new Error('Pincode must be exactly 6 digits'));
      return;
    }
    setError(null);
    const setBusy = fromModal ? setAddAddressLoading : setLoading;
    setBusy(true);
    try {
      const serviceability = await checkServiceability(pincodeVal);
      if (!serviceability.serviceable) {
        const msg = serviceability.message || 'We do not serve this pincode yet.';
        setError(new Error(msg));
        toast.error('Non-serviceable area');
        if (!fromModal) window.alert(`Non-serviceable area.\n\n${msg}\n\nPlease enter a pincode we serve.`);
        setBusy(false);
        return;
      }
      const result = await apiWithToken<{ id: string; pincode: string }>(
        'POST',
        '/addresses',
        customerToken,
        { label, addressLine: addressLineVal || label, pincode: pincodeVal, isDefault: true }
      );
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
      toast.success('Address added.');
      const meResult = await apiWithToken<typeof me>('GET', '/me', customerToken);
      if (meResult.ok) setMe(meResult.data);
      if (fromModal) {
        await fetchAddresses();
        setSelectedAddressId(result.data.id);
        setAddAddressModalOpen(false);
        setAddressLabel('Home');
        setAddressLine('');
        setAddressPincode('');
      } else {
        setStep('form');
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Walk-in customer</h1>
      <p className="text-sm text-muted-foreground">
        Simulate customer OTP login, load /api/me, and create an order. Uses customer token in memory only (no admin logout).
      </p>

      {step === 'login' && (
        <Card>
          <CardHeader>
            <CardTitle>1. Customer OTP login</CardTitle>
            <CardDescription>Country code and mobile number. OTP (dev: 123456)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="tel"
                value={countryCode}
                onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 3);
                setCountryCode(d ? '+' + d : '+91');
              }}
                placeholder="+91"
                className="w-24 shrink-0"
                disabled={loading}
              />
              <Input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                maxLength={10}
                disabled={loading}
                className="flex-1"
              />
            </div>
            <Button onClick={handleOtpLogin} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit'}
            </Button>
            {error && <ErrorDisplay error={error} />}
          </CardContent>
        </Card>
      )}

      {step === 'onboarding' && (
        <Card>
          <CardHeader>
            <CardTitle>Complete your profile</CardTitle>
            <CardDescription>
              Enter your name, email and initial address (with pincode and location). Select Home or Office. You need this before creating an order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name *</label>
                <Input
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  placeholder="Your name"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email ID *</label>
                <Input
                  type="email"
                  value={onboardingEmail}
                  onChange={(e) => setOnboardingEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Address & location *</label>
                <AddressAutocomplete
                  value={addressLine}
                  onChange={setAddressLine}
                  onPlaceSelect={(r) => {
                    setAddressLine(r.addressLine);
                    if (r.pincode) setAddressPincode(r.pincode);
                  }}
                  placeholder="Search address (Google Maps) or enter manually"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Pincode * (6 digits)</label>
                <Input
                  value={addressPincode}
                  onChange={(e) => setAddressPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="560001"
                  disabled={loading}
                  className="mt-1"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">We’ll check if this area is serviceable before saving.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Location type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer rounded border px-3 py-2">
                    <input
                      type="radio"
                      name="addressType"
                      checked={addressLabel === 'Home'}
                      onChange={() => setAddressLabel('Home')}
                      disabled={loading}
                    />
                    <span className="text-sm font-medium">Home</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer rounded border px-3 py-2">
                    <input
                      type="radio"
                      name="addressType"
                      checked={addressLabel === 'Office'}
                      onChange={() => setAddressLabel('Office')}
                      disabled={loading}
                    />
                    <span className="text-sm font-medium">Office</span>
                  </label>
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save and continue to order'}
              </Button>
              {error && <ErrorDisplay error={error} />}
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'me' && (
        <Card>
          <CardHeader>
            <CardTitle>2. Fetch /api/me</CardTitle>
            <CardDescription>Load defaultAddress and activeSubscription. Active subscriptions appear below and on Customer profile (Admin → Customers → customer).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleFetchMe} disabled={loading}>
              {loading ? 'Loading…' : 'Fetch /me'}
            </Button>
            {activeSubscriptions.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm text-muted-foreground">Active subscriptions ({activeSubscriptions.length})</p>
                {activeSubscriptions.map((sub) => (
                  <div key={sub.id} className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    <span className="font-medium">{sub.planName ?? sub.id}</span>
                    {sub.validTill && <span> · Valid till: {new Date(sub.validTill).toLocaleDateString()}</span>}
                    {sub.remainingPickups != null && <span> · Pickups: {sub.remainingPickups}{sub.maxPickups != null ? `/${sub.maxPickups}` : ''}</span>}
                    {sub.remainingKg != null && <span> · Remaining kg: {sub.remainingKg}</span>}
                    {sub.remainingItems != null && <span> · Remaining items: {sub.remainingItems}</span>}
                  </div>
                ))}
              </div>
            )}
            {error && <ErrorDisplay error={error} />}
          </CardContent>
        </Card>
      )}

      {(step === 'me' || step === 'form') && customerToken && (
        <BuySubscriptionCard
          customerToken={customerToken}
          activePlanIds={(me?.activeSubscriptions?.map((s) => s.planId).filter((id): id is string => Boolean(id)) ?? [])}
          onPurchased={() => handleFetchMe()}
          onError={setError}
        />
      )}

      {step === 'address' && me && (
        <Card>
          <CardHeader>
            <CardTitle>2b. Add address</CardTitle>
            <CardDescription>Customer has no default address. Enter a serviceable pincode (6 digits); we will check serviceability before adding.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleAddAddress(e, false)} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Label</label>
                <Input
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  placeholder="Home"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Address line</label>
                <Input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Street, area"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Pincode * (6 digits)</label>
                <Input
                  value={addressPincode}
                  onChange={(e) => setAddressPincode(e.target.value)}
                  placeholder="560001"
                  disabled={loading}
                  className="mt-1"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">We’ll check if this area is serviceable before saving.</p>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding…' : 'Add address'}
              </Button>
              {error && <ErrorDisplay error={error} />}
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'form' && me && (
        <Card>
          <CardHeader>
            <CardTitle>3. Create order</CardTitle>
            <CardDescription>
              Pickup date/time cannot be in the past (enforced by server).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* All active subscriptions – summary at top (order dedicated to selected one) */}
            <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-2">
              <p className="font-medium text-muted-foreground">
                {activeSubscriptions.length > 0
                  ? `Active subscriptions (${activeSubscriptions.length}) – select one below for this order`
                  : 'Active subscriptions'}
              </p>
              {activeSubscriptions.length > 0 ? (
                activeSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className={cn(
                      'rounded border px-2 py-1.5 text-xs',
                      sub.hasActiveOrder ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : 'border-muted bg-background/50',
                    )}
                  >
                    <span className="font-medium">{sub.planName ?? sub.id}</span>
                    {sub.hasActiveOrder && <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">(Order in progress)</span>}
                    {sub.validTill && <span> · Valid till: {new Date(sub.validTill).toLocaleDateString()}</span>}
                    {sub.remainingPickups != null && <span> · Pickups: {sub.remainingPickups}{sub.maxPickups != null ? `/${sub.maxPickups}` : ''}</span>}
                    {sub.remainingKg != null && <span> · Remaining kg: {sub.remainingKg}</span>}
                    {sub.remainingItems != null && <span> · Remaining items: {sub.remainingItems}</span>}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No active subscription. Buy a plan above to use subscription booking.</p>
              )}
            </div>

            {(addresses.length > 0 || me.defaultAddress) ? (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Order type</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer rounded border px-3 py-2">
                      <input
                        type="radio"
                        name="bookingType"
                        checked={bookingType === 'individual'}
                        onChange={() => setBookingType('individual')}
                        disabled={loading}
                      />
                      <span className="text-sm font-medium">Individual booking</span>
                    </label>
                    {activeSubscriptions.length > 0 ? (
                      activeSubscriptions.map((sub) => {
                        const hasActiveOrder = !!sub.hasActiveOrder;
                        return (
                          <label
                            key={sub.id}
                            className={cn(
                              'flex items-start gap-2 rounded border px-3 py-2 min-w-0',
                              hasActiveOrder ? 'cursor-not-allowed opacity-60 bg-muted/50' : 'cursor-pointer',
                            )}
                          >
                            <input
                              type="radio"
                              name="bookingType"
                              checked={bookingType === 'subscription' && selectedSubscriptionId === sub.id}
                              onChange={() => {
                                if (!hasActiveOrder) {
                                  setBookingType('subscription');
                                  setSelectedSubscriptionId(sub.id);
                                }
                              }}
                              disabled={loading || hasActiveOrder}
                              className="mt-1.5 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold leading-tight mb-1">{sub.planName ?? sub.id}</p>
                              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">Subscription</span>
                              {hasActiveOrder && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Order in progress – wait for delivery to book again</p>}
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <label className={cn('flex items-center gap-2 rounded border px-3 py-2 cursor-not-allowed opacity-70')}>
                        <input type="radio" name="bookingType" checked={false} disabled />
                        <span className="text-sm font-medium">Subscription booking</span>
                        <span className="text-xs text-muted-foreground">(Buy a plan above first)</span>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Selected subscription is tied to this order (Order ID) for easy ACK invoice.</p>
                </div>

                {bookingType === 'individual' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Services (select at least one)</label>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {BOOKABLE_SERVICES.map((s) => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(s)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices((prev) => [...prev, s].sort());
                              } else {
                                setSelectedServices((prev) => prev.filter((x) => x !== s));
                              }
                            }}
                            disabled={loading}
                          />
                          <span className="text-sm">{s.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Address</label>
                  {addressesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading addresses…</p>
                  ) : addresses.length > 0 ? (
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <label key={addr.id} className="flex items-center gap-2 cursor-pointer rounded border px-3 py-2">
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            disabled={loading}
                          />
                          <span className="text-sm">{addr.label ?? addr.addressLine ?? addr.pincode}</span>
                          <span className="text-xs text-muted-foreground">({addr.pincode})</span>
                        </label>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => setAddAddressModalOpen(true)}>
                        Add new address
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Using default address (pincode {me.defaultAddress?.pincode})</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => setAddAddressModalOpen(true)}>
                        Add new address
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pickup date</label>
                  <Input
                    type="date"
                    min={today}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pickup time</label>
                  <select
                    value={timeSlotOptions.some((o) => o.value === timeWindow) ? timeWindow : (timeSlotOptions[0]?.value ?? timeWindow)}
                    onChange={(e) => setTimeWindow(e.target.value)}
                    disabled={loading}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {timeSlotOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {isToday && timeSlotOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">No slots left today. Pick another date.</p>
                  )}
                </div>
                {bookingType === 'individual' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Estimated weight (kg)</label>
                    <Input
                      type="number"
                      min={0}
                      value={estimatedWeightKg}
                      onChange={(e) => setEstimatedWeightKg(Number(e.target.value) || 0)}
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !addressIdForOrder ||
                    (bookingType === 'individual' && selectedServices.length === 0) ||
                    (bookingType === 'subscription' && !selectedSubscriptionId) ||
                    (isToday && timeSlotOptions.length === 0)
                  }
                >
                  {loading ? 'Creating…' : 'Confirm order'}
                </Button>
                <p className="text-xs text-muted-foreground">Order will appear in Admin → Orders list.</p>
                {error && (
                  <div>
                    <ErrorDisplay error={error} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      If you see &quot;No slot available&quot;, set operating hours in Admin → Schedule &amp; calendar. Past slots are rejected by the server.
                    </p>
                  </div>
                )}
              </form>
            ) : (
              <p className="text-sm text-destructive">No address. Add an address in step 2b or use Fetch /me if you have a default.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={addAddressModalOpen} onOpenChange={setAddAddressModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new address</DialogTitle>
            <DialogDescription>We will check serviceability for the pincode before saving.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleAddAddress(e, true)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Label</label>
              <Input value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="Home" disabled={addAddressLoading} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Address line</label>
              <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Street, area" disabled={addAddressLoading} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pincode * (6 digits)</label>
              <Input value={addressPincode} onChange={(e) => setAddressPincode(e.target.value)} placeholder="560001" disabled={addAddressLoading} className="mt-1" maxLength={6} />
            </div>
            {error && <ErrorDisplay error={error} />}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddAddressModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addAddressLoading}>{addAddressLoading ? 'Adding…' : 'Add address'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmOrderOtpOpen}
        onOpenChange={(open) => {
          setConfirmOrderOtpOpen(open);
          if (!open) {
            setConfirmOrderOtp('');
            setConfirmOrderRequestId(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm order with OTP</DialogTitle>
            <DialogDescription>Enter the OTP sent to your phone to confirm and place the order.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmOrderWithOtp} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">OTP</label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={confirmOrderOtp}
                onChange={(e) => setConfirmOrderOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                disabled={confirmOrderOtpLoading}
                className="mt-1"
                maxLength={6}
              />
            </div>
            {error && <ErrorDisplay error={error} />}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeConfirmOrderOtpDialog} disabled={confirmOrderOtpLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={confirmOrderOtpLoading || confirmOrderOtp.length < 6}>
                {confirmOrderOtpLoading ? 'Verifying…' : 'Verify & place order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {step === 'done' && orderId && (
        <Card>
          <CardHeader>
            <CardTitle>Order created</CardTitle>
            <CardDescription>orderId: {orderId}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/orders/${orderId}`}
              className={cn(buttonVariants(), 'gap-2')}
            >
              <ExternalLink className="h-4 w-4" />
              Open in Orders
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
