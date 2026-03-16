// api/upload-image.js
// Terima base64 dari frontend → upload ke Catbox → simpan URL ke Supabase

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import FormData from 'form-data';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verifikasi token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token tidak ditemukan' });

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token tidak valid' });
  }

  const { image, type, filename } = req.body;

  if (!image || !type)
    return res.status(400).json({ error: 'image dan type wajib diisi' });

  if (!['avatar', 'cover'].includes(type))
    return res.status(400).json({ error: 'type harus avatar atau cover' });

  try {
    // Konversi base64 ke Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch  = image.match(/^data:(image\/\w+);base64,/);
    const mimeType   = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // Validasi tipe
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!allowed.includes(mimeType))
      return res.status(400).json({ error: 'Format harus JPG, PNG, WebP, atau GIF' });

    const buffer = Buffer.from(base64Data, 'base64');

    // Validasi ukuran (max 5MB)
    if (buffer.length > 5 * 1024 * 1024)
      return res.status(400).json({ error: 'Ukuran file maksimal 5 MB' });

    // Buat nama file unik
    const ext      = mimeType.split('/')[1].replace('jpeg','jpg');
    const fileName = `${type}_${decoded.id}_${Date.now()}.${ext}`;

    // Upload ke Catbox
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('userhash', '');
    form.append('fileToUpload', buffer, {
      filename: fileName,
      contentType: mimeType
    });

    const catboxRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const catboxUrl = (await catboxRes.text()).trim();

    if (!catboxUrl.startsWith('https://files.catbox.moe/')) {
      console.error('[Upload] Catbox error:', catboxUrl);
      return res.status(500).json({ error: 'Upload ke Catbox gagal. Coba lagi.' });
    }

    // Simpan URL ke Supabase
    const updateData = type === 'avatar'
      ? { avatar_url: catboxUrl }
      : { cover_url: catboxUrl };

    const { error: dbError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', decoded.id);

    if (dbError) {
      console.error('[Upload] DB error:', dbError);
      return res.status(500).json({ error: 'Gagal simpan URL foto' });
    }

    console.log(`[Upload] ${type} uploaded for user ${decoded.id}: ${catboxUrl}`);
    return res.status(200).json({ url: catboxUrl });

  } catch (err) {
    console.error('[Upload] Exception:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
