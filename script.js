(() => {
  const viewer = document.getElementById('viewer');
  const stage = document.getElementById('posterStage');
  const poster = document.getElementById('poster');
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  const zoomLabel = document.getElementById('zoomLabel');
  const fitWidth = document.getElementById('fitWidth');
  const hint = document.getElementById('hint');

  const MIN_SCALE = 0.08;
  const MAX_SCALE = 3.5;
  const STEP = 1.2;

  let scale = 1;
  let fitScale = 1;
  let naturalWidth = 0;
  let naturalHeight = 0;
  let hintTimer;

  function clamp(v, min, max){ return Math.min(max, Math.max(min, v)); }

  function setHintTimeout(){
    clearTimeout(hintTimer);
    hint.classList.remove('hidden');
    hintTimer = setTimeout(() => hint.classList.add('hidden'), 3500);
  }

  function updateZoomLabel(){
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function applyScale(newScale, anchorX = viewer.clientWidth / 2, anchorY = viewer.clientHeight / 2){
    if (!naturalWidth) return;

    newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);
    const oldScale = scale;
    if (Math.abs(newScale - oldScale) < 0.0001) return;

    const contentX = (viewer.scrollLeft + anchorX - stage.offsetLeft) / oldScale;
    const contentY = (viewer.scrollTop + anchorY - stage.offsetTop) / oldScale;

    scale = newScale;
    poster.style.width = `${Math.round(naturalWidth * scale)}px`;
    poster.style.height = `${Math.round(naturalHeight * scale)}px`;
    updateZoomLabel();

    requestAnimationFrame(() => {
      viewer.scrollLeft = contentX * scale + stage.offsetLeft - anchorX;
      viewer.scrollTop = contentY * scale + stage.offsetTop - anchorY;
    });
  }

  function calculateFitScale(){
    const computed = getComputedStyle(stage);
    const horizontalPadding = parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
    const usableWidth = Math.max(120, viewer.clientWidth - horizontalPadding);
    fitScale = clamp(usableWidth / naturalWidth, MIN_SCALE, 1);
    return fitScale;
  }

  function fitToWidth(){
    if (!naturalWidth) return;
    scale = calculateFitScale();
    poster.style.width = `${Math.round(naturalWidth * scale)}px`;
    poster.style.height = `${Math.round(naturalHeight * scale)}px`;
    viewer.scrollLeft = 0;
    viewer.scrollTop = 0;
    updateZoomLabel();
  }

  poster.addEventListener('load', () => {
    naturalWidth = poster.naturalWidth;
    naturalHeight = poster.naturalHeight;
    fitToWidth();
    setHintTimeout();
  });

  if (poster.complete && poster.naturalWidth) {
    naturalWidth = poster.naturalWidth;
    naturalHeight = poster.naturalHeight;
    fitToWidth();
    setHintTimeout();
  }

  zoomIn.addEventListener('click', () => applyScale(scale * STEP));
  zoomOut.addEventListener('click', () => applyScale(scale / STEP));
  zoomLabel.addEventListener('click', () => applyScale(1));
  fitWidth.addEventListener('click', fitToWidth);

  viewer.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const rect = viewer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const factor = Math.exp(-e.deltaY * 0.002);
    applyScale(scale * factor, x, y);
  }, { passive:false });

  viewer.addEventListener('dblclick', (e) => {
    const rect = viewer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const next = scale < Math.max(1, fitScale * 1.8) ? Math.max(1, fitScale * 1.8) : fitScale;
    applyScale(next, x, y);
  });

  viewer.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') { e.preventDefault(); applyScale(scale * STEP); }
    if (e.key === '-') { e.preventDefault(); applyScale(scale / STEP); }
    if (e.key === '0') { e.preventDefault(); fitToWidth(); }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const wasFit = Math.abs(scale - fitScale) < 0.025;
      const newFit = calculateFitScale();
      if (wasFit || window.innerWidth <= 720) {
        scale = newFit;
        poster.style.width = `${Math.round(naturalWidth * scale)}px`;
        poster.style.height = `${Math.round(naturalHeight * scale)}px`;
        updateZoomLabel();
      }
    }, 120);
  });

  // Touch pinch zoom while preserving one-finger scrolling.
  let pinchStartDistance = null;
  let pinchStartScale = null;
  let pinchCenter = null;

  function distance(t1,t2){
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx,dy);
  }

  viewer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinchStartDistance = distance(e.touches[0], e.touches[1]);
      pinchStartScale = scale;
      const rect = viewer.getBoundingClientRect();
      pinchCenter = {
        x: ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left,
        y: ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top
      };
    }
  }, { passive:true });

  viewer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchStartDistance) {
      e.preventDefault();
      const currentDistance = distance(e.touches[0], e.touches[1]);
      const ratio = currentDistance / pinchStartDistance;
      applyScale(pinchStartScale * ratio, pinchCenter.x, pinchCenter.y);
    }
  }, { passive:false });

  viewer.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      pinchStartDistance = null;
      pinchStartScale = null;
      pinchCenter = null;
    }
  }, { passive:true });

  ['scroll','click','touchstart'].forEach(evt => viewer.addEventListener(evt, () => hint.classList.add('hidden'), { once:true, passive:true }));
})();
