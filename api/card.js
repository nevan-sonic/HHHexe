/**
 * Dynamic share card with Open Graph / Twitter meta pointing at the
 * uploaded generated graphic (not the static frame template).
 *
 * GET /api/card?img=<https-image-url>&kind=pfp|front|back&name=...
 */
module.exports = async (req, res) => {
  const q = req.query || {};
  const img = typeof q.img === 'string' ? q.img.trim() : '';
  const kind = typeof q.kind === 'string' ? q.kind : 'pfp';
  const name = typeof q.name === 'string' ? q.name.slice(0, 40) : '';

  if (!img || !/^https:\/\//i.test(img)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Missing or invalid img (https URL required)');
  }

  const titles = {
    pfp: 'Hacker House Goa 2026 – X Profile Frame',
    front: 'Hacker House Goa 2026 – Builder Pass',
    back: 'Hacker House Goa 2026 – Team Pass',
  };
  const title = name
    ? `${name} · ${titles[kind] || titles.pfp}`
    : (titles[kind] || titles.pfp);
  const description =
    'Official Hacker House Goa 2026 builder graphic — download & share. #FrameInGoa';

  const safeImg = escapeHtml(img);
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const origin = `https://${req.headers.host || 'hhhexe.vercel.app'}`;
  const studioUrl = escapeHtml(origin.replace(/\/$/, '') + '/');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImg}">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta property="og:url" content="${escapeHtml(origin + req.url)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImg}">
  <style>
    :root { color-scheme: dark; }
    body { margin:0; min-height:100vh; font-family: system-ui, sans-serif;
      background:#002613; color:#ffe600; display:flex; align-items:center;
      justify-content:center; padding:24px; }
    .wrap { max-width:560px; width:100%; text-align:center; }
    img { width:100%; height:auto; border-radius:12px; border:2px solid #ffe600; }
    h1 { font-size:1.25rem; margin:1rem 0 0.5rem; }
    p { color:#c8e6d0; font-size:0.95rem; }
    a.btn { display:inline-block; margin-top:1rem; padding:0.75rem 1.25rem;
      background:#ffe600; color:#002613; font-weight:800; text-decoration:none;
      border-radius:8px; }
  </style>
</head>
<body>
  <div class="wrap">
    <img src="${safeImg}" alt="${safeTitle}">
    <h1>${safeTitle}</h1>
    <p>${safeDesc}</p>
    <a class="btn" href="${studioUrl}">Make yours</a>
  </div>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.end(html);
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
