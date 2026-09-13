'use strict';

let CATALOG = [];      // flat list of maps (filtered order used for prev/next)
let ALL = [];          // unfiltered
let current = null;    // {cityId, cityName, mapId, title, ...}
let points = [];       // [{text, x, y}] for current map
let page = 1;
let pageCount = 1;
let zoom = 1;
let naturalW = 0, naturalH = 0;
let saveTimer = null;
let dirty = false;

const $ = (sel) => document.querySelector(sel);
const mapList   = $('#mapList');
const filterBox = $('#filter');
const mapImage  = $('#mapImage');
const pointsLayer = $('#pointsLayer');
const canvasWrap = $('#canvasWrap');
const pointsListEl = $('#pointsList');
const pointCountEl = $('#pointCount');
const saveStatus = $('#saveStatus');

async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function groupByCity(list) {
  const groups = [];
  const byCity = new Map();
  for (const m of list) {
    if (!byCity.has(m.cityId)) {
      const g = { cityId: m.cityId, cityName: m.cityName, maps: [] };
      byCity.set(m.cityId, g);
      groups.push(g);
    }
    byCity.get(m.cityId).maps.push(m);
  }
  return groups;
}

function renderList() {
  const q = filterBox.value.trim().toLowerCase();
  CATALOG = ALL.filter(m =>
    !q || m.title.toLowerCase().includes(q) || m.cityName.toLowerCase().includes(q) || m.mapId.includes(q)
  );
  const groups = groupByCity(CATALOG);
  mapList.innerHTML = '';
  for (const g of groups) {
    const gEl = document.createElement('div');
    gEl.className = 'cityGroup';
    const h = document.createElement('div');
    h.className = 'cityHeader';
    h.textContent = g.cityName;
    gEl.appendChild(h);
    for (const m of g.maps) {
      const row = document.createElement('div');
      row.className = 'mapRow' + (current && current.mapId === m.mapId ? ' active' : '');
      row.innerHTML = `
        <span class="name">${m.title}</span>
        <span class="badges">
          ${m.manualPoints > 0 ? `<span class="badge has-points">${m.manualPoints}</span>` : ''}
          ${m.ocrWords > 0 ? `<span class="badge has-ocr">OCR ${m.ocrWords}</span>` : ''}
        </span>`;
      row.onclick = () => loadMap(m.mapId);
      gEl.appendChild(row);
    }
    mapList.appendChild(gEl);
  }
}

async function init() {
  ALL = await api('/api/maps');
  renderList();
}

filterBox.addEventListener('input', renderList);

$('#prevBtn').onclick = () => navigate(-1);
$('#nextBtn').onclick = () => navigate(1);
function navigate(delta) {
  if (!current) return;
  const idx = CATALOG.findIndex(m => m.mapId === current.mapId);
  const next = CATALOG[idx + delta];
  if (next) loadMap(next.mapId);
}

$('#prevPage').onclick = () => changePage(-1);
$('#nextPage').onclick = () => changePage(1);
function changePage(delta) {
  const p = page + delta;
  if (p < 1 || p > pageCount) return;
  page = p;
  loadImage();
}

$('#zoomIn').onclick = () => setZoom(zoom * 1.25);
$('#zoomOut').onclick = () => setZoom(zoom / 1.25);
function setZoom(z) {
  closeEditBox(); // its position was computed for the old zoom/scroll — stale otherwise
  zoom = Math.max(0.2, Math.min(4, z));
  $('#zoomLabel').textContent = Math.round(zoom * 100) + '%';
  layoutCanvas();
}

// Panning the map (scrolling #viewport) moves the map under the edit box
// without moving the box itself (it's positioned in page coordinates at
// the moment it opens) — close it instead of leaving it stranded.
$('#viewport').addEventListener('scroll', () => closeEditBox());

