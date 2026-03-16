// functions/api/get-transaction.js — Cloudflare Pages Functions
import { createClient } from '@supabase/supabase-js';

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const order_id = url.searchParams.get('order_id');
    if (!order_id) return new Response(JSON.stringify({ error: 'order_id wajib' }), { status: 400, headers: HEADERS });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase.from('transactions').select('*').eq('order_id', order_id).single();
    if (error || !data) return new Response(JSON.stringify({ error: 'Transaksi tidak ditemukan' }), { status: 404, headers: HEADERS });

    return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
