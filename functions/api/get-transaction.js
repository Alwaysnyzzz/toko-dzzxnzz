import { supabase, json, CORS } from './_helper.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const order_id = url.searchParams.get('order_id');
    if (!order_id) return json({ error: 'order_id wajib' }, 400);

    const { data, error } = await supabase(env).from('transactions').select('*').eq('order_id', order_id).single();
    if (error || !data) return json({ error: 'Transaksi tidak ditemukan' }, 404);
    return json(data);
  } catch (err) {
    return json({ error: 'Internal server error' }, 500);
  }
}

export const onRequestOptions = () => CORS;
