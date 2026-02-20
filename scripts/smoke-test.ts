import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getIndiaDates } from './seed-utils';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000/api';
const CUSTOMER_PHONE = process.env.CUSTOMER_PHONE ?? '+919999999999';
const OTP = process.env.OTP ?? '123456';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@laundry.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'dev-hash';
const BILLING_EMAIL = process.env.BILLING_EMAIL ?? 'billing@laundry.local';
const BILLING_PASSWORD = process.env.BILLING_PASSWORD ?? 'dev-hash';

const prisma = new PrismaClient();

interface HttpOptions {
  method: string;
  path: string;
  token?: string;
  body?: unknown;
}

async function httpRequest<T>(opts: HttpOptions): Promise<T> {
  const url = `${BASE_URL}${opts.path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) {
    headers['Authorization'] = `Bearer ${opts.token}`;
  }

  const res = await fetch(url, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error('HTTP_ERROR', {
      status: res.status,
      url,
      response: json ?? text,
    });
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return json as T;
}

async function getSeededData() {
  const user = await prisma.user.findUnique({
    where: { phone: CUSTOMER_PHONE },
  });
  if (!user) {
    throw new Error(
      'Seeded customer not found. Run: npm run prisma:seed and try again.',
    );
  }

  const address = await prisma.address.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  if (!address) {
    throw new Error(
      'Seeded default address not found for customer. Run seed or check data.',
    );
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      active: true,
      remainingPickups: { gt: 0 },
      expiryDate: { gt: new Date() },
    },
  });
  if (!subscription) {
    throw new Error(
      'Active subscription for customer not found. Run seed or check data.',
    );
  }

  return {
    customerUserId: user.id,
    addressId: address.id,
    subscriptionId: subscription.id,
  };
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('Starting smoke test against', BASE_URL);

  const seeded = await getSeededData();

  // 1) Customer OTP request
  const otpReq = await httpRequest<{ requestId: string }>({
    method: 'POST',
    path: '/auth/customer/otp/request',
    body: { phone: CUSTOMER_PHONE },
  });

  // 2) Customer OTP verify
  const otpVerify = await httpRequest<{
    token: string;
    user: { id: string; phone: string; role: string };
  }>({
    method: 'POST',
    path: '/auth/customer/otp/verify',
    body: {
      phone: CUSTOMER_PHONE,
      otp: OTP,
      requestId: otpReq.requestId,
    },
  });
  const tokenCustomer = otpVerify.token;

  // 3) Admin/Billing login (use billing for invoice, admin for status)
  const adminLogin = await httpRequest<{
    token: string;
    user: { id: string; email: string; role: string };
  }>({
    method: 'POST',
    path: '/auth/admin/login',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const tokenAdmin = adminLogin.token;

  const billingLogin = await httpRequest<{
    token: string;
    user: { id: string; email: string; role: string };
  }>({
    method: 'POST',
    path: '/auth/admin/login',
    body: { email: BILLING_EMAIL, password: BILLING_PASSWORD },
  });
  const tokenBilling = billingLogin.token;

  // 4) Create WASH_FOLD order with subscription
  const { todayDate } = getIndiaDates();
  const pickupDateIso = todayDate.toISOString();
  const createOrderRes = await httpRequest<{ orderId: string }>({
    method: 'POST',
    path: '/orders',
    token: tokenCustomer,
    body: {
      serviceType: 'WASH_FOLD',
      addressId: seeded.addressId,
      pickupDate: pickupDateIso,
      timeWindow: '10:00-12:00',
      estimatedWeightKg: 3,
      subscriptionId: seeded.subscriptionId,
    },
  });
  const orderId = createOrderRes.orderId;

  // 5) Update order status through 2 valid steps
  await httpRequest<{ orderId: string; status: string }>({
    method: 'PATCH',
    path: `/orders/${orderId}/status`,
    token: tokenAdmin,
    body: { status: 'PICKUP_SCHEDULED' },
  });
  const statusRes2 = await httpRequest<{ orderId: string; status: string }>({
    method: 'PATCH',
    path: `/orders/${orderId}/status`,
    token: tokenAdmin,
    body: { status: 'PICKED_UP' },
  });
  if (statusRes2.status !== 'PICKED_UP') {
    throw new Error(
      `Expected status PICKED_UP, got ${statusRes2.status}`,
    );
  }

  // 6) Create invoice draft with 2 items; subtotal should be 1200
  const draftRes = await httpRequest<{
    invoiceId: string;
    subtotal: number;
    tax: number;
    total: number;
  }>({
    method: 'POST',
    path: `/orders/${orderId}/invoice/draft`,
    token: tokenBilling,
    body: {
      items: [
        { type: 'SERVICE', name: 'Wash & Fold', quantity: 1, unitPrice: 1000 },
        { type: 'FEE', name: 'Pickup fee', quantity: 1, unitPrice: 200 },
      ],
      tax: 0,
    },
  });
  const expectedSubtotal = 1000 + 200;
  if (draftRes.subtotal !== expectedSubtotal || draftRes.total !== expectedSubtotal) {
    throw new Error(
      `Invoice totals mismatch. Expected ${expectedSubtotal}, got subtotal=${draftRes.subtotal}, total=${draftRes.total}`,
    );
  }
  const invoiceId = draftRes.invoiceId;

  // 7) Finalize invoice
  await httpRequest<{ invoiceId: string; status: string }>({
    method: 'POST',
    path: `/orders/${orderId}/invoice/finalize`,
    token: tokenBilling,
  });

  // 8) Generate invoice PDF
  const pdfRes = await httpRequest<{ pdfUrl: string }>({
    method: 'POST',
    path: `/orders/${orderId}/invoice/generate-pdf`,
    token: tokenBilling,
  });
  if (!pdfRes.pdfUrl || typeof pdfRes.pdfUrl !== 'string') {
    throw new Error('Missing pdfUrl from generate-pdf response');
  }

  // eslint-disable-next-line no-console
  console.log(
    'SMOKE_OK',
    JSON.stringify(
      {
        orderId,
        invoiceId,
        pdfUrl: pdfRes.pdfUrl,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(
      'SMOKE_FAIL',
      JSON.stringify(
        {
          message: (e as Error).message,
        },
        null,
        2,
      ),
    );
    await prisma.$disconnect();
    process.exit(1);
  });

