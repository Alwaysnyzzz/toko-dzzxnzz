// functions/api/webhook.js — Cloudflare Pages Functions
import { createClient } from '@supabase/supabase-js';

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { order_id, amount, status } = body;

    if (!order_id) return new Response(JSON.stringify({ error: 'order_id wajib' }), { status: 400, headers: HEADERS });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data: trx } = await supabase.from('transactions').select('*').eq('order_id', order_id).single();
    if (!trx) return new Response(JSON.stringify({ error: 'Transaksi tidak ditemukan' }), { status: 404, headers: HEADERS });

    if (trx.status === 'completed')
      return new Response(JSON.stringify({ message: 'Sudah diproses' }), { status: 200, headers: HEADERS });

    // Verifikasi ke Pakasir
    const pakasirRes = await fetch(`https://api.pakasir.com/transaction/${order_id}`, {
      headers: { 'Authorization': `Bearer ${env.PAKASIR_API_KEY}` }
    });
    const pakasir = await pakasirRes.json();
    const paid = pakasir.data?.status === 'paid' || pakasir.status === 'paid';

    if (!paid)
      return new Response(JSON.stringify({ message: 'Belum lunas' }), { status: 200, headers: HEADERS });

    await supabase.from('transactions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('order_id', order_id);
    await supabase.rpc('add_coins', { p_user_id: trx.user_id, p_amount: Number(trx.amount) });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
