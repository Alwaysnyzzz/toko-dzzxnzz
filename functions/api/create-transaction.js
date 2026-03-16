import { verifyJWT, getToken, supabase, json, CORS } from './_helper.js';

export async function onRequestPost({ request, env }) {
  try {
    const token = getToken(request);
    if (!token) return json({ error: 'Token tidak ditemukan' }, 401);
    const decoded = await verifyJWT(token, env.JWT_SECRET);

    const { amount } = await request.json();
    if (!amount || amount < 500) return json({ error: 'Minimal top up Rp 500' }, 400);

    const order_id = `SALDO-${Date.now()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;

    const pakasirRes = await fetch('https://api.pakasir.com/transaction/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.PAKASIR_API_KEY}` },
      body: JSON.stringify({ slug: env.PAKASIR_SLUG, amount, order_id, note: `Top up coins ${order_id}` })
    });
    const pakasir = await pakasirRes.json();
    if (!pakasirRes.ok) return json({ error: 'Gagal buat transaksi Pakasir' }, 500);

    const expired_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await supabase(env).from('transactions').insert({
      order_id, user_id: decoded.id, amount, status: 'pending', type: 'isisaldo',
      payment_method: 'QRIS', qr_string: pakasir.data?.qr_string || '', expired_at
    });

    return json({ order_id, qr_string: pakasir.data?.qr_string || pakasir.qr_string });
  } catch (err) {
    return json({ error: 'Internal server error: ' + err.message }, 500);
  }
}

export const onRequestOptions = () => CORS;
