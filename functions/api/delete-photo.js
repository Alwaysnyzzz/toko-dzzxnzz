import { verifyJWT, getToken, supabase, json, CORS } from './_helper.js';

export async function onRequestPost({ request, env }) {
  try {
    const token = getToken(request);
    if (!token) return json({ error: 'Token tidak ditemukan' }, 401);
    const decoded = await verifyJWT(token, env.JWT_SECRET);

    const { type } = await request.json();
    if (!type || !['avatar', 'cover'].includes(type)) return json({ error: 'type harus avatar atau cover' }, 400);

    const updateData = type === 'avatar' ? { avatar_url: null } : { cover_url: null };
    await supabase(env).from('profiles').update(updateData).eq('id', decoded.id);

    return json({ success: true });
  } catch (err) {
    return json({ error: 'Internal server error' }, 500);
  }
}

export const onRequestOptions = () => CORS;
