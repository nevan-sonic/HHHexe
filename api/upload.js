/**
 * Upload a generated PNG/JPEG (base64) to a temporary public host
 * so Share-to-X can use a real image URL for link previews.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, filename = 'hh-goa-2026.png' } = req.body || {};
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Missing image (base64 data URL or raw base64)' });
    }

    const match = image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
    const mime = match ? match[1] : 'image/png';
    const b64 = match ? match[2] : image.replace(/\s/g, '');
    const buffer = Buffer.from(b64, 'base64');

    if (!buffer.length || buffer.length > 4.2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image empty or too large (max ~4MB)' });
    }

    const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
    const safeName = String(filename).replace(/[^\w.-]+/g, '_') || `hh-goa.${ext}`;

    const url = await uploadWithFallbacks(buffer, safeName, mime);
    if (!url) {
      return res.status(502).json({ error: 'All upload hosts failed' });
    }
    return res.status(200).json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};

async function uploadWithFallbacks(buffer, filename, mime) {
  // Prefer permanent catbox URLs (shorter + more crawler-friendly), then temp hosts
  const attempts = [uploadCatbox, uploadLitterbox, uploadTmpfiles];
  for (const fn of attempts) {
    try {
      const url = await fn(buffer, filename, mime);
      if (url && /^https?:\/\//i.test(url)) return url.trim().replace(/^http:\/\//i, 'https://');
    } catch (_) { /* try next */ }
  }
  return null;
}

async function uploadCatbox(buffer, filename, mime) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buffer], { type: mime }), filename);

  const r = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form,
  });
  const text = (await r.text()).trim();
  if (!r.ok || !text.startsWith('http')) {
    throw new Error(text || 'catbox failed');
  }
  return text;
}

async function uploadLitterbox(buffer, filename, mime) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('time', '72h');
  form.append('fileToUpload', new Blob([buffer], { type: mime }), filename);

  const r = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
    method: 'POST',
    body: form,
  });
  const text = (await r.text()).trim();
  if (!r.ok || !text.startsWith('http')) {
    throw new Error(text || 'litterbox failed');
  }
  return text;
}

async function uploadTmpfiles(buffer, filename, mime) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mime }), filename);

  const r = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: form,
  });
  const data = await r.json();
  const pageUrl = data && data.data && data.data.url;
  if (!pageUrl) throw new Error('tmpfiles failed');
  // Direct file URL for OG scrapers
  return pageUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
}
