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

  /* ── Template images ─────────────────────────────── */
  const frontTemplate = new Image();
  frontTemplate.src   = 'frontf.jpeg';
  const backTemplate  = new Image();
  backTemplate.src    = 'backf.jpeg';

  let loaded = 0;
  const onLoad = () => { if (++loaded >= 2) renderAll(); };
  frontTemplate.onload = onLoad;
  backTemplate.onload  = onLoad;

  /* ── App state ───────────────────────────────────── */
  const S = {
    front: {
      name: 'Nevan Alvares', fontName: 'Caveat', fontSizeName: 52,
      role: 'Full Stack Developer',
      builderId: document.getElementById('inputBuilderId') ? document.getElementById('inputBuilderId').value : 'HH0026',
      tag: 'React Dev',
      image: null, img: { x:0, y:0, scale:1, rotate:0 }
    },
    back: {
      teamName: 'CYBER PUNKS', fontTeam: 'Permanent Marker', fontSizeTeam: 54,
      teamSlogan: 'Ride The Waves!',
      image: null, img: { x:0, y:0, scale:1, rotate:0 }
    }
  };

  /* ── Layout config (1254×1254 canvas units) ──────── */
  const FC = {
    circleCenter: { x:627, y:535 }, circleRadius: 210,
    nameCenter:   { x:627, y:771 }, nameAngle: -1.2 * Math.PI/180, maxNameW: 390,
    roleCenter:   { x:627, y:843 }, maxRoleW: 440,
    idCenter:     { x:490, y:941 }, maxIdW: 200,       // Builder ID box
    tagCenter:    { x:577, y:1034 }, maxTagW: 170
  };
  const BC = {
    circleCenter:    { x:627, y:550 }, circleRadius: 210,
    teamNameCenter:  { x:627, y:300 }, teamNameAngle: -1.5 * Math.PI/180, maxTeamNameW: 450,
    sloganCenter:    { x:570, y:800 }, sloganAngle: 0.8 * Math.PI/180, maxSloganW: 340
  };

  /* ── Helpers ─────────────────────────────────────── */
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
    frontCtx.clearRect(0, 0, 1254, 1254);
    frontCtx.drawImage(frontTemplate, 0, 0, 1254, 1254);

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
      frontCtx.roundRect(380, 824, 494, 38, 6);
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

    // 5. Speciality tag
    if (fs.tag.trim()) {
      frontCtx.save();
      frontCtx.translate(FC.tagCenter.x, FC.tagCenter.y);
      fitFont(frontCtx, fs.tag.trim().toUpperCase(), 21, 'Outfit', '800', FC.maxTagW, 12);
      frontCtx.fillStyle = '#ffffff';
      frontCtx.textAlign = 'center';
      frontCtx.textBaseline = 'middle';
      frontCtx.shadowColor = 'rgba(0,0,0,0.4)';
      frontCtx.shadowBlur = 3;
      frontCtx.shadowOffsetY = 1;
      frontCtx.fillText(fs.tag.trim().toUpperCase(), 0, 0);
      frontCtx.restore();
    }
  }

  /* ── BACK render ─────────────────────────────────── */
  function renderBack() {
    if (!backTemplate.complete || !backTemplate.naturalWidth) return;
    backCtx.clearRect(0, 0, 1254, 1254);
    backCtx.drawImage(backTemplate, 0, 0, 1254, 1254);

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

  function renderAll() { renderFront(); renderBack(); }

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

  // Front Controls
  bind('inputName', e => {
    if (e.target.value.length > 18) e.target.value = e.target.value.slice(0, 18);
    S.front.name = e.target.value; renderFront();
  });
  bindChange('fontNameSelect', e => { S.front.fontName = e.target.value; renderFront(); });
  bind('fontSizeName', e => { S.front.fontSizeName = parseInt(e.target.value); renderFront(); });

  bind('inputRole', e => { S.front.role = e.target.value; renderFront(); });

  bind('inputBuilderId', e => {
    if (e.target.value.length > 6) e.target.value = e.target.value.slice(0, 6);
    S.front.builderId = e.target.value;
    renderFront();
  });

  bind('inputTag', e => {
    if (e.target.value.length > 10) e.target.value = e.target.value.slice(0, 10);
    S.front.tag = e.target.value; renderFront();
  });

  // Profile Pic Image Adjustments (Zoom, Move X, Move Y, Rotate)
  bind('profileZoom', e => {
    const v = parseFloat(e.target.value);
    S.front.img.scale = v;
    document.getElementById('profileZoomVal').textContent = `${Math.round(v*100)}%`;
    renderFront();
  });
  bind('profilePosX', e => {
    const v = parseInt(e.target.value);
    S.front.img.x = v;
    document.getElementById('profilePosXVal').textContent = `${v}px`;
    renderFront();
  });
  bind('profilePosY', e => {
    const v = parseInt(e.target.value);
    S.front.img.y = v;
    document.getElementById('profilePosYVal').textContent = `${v}px`;
    renderFront();
  });
  bind('profileRotate', e => {
    const v = parseInt(e.target.value);
    S.front.img.rotate = v;
    document.getElementById('profileRotateVal').textContent = `${v}°`;
    renderFront();
  });

  document.getElementById('btnResetFrontImage').addEventListener('click', () => {
    S.front.img = { x:0, y:0, scale:1, rotate:0 };
    document.getElementById('profileZoom').value = 1;
    document.getElementById('profilePosX').value = 0;
    document.getElementById('profilePosY').value = 0;
    document.getElementById('profileRotate').value = 0;
    document.getElementById('profileZoomVal').textContent = '100%';
    document.getElementById('profilePosXVal').textContent = '0px';
    document.getElementById('profilePosYVal').textContent = '0px';
    document.getElementById('profileRotateVal').textContent = '0°';
    renderFront();
  });

  document.getElementById('inputProfilePic').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        S.front.image = img;
        S.front.img   = { x:0, y:0, scale:1, rotate:0 };
        document.getElementById('profileZoom').value = 1;
        document.getElementById('profilePosX').value = 0;
        document.getElementById('profilePosY').value = 0;
        document.getElementById('profileRotate').value = 0;
        document.getElementById('profileZoomVal').textContent = '100%';
        document.getElementById('profilePosXVal').textContent = '0px';
        document.getElementById('profilePosYVal').textContent = '0px';
        document.getElementById('profileRotateVal').textContent = '0°';
        document.getElementById('labelProfilePicText').textContent = file.name;
        renderFront();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
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
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        S.back.image = img;
        S.back.img   = { x:0, y:0, scale:1, rotate:0 };
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
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ── Canvas Drag-to-Pan (Bidirectional sync with Move X / Move Y sliders) ── */
  function makeDraggable(canvas, side) {
    let dragging = false, sx=0, sy=0, ox=0, oy=0;

    const coords = e => {
      const r = canvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x:(cx-r.left)*(1254/r.width), y:(cy-r.top)*(1254/r.height) };
    };

    const startDrag = e => {
      if (!S[side].image) return;
      const c = coords(e);
      sx = c.x; sy = c.y;
      ox = S[side].img.x; oy = S[side].img.y;
      dragging = true;
    };

    const doDrag = e => {
      if (!dragging) return;
      e.preventDefault();
      const c = coords(e);
      const newX = Math.round(ox + (c.x - sx));
      const newY = Math.round(oy + (c.y - sy));

      S[side].img.x = newX;
      S[side].img.y = newY;

      // Sync slider UI controls while dragging on canvas
      const prefix = side === 'front' ? 'profile' : 'logo';
      const sliderX = document.getElementById(`${prefix}PosX`);
      const sliderY = document.getElementById(`${prefix}PosY`);
      const valX = document.getElementById(`${prefix}PosXVal`);
      const valY = document.getElementById(`${prefix}PosYVal`);

      if (sliderX) sliderX.value = newX;
      if (sliderY) sliderY.value = newY;
      if (valX) valX.textContent = `${newX}px`;
      if (valY) valY.textContent = `${newY}px`;

      side === 'front' ? renderFront() : renderBack();
    };

    const stopDrag = () => { dragging = false; };

    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);

    canvas.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);
  }

  makeDraggable(frontCanvas, 'front');
  makeDraggable(backCanvas,  'back');

  /* ── View Switchers ────────────────────────── */
  const cardsDisplay = document.getElementById('cardsDisplay');
  const cardBoxFront = document.getElementById('cardBoxFront');
  const cardBoxBack  = document.getElementById('cardBoxBack');

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
      if (v === 'front') {
        cardsDisplay.className = 'cards-display grid-single';
        cardBoxFront.style.display = 'flex';
        cardBoxBack.style.display = 'none';
        activateTab('tab-front');
      } else {
        cardsDisplay.className = 'cards-display grid-single';
        cardBoxFront.style.display = 'none';
        cardBoxBack.style.display = 'flex';
        activateTab('tab-back');
      }
    });
  });

  window.triggerProfileUpload = () => document.getElementById('inputProfilePic').click();
  window.triggerLogoUpload    = () => document.getElementById('inputTeamLogo').click();

  /* ── Downloads ───────────────────────────────────── */
  window.downloadSinglePass = side => {
    const canvas = side==='front' ? frontCanvas : backCanvas;
    side==='front' ? renderFront() : renderBack();
    const a = document.createElement('a');
    a.download = `HackerHouse_Goa_${side==='front'?'Front':'Back'}_Pass.png`;
    a.href = canvas.toDataURL('image/png', 1.0);
    a.click();
  };

  document.getElementById('btnDownloadFront').addEventListener('click', () => downloadSinglePass('front'));
  document.getElementById('btnDownloadBack').addEventListener('click',  () => downloadSinglePass('back'));

  document.getElementById('btnDownloadBoth').addEventListener('click', () => {
    renderAll();
    const fUrl = frontCanvas.toDataURL('image/png', 1.0);
    const bUrl = backCanvas.toDataURL('image/png', 1.0);
    if (window.JSZip && window.saveAs) {
      const zip = new JSZip();
      zip.file('HackerHouse_Goa_Front_Pass.png', fUrl.split(',')[1], {base64:true});
      zip.file('HackerHouse_Goa_Back_Pass.png',  bUrl.split(',')[1], {base64:true});
      zip.generateAsync({type:'blob'}).then(blob => saveAs(blob, 'HackerHouse_Goa_Passes.zip'));
    } else {
      downloadSinglePass('front');
      setTimeout(() => downloadSinglePass('back'), 500);
    }
  });

});
