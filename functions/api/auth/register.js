import { hashPassword, signJWT, supabase, json, CORS } from '../helper.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return json({ error: 'Username dan password wajib diisi' }, 400);
    if (username.length < 3) return json({ error: 'Username minimal 3 karakter' }, 400);
    if (password.length < 6) return json({ error: 'Password minimal 6 karakter' }, 400);

    const db = supabase(env);
    const { data: existing } = await db.from('profiles').select('id').eq('username', username.trim().toLowerCase()).single();
    if (existing) return json({ error: 'Username sudah dipakai' }, 409);

    const password_hash = await hashPassword(password);
    const { data: newUser, error } = await db
      .from('profiles')
      .insert({ username: username.trim().toLowerCase(), password_hash, coins: 0 })
      .select('id, username, coins').single();

    if (error) return json({ error: 'Gagal buat akun: ' + error.message }, 500);

    const token = await signJWT({ id: newUser.id, username: newUser.username }, env.JWT_SECRET);

    return json({
      session: {
        access_token: token,
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        user: { id: newUser.id, username: newUser.username }
      },
      profile: { id: newUser.id, username: newUser.username, coins: 0 }
    });
  } catch (err) {
    return json({ error: 'Internal server error: ' + err.message }, 500);
  }
}

export const onRequestOptions = () => CORS;