async function loadMap(mapId) {
  await flushSave(); // don't lose edits on the map we're leaving
  current = ALL.find(m => m.mapId === mapId);
  page = 1;
  naturalW = 0; naturalH = 0; // so a stale image from the previous map can't be clicked on
  $('#mapTitle').textContent = `${current.cityName} — ${current.title}`;
  renderList();
  closeEditBox();
  setMapError(null);
  mapImage.removeAttribute('src');
  pointsLayer.innerHTML = '';
  points = []; // cleared up front so a failed load below doesn't leave the
  pointCountEl.textContent = 0;   // previous map's point list showing in the side panel
  renderPointsPanel();

  try {
    const pc = await api(`/api/pagecount?map=${mapId}`);
    pageCount = pc.pages;
    $('#pageNav').hidden = pageCount <= 1;
    $('#pageLabel').textContent = `${page}/${pageCount}`;

    points = await api(`/api/points?map=${mapId}`);
    await loadImage();
  } catch (e) {
    // Most often the source PDF is 404 on atlasmiast.umk.pl (happens for
    // whole cities sometimes, e.g. Bochnia) — without this, the click just
    // looked like it did nothing: title/sidebar updated but the map area
    // silently kept showing whatever was loaded before.
    setMapError(
      /404/.test(e.message)
        ? 'PDF tej mapy jest obecnie niedostępny (404) na atlasmiast.umk.pl — nie da się jej tu otworzyć.'
        : `Błąd wczytywania mapy: ${e.message}`
    );
  }
}

function setMapError(message) {
  const hint = $('#hint');
  if (message) {
    hint.textContent = message;
    hint.classList.add('error');
  } else {
    hint.textContent = 'Kliknij na mapie, żeby dodać punkt. Kliknij istniejący punkt, żeby go edytować lub usunąć.';
    hint.classList.remove('error');
  }
}

function loadImage() {
  $('#pageLabel').textContent = `${page}/${pageCount}`;
  return new Promise((resolve) => {
    mapImage.onload = () => {
      naturalW = mapImage.naturalWidth;
      naturalH = mapImage.naturalHeight;
      setZoom(1);
      renderPoints();
      resolve();
    };
    mapImage.src = `/api/image?map=${current.mapId}&page=${page}&_=${Date.now()}`;
  });
}

function layoutCanvas() {
  if (!naturalW) return;
  const w = naturalW * zoom, h = naturalH * zoom;
  mapImage.style.width = w + 'px';
  mapImage.style.height = h + 'px';
  canvasWrap.style.width = w + 'px';
  canvasWrap.style.height = h + 'px';
  pointsLayer.setAttribute('viewBox', `0 0 ${naturalW} ${naturalH}`);
  pointsLayer.style.width = w + 'px';
  pointsLayer.style.height = h + 'px';
}

// ── points rendering ─────────────────────────────────────────────────────

function renderPoints() {
  pointsLayer.innerHTML = '';
  points.forEach((p, i) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'pin');
    const cx = p.x * naturalW, cy = p.y * naturalH;
    g.innerHTML = `
      <circle cx="${cx}" cy="${cy}" r="${Math.max(5, naturalW * 0.004)}"></circle>
      <text x="${cx + 8}" y="${cy + 4}">${escapeXml(p.text)}</text>`;
    g.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openEditBox(ev.clientX, ev.clientY, i);
    });
    pointsLayer.appendChild(g);
  });
  pointCountEl.textContent = points.length;
  renderPointsPanel();
}

function escapeXml(s) {
  return s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

function renderPointsPanel() {
  pointsListEl.innerHTML = '';
  points.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'pointRow';
    row.innerHTML = `
      <button class="jump" title="Pokaż na mapie">🎯</button>
      <input type="text" value="${p.text.replace(/"/g, '&quot;')}" />
      <button class="rm" title="Usuń">✕</button>`;
    row.querySelector('input').addEventListener('change', (ev) => {
      points[i].text = ev.target.value.trim();
      renderPoints();
      scheduleSave();
    });
    row.querySelector('.rm').addEventListener('click', () => {
      points.splice(i, 1);
      renderPoints();
      scheduleSave();
    });
    row.querySelector('.jump').addEventListener('click', () => {
      const el = canvasWrap.closest('#viewport');
      el.scrollTo({
        left: p.x * naturalW * zoom - el.clientWidth / 2,
        top: p.y * naturalH * zoom - el.clientHeight / 2,
        behavior: 'smooth',
      });
    });
    pointsListEl.appendChild(row);
  });
}

