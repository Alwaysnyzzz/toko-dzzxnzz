import { verifyJWT, getToken, supabase, json, CORS } from './_helper.js';

export async function onRequestPost({ request, env }) {
  try {
    const token = getToken(request);
    if (!token) return json({ error: 'Token tidak ditemukan' }, 401);
    const decoded = await verifyJWT(token, env.JWT_SECRET);

    const { order_id } = await request.json();
    if (!order_id) return json({ error: 'order_id wajib' }, 400);

    const db = supabase(env);
    const { data: trx } = await db.from('transactions').select('*').eq('order_id', order_id).eq('user_id', decoded.id).single();
    if (!trx) return json({ error: 'Transaksi tidak ditemukan' }, 404);
    if (trx.status !== 'pending') return json({ error: 'Hanya transaksi pending yang bisa dibatalkan' }, 400);

    await db.from('transactions').update({ status: 'cancelled' }).eq('order_id', order_id);
    return json({ success: true });
  } catch (err) {
    return json({ error: 'Internal server error' }, 500);
  }
}

export const onRequestOptions = () => CORS;
