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
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error('HTTP_ERROR', { status: res.status, url, response: json ?? text });
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return json as T;
}

async function getSeededData() {
  const user = await prisma.user.findUnique({
    where: { phone: CUSTOMER_PHONE },
  });
  if (!user) {
    throw new Error('Seeded customer not found. Run: npm run prisma:seed and try again.');
  }

  const address = await prisma.address.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  if (!address) {
    throw new Error('Seeded default address not found for customer. Run seed or check data.');
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
    throw new Error('Active subscription for customer not found. Run seed or check data.');
  }

  return {
    customerUserId: user.id,
    addressId: address.id,
    subscriptionId: subscription.id,
  };
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('Starting smoke-admin-flow against', BASE_URL);

  const seeded = await getSeededData();

  // 1) Customer OTP request
  const otpReq = await httpRequest<{ requestId: string }>({
    method: 'POST',
    path: '/auth/customer/otp/request',
    body: { phone: CUSTOMER_PHONE },
  });

  // 2) Customer OTP verify
  const otpVerify = await httpRequest<{ token: string }>({
    method: 'POST',
    path: '/auth/customer/otp/verify',
    body: {
      phone: CUSTOMER_PHONE,
      otp: OTP,
      requestId: otpReq.requestId,
    },
  });
  const tokenCustomer = otpVerify.token;

  // 3) Admin login + Billing login
  const adminLogin = await httpRequest<{ token: string }>({
    method: 'POST',
    path: '/auth/admin/login',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const tokenAdmin = adminLogin.token;

  const billingLogin = await httpRequest<{ token: string }>({
    method: 'POST',
    path: '/auth/admin/login',
    body: { email: BILLING_EMAIL, password: BILLING_PASSWORD },
  });
  const tokenBilling = billingLogin.token;

  // 4) Create order
  const { todayDate } = getIndiaDates();
  const createOrderRes = await httpRequest<{ orderId: string }>({
    method: 'POST',
    path: '/orders',
    token: tokenCustomer,
    body: {
      serviceType: 'WASH_FOLD',
      addressId: seeded.addressId,
      pickupDate: todayDate.toISOString(),
      timeWindow: '10:00-12:00',
      estimatedWeightKg: 3,
      subscriptionId: seeded.subscriptionId,
    },
  });
  const orderId = createOrderRes.orderId;

  // 5) Update status -> PICKED_UP
  await httpRequest<{ orderId: string; status: string }>({
    method: 'PATCH',
    path: `/orders/${orderId}/status`,
    token: tokenAdmin,
    body: { status: 'PICKUP_SCHEDULED' },
  });
  const pickedUp = await httpRequest<{ orderId: string; status: string }>({
    method: 'PATCH',
    path: `/orders/${orderId}/status`,
    token: tokenAdmin,
    body: { status: 'PICKED_UP' },
  });
  if (pickedUp.status !== 'PICKED_UP') {
    throw new Error(`Expected PICKED_UP, got ${pickedUp.status}`);
  }

  // 6) Create ACK draft
  await httpRequest<{ invoiceId: string; subtotal: number; tax: number; total: number }>({
    method: 'POST',
    path: `/admin/orders/${orderId}/ack-invoice/draft`,
    token: tokenBilling,
    body: {
      items: [
        { type: 'SERVICE', name: 'Wash & Fold', quantity: 1, unitPricePaise: 10000 },
        { type: 'FEE', name: 'Pickup fee', quantity: 1, unitPricePaise: 2000 },
      ],
      taxPaise: 0,
    },
  });

  // 7) Issue ACK
  const ackIssue = await httpRequest<{ invoiceId: string; pdfUrl: string; status: string }>({
    method: 'POST',
    path: `/admin/orders/${orderId}/ack-invoice/issue`,
    token: tokenBilling,
  });
  if (!ackIssue.pdfUrl || !ackIssue.pdfUrl.includes('/api/invoices/')) {
    throw new Error('ACK issue should return pdfUrl');
  }

  // 8) Update status -> DELIVERED
  await httpRequest({ method: 'PATCH', path: `/orders/${orderId}/status`, token: tokenAdmin, body: { status: 'IN_PROCESSING' } });
  await httpRequest({ method: 'PATCH', path: `/orders/${orderId}/status`, token: tokenAdmin, body: { status: 'READY' } });
  await httpRequest({ method: 'PATCH', path: `/orders/${orderId}/status`, token: tokenAdmin, body: { status: 'OUT_FOR_DELIVERY' } });
  const delivered = await httpRequest<{ orderId: string; status: string }>({
    method: 'PATCH',
    path: `/orders/${orderId}/status`,
    token: tokenAdmin,
    body: { status: 'DELIVERED' },
  });
  if (delivered.status !== 'DELIVERED') {
    throw new Error(`Expected DELIVERED, got ${delivered.status}`);
  }

  // 9) Create FINAL draft
  const finalDraft = await httpRequest<{ invoiceId: string; subtotal: number; tax: number; total: number }>({
    method: 'POST',
    path: `/admin/orders/${orderId}/final-invoice/draft`,
    token: tokenBilling,
    body: {
      items: [
        { type: 'SERVICE', name: 'Wash & Fold', quantity: 1, unitPricePaise: 10000 },
        { type: 'FEE', name: 'Delivery fee', quantity: 1, unitPricePaise: 1500 },
      ],
      taxPaise: 0,
    },
  });

  // 10) Issue FINAL
  const finalIssue = await httpRequest<{ invoiceId: string; pdfUrl: string; status: string }>({
    method: 'POST',
    path: `/admin/orders/${orderId}/final-invoice/issue`,
    token: tokenBilling,
  });
  const finalInvoiceId = finalIssue.invoiceId;
  if (!finalIssue.pdfUrl || !finalIssue.pdfUrl.includes('/api/invoices/')) {
    throw new Error('FINAL issue should return pdfUrl');
  }

  // 11) PATCH payment -> CAPTURED
  await httpRequest({
    method: 'PATCH',
    path: `/admin/orders/${orderId}/payment`,
    token: tokenBilling,
    body: {
      provider: 'CASH',
      status: 'CAPTURED',
      amountPaise: finalDraft.total,
      note: 'Smoke test',
    },
  });

  // 12) GET analytics revenue (assert billed > 0 and collected > 0)
  const revenue = await httpRequest<{
    billedPaise: number;
    collectedPaise: number;
    ordersCount: number;
    invoicesCount: number;
  }>({
    method: 'GET',
    path: '/admin/analytics/revenue?preset=TODAY',
    token: tokenBilling,
  });
  if (revenue.billedPaise <= 0 || revenue.collectedPaise <= 0) {
    throw new Error(
      `Expected billed and collected > 0, got billedPaise=${revenue.billedPaise}, collectedPaise=${revenue.collectedPaise}`,
    );
  }

  // 13) Submit feedback for order
  await httpRequest({
    method: 'POST',
    path: `/orders/${orderId}/feedback`,
    token: tokenCustomer,
    body: { rating: 5, tags: ['quality'], message: 'Smoke admin flow' },
  });

  // 14) Admin list feedback (assert exists)
  const feedbackList = await httpRequest<{ data: unknown[]; nextCursor: string | null }>({
    method: 'GET',
    path: '/admin/feedback?limit=20',
    token: tokenAdmin,
  });
  if (!feedbackList.data || feedbackList.data.length === 0) {
    throw new Error('Expected at least one feedback from admin list');
  }

  // eslint-disable-next-line no-console
  console.log(
    'SMOKE_ADMIN_OK',
    JSON.stringify({ orderId, finalInvoiceId }, null, 2),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error('SMOKE_ADMIN_FAIL', (e as Error).message);
    await prisma.$disconnect();
    process.exit(1);
  });
