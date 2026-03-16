// functions/api/user.js — Cloudflare Pages Functions
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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, coins, created_at, avatar_url, cover_url')
      .eq('id', decoded.id)
      .single();

    if (error || !profile)
      return new Response(JSON.stringify({ error: 'Profil tidak ditemukan' }), { status: 404, headers: HEADERS });

    return new Response(JSON.stringify(profile), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
