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
  const upload = $('#boothUpload'), fileInput = $('#boothFileInput'), slots = $('#boothSlots');
  const cropDialog = $('#boothCrop'), cropCanvas = $('#boothCropCanvas');
  const cropContext = cropCanvas.getContext('2d'), cropZoom = $('#boothCropZoom');
  const cropConfirm = $('#boothCropConfirm'), cropReset = $('#boothCropReset'), cropChange = $('#boothCropChange');
  const cropStatus = $('#boothCropStatus');
  const photoWidth = 600, photoHeight = 440, photoX = 60, firstY = 236, pitch = 476;
  const paperColor = '#faf9f5';
  let stream = null, generation = 0, photos = [], imageUrl = null;
  let facing = 'user', shooting = false, requesting = false;
  let importing = false, exporting = false, crop = null, editEpoch = 0, loadingCrop = false;
  let importErrorMessage = '';
  let importQueue = [], importErrors = 0, extraFiles = 0, uploadTarget = 0, queueTarget = 0, pickerMode = 'queue';
  const photoSources = [], cropPointers = new Map();
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const readyText = () => `Đã có ${photos.length} / 4 tấm. Cậu sẵn sàng thì bấm chụp tấm ${photos.length + 1} nhé.`;
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
    const shape = (d, fill) => { const p = new Path2D(d); ctx.strokeStyle = paperColor; ctx.lineWidth = 7; ctx.stroke(p); ctx.fillStyle = fill; ctx.fill(p); };
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
  function inkHeart(x, y) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.12);
    ctx.strokeStyle = '#ad3d43'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.stroke(new Path2D('M0 13C-49-12-27-49 0-20C27-48 48-11 0 13M2 16C-43-7-29-43-2-18C25-46 48-10 2 16'));
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
      ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = paperColor;
      ctx.fillRect(photoX, y, photoWidth, pitch - photoHeight);
      ctx.globalAlpha = .55; ctx.fillStyle = '#ac3e48';
      ctx.font = '32px "Great Vibes", cursive'; ctx.textAlign = 'center';
      ctx.translate(360, y + 26); ctx.rotate(-.035);
      ctx.fillText("it's always you", 0, 0); ctx.restore();
    }
    ctx.restore();
  }
  function drawStrip() {
    // One continuous ivory paper fills the entire strip, with equal photo margins.
    ctx.fillStyle = paperColor; ctx.fillRect(0, 0, strip.width, strip.height);
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
      photoWindow.rect(photoX, y, photoWidth, photoHeight);
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
      if (design?.stickers.length) {
        const x = (i === 1 || i === 3) ? 650 : ((i % 2 === 0) !== design.reverse ? 62 : 650);
        sticker(design.stickers[0].type, x, y + 10, design.stickers[0].angle);
        if (design.bow) sticker('bow', x === 62 ? 650 : 62, y + photoHeight - 100, -.12);
        if (i === 2) inkHeart(x === 62 ? 650 : 62, y + photoHeight - 50);
      }
    }
    // The paper pattern continues to the bottom; there is no separate footer caption or signature.
    updateSlots();
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
    const busy = shooting || requesting || importing || exporting;
    camera.hidden = ready || photos.length === 4;
    camera.disabled = busy;
    camera.textContent = requesting ? 'Đang mở camera…' : 'Bật camera';
    capture.hidden = !ready || photos.length === 4; capture.disabled = busy;
    capture.textContent = shooting ? 'Đang chụp…' : `Chụp tấm ${Math.min(photos.length + 1, 4)} / 4`;
    flip.hidden = !ready || photos.length === 4; flip.disabled = busy;
    undo.hidden = photos.length === 0; undo.disabled = busy;
    retake.hidden = photos.length !== 4;
    retake.disabled = busy; upload.disabled = busy;
    upload.textContent = photos.length === 4 ? 'Thay bằng ảnh có sẵn' : 'Tải ảnh lên';
    updateSlots();
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
    if (requesting || shooting || importing || exporting || !modal.open) return;
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
    if (shooting || requesting || importing || exporting || !stream || photos.length >= 4) return;
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
      const frame = takeFrame();
      photoSources[photos.length] = {source: frame, zoom: 1, panX: 0, panY: 0};
      photos.push(frame); drawStrip();
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
    exporting = true; controls();
    try {
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
    } finally {
      if (token === generation) { exporting = false; controls(!!stream); }
    }
  }
  function closeBooth() { modal.close(); }
  open.addEventListener('click', async () => {
    if (modal.open) return;
    modal.showModal(); controls();
    if (photos.length !== 4) {
      if (!photos.length) randomizeDecoration();
      drawStrip(); showLiveStars();
      status.textContent = photos.length ? `Đã giữ ${photos.length} tấm. Cậu bật camera hoặc tải ảnh để thêm nhé.` : 'Cậu có thể bật camera hoặc tải ảnh có sẵn lên nhé.';
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
    abandonEditor();
    generation++; shooting = requesting = exporting = false; stopCamera();
    countdown.hidden = shotLabel.hidden = true;
    message.hidden = false; view.classList.remove('is-flashing');
    if (photos.length !== 4 || !imageUrl) modal.classList.remove('is-complete');
    open.focus();
  });
  camera.addEventListener('click', startCamera);
  flip.addEventListener('click', () => { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); });
  capture.addEventListener('click', shoot);
  undo.addEventListener('click', () => {
    if (shooting || requesting || importing || exporting || !photos.length) return;
    generation++; photos.pop(); photoSources.pop(); resetDownload(); modal.classList.remove('is-complete');
    drawStrip(); showLiveStars();
    if (stream) { controls(true); status.textContent = readyText(); capture.focus(); }
    else startCamera();
  });
  retake.addEventListener('click', () => {
    if (shooting || requesting || importing || exporting) return;
    photos = []; photoSources.length = 0; resetDownload(); modal.classList.remove('is-complete');
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
  function updateSlots() {
    const busy = shooting || requesting || importing || exporting;
    slots.replaceChildren();
    for (let i = 0; i < 4; i++) {
      const button = document.createElement('button'); button.type = 'button';
      button.dataset.slot = i;
      const filled = !!photos[i];
      button.textContent = `${filled ? '' : '+ '}Tấm ${i + 1}`;
      button.classList.toggle('is-filled', filled);
      button.disabled = busy || (!filled && i !== photos.length);
      button.setAttribute('aria-label', filled ? `Căn chỉnh hoặc thay ảnh tấm ${i + 1}` : `Tải ảnh cho tấm ${i + 1}`);
      button.addEventListener('click', () => filled ? editPhoto(i) : choosePhotos(i));
      slots.append(button);
    }
  }
  function choosePhotos(target = photos.length < 4 ? photos.length : 0) {
    if (shooting || requesting || importing || exporting || !modal.open) return;
    uploadTarget = target; pickerMode = 'queue'; fileInput.multiple = true;
    fileInput.value = ''; fileInput.click();
  }
  async function readPhoto(file) {
    if (!(file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|bmp|heic|heif)$/i.test(file.name))) throw new Error('Ảnh chưa đúng định dạng. Cậu chọn JPG, PNG hoặc WebP nhé.');
    if (file.size > 25 * 1024 * 1024) throw new Error('Ảnh hơi lớn. Cậu chọn ảnh dưới 25 MB nhé.');
    const url = URL.createObjectURL(file), image = new Image();
    try {
      image.src = url; await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('Ảnh không có kích thước hợp lệ.');
      const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
      const source = document.createElement('canvas');
      source.width = Math.max(1, Math.round(image.naturalWidth * scale));
      source.height = Math.max(1, Math.round(image.naturalHeight * scale));
      source.getContext('2d').drawImage(image, 0, 0, source.width, source.height);
      return source;
    } catch (error) {
      if (error.name === 'EncodingError') throw new Error('Chưa đọc được ảnh này. Cậu thử ảnh JPG, PNG hoặc WebP nhé.');
      throw error;
    } finally { URL.revokeObjectURL(url); image.src = ''; }
  }
  function setCropControls() {
    const disabled = loadingCrop || !crop;
    cropConfirm.disabled = cropReset.disabled = cropChange.disabled = cropZoom.disabled = disabled;
    $('#boothCropCancel').textContent = importQueue.length > 1 ? 'Hủy ảnh còn lại' : 'Hủy';
  }
  function cropDimensions() {
    const scale = Math.max(photoWidth / crop.source.width, photoHeight / crop.source.height) * crop.zoom;
    return {width: crop.source.width * scale, height: crop.source.height * scale};
  }
  function clampCrop() {
    const d = cropDimensions();
    const maxX = Math.max(0, (d.width - photoWidth) / 2), maxY = Math.max(0, (d.height - photoHeight) / 2);
    crop.panX = Math.max(-maxX, Math.min(maxX, crop.panX));
    crop.panY = Math.max(-maxY, Math.min(maxY, crop.panY));
  }
  function paintCrop(context) {
    clampCrop(); const d = cropDimensions();
    context.fillStyle = paperColor; context.fillRect(0, 0, photoWidth, photoHeight);
    context.drawImage(crop.source, (photoWidth - d.width) / 2 + crop.panX, (photoHeight - d.height) / 2 + crop.panY, d.width, d.height);
  }
  function renderCrop() {
    if (!crop || loadingCrop) return;
    paintCrop(cropContext);
    cropZoom.value = crop.zoom;
    $('#boothCropZoomValue').textContent = `${crop.zoom.toFixed(2)}×`;
    cropZoom.setAttribute('aria-valuetext', `Phóng to ${Math.round(crop.zoom * 100)} phần trăm`);
  }
  function showCrop(source, target, name, previous = {}) {
    crop = {source, target, name, zoom: previous.zoom || 1, panX: previous.panX || 0, panY: previous.panY || 0};
    loadingCrop = false; cropPointers.clear(); cropCanvas.classList.remove('is-dragging');
    $('#boothCropTitle').textContent = `Căn ảnh cho tấm ${target + 1}`;
    cropStatus.textContent = `${name}${importQueue.length > 1 ? ` · Còn ${importQueue.length - 1} ảnh tiếp theo` : ''}`;
    if (!cropDialog.open) cropDialog.showModal();
    setCropControls(); renderCrop(); cropCanvas.focus();
  }
  function prepareEditor() {
    generation++; stopCamera(); message.hidden = false; importing = true; controls();
    cropContext.fillStyle = paperColor; cropContext.fillRect(0, 0, photoWidth, photoHeight);
    if (!cropDialog.open) cropDialog.showModal();
  }
  async function nextImport() {
    if (!importQueue.length || queueTarget >= 4) { await endEditing(); return; }
    const epoch = editEpoch, file = importQueue[0];
    crop = null; loadingCrop = true; setCropControls();
    $('#boothCropTitle').textContent = `Căn ảnh cho tấm ${queueTarget + 1}`;
    cropStatus.textContent = 'Đang mở ảnh…';
    cropContext.fillStyle = paperColor; cropContext.fillRect(0, 0, photoWidth, photoHeight);
    try {
      const source = await readPhoto(file);
      if (epoch !== editEpoch || !modal.open) return;
      showCrop(source, queueTarget, file.name);
    } catch (error) {
      if (epoch !== editEpoch || !modal.open) return;
      importErrorMessage = error.message; importErrors++; importQueue.shift(); await nextImport();
    }
  }
  function editPhoto(target) {
    if (shooting || requesting || importing || exporting || !photos[target]) return;
    editEpoch++; importQueue = []; importErrors = extraFiles = 0;
    const saved = photoSources[target] || {source: photos[target]};
    prepareEditor(); showCrop(saved.source, target, saved.name || `Ảnh tấm ${target + 1}`, saved);
  }
  function abandonEditor() {
    editEpoch++; importing = loadingCrop = false; importQueue = []; crop = null;
    for (const id of cropPointers.keys()) { try { cropCanvas.releasePointerCapture(id); } catch {} }
    cropPointers.clear(); cropCanvas.classList.remove('is-dragging');
    if (cropDialog.open) cropDialog.close();
    cropContext.clearRect(0, 0, photoWidth, photoHeight);
  }
  async function endEditing(cancelled = false) {
    const errors = importErrors, extra = extraFiles;
    abandonEditor();
    if (!modal.open) return;
    const token = ++generation;
    if (photos.length === 4 && !imageUrl) {
      try { await finishStrip(token); }
      catch { status.textContent = 'Chưa tạo được file ảnh. Cậu mở lại photobooth để thử lưu nhé.'; }
    } else if (photos.length < 4) {
      status.textContent = `Đã có ${photos.length} / 4 tấm. Cậu tải thêm ảnh hoặc bật camera để chụp tiếp nhé.`;
    } else if (cancelled) status.textContent = 'Đã giữ nguyên ảnh. Cậu vẫn có thể lưu dải ảnh về máy nhé.';
    if (token !== generation || !modal.open) return;
    if (errors) status.textContent += ` Đã bỏ qua ${errors} ảnh. ${importErrorMessage}`;
    if (extra) status.textContent += ` Đã bỏ qua ${extra} ảnh vì chỉ còn ${4 - uploadTarget} ô để thêm.`;
    controls(!!stream);
    if (photos.length === 4 && imageUrl) save.focus(); else upload.focus();
  }
  upload.addEventListener('click', () => choosePhotos());
  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []); fileInput.value = '';
    if (!files.length || !modal.open) return;
    if (pickerMode === 'replace' && crop && importing) {
      const epoch = ++editEpoch;
      loadingCrop = true; setCropControls(); cropStatus.textContent = 'Đang mở ảnh thay thế…';
      try {
        const source = await readPhoto(files[0]);
        if (epoch !== editEpoch || !modal.open || !crop) return;
        showCrop(source, crop.target, files[0].name);
      } catch (error) {
        if (epoch === editEpoch && crop) cropStatus.textContent = error.message;
      } finally {
        if (epoch === editEpoch && crop) { loadingCrop = false; setCropControls(); }
      }
      return;
    }
    if (shooting || requesting || importing || exporting) return;
    editEpoch++; queueTarget = uploadTarget;
    const capacity = 4 - queueTarget;
    importQueue = files.slice(0, capacity); importErrors = 0; extraFiles = Math.max(0, files.length - capacity);
    prepareEditor(); await nextImport();
  });
  cropChange.addEventListener('click', () => {
    if (!crop || loadingCrop) return;
    pickerMode = 'replace'; fileInput.multiple = false; fileInput.value = ''; fileInput.click();
  });
  cropConfirm.addEventListener('click', async () => {
    if (!crop || loadingCrop) return;
    const photo = document.createElement('canvas'); photo.width = photoWidth; photo.height = photoHeight;
    paintCrop(photo.getContext('2d'));
    photos[crop.target] = photo;
    photoSources[crop.target] = {source: crop.source, name: crop.name, zoom: crop.zoom, panX: crop.panX, panY: crop.panY};
    resetDownload(); modal.classList.remove('is-complete'); drawStrip(); showLiveStars();
    if (importQueue.length) { importQueue.shift(); queueTarget++; await nextImport(); }
    else await endEditing();
  });
  for (const id of ['boothCropClose', 'boothCropCancel']) $(`#${id}`).addEventListener('click', () => endEditing(true));
  cropDialog.addEventListener('cancel', event => { event.preventDefault(); endEditing(true); });
  cropReset.addEventListener('click', () => {
    if (!crop || loadingCrop) return;
    crop.zoom = 1; crop.panX = crop.panY = 0; renderCrop();
  });
  function changeZoom(value, anchorX = photoWidth / 2, anchorY = photoHeight / 2) {
    if (!crop || loadingCrop) return;
    const before = cropDimensions();
    const sourceX = (anchorX - (photoWidth - before.width) / 2 - crop.panX) / before.width;
    const sourceY = (anchorY - (photoHeight - before.height) / 2 - crop.panY) / before.height;
    crop.zoom = Math.max(1, Math.min(3, value));
    const after = cropDimensions();
    crop.panX = anchorX - sourceX * after.width - (photoWidth - after.width) / 2;
    crop.panY = anchorY - sourceY * after.height - (photoHeight - after.height) / 2;
    renderCrop();
  }
  cropZoom.addEventListener('input', () => changeZoom(Number(cropZoom.value)));
  function pointerPosition(event) {
    const rect = cropCanvas.getBoundingClientRect();
    return {x: (event.clientX - rect.left) * photoWidth / rect.width, y: (event.clientY - rect.top) * photoHeight / rect.height};
  }
  cropCanvas.addEventListener('pointerdown', event => {
    if (!crop || loadingCrop || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); cropCanvas.focus(); cropPointers.set(event.pointerId, pointerPosition(event));
    cropCanvas.setPointerCapture(event.pointerId); cropCanvas.classList.add('is-dragging');
  });
  cropCanvas.addEventListener('pointermove', event => {
    if (!crop || loadingCrop || !cropPointers.has(event.pointerId)) return;
    event.preventDefault();
    const previous = cropPointers.get(event.pointerId), next = pointerPosition(event);
    if (cropPointers.size === 1) {
      crop.panX += next.x - previous.x; crop.panY += next.y - previous.y;
      cropPointers.set(event.pointerId, next); renderCrop();
    } else {
      const before = [...cropPointers.values()].slice(0, 2);
      cropPointers.set(event.pointerId, next);
      const after = [...cropPointers.values()].slice(0, 2);
      const distance = points => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const middle = points => ({x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2});
      const oldMiddle = middle(before), newMiddle = middle(after);
      if (distance(before) > 0) changeZoom(crop.zoom * distance(after) / distance(before), oldMiddle.x, oldMiddle.y);
      crop.panX += newMiddle.x - oldMiddle.x; crop.panY += newMiddle.y - oldMiddle.y; renderCrop();
    }
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) cropCanvas.addEventListener(name, event => {
    cropPointers.delete(event.pointerId); if (!cropPointers.size) cropCanvas.classList.remove('is-dragging');
  });
  cropCanvas.addEventListener('wheel', event => {
    if (!crop || loadingCrop) return;
    event.preventDefault(); const point = pointerPosition(event);
    changeZoom(crop.zoom * Math.exp(-event.deltaY * .0015), point.x, point.y);
  }, {passive: false});
  cropCanvas.addEventListener('keydown', event => {
    if (!crop || loadingCrop || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const step = event.shiftKey ? 40 : 10;
    if (event.key === 'ArrowLeft') crop.panX -= step;
    if (event.key === 'ArrowRight') crop.panX += step;
    if (event.key === 'ArrowUp') crop.panY -= step;
    if (event.key === 'ArrowDown') crop.panY += step;
    renderCrop();
  });
  window.addEventListener('pagehide', stopCamera);
  randomizeDecoration(); drawStrip();
  document.fonts?.ready.then(() => { if (!imageUrl) drawStrip(); });
})();
