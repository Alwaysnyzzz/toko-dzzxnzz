import { supabase, json, CORS } from './_helper.js';

export async function onRequestPost({ request, env }) {
  try {
    const { order_id } = await request.json();
    if (!order_id) return json({ error: 'order_id wajib' }, 400);

    const db = supabase(env);
    const { data: trx } = await db.from('transactions').select('*').eq('order_id', order_id).single();
    if (!trx) return json({ error: 'Transaksi tidak ditemukan' }, 404);
    if (trx.status === 'completed') return json({ message: 'Sudah diproses' });

    const pakasirRes = await fetch(`https://api.pakasir.com/transaction/${order_id}`, {
      headers: { 'Authorization': `Bearer ${env.PAKASIR_API_KEY}` }
    });
    const pakasir = await pakasirRes.json();
    const paid = pakasir.data?.status === 'paid' || pakasir.status === 'paid';

    if (!paid) return json({ message: 'Belum lunas' });

    await db.from('transactions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('order_id', order_id);
    await db.rpc('add_coins', { p_user_id: trx.user_id, p_amount: Number(trx.amount) });

    return json({ success: true });
  } catch (err) {
    return json({ error: 'Internal server error' }, 500);
  }
}

export const onRequestOptions = () => CORS;
