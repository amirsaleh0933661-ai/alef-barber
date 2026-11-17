
import { createHmac, timingSafeEqual } from 'crypto';

const TCART_BASE_URL = 'https://tcartt.com';

export type TcartCredentials = {
  apiKey: string;
  callbackSecret: string;
};

export type CreateTcartInvoiceInput = {
  credentials: TcartCredentials;
  amountToman: number;
  title: string;
  externalOrderId: string;
  buyerRef?: string;
  returnUrl: string;
  callbackUrl: string;
  expiresMinutes?: number;
};

export type TcartInvoiceResult = {
  invoiceId: string;
  trackingCode: string;
  paymentUrl: string;
  status: string;
  basePriceToman: number;
  uniqueAmountToman: number;
  expiresAt?: string;
};

function sortObject(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result: Record<string, any>, key) => {
        result[key] = sortObject(value[key]);
        return result;
      }, {});
  }

  return value;
}

export function canonicalizeTcartPayload(payload: unknown): string {
  return JSON.stringify(sortObject(payload));
}

export function verifyTcartSignature(
  payload: unknown,
  signatureHeader: string | null,
  callbackSecret: string
): boolean {
  if (!signatureHeader || !callbackSecret) return false;

  const received = signatureHeader.trim().replace(/^sha256=/i, '');

  if (!/^[a-f0-9]{64}$/i.test(received)) return false;

  const expected = createHmac('sha256', callbackSecret)
    .update(canonicalizeTcartPayload(payload), 'utf8')
    .digest('hex');

  const receivedBuffer = Buffer.from(received, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

async function tcartRequest<T>(
  credentials: TcartCredentials,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!credentials.apiKey?.trim()) {
    throw new Error('کلید API تیکارت تنظیم نشده است.');
  }

  const response = await fetch(`${TCART_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credentials.apiKey}`,
      ...options.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  });

  const responseText = await response.text();

  let data: any;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error('پاسخ نامعتبر از سرور تیکارت دریافت شد.');
  }

  if (!response.ok || data?.ok === false) {
    throw new Error(
      data?.message ||
      data?.error ||
      `خطای تیکارت: HTTP ${response.status}`
    );
  }

  return data as T;
}

export async function createTcartInvoice(
  input: CreateTcartInvoiceInput
): Promise<TcartInvoiceResult> {
  const {
    credentials,
    amountToman,
    title,
    externalOrderId,
    buyerRef,
    returnUrl,
    callbackUrl,
    expiresMinutes = 30,
  } = input;

  if (!Number.isSafeInteger(amountToman) || amountToman < 1000) {
    throw new Error('مبلغ فاکتور باید حداقل ۱۰۰۰ تومان باشد.');
  }

  if (!externalOrderId?.trim()) {
    throw new Error('شناسه سفارش معتبر نیست.');
  }

  const result = await tcartRequest<any>(
    credentials,
    '/api/v1/invoices',
    {
      method: 'POST',
      body: JSON.stringify({
        amount_toman: amountToman,
        title,
        external_order_id: externalOrderId,
        ...(buyerRef ? { buyer_ref: buyerRef } : {}),
        return_url: returnUrl,
        callback_url: callbackUrl,
        expires_minutes: expiresMinutes,
      }),
    }
  );

  if (!result.invoice_id || !result.payment_url) {
    throw new Error('تیکارت فاکتور را بدون شناسه یا لینک پرداخت برگرداند.');
  }

  return {
    invoiceId: String(result.invoice_id),
    trackingCode: String(result.tracking_code || ''),
    paymentUrl: String(result.payment_url),
    status: String(result.status || 'pending'),
    basePriceToman: Number(result.base_price_toman ?? amountToman),
    uniqueAmountToman: Number(
      result.unique_amount_toman ?? amountToman
    ),
    expiresAt: result.expires_at
      ? String(result.expires_at)
      : undefined,
  };
}

export async function getTcartInvoice(
  credentials: TcartCredentials,
  invoiceId: string
): Promise<any> {
  if (!invoiceId?.trim()) {
    throw new Error('شناسه فاکتور تیکارت معتبر نیست.');
  }

  return tcartRequest<any>(
    credentials,
    `/api/v1/invoices/${encodeURIComponent(invoiceId)}`,
    { method: 'GET' }
  );
}

export async function verifyTcartPaidInvoice(params: {
  credentials: TcartCredentials;
  invoiceId: string;
  expectedExternalOrderId: string;
  expectedAmountToman: number;
}): Promise<{ paid: boolean; invoice: any }> {
  const invoice = await getTcartInvoice(
    params.credentials,
    params.invoiceId
  );

  const externalOrderId = String(
    invoice.external_order_id || ''
  );

  const amount = Number(
    invoice.base_price_toman ??
    invoice.amount_toman ??
    invoice.amount ??
    0
  );

  const paid =
    String(invoice.status || '').toLowerCase() === 'paid' &&
    externalOrderId === params.expectedExternalOrderId &&
    amount === params.expectedAmountToman;

  return { paid, invoice };
}
