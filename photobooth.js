// Camera frames and the finished strip stay entirely in this browser.
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const modal = $('#photobooth'), open = $('#openPhotobooth');
  const video = $('#boothVideo'), view = $('#boothViewfinder');
  const message = $('#boothCameraMessage'), status = $('#boothStatus');
  const camera = $('#boothCamera'), capture = $('#boothCapture');
  const flip = $('#boothFlip'), retake = $('#boothRetake'), undo = $('#boothUndo');
  const countdown = $('#boothCountdown'), shotLabel = $('#boothShotLabel');
  const strip = $('#boothStrip'), ctx = strip.getContext('2d');
  const save = $('#boothSave'), original = $('#boothOriginal');
  const photoWidth = 600, photoHeight = 440, photoX = 60, firstY = 236, pitch = 476;
  let stream = null, generation = 0, photos = [], imageUrl = null;
  let facing = 'user', shooting = false, requesting = false;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const readyText = () => `Đã chụp ${photos.length} / 4 tấm. Cậu sẵn sàng thì bấm chụp tấm ${photos.length + 1} nhé.`;
  const sparkleSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sparkleSvg.id = 'boothSparkles'; sparkleSvg.setAttribute('viewBox', `0 0 ${photoWidth} ${photoHeight}`);
  sparkleSvg.setAttribute('aria-hidden', 'true'); video.after(sparkleSvg);
  view.style.aspectRatio = `${photoWidth} / ${photoHeight}`;
  const scriptFont = document.fonts.load('96px "Great Vibes"').catch(() => []);
  let decoration = [];

  function randomizeDecoration() {
    // One small flower per photo, plus a single bow for the whole strip.
    const types = ['rose', 'tulip', 'rose', 'tulip'];
    const reverse = Math.random() > .5;
    const bowFrame = Math.floor(Math.random() * 4);
    for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
    decoration = Array.from({length: 4}, (_, i) => ({
      reverse,
      bow: i === bowFrame,
      stickers: [{type: types[i], angle: (Math.random() - .5) * .35}],
      stars: Array.from({length: 8}, (_, j) => ({
        x: j % 2 ? 485 + Math.random() * 90 : 24 + Math.random() * 90,
        y: 24 + Math.random() * (photoHeight - 50), size: 8 + Math.random() * 7, angle: Math.random() * .5
      }))
    }));
    showLiveStars();
  }
  function starPath(x, y, size, angle = 0) {
    const path = new Path2D();
    for (let j = 0; j < 8; j++) {
      const a = angle + j * Math.PI / 4 - Math.PI / 2, r = j % 2 ? size * .23 : size;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (!j) path.moveTo(px, py); else path.lineTo(px, py);
    }
    path.closePath(); return path;
  }
  function showLiveStars() {
    sparkleSvg.replaceChildren();
    for (const [j, star] of (decoration[Math.min(photos.length, 3)]?.stars || []).entries()) {
      const path = document.createElementNS(sparkleSvg.namespaceURI, 'path');
      const points = Array.from({length: 8}, (_, n) => {
        const a = star.angle + n * Math.PI / 4 - Math.PI / 2, r = n % 2 ? star.size * .23 : star.size;
        return `${n ? 'L' : 'M'}${star.x + Math.cos(a) * r} ${star.y + Math.sin(a) * r}`;
      }).join(' ') + 'Z';
      path.setAttribute('d', points); path.setAttribute('fill', '#fff0b5');
      path.style.setProperty('--twinkle-delay', `${-j * .34}s`); sparkleSvg.append(path);
    }
  }

  function heart(x, y, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
    ctx.beginPath(); ctx.moveTo(0, .32);
    ctx.bezierCurveTo(-.85, -.2, -.5, -.85, 0, -.43);
    ctx.bezierCurveTo(.5, -.85, .85, -.2, 0, .32);
    ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function sticker(type, x, y, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(.7, .7); ctx.lineJoin = ctx.lineCap = 'round';
    const shape = (d, fill) => { const p = new Path2D(d); ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.stroke(p); ctx.fillStyle = fill; ctx.fill(p); };
    if (type === 'bow') {
      shape('M-5 2Q-5 31-21 53L-28 37-45 39Q-24 24-16-3Z', '#e899b9');
      shape('M9 0Q26 18 43 42L24 40 17 53Q8 32 0 9Z', '#d977a3');
      shape('M-4-5Q-55-48-53-5Q-52 29-5 7Z', '#f3b7d0');
      shape('M4-5Q55-48 53-5Q52 29 5 7Z', '#f3b7d0');
      ctx.strokeStyle = '#d682a6'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-7, 1); ctx.quadraticCurveTo(-26, -12, -42, -10); ctx.moveTo(7, 1); ctx.quadraticCurveTo(28, -12, 43, -10); ctx.stroke();
      shape('M-9-9Q0-14 10-8L9 11Q0 16-10 9Z', '#dc87ab');
    } else {
      shape('M-3 0Q-9 27 8 57L14 54Q-1 23 4 0Z', '#6f9474');
      shape('M3 27Q-35 1-27 25Q-15 44 8 38Z', '#95b095');
      shape('M8 39Q36 5 34 27Q28 44 10 46Z', '#7d9f80');
      if (type === 'tulip') {
        shape('M0 8Q-36-2-29-42L-9-28 0-48 12-27 32-39Q36 0 0 8Z', '#c85f6b');
        ctx.fillStyle = '#e69a9f'; ctx.fill(new Path2D('M0 5Q-23-7-9-28Q5-15 0 5Z'));
        ctx.strokeStyle = '#a73e4b'; ctx.lineWidth = 2; ctx.stroke(new Path2D('M0 4Q14-7 12-27'));
      } else {
        shape('M-28 6Q-43-4-30-20Q-36-36-15-37Q0-50 17-36Q38-39 35-18Q47-3 28 10Q17 26 0 17Q-19 27-28 6Z', '#b43b49');
        ctx.strokeStyle = '#efa4ab'; ctx.lineWidth = 3;
        ['M-27-15Q-19-31-2-22Q13-33 25-19Q32-7 19 4Q8 16-5 9Q-25 14-27-4','M-18-7Q-19-23-3-23Q13-25 17-10Q20 4 4 7Q-8 12-15 0','M-8-13Q4-21 9-10L3-1-7-3Z'].forEach(d => ctx.stroke(new Path2D(d)));
      }
    }
    ctx.restore();
  }
  function scallopedPath(x, y, w, h) {
    const path = new Path2D(); path.moveTo(x, y);
    const edge = (sx, sy, dx, dy, length, nx, ny) => {
      const count = Math.round(length / 31), step = length / count;
      for (let i = 0; i < count; i++) {
        const px = sx + dx * i * step, py = sy + dy * i * step;
        path.bezierCurveTo(px + dx * step / 3 + nx * 8, py + dy * step / 3 + ny * 8,
          px + dx * step * 2 / 3 + nx * 8, py + dy * step * 2 / 3 + ny * 8,
          px + dx * step, py + dy * step);
      }
    };
    edge(x, y, 1, 0, w, 0, 1); edge(x + w, y, 0, 1, h, -1, 0);
    edge(x + w, y + h, -1, 0, w, 0, -1); edge(x, y + h, 0, -1, h, 1, 0);
    path.closePath(); return path;
  }
  function inkHeart(x, y) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.12);
    ctx.strokeStyle = '#ad3d43'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.stroke(new Path2D('M0 13C-49-12-27-49 0-20C27-48 48-11 0 13M2 16C-43-7-29-43-2-18C25-46 48-10 2 16'));
    ctx.restore();
  }
  function ribbonFrame(y) {
    ctx.save(); ctx.translate(photoX, y); ctx.scale(photoWidth / 600, photoHeight / 600);
    ctx.strokeStyle = '#b04d53'; ctx.lineWidth = 2; ctx.lineCap = ctx.lineJoin = 'round';
    // Two loose red pen strokes with loops at opposite corners, like the reference.
    ctx.stroke(new Path2D('M-13-10C-43-52-19-43 3 5C86 28 250-9 430 16M3 5C25 120-18 267-37 374'));
    ctx.stroke(new Path2D('M622 215C584 292 608 442 597 594C643 635 660 628 626 600C608 575 523 619 433 603C328 584 245 617 169 597'));
    ctx.restore();
  }
  function drawPaperWords() {
    ctx.save();
    // Bleed the paper lettering to the left, right and bottom edges; keep the heading clear.
    ctx.beginPath(); ctx.rect(0, 218, strip.width, strip.height - 218); ctx.clip();
    ctx.font = '44px "Great Vibes", cursive'; ctx.textAlign = 'left';
    ctx.fillStyle = '#ac3e48'; ctx.globalAlpha = .48;
    for (let row = 0; row < Math.ceil((strip.height - 218) / 137) + 2; row++) {
      for (let column = -1; column < 4; column++) {
        ctx.save(); ctx.translate(40 + column * 245 + (row % 2) * 72, 265 + row * 137);
        ctx.rotate(-.22); ctx.fillText("it's always you", 0, 0); ctx.restore();
      }
    }
    // Keep a complete, readable phrase in the three paper gaps between photos.
    for (let i = 0; i < 3; i++) {
      const y = firstY + photoHeight + i * pitch;
      ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = '#faf9f5';
      ctx.fillRect(photoX, y, photoWidth, pitch - photoHeight);
      ctx.globalAlpha = .55; ctx.fillStyle = '#ac3e48';
      ctx.font = '32px "Great Vibes", cursive'; ctx.textAlign = 'center';
      ctx.translate(360, y + 26); ctx.rotate(-.035);
      ctx.fillText("it's always you", 0, 0); ctx.restore();
    }
    ctx.restore();
  }
  function drawStrip() {
    // A straight white outer border surrounds the warm paper and scalloped photo windows.
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, strip.width, strip.height);
    ctx.fillStyle = '#faf9f5'; ctx.fillRect(22, 22, strip.width - 44, strip.height - 44);
    drawPaperWords();
    ctx.fillStyle = '#ab3039'; ctx.textAlign = 'center';
    ctx.font = '500 56px "Playfair Display", Georgia, serif'; ctx.fillText('20/10', 360, 94);
    ctx.font = '96px "Great Vibes", cursive'; ctx.fillText('Womens Day', 360, 188, 520);
    // Fine red pen strokes echo the reference without adding labels or a footer.
    ctx.strokeStyle = '#b54b51'; ctx.lineWidth = 1.4;
    ctx.stroke(new Path2D('M225 209C278 193 378 220 491 201M487 202Q507 195 502 210'));
    for (let i = 0; i < 4; i++) {
      const y = firstY + i * pitch, design = decoration[i];
      const photoWindow = new Path2D();
      if (i === 1 || i === 3) photoWindow.rect(photoX, y, photoWidth, photoHeight);
      else photoWindow.addPath(scallopedPath(photoX, y, photoWidth, photoHeight));
      ctx.save(); ctx.clip(photoWindow);
      if (photos[i]) ctx.drawImage(photos[i], photoX, y, photoWidth, photoHeight);
      else {
        ctx.fillStyle = '#eae7e5'; ctx.fillRect(photoX, y, photoWidth, photoHeight);
        heart(360, y + photoHeight / 2, 38, '#bc8b8c');
        ctx.fillStyle = '#8d6669'; ctx.font = '22px "Be Vietnam Pro", Arial, sans-serif';
        ctx.fillText(`Tấm ${i + 1}`, 360, y + photoHeight / 2 + 48);
      }
      if (photos[i]) {
        ctx.fillStyle = '#fff0b5';
        design.stars.forEach(s => ctx.fill(starPath(photoX + s.x, y + s.y, s.size, s.angle)));
      }
      ctx.restore();
      if (i === 1 || i === 3) ribbonFrame(y);
      if (design?.stickers.length) {
        const x = (i === 1 || i === 3) ? 650 : ((i % 2 === 0) !== design.reverse ? 62 : 650);
        sticker(design.stickers[0].type, x, y + 10, design.stickers[0].angle);
        if (design.bow) sticker('bow', x === 62 ? 650 : 62, y + photoHeight - 100, -.12);
        if (i === 2) inkHeart(x === 62 ? 650 : 62, y + photoHeight - 50);
      }
    }
    // The paper pattern continues to the bottom; there is no separate footer caption or signature.
  }
  function resetDownload() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = null; save.removeAttribute('href'); original.removeAttribute('href');
    save.hidden = original.hidden = $('#boothSaveHint').hidden = true;
  }
  function stopCamera() {
    const previous = stream; stream = null;
    previous?.getTracks().forEach(track => track.stop());
    video.pause(); video.srcObject = null; view.classList.remove('is-live');
  }
  function controls(ready = false) {
    camera.hidden = ready || photos.length === 4;
    camera.disabled = requesting;
    camera.textContent = requesting ? 'Đang mở camera…' : 'Bật camera';
    capture.hidden = !ready || photos.length === 4; capture.disabled = shooting;
    capture.textContent = shooting ? 'Đang chụp…' : `Chụp tấm ${Math.min(photos.length + 1, 4)} / 4`;
    flip.hidden = !ready || photos.length === 4; flip.disabled = shooting;
    undo.hidden = photos.length === 0; undo.disabled = shooting || requesting;
    retake.hidden = photos.length !== 4;
  }
  function cameraError(error) {
    const messages = {
      NotAllowedError: 'Cậu hãy cho phép dùng camera trong cài đặt trình duyệt, rồi bấm “Bật camera” nhé.',
      NotFoundError: 'Không tìm thấy camera. Cậu thử mở trang này trên điện thoại có camera nhé.',
      NotReadableError: 'Camera đang bận. Cậu đóng ứng dụng đang dùng camera rồi thử lại nhé.',
      SecurityError: 'Trình duyệt đang chặn camera. Cậu hãy mở trang bằng trình duyệt và cho phép camera nhé.'
    };
    status.textContent = messages[error?.name] || 'Chưa mở được camera. Cậu thử bật lại camera nhé.';
  }
  async function startCamera() {
    if (requesting || shooting || !modal.open) return;
    const token = ++generation;
    requesting = true; stopCamera(); controls();
    message.hidden = false;
    status.textContent = 'Cậu cho phép camera để bắt đầu nhé.';
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw {name: 'SecurityError'};
      }
      const acquired = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {facingMode: {ideal: facing}, width: {ideal: 1280}, height: {ideal: 960}}
      });
      // A permission prompt can resolve after the visitor already closed the booth.
      if (token !== generation || !modal.open) { acquired.getTracks().forEach(track => track.stop()); return; }
      stream = acquired; video.srcObject = acquired;
      const actualFacing = acquired.getVideoTracks()[0].getSettings().facingMode;
      view.classList.toggle('is-rear', actualFacing ? actualFacing === 'environment' : facing === 'environment');
      await video.play();
      const readyUntil = performance.now() + 10000;
      while (!video.videoWidth || video.readyState < 2) {
        if (token !== generation || !modal.open) return;
        if (performance.now() > readyUntil) throw new Error('Camera frame timeout');
        await wait(100);
      }
      if (token !== generation || !modal.open) return;
      view.classList.add('is-live'); message.hidden = true;
      showLiveStars(); status.textContent = readyText();
      acquired.getVideoTracks()[0].addEventListener('ended', () => {
        if (stream !== acquired) return;
        generation++; shooting = false; stopCamera(); countdown.hidden = shotLabel.hidden = true;
        message.hidden = false; controls(); status.textContent = 'Camera đã ngắt. Cậu bật lại để chụp nhé.';
      });
    } catch (error) {
      if (token !== generation || !modal.open) return;
      stopCamera(); message.hidden = false; cameraError(error);
    } finally {
      if (token === generation) { requesting = false; controls(!!stream && video.readyState >= 2); }
    }
  }
  function takeFrame() {
    if (!stream?.getVideoTracks().some(track => track.readyState === 'live') || video.readyState < 2) throw new Error('Camera disconnected');
    const photo = document.createElement('canvas'); photo.width = photoWidth; photo.height = photoHeight;
    const p = photo.getContext('2d');
    // Match the live crop and mirror only a front-facing camera.
    const ratio = photoWidth / photoHeight, sourceRatio = video.videoWidth / video.videoHeight;
    const sw = sourceRatio > ratio ? video.videoHeight * ratio : video.videoWidth;
    const sh = sourceRatio > ratio ? video.videoHeight : video.videoWidth / ratio;
    if (!view.classList.contains('is-rear')) { p.translate(photoWidth, 0); p.scale(-1, 1); }
    p.drawImage(video, (video.videoWidth - sw) / 2, (video.videoHeight - sh) / 2, sw, sh, 0, 0, photoWidth, photoHeight);
    return photo;
  }
  async function shoot() {
    if (shooting || requesting || !stream || photos.length >= 4) return;
    const token = ++generation;
    shooting = true; controls(true);
    shotLabel.hidden = false;
    try {
      const i = photos.length;
      shotLabel.textContent = `Tấm ${i + 1} / 4`;
      for (let n = 3; n >= 1; n--) {
        if (token !== generation || !modal.open) return;
        countdown.textContent = n; countdown.hidden = false;
        status.textContent = `Tấm ${i + 1} / 4 · ${n}…`;
        await wait(1000);
      }
      if (token !== generation || !modal.open) return;
      countdown.hidden = true;
      photos.push(takeFrame()); drawStrip();
      view.classList.remove('is-flashing'); void view.offsetWidth; view.classList.add('is-flashing');
      await wait(350);
      if (token !== generation || !modal.open) return;
      // One click captures exactly one photo. The next photo waits for another click.
      if (photos.length === 4) await finishStrip(token);
      else { showLiveStars(); status.textContent = readyText(); }
    } catch {
      if (token !== generation || !modal.open) return;
      stopCamera(); message.hidden = false;
      status.textContent = 'Lần chụp bị gián đoạn. Những tấm đã chụp vẫn được giữ lại nhé.';
    } finally {
      if (token === generation) {
        shooting = false; countdown.hidden = shotLabel.hidden = true;
        view.classList.remove('is-flashing'); controls(!!stream);
      }
    }
  }
  async function finishStrip(token) {
    stopCamera(); status.textContent = 'Đang gói bốn khoảnh khắc của cậu…';
    await Promise.race([Promise.all([scriptFont, document.fonts.ready]), wait(3000)]);
    if (token !== generation || !modal.open) return;
    drawStrip();
    const blob = await new Promise(resolve => strip.toBlob(resolve, 'image/png'));
    if (token !== generation || !modal.open) return;
    if (!blob) throw new Error('Could not export image');
    resetDownload(); imageUrl = URL.createObjectURL(blob); save.href = original.href = imageUrl;
    save.hidden = original.hidden = $('#boothSaveHint').hidden = false;
    modal.classList.add('is-complete'); message.hidden = false;
    status.textContent = 'Bốn khoảnh khắc thật xinh! Cậu lưu dải ảnh về máy nhé.';
    save.focus();
  }
  function closeBooth() { modal.close(); }
  open.addEventListener('click', async () => {
    if (modal.open) return;
    modal.showModal(); controls();
    if (photos.length !== 4) {
      if (!photos.length) randomizeDecoration();
      drawStrip(); showLiveStars();
      status.textContent = photos.length ? `Đã giữ ${photos.length} tấm. Cậu bật camera để chụp tiếp nhé.` : 'Cậu tự bấm chụp từng tấm nhé. Mỗi lần bấm đếm ngược 3 giây.';
      camera.focus();
    } else if (imageUrl) save.focus();
    else {
      try { await finishStrip(++generation); }
      catch { status.textContent = 'Chưa tạo được file ảnh. Cậu đóng rồi mở photobooth để thử lưu lại nhé.'; }
    }
  });
  $('#closePhotobooth').addEventListener('click', closeBooth);
  modal.addEventListener('cancel', event => { event.preventDefault(); closeBooth(); });
  modal.addEventListener('close', () => {
    generation++; shooting = requesting = false; stopCamera();
    countdown.hidden = shotLabel.hidden = true;
    message.hidden = false; view.classList.remove('is-flashing');
    if (photos.length !== 4 || !imageUrl) modal.classList.remove('is-complete');
    open.focus();
  });
  camera.addEventListener('click', startCamera);
  flip.addEventListener('click', () => { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); });
  capture.addEventListener('click', shoot);
  undo.addEventListener('click', () => {
    if (shooting || requesting || !photos.length) return;
    generation++; photos.pop(); resetDownload(); modal.classList.remove('is-complete');
    drawStrip(); showLiveStars();
    if (stream) { controls(true); status.textContent = readyText(); capture.focus(); }
    else startCamera();
  });
  retake.addEventListener('click', () => {
    photos = []; resetDownload(); modal.classList.remove('is-complete');
    randomizeDecoration(); drawStrip(); startCamera();
  });
  // Backgrounding a phone interrupts a session instead of saving black frames.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !modal.open || (!stream && !requesting)) return;
    generation++; shooting = requesting = false; stopCamera();
    countdown.hidden = shotLabel.hidden = true; message.hidden = false;
    controls();
    status.textContent = `Camera đã tạm dừng, đã giữ ${photos.length} tấm. Cậu bật lại để chụp tiếp nhé.`;
  });
  window.addEventListener('pagehide', stopCamera);
  randomizeDecoration(); drawStrip();
  document.fonts?.ready.then(() => { if (!imageUrl) drawStrip(); });
})();
