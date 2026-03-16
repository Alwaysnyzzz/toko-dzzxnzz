import { verifyJWT, getToken, supabase, json, CORS } from './helper.js';

export async function onRequestGet({ request, env }) {
  try {
    const token = getToken(request);
    if (!token) return json({ error: 'Token tidak ditemukan' }, 401);
    const decoded = await verifyJWT(token, env.JWT_SECRET);

    const { data: profile, error } = await supabase(env)
      .from('profiles')
      .select('id, username, coins, created_at, avatar_url, cover_url')
      .eq('id', decoded.id).single();

    if (error || !profile) return json({ error: 'Profil tidak ditemukan' }, 404);
    return json(profile);
  } catch (err) {
    return json({ error: 'Internal server error' }, 500);
  }
}

export const onRequestOptions = () => CORS;
