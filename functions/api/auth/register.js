// functions/api/auth/register.js — Cloudflare Pages Functions
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password)
      return new Response(JSON.stringify({ error: 'Username dan password wajib diisi' }), { status: 400, headers: HEADERS });

    if (username.length < 3)
      return new Response(JSON.stringify({ error: 'Username minimal 3 karakter' }), { status: 400, headers: HEADERS });

    if (password.length < 6)
      return new Response(JSON.stringify({ error: 'Password minimal 6 karakter' }), { status: 400, headers: HEADERS });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Cek username sudah ada
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .single();

    if (existing)
      return new Response(JSON.stringify({ error: 'Username sudah dipakai' }), { status: 409, headers: HEADERS });

    const password_hash = await bcrypt.hash(password, 12);

    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert({ username: username.trim().toLowerCase(), password_hash, coins: 0 })
      .select('id, username, coins')
      .single();

    if (error)
      return new Response(JSON.stringify({ error: 'Gagal membuat akun: ' + error.message }), { status: 500, headers: HEADERS });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return new Response(JSON.stringify({
      session: {
        access_token: token,
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        user: { id: newUser.id, username: newUser.username }
      },
      profile: { id: newUser.id, username: newUser.username, coins: 0 }
    }), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
