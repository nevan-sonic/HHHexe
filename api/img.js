/**
 * Same-origin image proxy so X/Twitter can fetch og:image from hhhexe.vercel.app.
 * MUST support HEAD — Twitterbot probes with HEAD before GET.
 *
 * GET|HEAD /api/img?u=<https-image-url>
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
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
    // Always GET upstream — many hosts (and our own API) reject HEAD
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Twitterbot/1.0',
        Accept: 'image/*,*/*',
      },
    });

    if (!upstream.ok) {
      return res.status(502).end('Upstream image failed');
    }

    const contentType = (upstream.headers.get('content-type') || 'image/jpeg')
      .split(';')[0]
      .trim();
    if (!contentType.startsWith('image/')) {
      return res.status(502).end('Upstream is not an image');
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Content-Length', String(buf.length));

    if (req.method === 'HEAD') {
      return res.end();
    }
    return res.end(buf);
  } catch (err) {
    return res.status(502).end(err.message || 'Proxy failed');
  }
};
