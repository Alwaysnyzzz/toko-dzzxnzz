// functions/api/delete-photo.js — Cloudflare Pages Functions
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

    const { type } = await request.json();
    if (!type || !['avatar', 'cover'].includes(type))
      return new Response(JSON.stringify({ error: 'type harus avatar atau cover' }), { status: 400, headers: HEADERS });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const updateData = type === 'avatar' ? { avatar_url: null } : { cover_url: null };
    await supabase.from('profiles').update(updateData).eq('id', decoded.id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
