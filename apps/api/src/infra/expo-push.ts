/**
 * Send a push notification via Expo Push API so the user sees it on the lock screen
 * when they are not inside the app. Call this when: booking confirmed, order picked up,
 * acknowledgement invoice available, subscription activated, payment recorded, delivered, etc.
 *
 * Usage: await sendExpoPush(customersRepo, userId, { title: 'Booking confirmed', body: 'Order #123', data: { orderId: '...' } });
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface SendExpoPushOptions {
  title: string;
  body: string;
  /** Optional payload (e.g. orderId, subscriptionId) for the app to handle on tap. */
  data?: Record<string, string>;
}

export interface CustomersRepoForPush {
  getById(userId: string): Promise<{ expoPushToken: string | null } | null>;
}

export async function sendExpoPush(
  customersRepo: CustomersRepoForPush,
  userId: string,
  options: SendExpoPushOptions
): Promise<{ sent: boolean; error?: string }> {
  const customer = await customersRepo.getById(userId);
  const token = customer?.expoPushToken?.trim();
  if (!token || (!token.startsWith('ExponentPushToken') && !token.startsWith('ExpoPushToken'))) {
    return { sent: false };
  }
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: options.title,
        body: options.body,
        data: options.data ?? {},
        sound: 'default',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { sent: false, error: text || res.statusText };
    }
    const json = (await res.json()) as { data?: { status?: string } };
    const status = json?.data?.status;
    if (status === 'error') {
      return { sent: false, error: 'Expo returned error' };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}
