// functions/api/auth/login.js — Cloudflare Pages Functions format
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function onRequestPost({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { username, password } = await request.json();

    if (!username || !password)
      return new Response(JSON.stringify({ error: 'Username dan password wajib diisi' }), { status: 400, headers });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, username, password_hash, coins')
      .eq('username', username.trim().toLowerCase())
      .single();

    if (error || !user)
      return new Response(JSON.stringify({ error: 'Username atau password salah' }), { status: 401, headers });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return new Response(JSON.stringify({ error: 'Username atau password salah' }), { status: 401, headers });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return new Response(JSON.stringify({
      session: {
        access_token: token,
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        user: { id: user.id, username: user.username }
      },
      profile: { id: user.id, username: user.username, coins: user.coins }
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
