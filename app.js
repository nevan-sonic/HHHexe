/**
 * Hacker House Goa – Official ID Card & Pass Studio
 * Full Application Logic with Image Upload, Move X/Y Sliders, Zoom, Rotate, and Drag Sync
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Canvas contexts ─────────────────────────────── */
  const frontCanvas = document.getElementById('frontCanvas');
  const frontCtx    = frontCanvas.getContext('2d');
  const backCanvas  = document.getElementById('backCanvas');
  const backCtx     = backCanvas.getContext('2d');
  const pfpCanvas   = document.getElementById('pfpCanvas');
  const pfpCtx      = pfpCanvas ? pfpCanvas.getContext('2d') : null;

  /* ── Template images ─────────────────────────────── */
  const frontTemplate = new Image();
  frontTemplate.src   = 'frontf.jpeg';
  const backTemplate  = new Image();
  backTemplate.src    = 'backf.jpeg';
  const pfpFrameTemplate = new Image();
  pfpFrameTemplate.src   = 'pfp_frame.png';
  const qrTemplate = new Image();
  qrTemplate.src   = 'qr_hhgoa.png';

  let loaded = 0;
  const onLoad = () => { if (++loaded >= 4) renderAll(); };
  frontTemplate.onload    = onLoad;
  backTemplate.onload     = onLoad;
  pfpFrameTemplate.onload = onLoad;
  qrTemplate.onload       = onLoad;

  /* ── App state ───────────────────────────────────── */
  let currentView = 'front'; // 'front', 'back', or 'pfp'

  const S = {
    pfp: {
      image: null, img: { x:0, y:0, scale:1, rotate:0 }
    },
    front: {
      name: 'Nevan Alvares', fontName: 'Caveat', fontSizeName: 52,
      role: 'Full Stack Developer',
      builderId: document.getElementById('inputBuilderId') ? document.getElementById('inputBuilderId').value : 'HH0026',
      tag: 'Wave Rider',
      image: null, img: { x:0, y:0, scale:1, rotate:0 }
    },
    back: {
      teamName: 'CYBER PUNKS', fontTeam: 'Permanent Marker', fontSizeTeam: 54,
      teamSlogan: 'Ride The Waves!',
      image: null, img: { x:0, y:0, scale:1, rotate:0 }
    }
  };

  /* ── Layout config (722×1099 canvas units) ──────── */
  const FC = {
    circleCenter: { x:361, y:439 }, circleRadius: 210,
    nameCenter:   { x:361, y:675 }, nameAngle: -1.2 * Math.PI/180, maxNameW: 390,
    roleCenter:   { x:361, y:747 }, maxRoleW: 440,
    idCenter:     { x:224, y:845 }, maxIdW: 200,       // Builder ID box
    tagCenter:    { x:311, y:938 }, maxTagW: 200
  };
  const BC = {
    circleCenter:    { x:361, y:454 }, circleRadius: 210,
    teamNameCenter:  { x:361, y:204 }, teamNameAngle: -1.5 * Math.PI/180, maxTeamNameW: 450,
    sloganCenter:    { x:304, y:704 }, sloganAngle: 0.8 * Math.PI/180, maxSloganW: 340
  };

  /* ── Helpers ─────────────────────────────────────── */
  function isHeicFile(file) {
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    return (
      name.endsWith('.heic') ||
      name.endsWith('.heif') ||
      type === 'image/heic' ||
      type === 'image/heif' ||
      type === 'image/heic-sequence' ||
      type === 'image/heif-sequence'
    );
  }

  function processImageFile(file, callback, onError) {
    if (!file) return;
    const fail = msg => {
      if (typeof onError === 'function') onError(msg);
      else alert(msg);
    };
    const loadStandardImage = fileObj => {
      const reader = new FileReader();
      reader.onerror = () => fail('Could not read that image file.');
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => callback(img);
        img.onerror = () => fail('Could not decode that image. Try JPG or PNG.');
        img.src = ev.target.result;
      };
      reader.readAsDataURL(fileObj);
    };

    if (isHeicFile(file)) {
      if (!window.heic2any) {
        fail('HEIC support is still loading. Wait a second and try again, or export as JPG.');
        return;
      }
      heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
        .then(conversionResult => {
          const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
          loadStandardImage(blob);
        })
        .catch(() => fail('Could not convert HEIC. On iPhone, try “Most Compatible” or export as JPG.'));
      return;
    }
    loadStandardImage(file);
  }

  /* Fun builder titles — short enough for the badge tag slot */
  const TITLE_POOL = {
    default: ['Wave Rider', 'Ship It', 'Goa Hacker', 'Coast Coder', 'Palm Pilot', 'Monsoon Dev'],
    frontend: ['Pixel Surfer', 'UI Voyager', 'React Rider', 'CSS Captain'],
    backend: ['API Surfer', 'Stack Diver', 'Data Surfer', 'Node Nomad'],
    fullstack: ['Full Wave', 'Stack Surfer', 'End-to-End', 'Ship Captain'],
    ai: ['Model Rider', 'Prompt Pilot', 'AI Voyager', 'Neural Surf'],
    design: ['Vibe Crafter', 'Pixel Poet', 'Form Finder', 'Type Surfer'],
    mobile: ['App Sailor', 'Touch Surfer', 'Swift Rider', 'Native Wave'],
    web3: ['Chain Rider', 'Block Surfer', 'Wallet Wave', 'On-Chain'],
    founder: ['Build Chief', 'Founder Wave', 'Ship Owner', 'Goa Founder'],
  };

  function roleBucket(role) {
    const r = (role || '').toLowerCase();
    if (/ai|ml|llm|prompt|model/.test(r)) return 'ai';
    if (/design|ux|ui|product design/.test(r)) return 'design';
    if (/mobile|ios|android|flutter|react native/.test(r)) return 'mobile';
    if (/web3|crypto|solidity|blockchain/.test(r)) return 'web3';
    if (/founder|ceo|builder founder/.test(r)) return 'founder';
    if (/full.?stack|fullstack/.test(r)) return 'fullstack';
    if (/front|react|vue|angular|next/.test(r)) return 'frontend';
    if (/back|node|python|java|rust|go\b|devops|infra/.test(r)) return 'backend';
    return 'default';
  }

  function generateBuilderTitle(name, role, avoid) {
    const bucket = roleBucket(role);
    const pool = [...(TITLE_POOL[bucket] || []), ...TITLE_POOL.default];
    const first = (name || '').trim().split(/\s+/)[0];
    if (first && first.length <= 6) {
      pool.push(`${first} Wave`, `${first} Dev`);
    }
    const unique = [...new Set(pool.map(t => t.slice(0, 14)))].filter(t => t && t !== avoid);
    return unique[Math.floor(Math.random() * unique.length)] || 'Wave Rider';
  }

  function applyBuilderTitle(title, { render = true } = {}) {
    const t = String(title || '').slice(0, 14);
    S.front.tag = t;
    const el = document.getElementById('inputTag');
    if (el) el.value = t;
    if (render) renderFront();
  }

  function fitFont(ctx, text, base, family, weight, maxW, min=12) {
    let s = base;
    ctx.font = `${weight} ${s}px "${family}", sans-serif`;
    while (ctx.measureText(text).width > maxW && s > min) {
      s--;
      ctx.font = `${weight} ${s}px "${family}", sans-serif`;
    }
    return ctx.font;
  }

  function drawImageInCircle(ctx, cfg, imgState, img) {
    const cx = cfg.circleCenter.x;
    const cy = cfg.circleCenter.y;
    const r  = cfg.circleRadius;

    ctx.save(); // OUTER — sets clip, removed on final restore

    // 1. Clip to circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // 2. Dark background fill (fillRect avoids touching the arc path)
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    // 3. Draw the photo/logo centered + transformed
    ctx.save();
    ctx.translate(cx + imgState.x, cy + imgState.y);
    ctx.rotate(imgState.rotate * Math.PI / 180);
    const aspect = img.width / img.height;
    let w, h;
    // Ensure image always covers the full circle (cover logic)
    if (aspect >= 1) { h = r * 2; w = h * aspect; }
    else              { w = r * 2; h = w / aspect; }
    w *= imgState.scale;
    h *= imgState.scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    // 4. Golden ring drawn INSIDE the clip — perfectly sealed edge, zero bleed
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.95)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // OUTER — removes clip
  }


  /* ── FRONT render ────────────────────────────────── */
  function renderFront() {
    if (!frontTemplate.complete || !frontTemplate.naturalWidth) return;
    frontCtx.clearRect(0, 0, 722, 1099);
    frontCtx.drawImage(frontTemplate, 0, 0, 722, 1099);

    const fs = S.front;

    // 1. Profile photo
    if (fs.image) drawImageInCircle(frontCtx, FC, fs.img, fs.image);

    // 2. Builder name
    if (fs.name.trim()) {
      frontCtx.save();
      frontCtx.translate(FC.nameCenter.x, FC.nameCenter.y);
      frontCtx.rotate(FC.nameAngle);
      fitFont(frontCtx, fs.name.trim(), fs.fontSizeName, fs.fontName, '700', FC.maxNameW);
      frontCtx.fillStyle = '#1c1917';
      frontCtx.textAlign = 'center';
      frontCtx.textBaseline = 'middle';
      frontCtx.shadowColor = 'rgba(0,0,0,0.18)';
      frontCtx.shadowBlur = 3;
      frontCtx.shadowOffsetX = 1;
      frontCtx.shadowOffsetY = 1;
      frontCtx.fillText(fs.name.trim(), 0, 0);
      frontCtx.restore();
    }

    // 3. Role
    if (fs.role.trim()) {
      frontCtx.save();
      // Cover original template role string
      frontCtx.fillStyle = '#017038';
      frontCtx.beginPath();
      frontCtx.roundRect(114, 728, 494, 38, 6);
      frontCtx.fill();
      frontCtx.translate(FC.roleCenter.x, FC.roleCenter.y);
      fitFont(frontCtx, fs.role.trim(), 28, 'Fira Code', '700', FC.maxRoleW, 14);
      frontCtx.fillStyle = '#ffffff';
      frontCtx.textAlign = 'center';
      frontCtx.textBaseline = 'middle';
      frontCtx.shadowColor = 'rgba(0,0,0,0.6)';
      frontCtx.shadowBlur = 4;
      frontCtx.shadowOffsetY = 2;
      frontCtx.fillText(fs.role.trim(), 0, 0);
      frontCtx.restore();
    }

    // 4. Builder ID
    {
      const txt = (fs.builderId || '').trim().toUpperCase();
      if (txt) {
        frontCtx.save();
        frontCtx.setTransform(1, 0, 0, 1, 0, 0);
        frontCtx.globalAlpha = 1;
        frontCtx.globalCompositeOperation = 'source-over';
        frontCtx.shadowColor = 'transparent';
        frontCtx.shadowBlur  = 0;
        frontCtx.shadowOffsetX = 0;
        frontCtx.shadowOffsetY = 0;

        let sz = 34;
        frontCtx.font = `bold ${sz}px "Courier New", monospace`;
        while (frontCtx.measureText(txt).width > FC.maxIdW && sz > 14) {
          sz--;
          frontCtx.font = `bold ${sz}px "Courier New", monospace`;
        }

        frontCtx.textAlign    = 'center';
        frontCtx.textBaseline = 'middle';

        // Dark text shadow
        frontCtx.fillStyle = 'rgba(0,0,0,0.75)';
        frontCtx.fillText(txt, FC.idCenter.x + 1, FC.idCenter.y + 2);

        // Yellow main text
        frontCtx.fillStyle = '#ffe600';
        frontCtx.fillText(txt, FC.idCenter.x, FC.idCenter.y);

        frontCtx.restore();
      }
    }

    // 5. Builder title (generated / editable tag)
    if (fs.tag.trim()) {
      frontCtx.save();
      frontCtx.translate(FC.tagCenter.x, FC.tagCenter.y);
      fitFont(frontCtx, fs.tag.trim().toUpperCase(), 20, 'Outfit', '800', FC.maxTagW, 11);
      frontCtx.fillStyle = '#ffffff';
      frontCtx.textAlign = 'center';
      frontCtx.textBaseline = 'middle';
      frontCtx.shadowColor = 'rgba(0,0,0,0.4)';
      frontCtx.shadowBlur = 3;
      frontCtx.shadowOffsetY = 1;
      frontCtx.fillText(fs.tag.trim().toUpperCase(), 0, 0);
      frontCtx.restore();
    }

    // 6. Scannable QR code pointing to https://hhgoa.com/
    if (qrTemplate.complete && qrTemplate.naturalWidth) {
      frontCtx.drawImage(qrTemplate, 434, 813, 146, 146);
    }
  }

  /* ── BACK render ─────────────────────────────────── */
  function renderBack() {
    if (!backTemplate.complete || !backTemplate.naturalWidth) return;
    backCtx.clearRect(0, 0, 722, 1099);
    backCtx.drawImage(backTemplate, 0, 0, 722, 1099);

    const bs = S.back;

    // 1. Team logo
    if (bs.image) drawImageInCircle(backCtx, BC, bs.img, bs.image);

    // 2. Team name
    if (bs.teamName.trim()) {
      backCtx.save();
      backCtx.translate(BC.teamNameCenter.x, BC.teamNameCenter.y);
      backCtx.rotate(BC.teamNameAngle);
      fitFont(backCtx, bs.teamName.trim(), bs.fontSizeTeam, bs.fontTeam, '700', BC.maxTeamNameW);
      backCtx.fillStyle = '#1c1917';
      backCtx.textAlign = 'center';
      backCtx.textBaseline = 'middle';
      backCtx.shadowColor = 'rgba(0,0,0,0.18)';
      backCtx.shadowBlur = 3;
      backCtx.fillText(bs.teamName.trim(), 0, 0);
      backCtx.restore();
    }

    // 3. Team slogan
    if (bs.teamSlogan.trim()) {
      backCtx.save();
      backCtx.translate(BC.sloganCenter.x, BC.sloganCenter.y);
      backCtx.rotate(BC.sloganAngle);
      fitFont(backCtx, bs.teamSlogan.trim(), 38, 'Caveat', '700', BC.maxSloganW);
      backCtx.fillStyle = '#1c1917';
      backCtx.textAlign = 'center';
      backCtx.textBaseline = 'middle';
      backCtx.shadowColor = 'rgba(0,0,0,0.18)';
      backCtx.shadowBlur = 3;
      backCtx.fillText(bs.teamSlogan.trim(), 0, 0);
      backCtx.restore();
    }
  }

  /* ── PFP OVERLAY render ──────────────────────────── */
  function renderPfp() {
    if (!pfpCanvas || !pfpCtx) return;
    pfpCtx.clearRect(0, 0, 1024, 1024);

    const ps = S.pfp;
    // Inner frame photo circle bounds: center (512, 420), radius 330
    const cx = 512, cy = 420, r = 330;

    // 2. Profile Photo (if uploaded)
    if (ps.image) {
      pfpCtx.save();
      pfpCtx.beginPath();
      pfpCtx.arc(cx, cy, r, 0, Math.PI * 2);
      pfpCtx.closePath();
      pfpCtx.clip();

      pfpCtx.fillStyle = '#0f172a';
      pfpCtx.fillRect(cx - r, cy - r, r * 2, r * 2);

      pfpCtx.translate(cx + ps.img.x, cy + ps.img.y);
      pfpCtx.rotate(ps.img.rotate * Math.PI / 180);
      const aspect = ps.image.width / ps.image.height;
      let w, h;
      if (aspect >= 1) { h = r * 2; w = h * aspect; }
      else              { w = r * 2; h = w / aspect; }
      w *= ps.img.scale;
      h *= ps.img.scale;
      pfpCtx.drawImage(ps.image, -w / 2, -h / 2, w, h);
      pfpCtx.restore();
    } else {
      // Placeholder background text inside frame opening
      pfpCtx.save();
      pfpCtx.beginPath();
      pfpCtx.arc(cx, cy, r, 0, Math.PI * 2);
      pfpCtx.closePath();
      pfpCtx.fillStyle = 'rgba(1, 112, 56, 0.4)';
      pfpCtx.fill();
      pfpCtx.fillStyle = '#ffe600';
      pfpCtx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      pfpCtx.textAlign = 'center';
      pfpCtx.fillText('Upload Profile Photo', cx, cy);
      pfpCtx.restore();
    }

    // 3. Draw pfp_frame.png template overlay on top
    if (pfpFrameTemplate.complete && pfpFrameTemplate.naturalWidth) {
      pfpCtx.drawImage(pfpFrameTemplate, 0, 0, 1024, 1024);
    }
  }

  function renderAll() { renderFront(); renderBack(); renderPfp(); }

  // Render once fonts are ready
  document.fonts.ready.then(renderAll);

  /* ── Form Event Bindings ─────────────────────────── */

  function bind(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', handler);
  }
  function bindChange(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', handler);
  }

  function syncPhotoSliders() {
    const targetState = currentView === 'pfp' ? S.pfp.img : S.front.img;
    const zoomEl = document.getElementById('profileZoom');
    const posXEl = document.getElementById('profilePosX');
    const posYEl = document.getElementById('profilePosY');
    const rotEl  = document.getElementById('profileRotate');

    if (zoomEl) zoomEl.value = targetState.scale;
    if (posXEl) posXEl.value = targetState.x;
    if (posYEl) posYEl.value = targetState.y;
    if (rotEl)  rotEl.value  = targetState.rotate;

    const zoomVal = document.getElementById('profileZoomVal');
    const posXVal = document.getElementById('profilePosXVal');
    const posYVal = document.getElementById('profilePosYVal');
    const rotVal  = document.getElementById('profileRotateVal');

    if (zoomVal) zoomVal.textContent = `${Math.round(targetState.scale * 100)}%`;
    if (posXVal) posXVal.textContent = `${targetState.x}px`;
    if (posYVal) posYVal.textContent = `${targetState.y}px`;
    if (rotVal)  rotVal.textContent  = `${targetState.rotate}°`;
  }

  // Front Controls
  bind('inputName', e => {
    if (e.target.value.length > 18) e.target.value = e.target.value.slice(0, 18);
    S.front.name = e.target.value; renderFront();
  });
  bindChange('fontNameSelect', e => { S.front.fontName = e.target.value; renderFront(); });
  bind('fontSizeName', e => { S.front.fontSizeName = parseInt(e.target.value); renderFront(); });

  bind('inputRole', e => {
    S.front.role = e.target.value;
    renderFront();
  });

  bind('inputBuilderId', e => {
    if (e.target.value.length > 6) e.target.value = e.target.value.slice(0, 6);
    S.front.builderId = e.target.value;
    renderFront();
  });

  bind('inputTag', e => {
    if (e.target.value.length > 14) e.target.value = e.target.value.slice(0, 14);
    S.front.tag = e.target.value;
    renderFront();
  });

  const btnRegenTitle = document.getElementById('btnRegenTitle');
  if (btnRegenTitle) {
    btnRegenTitle.addEventListener('click', () => {
      applyBuilderTitle(generateBuilderTitle(S.front.name, S.front.role, S.front.tag));
    });
  }

  // Fresh title once fonts/templates are ready (keeps demo data fun)
  document.fonts.ready.then(() => {
    if (!S.front.tag || S.front.tag === 'React Dev' || S.front.tag === 'Wave Rider') {
      applyBuilderTitle(generateBuilderTitle(S.front.name, S.front.role), { render: true });
    }
  });

  // Profile Pic Image Adjustments (Zoom, Move X, Move Y, Rotate)
  bind('profileZoom', e => {
    const v = parseFloat(e.target.value);
    if (currentView === 'pfp') {
      S.pfp.img.scale = v;
      document.getElementById('profileZoomVal').textContent = `${Math.round(v*100)}%`;
      renderPfp();
    } else {
      S.front.img.scale = v;
      document.getElementById('profileZoomVal').textContent = `${Math.round(v*100)}%`;
      renderFront();
    }
  });
  bind('profilePosX', e => {
    const v = parseInt(e.target.value);
    if (currentView === 'pfp') {
      S.pfp.img.x = v;
      document.getElementById('profilePosXVal').textContent = `${v}px`;
      renderPfp();
    } else {
      S.front.img.x = v;
      document.getElementById('profilePosXVal').textContent = `${v}px`;
      renderFront();
    }
  });
  bind('profilePosY', e => {
    const v = parseInt(e.target.value);
    if (currentView === 'pfp') {
      S.pfp.img.y = v;
      document.getElementById('profilePosYVal').textContent = `${v}px`;
      renderPfp();
    } else {
      S.front.img.y = v;
      document.getElementById('profilePosYVal').textContent = `${v}px`;
      renderFront();
    }
  });
  bind('profileRotate', e => {
    const v = parseInt(e.target.value);
    if (currentView === 'pfp') {
      S.pfp.img.rotate = v;
      document.getElementById('profileRotateVal').textContent = `${v}°`;
      renderPfp();
    } else {
      S.front.img.rotate = v;
      document.getElementById('profileRotateVal').textContent = `${v}°`;
      renderFront();
    }
  });

  document.getElementById('btnResetFrontImage').addEventListener('click', () => {
    if (currentView === 'pfp') {
      S.pfp.img = { x:0, y:0, scale:1, rotate:0 };
      syncPhotoSliders();
      renderPfp();
    } else {
      S.front.img = { x:0, y:0, scale:1, rotate:0 };
      syncPhotoSliders();
      renderFront();
    }
  });

  /* ── Drag hint: show once before first move, never again ── */
  const hintTimers = {};
  const hintDismissed = { front: false, back: false, pfp: false };

  function hintEl(side) {
    return document.getElementById(
      side === 'pfp' ? 'pfpDragHint' : side === 'back' ? 'backDragHint' : 'frontDragHint'
    );
  }

  function dismissDragHint(side) {
    if (hintDismissed[side]) return;
    hintDismissed[side] = true;
    if (hintTimers[side]) {
      clearTimeout(hintTimers[side]);
      delete hintTimers[side];
    }
    const el = hintEl(side);
    if (!el) return;
    el.classList.remove('is-visible');
    el.classList.add('is-dismissed');
    el.setAttribute('aria-hidden', 'true');
  }

  function showDragHint(side) {
    if (hintDismissed[side]) return;
    const el = hintEl(side);
    if (!el) return;
    el.classList.remove('is-dismissed');
    el.classList.add('is-visible');
    el.setAttribute('aria-hidden', 'false');
    if (hintTimers[side]) clearTimeout(hintTimers[side]);
    hintTimers[side] = setTimeout(() => dismissDragHint(side), 2800);
  }

  document.getElementById('inputProfilePic').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    processImageFile(file, img => {
      // Sync one upload across Format A (PFP) and Format B (front pass)
      const reset = { x: 0, y: 0, scale: 1, rotate: 0 };
      S.front.image = img;
      S.front.img = { ...reset };
      S.pfp.image = img;
      S.pfp.img = { ...reset };
      // Fresh photo → allow the one-time hint again for both views
      hintDismissed.front = false;
      hintDismissed.pfp = false;
      const frontHint = hintEl('front');
      const pfpHint = hintEl('pfp');
      if (frontHint) frontHint.classList.remove('is-dismissed');
      if (pfpHint) pfpHint.classList.remove('is-dismissed');
      syncPhotoSliders();
      document.getElementById('labelProfilePicText').textContent = file.name;
      renderFront();
      renderPfp();
      showDragHint(currentView === 'pfp' ? 'pfp' : 'front');
    });
    e.target.value = '';
  });

  // Back Controls
  bind('inputTeamName', e => {
    if (e.target.value.length > 18) e.target.value = e.target.value.slice(0, 18);
    S.back.teamName = e.target.value; renderBack();
  });
  bindChange('fontTeamSelect', e => { S.back.fontTeam = e.target.value; renderBack(); });
  bind('fontSizeTeam', e => { S.back.fontSizeTeam = parseInt(e.target.value); renderBack(); });

  bind('inputTeamSlogan', e => {
    if (e.target.value.length > 18) e.target.value = e.target.value.slice(0, 18);
    S.back.teamSlogan = e.target.value; renderBack();
  });

  // Team Logo Image Adjustments (Zoom, Move X, Move Y, Rotate)
  bind('logoZoom', e => {
    const v = parseFloat(e.target.value);
    S.back.img.scale = v;
    document.getElementById('logoZoomVal').textContent = `${Math.round(v*100)}%`;
    renderBack();
  });
  bind('logoPosX', e => {
    const v = parseInt(e.target.value);
    S.back.img.x = v;
    document.getElementById('logoPosXVal').textContent = `${v}px`;
    renderBack();
  });
  bind('logoPosY', e => {
    const v = parseInt(e.target.value);
    S.back.img.y = v;
    document.getElementById('logoPosYVal').textContent = `${v}px`;
    renderBack();
  });
  bind('logoRotate', e => {
    const v = parseInt(e.target.value);
    S.back.img.rotate = v;
    document.getElementById('logoRotateVal').textContent = `${v}°`;
    renderBack();
  });

  document.getElementById('btnResetBackImage').addEventListener('click', () => {
    S.back.img = { x:0, y:0, scale:1, rotate:0 };
    document.getElementById('logoZoom').value = 1;
    document.getElementById('logoPosX').value = 0;
    document.getElementById('logoPosY').value = 0;
    document.getElementById('logoRotate').value = 0;
    document.getElementById('logoZoomVal').textContent = '100%';
    document.getElementById('logoPosXVal').textContent = '0px';
    document.getElementById('logoPosYVal').textContent = '0px';
    document.getElementById('logoRotateVal').textContent = '0°';
    renderBack();
  });

  document.getElementById('inputTeamLogo').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    processImageFile(file, img => {
      S.back.image = img;
      S.back.img   = { x:0, y:0, scale:1, rotate:0 };
      hintDismissed.back = false;
      const backHint = hintEl('back');
      if (backHint) backHint.classList.remove('is-dismissed');
      document.getElementById('logoZoom').value = 1;
      document.getElementById('logoPosX').value = 0;
      document.getElementById('logoPosY').value = 0;
      document.getElementById('logoRotate').value = 0;
      document.getElementById('logoZoomVal').textContent = '100%';
      document.getElementById('logoPosXVal').textContent = '0px';
      document.getElementById('logoPosYVal').textContent = '0px';
      document.getElementById('logoRotateVal').textContent = '0°';
      document.getElementById('labelTeamLogoText').textContent = file.name;
      renderBack();
      showDragHint('back');
    });
    e.target.value = '';
  });

  /* ── Canvas gestures: drag / pinch-zoom / twist-rotate (circle only) ── */
  function circleHitFor(side) {
    if (side === 'pfp') return { x: 512, y: 420, r: 330 };
    if (side === 'back') return { x: BC.circleCenter.x, y: BC.circleCenter.y, r: BC.circleRadius };
    return { x: FC.circleCenter.x, y: FC.circleCenter.y, r: FC.circleRadius };
  }

  function makeDraggable(canvas, side) {
    if (!canvas) return;

    let dragging = false;
    let pinching = false;
    let sx = 0, sy = 0, ox = 0, oy = 0;
    let pinchDist = 0;
    let pinchAngle = 0;
    let baseScale = 1;
    let baseRotate = 0;

    const canvasSize = () => (
      side === 'pfp' ? { cw: 1024, ch: 1024 } : { cw: 722, ch: 1099 }
    );

    const target = () => (side === 'pfp' ? S.pfp : side === 'front' ? S.front : S.back);

    const clientToCanvas = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      const { cw, ch } = canvasSize();
      return {
        x: (clientX - r.left) * (cw / r.width),
        y: (clientY - r.top) * (ch / r.height),
      };
    };

    const eventPoint = e => {
      if (e.touches && e.touches.length) {
        return clientToCanvas(e.touches[0].clientX, e.touches[0].clientY);
      }
      return clientToCanvas(e.clientX, e.clientY);
    };

    const insideCircle = (pt) => {
      const c = circleHitFor(side);
      const dx = pt.x - c.x;
      const dy = pt.y - c.y;
      // Slightly padded so the yellow ring is still grab-able
      return (dx * dx + dy * dy) <= (c.r + 12) * (c.r + 12);
    };

    const midpointInCircle = e => {
      if (!e.touches || e.touches.length < 2) return false;
      const a = clientToCanvas(e.touches[0].clientX, e.touches[0].clientY);
      const b = clientToCanvas(e.touches[1].clientX, e.touches[1].clientY);
      return insideCircle({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    };

    const touchDist = e => {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    };

    const touchAngle = e => {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
    };

    const prefix = () => (side === 'back' ? 'logo' : 'profile');

    const updatePosUI = (x, y) => {
      const p = prefix();
      const sliderX = document.getElementById(`${p}PosX`);
      const sliderY = document.getElementById(`${p}PosY`);
      const valX = document.getElementById(`${p}PosXVal`);
      const valY = document.getElementById(`${p}PosYVal`);
      if (sliderX) sliderX.value = x;
      if (sliderY) sliderY.value = y;
      if (valX) valX.textContent = `${x}px`;
      if (valY) valY.textContent = `${y}px`;
    };

    const updateZoomUI = (scaleVal) => {
      const p = prefix();
      const sliderZoom = document.getElementById(`${p}Zoom`);
      const valZoom = document.getElementById(`${p}ZoomVal`);
      if (sliderZoom) sliderZoom.value = scaleVal;
      if (valZoom) valZoom.textContent = `${Math.round(scaleVal * 100)}%`;
    };

    const updateRotateUI = (deg) => {
      const p = prefix();
      const slider = document.getElementById(`${p}Rotate`);
      const val = document.getElementById(`${p}RotateVal`);
      if (slider) slider.value = deg;
      if (val) val.textContent = `${deg}°`;
    };

    const paint = () => {
      if (side === 'pfp') renderPfp();
      else if (side === 'front') renderFront();
      else renderBack();
    };

    const setGestureActive = (on) => {
      canvas.classList.toggle('gesture-active', !!on);
    };

    const endGestures = () => {
      dragging = false;
      pinching = false;
      pinchDist = 0;
      setGestureActive(false);
    };

    const beginOneFinger = e => {
      const st = target();
      if (!st.image) return false;
      const pt = eventPoint(e);
      if (!insideCircle(pt)) return false;
      dismissDragHint(side);
      sx = pt.x; sy = pt.y;
      ox = st.img.x; oy = st.img.y;
      dragging = true;
      pinching = false;
      setGestureActive(true);
      return true;
    };

    const beginTwoFinger = e => {
      const st = target();
      if (!st.image || e.touches.length < 2) return false;
      if (!midpointInCircle(e)) return false;
      dismissDragHint(side);
      dragging = false;
      pinching = true;
      pinchDist = touchDist(e);
      pinchAngle = touchAngle(e);
      baseScale = st.img.scale;
      baseRotate = st.img.rotate;
      setGestureActive(true);
      return true;
    };

    // Mouse
    canvas.addEventListener('mousedown', e => {
      if (beginOneFinger(e)) e.preventDefault();
    });

    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      const st = target();
      const pt = eventPoint(e);
      const newX = Math.round(ox + (pt.x - sx));
      const newY = Math.round(oy + (pt.y - sy));
      st.img.x = newX;
      st.img.y = newY;
      updatePosUI(newX, newY);
      paint();
    });

    window.addEventListener('mouseup', endGestures);

    canvas.addEventListener('wheel', e => {
      const st = target();
      if (!st.image) return;
      const pt = eventPoint(e);
      if (!insideCircle(pt)) return;
      e.preventDefault();
      dismissDragHint(side);
      let newScale = st.img.scale * (e.deltaY < 0 ? 1.05 : 0.95);
      newScale = Math.max(0.05, Math.min(4.0, newScale));
      st.img.scale = newScale;
      updateZoomUI(newScale);
      paint();
    }, { passive: false });

    // Touch — only steal the gesture when starting inside the photo circle
    canvas.addEventListener('touchstart', e => {
      const st = target();
      if (!st.image) return;

      if (e.touches.length === 2) {
        if (beginTwoFinger(e)) {
          if (e.cancelable) e.preventDefault();
        }
        return;
      }

      if (e.touches.length === 1) {
        if (beginOneFinger(e)) {
          if (e.cancelable) e.preventDefault();
        }
        // else: outside circle → browser scrolls the page
      }
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      const st = target();
      if (!st.image) return;

      if (pinching && e.touches.length >= 2) {
        if (e.cancelable) e.preventDefault();
        const dist = touchDist(e);
        const angle = touchAngle(e);
        if (pinchDist > 0) {
          let newScale = baseScale * (dist / pinchDist);
          newScale = Math.max(0.05, Math.min(4.0, newScale));
          st.img.scale = newScale;
          updateZoomUI(newScale);

          let newRot = Math.round(baseRotate + (angle - pinchAngle));
          // Normalize to slider range [-180, 180]
          while (newRot > 180) newRot -= 360;
          while (newRot < -180) newRot += 360;
          st.img.rotate = newRot;
          updateRotateUI(newRot);
          paint();
        }
        return;
      }

      if (dragging && e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();
        const pt = eventPoint(e);
        const newX = Math.round(ox + (pt.x - sx));
        const newY = Math.round(oy + (pt.y - sy));
        st.img.x = newX;
        st.img.y = newY;
        updatePosUI(newX, newY);
        paint();
      }
    }, { passive: false });

    window.addEventListener('touchend', e => {
      if (e.touches.length >= 2) return;
      if (e.touches.length === 1 && pinching) {
        // Dropped one finger after pinch — stop pinch; don't auto-start drag
        pinching = false;
        pinchDist = 0;
        dragging = false;
        setGestureActive(false);
        return;
      }
      if (e.touches.length === 0) endGestures();
    });

    window.addEventListener('touchcancel', endGestures);
  }

  makeDraggable(frontCanvas, 'front');
  makeDraggable(backCanvas,  'back');
  makeDraggable(pfpCanvas,   'pfp');

  /* ── View Switchers ────────────────────────── */
  const cardsDisplay = document.getElementById('cardsDisplay');
  const cardBoxFront = document.getElementById('cardBoxFront');
  const cardBoxBack  = document.getElementById('cardBoxBack');
  const cardBoxPfp   = document.getElementById('cardBoxPfp');

  function activateTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
  }

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const v = btn.dataset.view;
      currentView = v;
      const frontTextControls = document.getElementById('frontTextControls');
      if (v === 'front') {
        cardsDisplay.className = 'cards-display grid-single';
        cardBoxFront.style.display = 'flex';
        cardBoxBack.style.display = 'none';
        if (cardBoxPfp) cardBoxPfp.style.display = 'none';
        if (frontTextControls) frontTextControls.style.display = 'block';
        activateTab('tab-front');
        syncPhotoSliders();
        if (S.front.image) showDragHint('front');
      } else if (v === 'back') {
        cardsDisplay.className = 'cards-display grid-single';
        cardBoxFront.style.display = 'none';
        cardBoxBack.style.display = 'flex';
        if (cardBoxPfp) cardBoxPfp.style.display = 'none';
        if (frontTextControls) frontTextControls.style.display = 'block';
        activateTab('tab-back');
        if (S.back.image) showDragHint('back');
      } else if (v === 'pfp') {
        cardsDisplay.className = 'cards-display grid-single';
        cardBoxFront.style.display = 'none';
        cardBoxBack.style.display = 'none';
        if (cardBoxPfp) cardBoxPfp.style.display = 'flex';
        if (frontTextControls) frontTextControls.style.display = 'none';
        activateTab('tab-front');
        syncPhotoSliders();
        renderPfp();
        if (S.pfp.image) showDragHint('pfp');
      }
    });
  });

  window.triggerProfileUpload = () => document.getElementById('inputProfilePic').click();
  window.triggerLogoUpload    = () => document.getElementById('inputTeamLogo').click();

  /* ── Downloads ───────────────────────────────────── */
  window.downloadSinglePass = side => {
    let canvas = frontCanvas;
    let filename = 'HackerHouse_Goa_ID_Card_Front.png';
    if (side === 'front') {
      renderFront();
      canvas = frontCanvas;
      filename = 'HackerHouse_Goa_ID_Card_Front.png';
    } else if (side === 'back') {
      renderBack();
      canvas = backCanvas;
      filename = 'HackerHouse_Goa_ID_Card_Back.png';
    } else if (side === 'pfp') {
      renderPfp();
      canvas = pfpCanvas;
      filename = 'HackerHouse_Goa_PFP_Frame.png';
    }
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png', 1.0);
    a.click();
  };

  function downloadAllThreePics() {
    renderAll();
    // Stagger so browsers don't collapse multiple download clicks
    downloadSinglePass('front');
    setTimeout(() => downloadSinglePass('back'), 450);
    setTimeout(() => downloadSinglePass('pfp'), 900);
  }

  /* ── Share to X (their sync intent launcher + our upload/OG preview) ── */
  const PROD_ORIGIN = 'https://hhhexe.vercel.app';

  function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
    return new Promise((resolve, reject) => {
      if (!canvas) return reject(new Error('No canvas'));
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), type, quality);
    });
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function uploadGeneratedImage(dataUrl, filename) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, filename }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) return data.url;
      }
    } catch (_) { /* local static server, etc. */ }

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('time', '72h');
      form.append('fileToUpload', blob, filename);
      const up = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: form,
      });
      const text = (await up.text()).trim();
      if (text.startsWith('http')) return text;
    } catch (_) { /* CORS / network */ }

    return null;
  }

  function shareApiOrigin() {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return PROD_ORIGIN;
    return window.location.origin;
  }

  function buildShareCardUrl(imageUrl, kind, meta = {}) {
    const base = `${shareApiOrigin()}/api/card`;
    const params = new URLSearchParams({
      img: imageUrl,
      kind: kind || 'pfp',
    });
    if (meta.name) params.set('name', meta.name);
    if (meta.role) params.set('role', meta.role);
    if (meta.team) params.set('team', meta.team);
    return `${base}?${params.toString()}`;
  }

  function buildExcitedShareText(side) {
    const name = (S.front.name || '').trim();
    const role = (S.front.role || '').trim();
    const title = (S.front.tag || '').trim();
    const id = (S.front.builderId || '').trim();
    const team = (S.back.teamName || '').trim();
    const slogan = (S.back.teamSlogan || '').trim();

    const detailBits = [name, role, title, id ? `ID ${id.toUpperCase()}` : '']
      .filter(Boolean)
      .join(' · ');
    const teamLine = team
      ? `Team ${team}${slogan ? ` — ${slogan}` : ''}`
      : '';

    // Blank line between sections; studio link visible in text.
    // Preview card URL is passed separately via intent `url=` (not duplicated here).
    const cta = `Try it now and generate yours\n${PROD_ORIGIN}`;

    if (side === 'pfp') {
      return [
        'Excited to share my Hacker House Goa 2026 PFP!',
        detailBits,
        teamLine,
        'See you in Goa! #FrameInGoa',
        cta,
      ].filter(Boolean).join('\n\n');
    }

    if (side === 'back') {
      return [
        `Excited to share our Hacker House Goa 2026 team pass${team ? ` — ${team}` : ''}!`,
        teamLine || detailBits,
        'See you in Goa! #FrameInGoa',
        cta,
      ].filter(Boolean).join('\n\n');
    }

    return [
      'Excited to share my Hacker House Goa 2026 Builder Pass!',
      detailBits,
      teamLine,
      'See you in Goa! #FrameInGoa',
      cta,
    ].filter(Boolean).join('\n\n');
  }

  function tweetWebUrl(text, linkUrl) {
    const t = encodeURIComponent(text);
    const u = encodeURIComponent(linkUrl || PROD_ORIGIN);
    return `https://x.com/intent/tweet?text=${t}&url=${u}`;
  }

  function isMobileUA() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
  }

  /**
   * Force native X / Twitter app. Website intent is ONLY used if the app
   * is missing / does not take over the page.
   */
  function openXCompose(text, linkUrl, preOpened) {
    // Card URL drives the large image preview; studio link stays visible in text body
    const shareLink = linkUrl || PROD_ORIGIN;
    const webUrl = tweetWebUrl(text, shareLink);
    // Don't append card URL again if text already has the studio link (keeps spacing clean)
    const message = text.includes(PROD_ORIGIN) ? text : `${text}\n\n${shareLink}`;
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    // Never leave a blank browser tab hanging on mobile
    if (preOpened && !preOpened.closed && (isIOS || isAndroid)) {
      try { preOpened.close(); } catch (_) { /* ignore */ }
    }

    if (isAndroid) {
      // package=com.twitter.android forces the X app; browser_fallback only if not installed
      const appIntent =
        `intent://x.com/intent/tweet?text=${encodeURIComponent(text)}` +
        `&url=${encodeURIComponent(shareLink)}` +
        `#Intent;scheme=https;package=com.twitter.android;` +
        `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;

      const schemeIntent =
        `intent://post?message=${encodeURIComponent(message)}` +
        `#Intent;scheme=twitter;package=com.twitter.android;` +
        `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;

      window.location.href = appIntent;
      setTimeout(() => {
        if (!document.hidden) window.location.href = schemeIntent;
      }, 400);
      return;
    }

    if (isIOS) {
      let appTookOver = false;
      const markOpened = () => { appTookOver = true; };
      document.addEventListener('visibilitychange', markOpened);
      window.addEventListener('pagehide', markOpened);
      window.addEventListener('blur', markOpened);

      // App-only deep links first (never open x.com until we know app failed)
      const deepLinks = [
        `twitter://post?message=${encodeURIComponent(message)}`,
        `twitter://post?text=${encodeURIComponent(message)}`,
      ];
      window.location.href = deepLinks[0];
      setTimeout(() => {
        if (!appTookOver && !document.hidden) {
          window.location.href = deepLinks[1];
        }
      }, 250);

      setTimeout(() => {
        document.removeEventListener('visibilitychange', markOpened);
        window.removeEventListener('pagehide', markOpened);
        window.removeEventListener('blur', markOpened);
        // Website ONLY if the app never hid this page
        if (!appTookOver && !document.hidden) {
          window.location.href = webUrl;
        }
      }, 1400);
      return;
    }

    // Desktop: website compose (no reliable X app deep link)
    if (preOpened && !preOpened.closed) {
      preOpened.location.href = webUrl;
      return;
    }
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }

  function setShareButtonsBusy(busy) {
    document.querySelectorAll('.btn-x-share').forEach(btn => {
      btn.disabled = !!busy;
      if (busy) {
        btn.dataset.prevHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing…';
      } else if (btn.dataset.prevHtml) {
        btn.innerHTML = btn.dataset.prevHtml;
        delete btn.dataset.prevHtml;
      }
    });
  }

  window.shareToX = async side => {
    let canvas = frontCanvas;
    let filename = 'HackerHouse_Goa_Front_Pass.jpg';
    let kind = 'front';

    if (side === 'pfp') {
      renderPfp();
      canvas = pfpCanvas;
      filename = 'HackerHouse_Goa_X_Profile_Frame.jpg';
      kind = 'pfp';
    } else if (side === 'back') {
      renderBack();
      canvas = backCanvas;
      filename = 'HackerHouse_Goa_Back_Pass.jpg';
      kind = 'back';
    } else {
      renderFront();
      canvas = frontCanvas;
      filename = 'HackerHouse_Goa_Front_Pass.jpg';
      kind = 'front';
    }

    let text = buildExcitedShareText(kind);

    // 1. Instant download so the graphic is in Downloads/Recents
    if (canvas) {
      try {
        const a = document.createElement('a');
        a.download = filename.replace(/\.jpg$/i, '.png');
        a.href = canvas.toDataURL('image/png', 1.0);
        a.click();
      } catch (_) { /* ignore */ }
    }

    // Desktop only: reserve a window under the user gesture (mobile uses app deep links)
    const preOpened = isMobileUA() ? null : window.open('about:blank', '_blank');

    setShareButtonsBusy(true);
    try {
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      const dataUrl = await blobToDataURL(blob);
      const imageUrl = await uploadGeneratedImage(dataUrl, filename);
      // Intent `url` = preview card (image unfurl). Studio link is already in text.
      const linkUrl = imageUrl
        ? buildShareCardUrl(imageUrl, kind, {
            name: S.front.name,
            role: S.front.role,
            team: S.back.teamName,
          })
        : PROD_ORIGIN;
      openXCompose(text, linkUrl, preOpened);
    } catch (_) {
      openXCompose(text, PROD_ORIGIN, preOpened);
    } finally {
      setShareButtonsBusy(false);
    }
  };

  window.shareCurrentViewToX = () => {
    shareToX(currentView);
  };

  const btnPfp = document.getElementById('btnDownloadPfp');
  if (btnPfp) btnPfp.addEventListener('click', () => downloadSinglePass('pfp'));
  document.getElementById('btnDownloadFront').addEventListener('click', () => downloadSinglePass('front'));
  document.getElementById('btnDownloadBack').addEventListener('click',  () => downloadSinglePass('back'));

  document.getElementById('btnDownloadBoth').addEventListener('click', downloadAllThreePics);

});
