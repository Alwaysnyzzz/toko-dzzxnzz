import { verifyPassword, hashPassword, verifyJWT, getToken, supabase, json, CORS } from '../_helper.js';

export async function onRequestPost({ request, env }) {
  try {
    const token = getToken(request);
    if (!token) return json({ error: 'Token tidak ditemukan' }, 401);
    const decoded = await verifyJWT(token, env.JWT_SECRET);

    const { old_password, new_password } = await request.json();
    if (!old_password || !new_password) return json({ error: 'Semua field wajib diisi' }, 400);
    if (new_password.length < 6) return json({ error: 'Password baru minimal 6 karakter' }, 400);

    const db = supabase(env);
    const { data: user } = await db.from('profiles').select('password_hash').eq('id', decoded.id).single();
    if (!user) return json({ error: 'User tidak ditemukan' }, 404);

    const valid = await verifyPassword(old_password, user.password_hash);
    if (!valid) return json({ error: 'Password lama tidak sesuai' }, 401);

    const new_hash = await hashPassword(new_password);
    await db.from('profiles').update({ password_hash: new_hash }).eq('id', decoded.id);

    return json({ message: 'Password berhasil diganti' });
  } catch (err) {
    return json({ error: 'Internal server error' }, 500);
  }
}

export const onRequestOptions = () => CORS;
