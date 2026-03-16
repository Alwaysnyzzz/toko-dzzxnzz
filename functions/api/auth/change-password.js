// functions/api/auth/change-password.js — Cloudflare Pages Functions
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

function getToken(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;
}

export async function onRequestPost({ request, env }) {
  try {
    const token = getToken(request);
    if (!token) return new Response(JSON.stringify({ error: 'Token tidak ditemukan' }), { status: 401, headers: HEADERS });

    let decoded;
    try { decoded = jwt.verify(token, env.JWT_SECRET); }
    catch { return new Response(JSON.stringify({ error: 'Token tidak valid' }), { status: 401, headers: HEADERS }); }

    const { old_password, new_password } = await request.json();

    if (!old_password || !new_password)
      return new Response(JSON.stringify({ error: 'Semua field wajib diisi' }), { status: 400, headers: HEADERS });

    if (new_password.length < 6)
      return new Response(JSON.stringify({ error: 'Password baru minimal 6 karakter' }), { status: 400, headers: HEADERS });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data: user } = await supabase.from('profiles').select('password_hash').eq('id', decoded.id).single();
    if (!user) return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), { status: 404, headers: HEADERS });

    const valid = await bcrypt.compare(old_password, user.password_hash);
    if (!valid) return new Response(JSON.stringify({ error: 'Password lama tidak sesuai' }), { status: 401, headers: HEADERS });

    const new_hash = await bcrypt.hash(new_password, 12);
    await supabase.from('profiles').update({ password_hash: new_hash }).eq('id', decoded.id);

    return new Response(JSON.stringify({ message: 'Password berhasil diganti' }), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
