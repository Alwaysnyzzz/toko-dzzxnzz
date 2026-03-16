// functions/api/check-status.js — Cloudflare Pages Functions
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const order_id = url.searchParams.get('order_id');
    if (!order_id) return new Response(JSON.stringify({ error: 'order_id wajib' }), { status: 400, headers: HEADERS });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data: trx } = await supabase.from('transactions').select('*').eq('order_id', order_id).single();
    if (!trx) return new Response(JSON.stringify({ error: 'Transaksi tidak ditemukan' }), { status: 404, headers: HEADERS });

    if (trx.status === 'completed')
      return new Response(JSON.stringify({ status: 'completed', order_id }), { status: 200, headers: HEADERS });

    // Cek ke Pakasir
    const pakasirRes = await fetch(`https://api.pakasir.com/transaction/${order_id}`, {
      headers: { 'Authorization': `Bearer ${env.PAKASIR_API_KEY}` }
    });
    const pakasir = await pakasirRes.json();

    const paid = pakasir.data?.status === 'paid' || pakasir.status === 'paid';

    if (paid) {
      await supabase.from('transactions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('order_id', order_id);
      await supabase.rpc('add_coins', { p_user_id: trx.user_id, p_amount: Number(trx.amount) });
      return new Response(JSON.stringify({ status: 'completed', order_id }), { status: 200, headers: HEADERS });
    }

    // Cek expired
    if (trx.expired_at && new Date() > new Date(trx.expired_at)) {
      await supabase.from('transactions').update({ status: 'cancelled' }).eq('order_id', order_id);
      return new Response(JSON.stringify({ status: 'cancelled', order_id }), { status: 200, headers: HEADERS });
    }

    return new Response(JSON.stringify({ status: 'pending', order_id }), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
