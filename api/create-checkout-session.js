import Stripe from 'stripe';

export const config = { runtime: 'edge' };

const PRICE_IDS = {
  annual:  process.env.STRIPE_PRICE_ANNUAL,   // set in Vercel env vars
  monthly: process.env.STRIPE_PRICE_MONTHLY,  // set in Vercel env vars
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { plan = 'annual', email } = body;
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return new Response(JSON.stringify({ error: `Unknown plan: ${plan}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

  const origin = req.headers.get('origin') || 'https://monelingo.vercel.app';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 7,
    },
    customer_email: email || undefined,
    success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/pro`,
    metadata: { plan },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
    },
  });
}
