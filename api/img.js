/**
 * Same-origin image proxy so X/Twitter can fetch og:image from hhhexe.vercel.app
 * (crawlers often block litterbox/tmpfiles/catbox directly).
 *
 * GET /api/img?u=<https-image-url>
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).end('Method not allowed');
  }

  const raw = typeof req.query.u === 'string' ? req.query.u.trim() : '';
  let target;
  try {
    target = new URL(raw);
  } catch (_) {
    return res.status(400).end('Invalid u');
  }

  if (target.protocol !== 'https:') {
    return res.status(400).end('HTTPS required');
  }

  // Allowlist common temp hosts + our own domain
  const host = target.hostname.toLowerCase();
  const allowed =
    host.endsWith('catbox.moe') ||
    host.endsWith('tmpfiles.org') ||
    host.endsWith('vercel.app') ||
    host === 'hhhexe.vercel.app';

  if (!allowed) {
    return res.status(403).end('Host not allowed');
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'HHHexeCardBot/1.0 (+https://hhhexe.vercel.app)',
        Accept: 'image/*,*/*',
      },
    });

    if (!upstream.ok) {
      return res.status(502).end('Upstream image failed');
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return res.status(502).end('Upstream is not an image');
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType.split(';')[0]);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Content-Length', buf.length);
    return res.end(buf);
  } catch (err) {
    return res.status(502).end(err.message || 'Proxy failed');
  }
};
