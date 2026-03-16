import { supabase, json, CORS } from './helper.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const order_id = url.searchParams.get('order_id');
    if (!order_id) return json({ error: 'order_id wajib' }, 400);

    const db = supabase(env);
    const { data: trx } = await db.from('transactions').select('*').eq('order_id', order_id).single();
    if (!trx) return json({ error: 'Transaksi tidak ditemukan' }, 404);
    if (trx.status === 'completed') return json({ status: 'completed', order_id });

    const pakasirRes = await fetch(`https://api.pakasir.com/transaction/${order_id}`, {
      headers: { 'Authorization': `Bearer ${env.PAKASIR_API_KEY}` }
    });
    const pakasir = await pakasirRes.json();
    const paid = pakasir.data?.status === 'paid' || pakasir.status === 'paid';

    if (paid) {
      await db.from('transactions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('order_id', order_id);
      await db.rpc('add_coins', { p_user_id: trx.user_id, p_amount: Number(trx.amount) });
      return json({ status: 'completed', order_id });
    }

    if (trx.expired_at && new Date() > new Date(trx.expired_at)) {
      await db.from('transactions').update({ status: 'cancelled' }).eq('order_id', order_id);
      return json({ status: 'cancelled', order_id });
    }

    return json({ status: 'pending', order_id });
  } catch (err) {
    return json({ error: 'Internal server error' }, 500);
  }
}

export const onRequestOptions = () => CORS;
