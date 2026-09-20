(() => {
  const mapTab = document.getElementById('mapTab');
  const posterTab = document.getElementById('posterTab');
  const brandHome = document.getElementById('brandHome');
  const mapView = document.getElementById('mapView');
  const posterView = document.getElementById('posterView');

  const posterScroll = document.getElementById('posterScroll');
  const posterStage = document.getElementById('posterStage');
  const poster = document.getElementById('poster');
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  const zoomReadout = document.getElementById('zoomReadout');
  const fitWidth = document.getElementById('fitWidth');
  const posterHint = document.getElementById('posterHint');

  function showMap(){
    mapView.classList.add('active');
    posterView.classList.remove('active');
    mapTab.classList.add('active');
    posterTab.classList.remove('active');
  }

  function showPoster(){
    mapView.classList.remove('active');
    posterView.classList.add('active');
    mapTab.classList.remove('active');
    posterTab.classList.add('active');
    requestAnimationFrame(() => fitPoster());
  }

  mapTab.addEventListener('click', showMap);
  posterTab.addEventListener('click', showPoster);
  brandHome.addEventListener('click', (e) => { e.preventDefault(); showMap(); });

  const MIN_SCALE = 0.08;
  const MAX_SCALE = 4;
  const STEP = 1.2;
  let scale = 1;
  let fitScale = 1;
  let naturalWidth = 0;
  let naturalHeight = 0;

  function clamp(v,min,max){ return Math.min(max,Math.max(min,v)); }

  function updateLabel(){
    zoomReadout.textContent = `${Math.round(scale * 100)}%`;
  }

  function calcFit(){
    if(!naturalWidth) return 1;
    const c = getComputedStyle(posterStage);
    const pad = parseFloat(c.paddingLeft) + parseFloat(c.paddingRight);
    const usable = Math.max(120, posterScroll.clientWidth - pad);
    fitScale = clamp(usable / naturalWidth, MIN_SCALE, 1);
    return fitScale;
  }

  function applyScale(nextScale, anchorX = posterScroll.clientWidth/2, anchorY = posterScroll.clientHeight/2){
    if(!naturalWidth) return;
    nextScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const old = scale;
    if(Math.abs(nextScale-old) < .0001) return;

    const x = (posterScroll.scrollLeft + anchorX - posterStage.offsetLeft) / old;
    const y = (posterScroll.scrollTop + anchorY - posterStage.offsetTop) / old;

    scale = nextScale;
    poster.style.width = `${Math.round(naturalWidth * scale)}px`;
    poster.style.height = `${Math.round(naturalHeight * scale)}px`;
    updateLabel();

    requestAnimationFrame(() => {
      posterScroll.scrollLeft = x * scale + posterStage.offsetLeft - anchorX;
      posterScroll.scrollTop = y * scale + posterStage.offsetTop - anchorY;
    });
  }

  function fitPoster(){
    if(!naturalWidth) return;
    scale = calcFit();
    poster.style.width = `${Math.round(naturalWidth * scale)}px`;
    poster.style.height = `${Math.round(naturalHeight * scale)}px`;
    posterScroll.scrollLeft = 0;
    posterScroll.scrollTop = 0;
    updateLabel();
  }

  function onPosterReady(){
    naturalWidth = poster.naturalWidth;
    naturalHeight = poster.naturalHeight;
    fitPoster();
    setTimeout(() => posterHint.classList.add('hidden'), 3500);
  }

  poster.addEventListener('load', onPosterReady);
  if(poster.complete && poster.naturalWidth) onPosterReady();

  zoomIn.addEventListener('click', () => applyScale(scale * STEP));
  zoomOut.addEventListener('click', () => applyScale(scale / STEP));
  zoomReadout.addEventListener('click', () => applyScale(1));
  fitWidth.addEventListener('click', fitPoster);

  posterScroll.addEventListener('wheel', (e) => {
    if(!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const rect = posterScroll.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    applyScale(scale * Math.exp(-e.deltaY * .002), x, y);
  }, {passive:false});

  posterScroll.addEventListener('dblclick', (e) => {
    const rect = posterScroll.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const target = scale < Math.max(1, fitScale * 1.8) ? Math.max(1, fitScale * 1.8) : fitScale;
    applyScale(target, x, y);
  });

  let pinchStartDistance = null;
  let pinchStartScale = null;
  let pinchCenter = null;

  const distance = (a,b) => Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);

  posterScroll.addEventListener('touchstart', (e) => {
    if(e.touches.length === 2){
      pinchStartDistance = distance(e.touches[0],e.touches[1]);
      pinchStartScale = scale;
      const rect = posterScroll.getBoundingClientRect();
      pinchCenter = {
        x: ((e.touches[0].clientX+e.touches[1].clientX)/2)-rect.left,
        y: ((e.touches[0].clientY+e.touches[1].clientY)/2)-rect.top
      };
    }
  }, {passive:true});

  posterScroll.addEventListener('touchmove', (e) => {
    if(e.touches.length === 2 && pinchStartDistance){
      e.preventDefault();
      const ratio = distance(e.touches[0],e.touches[1]) / pinchStartDistance;
      applyScale(pinchStartScale * ratio, pinchCenter.x, pinchCenter.y);
    }
  }, {passive:false});

  posterScroll.addEventListener('touchend', (e) => {
    if(e.touches.length < 2){
      pinchStartDistance = null;
      pinchStartScale = null;
      pinchCenter = null;
    }
  }, {passive:true});

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if(posterView.classList.contains('active')) fitPoster();
    }, 120);
  });
})();
