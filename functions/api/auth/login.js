import { verifyPassword, signJWT, supabase, json, CORS } from '../_helper.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return json({ error: 'Username dan password wajib diisi' }, 400);

    const db = supabase(env);
    const { data: user, error } = await db
      .from('profiles')
      .select('id, username, password_hash, coins')
      .eq('username', username.trim().toLowerCase())
      .single();

    if (error || !user) return json({ error: 'Username atau password salah' }, 401);

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return json({ error: 'Username atau password salah. Jika akun lama, silakan reset password.' }, 401);

    const token = await signJWT({ id: user.id, username: user.username }, env.JWT_SECRET);

    return json({
      session: {
        access_token: token,
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        user: { id: user.id, username: user.username }
      },
      profile: { id: user.id, username: user.username, coins: user.coins }
    });
  } catch (err) {
    return json({ error: 'Internal server error: ' + err.message }, 500);
  }
}

export const onRequestOptions = () => CORS;
