// Camera frames and the finished strip stay entirely in this browser.
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const modal = $('#photobooth'), open = $('#openPhotobooth');
  const video = $('#boothVideo'), view = $('#boothViewfinder');
  const message = $('#boothCameraMessage'), status = $('#boothStatus');
  const camera = $('#boothCamera'), capture = $('#boothCapture');
  const flip = $('#boothFlip'), retake = $('#boothRetake');
  const countdown = $('#boothCountdown'), shotLabel = $('#boothShotLabel');
  const strip = $('#boothStrip'), ctx = strip.getContext('2d');
  const save = $('#boothSave'), original = $('#boothOriginal');
  const photoWidth = 624, photoHeight = 440, firstY = 214, pitch = 466;
  let stream = null, generation = 0, photos = [], imageUrl = null;
  let facing = 'user', shooting = false, requesting = false;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function heart(x, y, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
    ctx.beginPath(); ctx.moveTo(0, .32);
    ctx.bezierCurveTo(-.85, -.2, -.5, -.85, 0, -.43);
    ctx.bezierCurveTo(.5, -.85, .85, -.2, 0, .32);
    ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function flower(x, y, size) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#788b69'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, size, 9, size * 1.5); ctx.stroke();
    ctx.fillStyle = '#788b69'; ctx.beginPath(); ctx.ellipse(12, size * .95, 13, 6, -.55, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      ctx.fillStyle = i % 2 ? '#dc6487' : '#c13e68';
      ctx.beginPath(); ctx.ellipse(Math.cos(angle) * size * .35, Math.sin(angle) * size * .35, size * .5, size * .4, angle, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f8b0bb'; ctx.beginPath(); ctx.arc(0, 0, size * .22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function drawStrip() {
    ctx.fillStyle = '#ffe5ed'; ctx.fillRect(0, 0, strip.width, strip.height);
    ctx.fillStyle = '#912547'; ctx.textAlign = 'center';
    ctx.font = '500 66px "Playfair Display", Georgia, serif';
    ctx.fillText('20/10', 360, 98);
    ctx.font = '24px "Be Vietnam Pro", Arial, sans-serif'; ctx.fillText('Một ngày thật xinh, dành cho cậu.', 360, 151);
    flower(76, 84, 27); flower(645, 90, 25);
    photos.forEach((photo, i) => ctx.drawImage(photo, 48, firstY + i * pitch, photoWidth, photoHeight));
    for (let i = photos.length; i < 4; i++) {
      const y = firstY + i * pitch;
      ctx.fillStyle = '#f1c5d3'; ctx.fillRect(48, y, photoWidth, photoHeight);
      heart(360, y + photoHeight / 2, 55, '#ca8099');
      ctx.fillStyle = '#97566d'; ctx.font = '24px "Be Vietnam Pro", Arial, sans-serif';
      ctx.fillText(`Khoảnh khắc ${i + 1}`, 360, y + photoHeight / 2 + 62);
    }
    // Decorations stay in the paper margins, clear of all four photographs.
    [190, 671, 1137, 1603, 2070].forEach((y, i) => heart(i % 2 ? 695 : 24, y, 16, '#b93960'));
    ctx.fillStyle = '#912547'; ctx.font = 'italic 37px "Playfair Display", Georgia, serif';
    ctx.fillText('Cậu luôn xứng đáng được yêu thương.', 360, 2171, 624);
    heart(360, 2227, 38, '#c13759');
    ctx.font = '24px "Be Vietnam Pro", Arial, sans-serif'; ctx.fillText('From w luv H.M.Đ', 360, 2315);
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
    capture.hidden = !ready; capture.disabled = shooting;
    flip.hidden = !ready; flip.disabled = shooting;
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
      status.textContent = 'Sẵn sàng rồi! Mỗi tấm có 3 giây để cậu đổi dáng.';
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
    if (shooting || requesting || !stream) return;
    const token = ++generation;
    shooting = true; photos = []; resetDownload(); drawStrip(); controls(true);
    // The viewfinder uses the same landscape crop as each printed photograph.
    view.style.aspectRatio = `${photoWidth} / ${photoHeight}`;
    shotLabel.hidden = false;
    try {
      for (let i = 0; i < 4; i++) {
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
      }
      if (token !== generation || !modal.open) return;
      stopCamera(); status.textContent = 'Đang gói bốn khoảnh khắc của cậu…';
      // Wait for the typefaces so the saved PNG matches the preview.
      if (document.fonts) await Promise.race([document.fonts.ready, wait(2000)]);
      if (token !== generation || !modal.open) return;
      drawStrip();
      const blob = await new Promise(resolve => strip.toBlob(resolve, 'image/png'));
      if (token !== generation || !modal.open) return;
      if (!blob) throw new Error('Could not export image');
      imageUrl = URL.createObjectURL(blob); save.href = original.href = imageUrl;
      save.hidden = original.hidden = $('#boothSaveHint').hidden = false;
      modal.classList.add('is-complete');
      message.hidden = false;
      status.textContent = 'Bốn khoảnh khắc thật xinh! Cậu lưu dải ảnh về máy nhé.';
      save.focus();
    } catch {
      if (token !== generation || !modal.open) return;
      stopCamera(); message.hidden = false;
      status.textContent = 'Lần chụp bị gián đoạn. Cậu thử chụp lại nhé.';
      // An incomplete or failed export is never offered as a saved strip.
      photos = []; drawStrip();
    } finally {
      if (token === generation) {
        shooting = false; countdown.hidden = shotLabel.hidden = true;
        view.classList.remove('is-flashing'); controls();
      }
    }
  }
  function closeBooth() { modal.close(); }
  open.addEventListener('click', () => {
    if (modal.open) return;
    modal.showModal(); controls();
    if (photos.length !== 4 || !imageUrl) {
      photos = []; resetDownload(); drawStrip();
      status.textContent = 'Bật camera rồi tạo dáng nhé. Mỗi ảnh đếm ngược 3 giây.';
      camera.focus();
    } else save.focus();
  });
  $('#closePhotobooth').addEventListener('click', closeBooth);
  modal.addEventListener('cancel', event => { event.preventDefault(); closeBooth(); });
  modal.addEventListener('close', () => {
    generation++; shooting = requesting = false; stopCamera();
    countdown.hidden = shotLabel.hidden = true;
    message.hidden = false; view.classList.remove('is-flashing');
    if (photos.length !== 4 || !imageUrl) { photos = []; modal.classList.remove('is-complete'); view.style.aspectRatio = ''; }
    open.focus();
  });
  camera.addEventListener('click', startCamera);
  flip.addEventListener('click', () => { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); });
  capture.addEventListener('click', shoot);
  retake.addEventListener('click', () => {
    photos = []; resetDownload(); modal.classList.remove('is-complete');
    view.style.aspectRatio = ''; drawStrip(); startCamera();
  });
  // Backgrounding a phone interrupts a session instead of saving black frames.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !modal.open || (!stream && !requesting)) return;
    generation++; shooting = requesting = false; stopCamera();
    countdown.hidden = shotLabel.hidden = true; message.hidden = false;
    photos = []; drawStrip(); controls();
    status.textContent = 'Camera đã tạm dừng. Cậu bật lại để chụp nhé.';
  });
  window.addEventListener('pagehide', stopCamera);
  drawStrip();
  document.fonts?.ready.then(() => { if (!imageUrl) drawStrip(); });
})();
