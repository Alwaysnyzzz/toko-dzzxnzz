// functions/api/transactions.js — Cloudflare Pages Functions
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestGet({ request, env }) {
  try {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;
    if (!token) return new Response(JSON.stringify({ error: 'Token tidak ditemukan' }), { status: 401, headers: HEADERS });

    let decoded;
    try { decoded = jwt.verify(token, env.JWT_SECRET); }
    catch { return new Response(JSON.stringify({ error: 'Token tidak valid' }), { status: 401, headers: HEADERS }); }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase
      .from('transactions')
      .select('id, order_id, amount, status, type, payment_method, created_at, completed_at')
      .eq('user_id', decoded.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: HEADERS });

    return new Response(JSON.stringify(data || []), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
