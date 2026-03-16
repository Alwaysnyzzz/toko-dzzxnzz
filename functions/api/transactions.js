import { verifyJWT, getToken, supabase, json, CORS } from './_helper.js';

export async function onRequestGet({ request, env }) {
  try {
    const token = getToken(request);
    if (!token) return json({ error: 'Token tidak ditemukan' }, 401);
    const decoded = await verifyJWT(token, env.JWT_SECRET);

    const { data, error } = await supabase(env)
      .from('transactions')
      .select('id, order_id, amount, status, type, payment_method, created_at, completed_at')
      .eq('user_id', decoded.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return json({ error: error.message }, 500);
    return json(data || []);
  } catch (err) {
    return json({ error: 'Internal server error' }, 500);
  }
}

export const onRequestOptions = () => CORS;