// ── click-to-add / edit box ──────────────────────────────────────────────

let editBoxEl = null;

function closeEditBox() {
  if (editBoxEl) { editBoxEl.remove(); editBoxEl = null; }
}

canvasWrap.addEventListener('click', (ev) => {
  if (!naturalW) return;
  if (ev.target.closest('.pin')) return; // handled by pin's own listener
  ev.stopPropagation(); // otherwise this same click bubbles to the
                         // document-level "click outside" listener below,
                         // which immediately closes the box just opened
  const rect = canvasWrap.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;
  const y = (ev.clientY - rect.top) / rect.height;
  openEditBox(ev.clientX, ev.clientY, null, { x, y });
});

function openEditBox(clientX, clientY, existingIndex, newPos) {
  closeEditBox();
  const box = document.createElement('div');
  box.className = 'editBox';
  const isNew = existingIndex === null;
  const initial = isNew ? '' : points[existingIndex].text;
  box.innerHTML = `
    <input type="text" placeholder="Nazwa / napis…" value="${initial.replace(/"/g, '&quot;')}" />
    ${!isNew ? '<button class="del">Usuń</button>' : ''}
    <button class="ok">${isNew ? 'Dodaj' : 'Zapisz'}</button>`;
  document.body.appendChild(box);
  editBoxEl = box; // was never assigned — closeEditBox() was a permanent no-op,
                    // so old boxes stayed behind at their original click position
                    // every time a new one opened (looked like they "moved").

  const vp = $('#viewport').getBoundingClientRect();
  let left = clientX + 8, top = clientY + 8;
  if (left + 220 > vp.right) left = clientX - 228;
  if (top + 50 > vp.bottom) top = clientY - 58;
  box.style.left = left + 'px';
  box.style.top = top + 'px';

  const input = box.querySelector('input');
  input.focus();
  input.select();

  const commit = () => {
    const text = input.value.trim();
    if (!text) { closeEditBox(); return; }
    if (isNew) {
      points.push({ text, x: newPos.x, y: newPos.y });
    } else {
      points[existingIndex].text = text;
    }
    renderPoints();
    scheduleSave();
    closeEditBox();
  };

  input.addEventListener('keydown', (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Enter') commit();
    if (ev.key === 'Escape') closeEditBox();
  });
  box.querySelector('.ok').addEventListener('click', commit);
  if (!isNew) {
    box.querySelector('.del').addEventListener('click', () => {
      points.splice(existingIndex, 1);
      renderPoints();
      scheduleSave();
      closeEditBox();
    });
  }
}

document.addEventListener('click', (ev) => {
  if (editBoxEl && !editBoxEl.contains(ev.target)) closeEditBox();
});

// ── autosave ──────────────────────────────────────────────────────────────

function scheduleSave() {
  // Every call site here is a discrete commit (Enter, a button click, or an
  // input's blur/change) — never a per-keystroke event — so there's nothing
  // to debounce. Saving immediately also avoids losing an edit if you
  // navigate to another map within the old debounce window.
  dirty = true;
  saveStatus.textContent = 'zapisywanie…';
  saveStatus.className = 'saving';
  flushSave();
}

async function flushSave() {
  if (!dirty || !current) return;
  clearTimeout(saveTimer);
  const mapId = current.mapId;
  saveStatus.textContent = 'zapisywanie…';
  saveStatus.className = 'saving';
  try {
    await api(`/api/points?map=${mapId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points }),
    });
    dirty = false;
    saveStatus.textContent = 'zapisano ' + new Date().toLocaleTimeString('pl-PL');
    saveStatus.className = 'saved';
    const row = ALL.find(m => m.mapId === mapId);
    if (row) row.manualPoints = points.length;
    renderList();
  } catch (e) {
    saveStatus.textContent = 'błąd zapisu!';
    saveStatus.className = 'saving';
  }
}

window.addEventListener('beforeunload', (ev) => {
  if (dirty) { flushSave(); ev.preventDefault(); ev.returnValue = ''; }
});

init();
