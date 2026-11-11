import { RECURRENTE_SECRET_KEY, RECURRENTE_BASE_URL } from '../config';

interface CreateCheckoutParams {
  colegioId: string;
  alumnoId: string;
  mes: string;
  monto: number;
  nombreAlumno: string;
  nombreColegio: string;
  recurrenteAccountId?: string;
}

export async function createCheckout(params: CreateCheckoutParams): Promise<{ checkoutId: string; checkoutUrl: string }> {
  const { colegioId, alumnoId, mes, monto, nombreAlumno, nombreColegio, recurrenteAccountId } = params;

  const montoCentavos = Math.round(monto * 100);
  const comisionCentavos = Math.round(monto * 0.03 * 100);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-SECRET-KEY': RECURRENTE_SECRET_KEY,
  };

  if (recurrenteAccountId) {
    headers['X-ACCOUNT-ID'] = recurrenteAccountId;
  }

  const body = {
    items: [
      {
        name: `Colegiatura ${mes} - ${nombreColegio} - ${nombreAlumno}`,
        amount_in_cents: montoCentavos,
        quantity: 1,
        currency: 'GTQ',
      },
    ],
    metadata: {
      colegioId,
      alumnoId,
      mes,
    },
    payment_method_types: ['bank_transfer'],
    transfer_setups: [
      {
        amount_in_cents: comisionCentavos,
        purpose: 'platform_commission',
      },
    ],
  };

  const response = await fetch(`${RECURRENTE_BASE_URL}/checkouts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Recurrente createCheckout failed: ${response.status} ${errorBody}`);
  }

  const data: any = await response.json();

  return {
    checkoutId: data.id,
    checkoutUrl: data.checkout_url || data.url,
  };
}

export interface SubscriptionCheckoutParams {
  colegioId: string;
  plan: string;
  monto: number;
  nombreColegio: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createSubscriptionCheckout(
  params: SubscriptionCheckoutParams,
): Promise<{ checkoutId: string; checkoutUrl: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-SECRET-KEY': RECURRENTE_SECRET_KEY,
  };

  const body = {
    items: [
      {
        name: `AulaPro ${params.plan} - ${params.nombreColegio}`,
        amount_in_cents: Math.round(params.monto * 100),
        quantity: 1,
      },
    ],
    metadata: {
      tipo: 'suscripcion',
      colegioId: params.colegioId,
      plan: params.plan,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  };

  const response = await fetch(`${RECURRENTE_BASE_URL}/checkouts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Recurrente suscripcion checkout failed: ${response.status} ${errorBody}`);
  }

  const data: any = await response.json();
  return {
    checkoutId: data.id,
    checkoutUrl: data.checkout_url || data.url,
  };
}

export async function getCheckout(checkoutId: string): Promise<any> {
  const response = await fetch(`${RECURRENTE_BASE_URL}/checkouts/${checkoutId}`, {
    method: 'GET',
    headers: {
      'X-SECRET-KEY': RECURRENTE_SECRET_KEY,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Recurrente getCheckout failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export function verifyWebhookSignature(rawBody: string, headers: any): boolean {
  const signature = headers['x-recurrente-signature'] || headers['X-Recurrente-Signature'] || '';

  if (!signature || !RECURRENTE_SECRET_KEY) {
    return false;
  }

  return signature.length > 0;
}
