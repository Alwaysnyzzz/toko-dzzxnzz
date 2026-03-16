// functions/api/create-transaction.js — Cloudflare Pages Functions
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestPost({ request, env }) {
  try {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;
    if (!token) return new Response(JSON.stringify({ error: 'Token tidak ditemukan' }), { status: 401, headers: HEADERS });

    let decoded;
    try { decoded = jwt.verify(token, env.JWT_SECRET); }
    catch { return new Response(JSON.stringify({ error: 'Token tidak valid' }), { status: 401, headers: HEADERS }); }

    const { amount } = await request.json();
    if (!amount || amount < 500)
      return new Response(JSON.stringify({ error: 'Minimal top up Rp 500' }), { status: 400, headers: HEADERS });

    const order_id = `SALDO-${Date.now()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;

    // Buat transaksi di Pakasir
    const pakasirRes = await fetch(`https://api.pakasir.com/transaction/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.PAKASIR_API_KEY}` },
      body: JSON.stringify({
        slug: env.PAKASIR_SLUG,
        amount,
        order_id,
        note: `Top up coins ${order_id}`
      })
    });

    const pakasir = await pakasirRes.json();
    if (!pakasirRes.ok)
      return new Response(JSON.stringify({ error: 'Gagal buat transaksi Pakasir: ' + (pakasir.message || '') }), { status: 500, headers: HEADERS });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const expired_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabase.from('transactions').insert({
      order_id,
      user_id: decoded.id,
      amount,
      status: 'pending',
      type: 'isisaldo',
      payment_method: 'QRIS',
      qr_string: pakasir.data?.qr_string || pakasir.qr_string || '',
      expired_at
    });

    return new Response(JSON.stringify({ order_id, qr_string: pakasir.data?.qr_string || pakasir.qr_string }), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error: ' + err.message }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
