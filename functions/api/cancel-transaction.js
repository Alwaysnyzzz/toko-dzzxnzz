// functions/api/cancel-transaction.js — Cloudflare Pages Functions
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

    const { order_id } = await request.json();
    if (!order_id) return new Response(JSON.stringify({ error: 'order_id wajib' }), { status: 400, headers: HEADERS });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data: trx } = await supabase.from('transactions').select('*').eq('order_id', order_id).eq('user_id', decoded.id).single();
    if (!trx) return new Response(JSON.stringify({ error: 'Transaksi tidak ditemukan' }), { status: 404, headers: HEADERS });
    if (trx.status !== 'pending') return new Response(JSON.stringify({ error: 'Hanya transaksi pending yang bisa dibatalkan' }), { status: 400, headers: HEADERS });

    await supabase.from('transactions').update({ status: 'cancelled' }).eq('order_id', order_id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
