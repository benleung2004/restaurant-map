/* =============================================
   RESTAURANT MEMORY MAP — main.js  (Step 5)
   Step 0: refactor, M1,M3,M4,M5,L2,E1-E4
   Step 1: M2 cluster, F1 tag chips, F3 revisit, F5 count
   Step 2: A1 add form, A2 Nominatim, A3 Maps URL parse, A4,A6
   Step 3: A7 edit, A8 duplicate, D1 CSV export
   Step 4: F2 rating range, F4 multi-city, L1 table view
   Step 5: S1 country stats, S2 top-10, S3 avoid list
   ============================================= */

const SAMPLE_DATA = [
  { name:'一蘭拉麵 難波店', status:'visited', country:'日本', city:'大阪', district:'難波', cuisine:'拉麵',
    google_maps_url:'https://www.google.com/maps/place/%E4%B8%80%E8%98%AD+%E9%9B%A3%E6%B3%A2/',
    lat:'34.6662', lng:'135.5006', visit_date:'2026-01-15', my_rating:'4.5', tabelog_rating:'3.8',
    price_per_head:'¥1200', would_revisit:'✅', tags:'必食,深夜,難波',
    photo_url:'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1200&q=80',
    notes:'湯底濃郁，叫硬麵。宵夜都可以再去。', source_url:'' },
  { name:'麵屋丈六', status:'wishlist', country:'日本', city:'大阪', district:'難波', cuisine:'拉麵',
    google_maps_url:'', lat:'34.6646', lng:'135.5073', visit_date:'', my_rating:'', tabelog_rating:'',
    price_per_head:'', would_revisit:'', tags:'想試,魚介',
    photo_url:'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=80',
    notes:'網上睇到多人推，想下次去大阪試。', source_url:'https://www.youtube.com/' },
  { name:'% Arabica Kyoto Higashiyama', status:'visited', country:'日本', city:'京都', district:'東山', cuisine:'Cafe',
    google_maps_url:'', lat:'34.9975', lng:'135.7782', visit_date:'2025-12-28', my_rating:'4.0', tabelog_rating:'',
    price_per_head:'¥700', would_revisit:'✅', tags:'咖啡,景點附近',
    photo_url:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    notes:'景觀幾好，咖啡穩陣。', source_url:'' },
  { name:'燒肉 牛角 難波店', status:'visited', country:'日本', city:'大阪', district:'難波', cuisine:'燒肉',
    google_maps_url:'', lat:'34.6672', lng:'135.5010', visit_date:'2026-01-16', my_rating:'3.5', tabelog_rating:'3.5',
    price_per_head:'¥3500', would_revisit:'❌', tags:'避雷,貴', photo_url:'',
    notes:'肉質一般，不值這個價錢。', source_url:'' },
  { name:'錦市場 田中雞蛋焼', status:'visited', country:'日本', city:'京都', district:'錦市場', cuisine:'小食',
    google_maps_url:'', lat:'35.0050', lng:'135.7650', visit_date:'2025-12-29', my_rating:'4.2', tabelog_rating:'',
    price_per_head:'¥300', would_revisit:'✅', tags:'必食,街食,景點附近',
    photo_url:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    notes:'新鮮出爐，非常好食。', source_url:'' },
  { name:'添好運 點心專門店', status:'visited', country:'香港', city:'香港', district:'佐敦', cuisine:'點心',
    google_maps_url:'', lat:'22.3050', lng:'114.1694', visit_date:'2026-03-10', my_rating:'4.8', tabelog_rating:'',
    price_per_head:'HK$120', would_revisit:'✅', tags:'必食,點心,排隊值得',
    photo_url:'', notes:'叉燒包超正，一定要早去排隊。', source_url:'' },
  { name:'鏞記酒家', status:'visited', country:'香港', city:'香港', district:'中環', cuisine:'燒臘',
    google_maps_url:'', lat:'22.2830', lng:'114.1550', visit_date:'2025-11-20', my_rating:'3.8', tabelog_rating:'',
    price_per_head:'HK$350', would_revisit:'❌', tags:'避雷,貴,名過於實',
    photo_url:'', notes:'名氣大但質素跌咗好多，唔值。', source_url:'' },
  { name:'광장시장 빈대떡', status:'visited', country:'韓國', city:'首爾', district:'鐘路', cuisine:'韓食',
    google_maps_url:'', lat:'37.5700', lng:'126.9997', visit_date:'2026-02-14', my_rating:'4.3', tabelog_rating:'',
    price_per_head:'₩8000', would_revisit:'✅', tags:'必食,街食,市場',
    photo_url:'', notes:'廣藏市場綠豆煎餅，外脆內軟。', source_url:'' },
];

let map, clusterGroup;
let currentData = [];
let activeTagFilters = new Set();
let activeCityFilters = new Set();
let revisitFilter = 'all';
let nominatimTimer = null;
let addFormMode = 'full';
let editingIndex = null;
let currentViewMode = 'card';
let ratingFilter = { source: 'my_rating', min: 0 };
let statsCountryFilter = 'all';

// ── Google Sheet config ─────────────────────────────────────────
const SHEET_CONFIG = {
  editUrl: 'https://docs.google.com/spreadsheets/d/1kgmBstjoGEzcVkumo_nzZnRQ4nRxaantzmBC0VFfZK0/edit?gid=2105267835#gid=2105267835',
  csvUrl: 'https://docs.google.com/spreadsheets/d/1kgmBstjoGEzcVkumo_nzZnRQ4nRxaantzmBC0VFfZK0/export?format=csv&gid=2105267835',
  webAppUrl: '',
};
const SHEET_FIELDS = ['name','status','country','city','district','cuisine','google_maps_url','lat','lng','visit_date','my_rating','tabelog_rating','price_per_head','would_revisit','tags','photo_url','notes','source_url'];
const GAS_URL_KEY = 'rmm_gas_url';

function getSheetWebAppUrl() {
  return localStorage.getItem(GAS_URL_KEY) || SHEET_CONFIG.webAppUrl || '';
}

function getSheetCsvUrl() {
  return document.getElementById('sheetUrl')?.value.trim() || SHEET_CONFIG.csvUrl;
}

async function loadFromSheetWebApp(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('讀取 Google Sheet 失敗');
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || '讀取 Google Sheet 失敗');
  const rows = (json.rows || []).map(normalize).filter(r => r.name);
  currentData = rows;
  saveCache();
}

async function pushToSheet(action, item, rowIndex) {
  const url = getSheetWebAppUrl();
  if (!url) return false;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, item, rowIndex }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || '寫入 Google Sheet 失敗');
  return true;
}

async function syncItemToSheet(action, item, rowIndex) {
  try {
    const ok = await pushToSheet(action, item, rowIndex);
    if (!ok) showToast('⚠️ 未設定 Sheet 同步 URL，資料只存於本地');
    return ok;
  } catch (err) {
    showToast('❌ 寫入 Google Sheet 失敗：' + err.message);
    return false;
  }
}

async function initDataSource() {
  const gasUrl = getSheetWebAppUrl();
  if (gasUrl) {
    try {
      await loadFromSheetWebApp(gasUrl);
      return;
    } catch (err) {
      console.warn('Sheet webapp load failed', err);
    }
  }
  const csvUrl = getSheetCsvUrl();
  if (csvUrl) {
    try {
      await loadSheet(csvUrl);
      return;
    } catch (err) {
      console.warn('CSV load failed', err);
    }
  }
  if (!loadCache()) currentData = SAMPLE_DATA.map(normalize);
}

// ── Utilities ─────────────────────────────────────────────────
function esc(v) {
  return String(v||'')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function normalize(row) {
  return {
    name: String(row.name||'').trim(),
    status: String(row.status||'wishlist').toLowerCase().trim(),
    country: String(row.country||'').trim(),
    city: String(row.city||'').trim(),
    district: String(row.district||'').trim(),
    cuisine: String(row.cuisine||'').trim(),
    google_maps_url: String(row.google_maps_url||'').trim(),
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lng),
    visit_date: String(row.visit_date||'').trim(),
    my_rating: String(row.my_rating||'').trim(),
    tabelog_rating: String(row.tabelog_rating||'').trim(),
    price_per_head: String(row.price_per_head||'').trim(),
    would_revisit: String(row.would_revisit||'').trim(),
    tags: String(row.tags||'').trim(),
    photo_url: String(row.photo_url||'').trim(),
    notes: String(row.notes||'').trim(),
    source_url: String(row.source_url||'').trim()
  };
}

function hasCoords(item) { return Number.isFinite(item.lat) && Number.isFinite(item.lng); }

function mapsUrl(item) {
  const u = item.google_maps_url;
  if (u && u.includes('google.com/maps')) return u;
  if (item.name) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + (item.city ? ' ' + item.city : ''))}`;
  if (hasCoords(item)) return `https://www.google.com/maps?q=${item.lat},${item.lng}`;
  return '#';
}

const isJapan  = i => i.country.includes('日本') || /[\u3040-\u30ff]/.test(i.name);
const isHK     = i => i.country.includes('香港');
const isKorea  = i => i.country.includes('韓國') || i.country.includes('한국');

function externalLinks(item) {
  const links = [];
  const gm = mapsUrl(item);
  if (gm !== '#') links.push({label:'🗺 Google Maps', url:gm});
  links.push({label:'🔍 Google 搜尋', url:`https://www.google.com/search?q=${encodeURIComponent(item.name)}`});
  if (isJapan(item))  links.push({label:'🍜 Tabelog',  url:`https://www.google.com/search?q=${encodeURIComponent(item.name+' tabelog')}`});
  if (isHK(item))     links.push({label:'🍴 OpenRice', url:`https://www.google.com/search?q=${encodeURIComponent(item.name+' openrice')}`});
  if (isKorea(item))  links.push({label:'🇰🇷 Naver',   url:`https://search.naver.com/search.naver?query=${encodeURIComponent(item.name)}`});
  if (item.source_url) links.push({label:'📎 Source', url:item.source_url});
  if (hasCoords(item)) links.push({label:'🧭 導航', url:`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`});
  return links;
}

function parseCSV(text) {
  const rows=[]; let row=[], val='', inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"'){ if(inQ&&n==='"'){ val+='"'; i++; } else { inQ=!inQ; } }
    else if(c===','&&!inQ){ row.push(val); val=''; }
    else if((c==='\n'||c==='\r')&&!inQ){ if(c==='\r'&&n==='\n')i++; row.push(val); if(row.some(x=>x!==''))rows.push(row); row=[]; val=''; }
    else { val+=c; }
  }
  if(row.length){ row.push(val); if(row.some(x=>x!==''))rows.push(row); }
  if(!rows.length) return [];
  const headers=rows[0].map(h=>h.trim());
  return rows.slice(1).map(cols=>Object.fromEntries(headers.map((h,i)=>[h,(cols[i]||'').trim()])));
}

function exportCSV() {
  if (!currentData.length) { showToast('❌ 沒有資料可以匯出'); return; }
  const fields = ['name','status','country','city','district','cuisine','google_maps_url','lat','lng','visit_date','my_rating','tabelog_rating','price_per_head','would_revisit','tags','photo_url','notes','source_url'];
  const csvEsc = v => { const s=String(v??''); return s.includes(',')||s.includes('"')||s.includes('\n')?`"${s.replaceAll('"','""')}"`  :s; };
  const csv = [fields.join(','), ...currentData.map(item=>fields.map(f=>csvEsc(item[f]??'')).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'}));
  a.download = `restaurant-map-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast(`✅ 已匯出 ${currentData.length} 間餐廳`);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Theme ──────────────────────────────────────────────────────
function initTheme() {
  const btn=document.querySelector('[data-theme-toggle]'), root=document.documentElement;
  let theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  const apply=t=>{ root.setAttribute('data-theme',t); btn.textContent=t==='dark'?'☀️':'🌙'; };
  apply(theme);
  btn.addEventListener('click',()=>{ theme=theme==='dark'?'light':'dark'; apply(theme); });
}

// ── Lightbox ───────────────────────────────────────────────────
function initLightbox() {
  const lb=document.createElement('div');
  lb.className='lightbox'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-label','相片放大');
  lb.innerHTML=`<button class="lightbox-close" aria-label="關閉">✕</button><img src="" alt="放大相片"/>`;
  document.body.appendChild(lb);
  lb.querySelector('.lightbox-close').addEventListener('click',()=>lb.classList.remove('open'));
  lb.addEventListener('click',e=>{ if(e.target===lb)lb.classList.remove('open'); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&lb.classList.contains('open'))lb.classList.remove('open'); });
  window._openLightbox=src=>{ lb.querySelector('img').src=src; lb.classList.add('open'); };
  window.openLightbox=window._openLightbox;
}

// ── Map ────────────────────────────────────────────────────────
function initMap() {
  map=L.map('map',{zoomControl:true}).setView([34.6937,135.5023],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(map);
  clusterGroup = L.markerClusterGroup
    ? L.markerClusterGroup({
        showCoverageOnHover:false, maxClusterRadius:50,
        iconCreateFunction:cluster=>{
          const count=cluster.getChildCount();
          return L.divIcon({
            html:`<div style="background:var(--color-primary);color:var(--color-text-inverse);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border:2px solid rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.2)">${count}</div>`,
            className:'', iconSize:[36,36], iconAnchor:[18,18]
          });
        }
      })
    : L.layerGroup();
  clusterGroup.addTo(map);
}

function buildIcon(item) {
  const r=item.my_rating?parseFloat(item.my_rating).toFixed(1):'';
  const cls=item.status==='visited'?'visited':'wishlist';
  return L.divIcon({
    className:'',
    html:`<div class="marker-wrap"><div class="marker-pin ${cls}">${r?`<span class="marker-rating">${esc(r)}</span>`:''}</div></div>`,
    iconSize:[28,38], iconAnchor:[14,38], popupAnchor:[0,-40]
  });
}

function buildPopup(item) {
  const links=externalLinks(item);
  const btns=links.map(l=>`<a class="popup-btn" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`).join('');
  const loc=[item.country,item.city,item.district].filter(Boolean).join(' · ');
  return `<div>
    ${item.photo_url?`<img class="popup-photo" src="${esc(item.photo_url)}" alt="${esc(item.name)}" loading="lazy">`:''}
    <div class="popup-title">${esc(item.name)}</div>
    ${loc?`<div class="popup-row">${esc(loc)}</div>`:''}
    ${item.cuisine?`<div class="popup-row">料理：${esc(item.cuisine)}</div>`:''}
    ${item.my_rating?`<div class="popup-row">⭐ 私人評分：<strong>${esc(item.my_rating)}</strong></div>`:''}
    ${item.tabelog_rating?`<div class="popup-row">Tabelog：${esc(item.tabelog_rating)}</div>`:''}
    ${item.visit_date?`<div class="popup-row">日期：${esc(item.visit_date)}</div>`:''}
    ${item.price_per_head?`<div class="popup-row">人均：${esc(item.price_per_head)}</div>`:''}
    ${item.notes?`<div class="popup-row">${esc(item.notes)}</div>`:''}
    <div class="popup-actions">${btns}</div>
    <div style="padding:0.3rem 0.6rem 0.6rem">
      <button onclick="window._openNotesByName('${esc(item.name)}','${esc(item.country)}','${esc(item.city)}')" style="width:100%;padding:0.4rem;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface-2);cursor:pointer;font-size:0.78rem;font-weight:700;color:var(--color-primary)">💬 筆記 / 聊天</button>
    </div>
  </div>`;
}

function renderMarkers(data) {
  clusterGroup.clearLayers();
  const valid=data.filter(hasCoords);
  if(!valid.length){ map.setView([35.68,139.69],5); return; }
  const bounds=[];
  valid.forEach((item,idx)=>{
    const marker=L.marker([item.lat,item.lng],{icon:buildIcon(item)});
    marker.bindPopup(buildPopup(item),{maxWidth:280});
    marker.on('click',()=>{
      const card=document.getElementById(`card-${idx}`) || document.getElementById(`row-${idx}`);
      if(card){
        document.querySelectorAll('.card.highlighted,.data-row.highlighted').forEach(c=>c.classList.remove('highlighted'));
        card.classList.add('highlighted');
        card.scrollIntoView({behavior:'smooth',block:'nearest'});
      }
    });
    clusterGroup.addLayer(marker);
    bounds.push([item.lat,item.lng]);
  });
  map.fitBounds(bounds,{padding:[40,40],maxZoom:14});
}

// ── Card / Table builders ──────────────────────────────────────
function buildCard(item, idx) {
  const realIdx=currentData.indexOf(item);
  const tags=item.tags?item.tags.split(',').map(t=>t.trim()).filter(Boolean):[];
  const loc=[item.country,item.city,item.district].filter(Boolean).join(' · ');
  const lkBtns=externalLinks(item).map(l=>`<a class="link-btn" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`).join('');
  const photoHtml=item.photo_url?`<div class="photo" role="button" tabindex="0"
    onclick="window._openLightbox('${esc(item.photo_url)}')"
    onkeydown="if(event.key==='Enter')window._openLightbox('${esc(item.photo_url)}')">
    <img src="${esc(item.photo_url)}" alt="${esc(item.name)}" loading="lazy" width="1200" height="675"></div>`:'';
  return `<article class="card" id="card-${idx}" data-idx="${realIdx}">
    ${photoHtml}
    <div class="card-head">
      <div>
        <h3 class="card-title">${esc(item.name||'未命名餐廳')}</h3>
        <div class="small-row">
          <span class="chip ${item.status==='visited'?'visited':'wishlist'}">${item.status==='visited'?'已食':'Wishlist'}</span>
          ${item.cuisine?`<span class="chip">${esc(item.cuisine)}</span>`:''}
          ${item.would_revisit?`<span class="chip">再去：${esc(item.would_revisit)}</span>`:''}
        </div>
      </div>
      ${item.my_rating?`<div class="rating">${esc(item.my_rating)}</div>`:''}
    </div>
    ${loc?`<div class="helper">${esc(loc)}</div>`:''}
    <div class="meta">
      ${item.visit_date?`<span class="chip">日期：${esc(item.visit_date)}</span>`:''}
      ${item.tabelog_rating?`<span class="chip">Tabelog：${esc(item.tabelog_rating)}</span>`:''}
      ${item.price_per_head?`<span class="chip">人均：${esc(item.price_per_head)}</span>`:''}
    </div>
    ${tags.length?`<div class="meta">${tags.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>`:''}
    ${item.notes?`<p class="helper">${esc(item.notes)}</p>`:''}
    <div class="actions">${lkBtns}</div>
    <div class="card-footer-actions">
      <button class="btn-icon" type="button" onclick="openEditForm(${realIdx})">✏️ 編輯</button>
      <button class="btn-icon" type="button" onclick="duplicateRecord(${realIdx})">📋 複製記錄</button>
      <button class="btn-icon" type="button" onclick="openShareCard(${realIdx})">🔗 分享</button>
      <button class="btn-icon notes-btn" type="button" onclick="openNotesPanel(${realIdx})" title="筆記">💬 筆記</button>
    </div>
  </article>`;
}

function buildTable(data) {
  if (!data.length) return '<div class="empty">目前沒有符合條件的餐廳。</div>';
  const rows=data.map((item,idx)=>{
    const realIdx=currentData.indexOf(item);
    const links=externalLinks(item).slice(0,2).map(l=>`<a class="link-btn" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`).join('');
    const loc=[item.country,item.city,item.district].filter(Boolean).join(' · ');
    return `<tr class="data-row" id="row-${idx}">
      <td class="table-name">${esc(item.name)}</td><td>${esc(loc)}</td><td>${esc(item.cuisine||'')}</td>
      <td>${esc(item.my_rating||'')}</td><td>${esc(item.tabelog_rating||'')}</td>
      <td>${esc(item.would_revisit||'')}</td><td>${esc(item.visit_date||'')}</td><td>${esc(item.tags||'')}</td>
      <td><div class="table-actions">${links}
        <button class="btn-icon" type="button" onclick="openEditForm(${realIdx})">✏️ 編輯</button>
        <button class="btn-icon" type="button" onclick="duplicateRecord(${realIdx})">📋 複製</button>
      </div></td>
    </tr>`;
  }).join('');
  return `<div class="data-table-scroll"><table class="data-table"><thead><tr>
    <th>店名</th><th>地點</th><th>料理</th><th>私人評分</th><th>Tabelog</th><th>再去？</th><th>日期</th><th>標籤</th><th>操作</th>
  </tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ── Stats ──────────────────────────────────────────────────────
function renderStats(data) {
  const visited=data.filter(i=>i.status==='visited').length;
  const wishlist=data.filter(i=>i.status==='wishlist').length;
  const scores=data.map(i=>parseFloat(i.my_rating)).filter(n=>Number.isFinite(n));
  const avg=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):'—';
  document.getElementById('stats').innerHTML=`
    <div class="stat"><div class="num">${data.length}</div><div class="label">總店數</div></div>
    <div class="stat"><div class="num">${visited}</div><div class="label">已食</div></div>
    <div class="stat"><div class="num">${wishlist}</div><div class="label">Wishlist</div></div>
    <div class="stat"><div class="num">${avg}</div><div class="label">平均評分</div></div>`;
}

// ── Step 5: Stats Page ─────────────────────────────────────────
function openStatsPage() {
  document.getElementById('statsOverlay').classList.add('open');
  renderStatsPage();
}
function closeStatsPage() {
  document.getElementById('statsOverlay').classList.remove('open');
}

function buildCountryStats() {
  const map = {};
  currentData.forEach(item => {
    if (!item.country) return;
    if (!map[item.country]) map[item.country] = { count:0, scores:[] };
    map[item.country].count++;
    const r = parseFloat(item.my_rating);
    if (Number.isFinite(r)) map[item.country].scores.push(r);
  });
  return Object.entries(map)
    .map(([country, d]) => ({
      country,
      count: d.count,
      avg: d.scores.length ? (d.scores.reduce((a,b)=>a+b,0)/d.scores.length) : null,
      scored: d.scores.length
    }))
    .sort((a,b) => b.count - a.count);
}

function renderS1() {
  const stats = buildCountryStats();
  const maxCount = Math.max(...stats.map(s=>s.count), 1);
  const rows = stats.map(s => `
    <tr>
      <td><strong>${esc(s.country)}</strong></td>
      <td>
        <div class="country-bar-wrap">
          <div class="country-bar-bg"><div class="country-bar-fill" style="width:${Math.min(s.count/maxCount*100, 100).toFixed(1)}%"></div></div>
          <span class="country-bar-count">${s.count}</span>
        </div>
      </td>
      <td>${s.avg !== null ? s.avg.toFixed(1) + ' ⭐' : '—'}</td>
      <td style="color:var(--color-text-muted);font-size:var(--text-xs)">${s.scored} 間有評分</td>
    </tr>`).join('');
  return `
    <div class="stats-section-title">📊 各國家統計</div>
    ${stats.length ? `
      <div class="data-table-scroll">
        <table class="country-stat-table">
          <thead><tr><th>國家</th><th>餐廳數量</th><th>平均私人評分</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>` : '<div class="empty">尚無資料</div>'}`;
}

function renderS2() {
  const countries = [...new Set(currentData.map(i=>i.country).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
  const filterSel = `<div class="stats-filter-row">
    <label>按國家篩選：</label>
    <select id="top10CountryFilter" class="stats-select">
      <option value="all">全部國家</option>
      ${countries.map(c=>`<option value="${esc(c)}" ${statsCountryFilter===c?'selected':''}>${esc(c)}</option>`).join('')}
    </select>
  </div>`;
  const pool = statsCountryFilter === 'all' ? currentData : currentData.filter(i=>i.country===statsCountryFilter);
  const top10 = pool
    .filter(i => Number.isFinite(parseFloat(i.my_rating)))
    .map(i => ({...i, _score: parseFloat(i.my_rating)}))
    .sort((a,b) => b._score - a._score)
    .slice(0, 10);
  const rankClass = n => n===1?'gold':n===2?'silver':n===3?'bronze':'';
  const items = top10.map((item,i) => {
    const loc = [item.city,item.district].filter(Boolean).join(' · ');
    const gm = mapsUrl(item);
    return `<li class="top-list-item">
      <div class="top-rank ${rankClass(i+1)}">${i+1}</div>
      <div class="top-name">
        <div>${esc(item.name)}</div>
        <div class="top-meta">${esc(item.country)}${loc?' · '+esc(loc):''}${item.cuisine?' · '+esc(item.cuisine):''}</div>
      </div>
      ${gm!=='#'?`<a class="link-btn" href="${esc(gm)}" target="_blank" rel="noopener noreferrer" style="flex-shrink:0">🗺</a>`:''}
      <div class="top-score">${item._score.toFixed(1)}</div>
    </li>`;
  }).join('');
  return `
    <div class="stats-section-title">🏆 Top 10 評分最高餐廳</div>
    ${filterSel}
    ${top10.length
      ? `<ol class="top-list">${items}</ol>`
      : '<div class="empty">未有足夠評分資料</div>'}`;
}

function renderS3() {
  const avoid = currentData.filter(i => i.would_revisit && i.would_revisit.includes('❌'));
  const cards = avoid.map(item => {
    const loc = [item.country, item.city, item.district].filter(Boolean).join(' · ');
    const gm = mapsUrl(item);
    return `<div class="avoid-card">
      <div class="avoid-name">❌ ${esc(item.name)}</div>
      <div class="avoid-meta">
        ${loc?`<span>${esc(loc)}</span>`:''}
        ${item.cuisine?`<span>${esc(item.cuisine)}</span>`:''}
        ${item.my_rating?`<span>評分：${esc(item.my_rating)}</span>`:''}
        ${item.visit_date?`<span>${esc(item.visit_date)}</span>`:''}
        ${item.price_per_head?`<span>人均：${esc(item.price_per_head)}</span>`:''}
        ${gm!=='#'?`<a class="link-btn" href="${esc(gm)}" target="_blank" rel="noopener noreferrer">🗺 地圖</a>`:''}
      </div>
      ${item.notes?`<div class="avoid-notes">${esc(item.notes)}</div>`:''}
    </div>`;
  }).join('');
  return `
    <div class="stats-section-title">🚫 避雷名單（不再去）</div>
    <div style="font-size:var(--text-xs);color:var(--color-text-muted)">共 ${avoid.length} 間</div>
    ${avoid.length
      ? `<div class="avoid-list">${cards}</div>`
      : '<div class="empty">🎉 暫時沒有避雷記錄！</div>'}`;
}

function renderStatsPage() {
  const activeTab = document.querySelector('.stats-tab.active')?.dataset.tab || 's1';
  document.querySelectorAll('.stats-section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(`statsSection_${activeTab}`);
  if (!sec) return;
  sec.classList.add('active');
  if (activeTab === 's1') sec.innerHTML = renderS1();
  else if (activeTab === 's2') {
    sec.innerHTML = renderS2();
    const sel = document.getElementById('top10CountryFilter');
    if (sel) sel.addEventListener('change', () => { statsCountryFilter = sel.value; renderStatsPage(); });
  }
  else if (activeTab === 's3') sec.innerHTML = renderS3();
  else if (activeTab === 's4') sec.innerHTML = renderS4();
  else if (activeTab === 's5') sec.innerHTML = renderS5();
  else if (activeTab === 's6') sec.innerHTML = renderS6();
}

function initStatsPage() {
  document.getElementById('openStatsBtn').addEventListener('click', openStatsPage);
  document.getElementById('closeStatsBtn').addEventListener('click', closeStatsPage);
  document.querySelectorAll('.stats-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stats-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statsCountryFilter = 'all';
      renderStatsPage();
    });
  });
}

// ── Filters ────────────────────────────────────────────────────
function refreshTagBar() {
  const tagSet=new Set();
  currentData.forEach(item=>{ if(item.tags)item.tags.split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>tagSet.add(t)); });
  const bar=document.getElementById('tagFilterBar'); if(!bar)return;
  if(!tagSet.size){ bar.innerHTML=''; return; }
  bar.innerHTML=[...tagSet].sort((a,b)=>a.localeCompare(b,'zh-Hant')).map(tag=>{
    const active=activeTagFilters.has(tag)?' active':'';
    return `<button class="tag-chip${active}" data-tag="${esc(tag)}" type="button" aria-pressed="${activeTagFilters.has(tag)}">${esc(tag)}</button>`;
  }).join('');
  bar.querySelectorAll('.tag-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tag=btn.dataset.tag;
      if(activeTagFilters.has(tag)){ activeTagFilters.delete(tag); btn.classList.remove('active'); }
      else { activeTagFilters.add(tag); btn.classList.add('active'); }
      render();
    });
  });
}

function refreshCityBar() {
  const citySet=new Set(currentData.map(i=>i.city).filter(Boolean));
  const bar=document.getElementById('cityChipBar'); if(!bar)return;
  if(!citySet.size){ bar.innerHTML=''; return; }
  bar.innerHTML=[...citySet].sort((a,b)=>a.localeCompare(b,'zh-Hant')).map(city=>{
    const active=activeCityFilters.has(city)?' active':'';
    return `<button class="tag-chip city-chip${active}" data-city="${esc(city)}" type="button">${esc(city)}</button>`;
  }).join('');
  bar.querySelectorAll('.city-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const city=btn.dataset.city;
      if(activeCityFilters.has(city)) activeCityFilters.delete(city); else activeCityFilters.add(city);
      render(); refreshCityBar();
    });
  });
}

function initRevisitFilter() {
  const container=document.getElementById('revisitFilters'); if(!container)return;
  const options=[{value:'all',label:'全部'},{value:'yes',label:'✅ 會再去'},{value:'no',label:'❌ 不再去'}];
  container.innerHTML=options.map(o=>`<button class="quick-chip${revisitFilter===o.value?' active':''}" data-revisit="${o.value}" type="button">${o.label}</button>`).join('');
  container.querySelectorAll('.quick-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      revisitFilter=btn.dataset.revisit;
      container.querySelectorAll('.quick-chip').forEach(b=>b.classList.toggle('active',b.dataset.revisit===revisitFilter));
      render();
    });
  });
}

function initRatingFilter() {
  const source=document.getElementById('ratingSource');
  const range=document.getElementById('ratingMin');
  const value=document.getElementById('ratingMinValue');
  if(!source||!range||!value)return;
  const updateLabel=()=>value.textContent=`${parseFloat(range.value).toFixed(1)}+`;
  updateLabel();
  source.addEventListener('change',()=>{ ratingFilter.source=source.value; render(); });
  range.addEventListener('input',()=>{ ratingFilter.min=parseFloat(range.value)||0; updateLabel(); render(); });
}

function initViewToggle() {
  const cardBtn=document.getElementById('cardViewBtn');
  const tableBtn=document.getElementById('tableViewBtn');
  if(!cardBtn||!tableBtn)return;
  const apply=mode=>{
    currentViewMode=mode;
    cardBtn.classList.toggle('active',mode==='card');
    tableBtn.classList.toggle('active',mode==='table');
    document.getElementById('listWrap').style.display=mode==='card'?'':'none';
    document.getElementById('tableWrap').style.display=mode==='table'?'':'none';
  };
  cardBtn.addEventListener('click',()=>{ apply('card'); render(); });
  tableBtn.addEventListener('click',()=>{ apply('table'); render(); });
  apply(currentViewMode);
}

function populateSelect(id,values) {
  const sel=document.getElementById(id), cur=sel.value;
  sel.innerHTML='<option value="all">全部</option>';
  [...new Set(values)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'zh-Hant')).forEach(v=>{
    const opt=document.createElement('option'); opt.value=v; opt.textContent=v; sel.appendChild(opt);
  });
  if([...sel.options].some(o=>o.value===cur)) sel.value=cur;
}

function refreshSelects() {
  populateSelect('countryFilter',currentData.map(i=>i.country));
  populateSelect('cityFilter',currentData.map(i=>i.city));
  populateSelect('cuisineFilter',currentData.map(i=>i.cuisine));
}

function getFiltered() {
  const kw=document.getElementById('searchInput').value.trim().toLowerCase();
  const status=document.getElementById('statusFilter').value;
  const country=document.getElementById('countryFilter').value;
  const city=document.getElementById('cityFilter').value;
  const cuisine=document.getElementById('cuisineFilter').value;
  const sortBy=document.getElementById('sortBy').value;
  const source=ratingFilter.source, min=ratingFilter.min;
  let data=currentData.filter(item=>{
    const hay=[item.name,item.city,item.district,item.tags,item.notes,item.cuisine].join(' ').toLowerCase();
    const tagOk=activeTagFilters.size===0||[...activeTagFilters].every(t=>item.tags.toLowerCase().includes(t.toLowerCase()));
    const revisitOk=revisitFilter==='all'||(revisitFilter==='yes'&&item.would_revisit.includes('✅'))||(revisitFilter==='no'&&item.would_revisit.includes('❌'));
    const cityOk=activeCityFilters.size>0?activeCityFilters.has(item.city):(city==='all'||item.city===city);
    const rv=parseFloat(item[source]);
    const ratingOk=min<=0?true:(Number.isFinite(rv)&&rv>=min);
    return (!kw||hay.includes(kw))&&(status==='all'||item.status===status)&&(country==='all'||item.country===country)&&cityOk&&(cuisine==='all'||item.cuisine===cuisine)&&tagOk&&revisitOk&&ratingOk;
  });
  data.sort((a,b)=>{
    if(sortBy==='rating') return (parseFloat(b.my_rating)||-1)-(parseFloat(a.my_rating)||-1);
    if(sortBy==='name') return (a.name||'').localeCompare(b.name||'','zh-Hant');
    return new Date(b.visit_date||'1900-01-01')-new Date(a.visit_date||'1900-01-01');
  });
  return data;
}

function render() {
  const data=getFiltered();
  renderStats(data);
  const countEl=document.getElementById('resultCount');
  if(countEl){
    const total=currentData.length;
    countEl.innerHTML=data.length===total
      ?`<span class="result-count">共 <strong>${total}</strong> 間餐廳</span>`
      :`<span class="result-count">篩選結果：<strong>${data.length}</strong> 間（共 ${total} 間）</span>`;
  }
  document.getElementById('listWrap').innerHTML=data.length?data.map((item,idx)=>buildCard(item,idx)).join(''):'<div class="empty">目前沒有符合條件的餐廳。試試清除篩選或載入 sample data。</div>';
  document.getElementById('tableWrap').innerHTML=buildTable(data);
  renderMarkers(data);
}

// ── Add / Edit Form ────────────────────────────────────────────
function extractCoordsFromMapsUrl(url) {
  const patterns=[/@(-?\d+\.\d+),(-?\d+\.\d+)/,/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/];
  for(const re of patterns){ const m=url.match(re); if(m) return {lat:parseFloat(m[1]),lng:parseFloat(m[2])}; }
  return null;
}

let acAbortCtrl=null;
async function nominatimSearch(query) {
  if(acAbortCtrl)acAbortCtrl.abort();
  acAbortCtrl=new AbortController();
  try{
    const res=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&q=${encodeURIComponent(query)}`,{signal:acAbortCtrl.signal,headers:{'Accept-Language':'zh-TW,zh,en'}});
    return await res.json();
  }catch(e){ if(e.name!=='AbortError')console.warn('Nominatim error',e); return []; }
}

function extractAddress(result) {
  const a=result.address||{};
  return { country:a.country||'', city:a.city||a.town||a.village||a.county||a.state||'', district:a.neighbourhood||a.suburb||a.quarter||a.borough||'' };
}

function fillFormFromItem(item) {
  const f=(id,v)=>{ const el=document.getElementById(id); if(el)el.value=v||''; };
  f('af_name',item.name); f('af_status',item.status||'wishlist');
  f('af_country',item.country); f('af_city',item.city); f('af_district',item.district);
  f('af_cuisine',item.cuisine); f('af_maps_url',item.google_maps_url);
  f('af_lat',Number.isFinite(item.lat)?item.lat:''); f('af_lng',Number.isFinite(item.lng)?item.lng:'');
  f('af_visit_date',item.visit_date); f('af_my_rating',item.my_rating);
  f('af_tabelog_rating',item.tabelog_rating); f('af_price',item.price_per_head);
  f('af_would_revisit',item.would_revisit); f('af_tags',item.tags);
  f('af_photo_url',item.photo_url); f('af_notes',item.notes); f('af_source_url',item.source_url);
  const preview=document.getElementById('photoPreview'), img=preview.querySelector('img');
  if(item.photo_url){ img.src=item.photo_url; img.onload=()=>preview.classList.add('visible'); img.onerror=()=>preview.classList.remove('visible'); }
  else { preview.classList.remove('visible'); img.src=''; }
}

window.openEditForm=function(realIdx){
  const item=currentData[realIdx]; if(!item)return;
  editingIndex=realIdx;
  document.getElementById('addModalTitle').innerHTML=`編輯餐廳 <span class="modal-mode-badge">✏️ 編輯模式</span>`;
  document.getElementById('addFormSubmit').textContent='💾 儲存更改';
  setFormMode('full'); fillFormFromItem(item);
  document.getElementById('addModal').classList.add('open');
};

window.duplicateRecord=async function(realIdx){
  const item=currentData[realIdx]; if(!item)return;
  const copy=normalize({...item,name:item.name+' (複製)',visit_date:'',my_rating:'',notes:''});
  currentData.push(copy);
  saveCache(); refreshSelects(); refreshTagBar(); refreshCityBar(); render();
  const synced=await syncItemToSheet('append',copy);
  showToast(synced?`📋 已複製並同步：${item.name}`:`📋 已複製：${item.name}`);
};

function resetFormToAddMode(){
  editingIndex=null;
  document.getElementById('addModalTitle').textContent='新增餐廳';
  document.getElementById('addFormSubmit').textContent='✅ 新增餐廳';
  document.getElementById('addForm').reset();
  document.getElementById('photoPreview').classList.remove('visible');
  document.getElementById('photoPreview').querySelector('img').src='';
  document.getElementById('acList').innerHTML='';
}

function initAddForm(){
  const overlay=document.getElementById('addModal'), form=document.getElementById('addForm');
  if(!overlay||!form)return;
  document.getElementById('openAddBtn').addEventListener('click',()=>{ resetFormToAddMode(); setFormMode('full'); overlay.classList.add('open'); });
  const closeModal=()=>{ overlay.classList.remove('open'); resetFormToAddMode(); };
  overlay.addEventListener('click',e=>{ if(e.target===overlay)closeModal(); });
  document.querySelectorAll('#closeAddModal,#closeAddModal2').forEach(btn=>btn.addEventListener('click',closeModal));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&overlay.classList.contains('open'))closeModal(); });
  document.getElementById('modeToggleFull').addEventListener('click',()=>setFormMode('full'));
  document.getElementById('modeToggleQuick').addEventListener('click',()=>setFormMode('quick'));

  const nameInput=document.getElementById('af_name'), acList=document.getElementById('acList');
  nameInput.addEventListener('input',()=>{
    const q=nameInput.value.trim(); clearTimeout(nominatimTimer);
    if(q.length<2){ acList.innerHTML=''; return; }
    nominatimTimer=setTimeout(async()=>{
      const results=await nominatimSearch(q); if(!results.length){ acList.innerHTML=''; return; }
      acList.innerHTML=results.map((r,i)=>`<li data-idx="${i}" tabindex="0"><div class="ac-name">${esc(r.display_name.split(',')[0])}</div><div class="ac-addr">${esc(r.display_name)}</div></li>`).join('');
      acList._results=results;
      acList.querySelectorAll('li').forEach(li=>{
        const fillFn=()=>{
          const r=acList._results[parseInt(li.dataset.idx)], addr=extractAddress(r), placeName=r.display_name.split(',')[0].trim();
          if(nameInput.value.trim().length<3) nameInput.value=placeName;
          document.getElementById('af_country').value=addr.country;
          document.getElementById('af_city').value=addr.city;
          document.getElementById('af_district').value=addr.district;
          document.getElementById('af_lat').value=parseFloat(r.lat).toFixed(6);
          document.getElementById('af_lng').value=parseFloat(r.lon).toFixed(6);
          if(!document.getElementById('af_maps_url').value.trim())
            document.getElementById('af_maps_url').value=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName+(addr.city?' '+addr.city:''))}`;
          acList.innerHTML=''; showToast(`✅ 已自動填入：${addr.city||addr.country}`);
        };
        li.addEventListener('click',fillFn); li.addEventListener('keydown',e=>{ if(e.key==='Enter')fillFn(); });
      });
    },400);
  });

  document.getElementById('af_maps_url').addEventListener('input',()=>{
    const val=document.getElementById('af_maps_url').value.trim();
    if(!val.includes('google.com/maps'))return;
    const coords=extractCoordsFromMapsUrl(val);
    if(coords){ document.getElementById('af_lat').value=coords.lat.toFixed(6); document.getElementById('af_lng').value=coords.lng.toFixed(6); showToast(`✅ 已提取座標：${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`); }
  });

  document.getElementById('af_photo_url').addEventListener('input',()=>{
    const val=document.getElementById('af_photo_url').value.trim(), preview=document.getElementById('photoPreview'), img=preview.querySelector('img');
    if(val){ img.src=val; img.onload=()=>preview.classList.add('visible'); img.onerror=()=>preview.classList.remove('visible'); }
    else{ preview.classList.remove('visible'); img.src=''; }
  });

  const countryInput=document.getElementById('af_country');
  const updateTabelogHint=()=>{
    const hint=document.getElementById('tabelogHint'), name=nameInput.value.trim(), country=countryInput.value.trim();
    if(hint&&name&&(country.includes('日本')||/[\u3040-\u30ff]/.test(name))){
      hint.innerHTML=`🍜 <a href="https://www.google.com/search?q=${encodeURIComponent(name+' tabelog')}" target="_blank" rel="noopener noreferrer">搜尋 Tabelog 評分</a>`;
      hint.style.display='block';
    } else if(hint) hint.style.display='none';
  };
  countryInput.addEventListener('input',updateTabelogHint); nameInput.addEventListener('input',updateTabelogHint);

  document.getElementById('addFormSubmit').addEventListener('click',async()=>{
    const name=document.getElementById('af_name').value.trim();
    if(!name){ showToast('❌ 請輸入店名'); return; }
    const btn=document.getElementById('addFormSubmit');
    btn.disabled=true;
    const newItem=normalize({
      name, status:document.getElementById('af_status').value,
      country:document.getElementById('af_country').value, city:document.getElementById('af_city').value,
      district:document.getElementById('af_district').value, cuisine:document.getElementById('af_cuisine').value,
      google_maps_url:document.getElementById('af_maps_url').value,
      lat:document.getElementById('af_lat').value, lng:document.getElementById('af_lng').value,
      visit_date:document.getElementById('af_visit_date').value, my_rating:document.getElementById('af_my_rating').value,
      tabelog_rating:document.getElementById('af_tabelog_rating').value, price_per_head:document.getElementById('af_price').value,
      would_revisit:document.getElementById('af_would_revisit').value, tags:document.getElementById('af_tags').value,
      photo_url:document.getElementById('af_photo_url').value, notes:document.getElementById('af_notes').value,
      source_url:document.getElementById('af_source_url').value,
    });
    try {
      if(editingIndex!==null){
        currentData[editingIndex]=newItem;
        const synced=await syncItemToSheet('update',newItem,editingIndex);
        showToast(synced?`💾 已更新並同步：${newItem.name}`:`💾 已更新：${newItem.name}`);
      } else {
        currentData.push(newItem);
        const synced=await syncItemToSheet('append',newItem);
        showToast(synced?`✅ 已新增並同步：${newItem.name}`:`✅ 已新增：${newItem.name}`);
      }
      saveCache(); refreshSelects(); refreshTagBar(); refreshCityBar(); render(); closeModal();
    } finally {
      btn.disabled=false;
    }
  });

  const exportBtn=document.getElementById('exportCsvBtn');
  if(exportBtn) exportBtn.addEventListener('click',exportCSV);
}

function setFormMode(mode){
  addFormMode=mode;
  document.getElementById('modeToggleFull').classList.toggle('active',mode==='full');
  document.getElementById('modeToggleQuick').classList.toggle('active',mode==='quick');
  document.querySelectorAll('.form-full-only').forEach(el=>el.style.display=mode==='full'?'':'none');
  if(mode==='quick') document.getElementById('af_status').value='wishlist';
}
window.setFormMode=setFormMode;

// ── Sheet loader ───────────────────────────────────────────────
async function loadSheet(url){
  const res=await fetch(url); if(!res.ok)throw new Error('讀取 Google Sheet 失敗');
  const text=await res.text();
  const rows=parseCSV(text).map(normalize).filter(r=>r.name);
  if(!rows.length)throw new Error('Google Sheet 內沒有可用資料');
  currentData=rows; saveCache(); refreshSelects(); refreshTagBar(); refreshCityBar(); render();
}

// ── Event binding ──────────────────────────────────────────────
function bindEvents(){
  ['searchInput','statusFilter','countryFilter','cityFilter','cuisineFilter','sortBy'].forEach(id=>{
    document.getElementById(id).addEventListener('input',render);
    document.getElementById(id).addEventListener('change',render);
  });
  document.getElementById('cityFilter').addEventListener('change',()=>{
    if(document.getElementById('cityFilter').value!=='all') activeCityFilters.clear();
  });
  document.getElementById('loadSampleBtn').addEventListener('click',()=>{
    currentData=SAMPLE_DATA.map(normalize);
    activeTagFilters.clear(); activeCityFilters.clear(); revisitFilter='all';
    refreshSelects(); refreshTagBar(); refreshCityBar(); initRevisitFilter(); render();
  });
  document.getElementById('openSheetDirectBtn')?.addEventListener('click',()=>{
    window.open(SHEET_CONFIG.editUrl,'_blank');
  });
  document.getElementById('loadSheetBtn').addEventListener('click',async()=>{
    const btn=document.getElementById('loadSheetBtn'), url=document.getElementById('sheetUrl').value.trim();
    if(!url){ alert('請先貼上 Google Sheets CSV 連結。'); return; }
    try{ btn.disabled=true; btn.textContent='讀取中…'; await loadSheet(url);
      activeTagFilters.clear(); activeCityFilters.clear(); revisitFilter='all'; initRevisitFilter(); refreshCityBar();
    }catch(err){ alert(err.message+'。\n請確認已 Publish to web，而且是 CSV 連結。'); }
    finally{ btn.disabled=false; btn.textContent='讀取 Google Sheet'; }
  });
}

// ── Init ───────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
//  STEP 6 — D3: Local Cache, D4: Bulk Import, D2: Auto-refresh
// ═══════════════════════════════════════════════════════════════

const CACHE_KEY = 'rmm_data_v1';
const SHEET_URL_KEY = 'rmm_sheet_url';
let autoRefreshTimer = null;

// D3: Save/load from localStorage
function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(currentData));
    localStorage.setItem('rmm_cache_ts', Date.now().toString());
  } catch(e) { console.warn('Cache save failed', e); }
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return false;
    currentData = parsed.map(normalize);
    const ts = parseInt(localStorage.getItem('rmm_cache_ts') || '0');
    const age = ts ? Math.round((Date.now()-ts)/60000) : null;
    showToast(`📦 已從本地快取載入 ${currentData.length} 間餐廳${age!==null?' ('+age+'分鐘前)':''}`);
    return true;
  } catch(e) { return false; }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem('rmm_cache_ts');
  showToast('🗑 本地快取已清除');
}
window.clearCache = clearCache;

function getCacheInfo() {
  const raw = localStorage.getItem(CACHE_KEY);
  const ts = parseInt(localStorage.getItem('rmm_cache_ts') || '0');
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return { count: data.length, ts };
  } catch { return null; }
}

// D2: Auto-refresh
function startAutoRefresh(url, intervalMin) {
  stopAutoRefresh();
  if (!url || intervalMin < 1) return;
  autoRefreshTimer = setInterval(async () => {
    try {
      const gasUrl = getSheetWebAppUrl();
      if (gasUrl) {
        await loadFromSheetWebApp(gasUrl);
      } else {
        const res = await fetch(url);
        if (!res.ok) return;
        const text = await res.text();
        const rows = parseCSV(text).map(normalize).filter(r => r.name);
        if (!rows.length) return;
        currentData = rows;
        saveCache();
      }
      refreshSelects(); refreshTagBar(); refreshCityBar(); render();
      showToast(`🔄 已自動更新 ${currentData.length} 間餐廳`);
      updateAutoRefreshStatus(true);
    } catch(e) { console.warn('Auto-refresh failed', e); }
  }, intervalMin * 60 * 1000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
}

function updateAutoRefreshStatus(active) {
  const el = document.getElementById('autoRefreshStatus');
  if (!el) return;
  el.textContent = active ? '🟢 自動更新中' : '⚪ 未啟動';
  el.style.color = active ? 'var(--color-success)' : 'var(--color-text-muted)';
}

// D4: Bulk CSV import
function initBulkImport() {
  const fileInput = document.getElementById('importCsvFile');
  const importBtn = document.getElementById('importCsvBtn');
  const modeSelect = document.getElementById('importMode');
  if (!fileInput || !importBtn) return;

  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      let text = e.target.result;
      // Strip BOM
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const rows = parseCSV(text).map(normalize).filter(r => r.name);
      if (!rows.length) { showToast('❌ 無法解析 CSV，請確認格式正確'); return; }
      const mode = modeSelect ? modeSelect.value : 'replace';
      if (mode === 'merge') {
        // merge: add rows not already in currentData (match by name+city)
        const existing = new Set(currentData.map(r => r.name+'|'+r.city));
        const newRows = rows.filter(r => !existing.has(r.name+'|'+r.city));
        currentData = [...currentData, ...newRows];
        showToast(`✅ 合併匯入：新增 ${newRows.length} 間，已有 ${rows.length - newRows.length} 間略過`);
      } else {
        currentData = rows;
        showToast(`✅ 已替換匯入 ${rows.length} 間餐廳`);
      }
      saveCache();
      refreshSelects(); refreshTagBar(); refreshCityBar(); render();
      fileInput.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  });
}

function renderConnectionStatus() {
  const gasUrl = getSheetWebAppUrl();
  const csvUrl = document.getElementById('sheetUrl')?.value.trim();
  let text, dotClass;
  if (gasUrl) {
    text = '已設定 Web App 雙向同步';
    dotClass = 'connected';
  } else if (csvUrl) {
    text = '僅 CSV 讀取（無法寫回 Sheet）';
    dotClass = 'partial';
  } else {
    text = '未連接 · 請開啟設定';
    dotClass = 'disconnected';
  }
  const dot = document.getElementById('connectionDot');
  if (dot) dot.className = 'connection-dot ' + dotClass;
  const sidebar = document.getElementById('connectionStatusText');
  if (sidebar) sidebar.textContent = text;
  const settings = document.getElementById('settingsSyncStatus');
  if (settings) {
    const icon = dotClass === 'connected' ? '🟢' : dotClass === 'partial' ? '🟡' : '⚪';
    settings.textContent = icon + ' ' + text;
  }
}

async function testSheetConnection() {
  const resultEl = document.getElementById('settingsTestResult');
  if (resultEl) resultEl.textContent = '測試中…';
  try {
    const gasUrl = getSheetWebAppUrl();
    if (gasUrl) {
      const res = await fetch(gasUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Web App 回應錯誤');
      const count = (json.rows || []).length;
      if (resultEl) resultEl.textContent = `✅ Web App 正常 · ${count} 間餐廳`;
      return;
    }
    const csvUrl = getSheetCsvUrl();
    if (!csvUrl) throw new Error('請先填入 Web App URL 或 CSV 連結');
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error('CSV 讀取失敗（HTTP ' + res.status + '）');
    const text = await res.text();
    const rows = parseCSV(text).map(normalize).filter(r => r.name);
    if (resultEl) resultEl.textContent = `✅ CSV 正常 · ${rows.length} 間餐廳`;
  } catch (err) {
    if (resultEl) resultEl.textContent = '❌ ' + err.message;
  }
}

function openSettings() {
  document.getElementById('settingsModal')?.classList.add('open');
  renderConnectionStatus();
  renderCacheBadge();
}

function closeSettings() {
  document.getElementById('settingsModal')?.classList.remove('open');
}

function initSettingsModal() {
  ['openSettingsBtn', 'openSettingsBtnSidebar', 'openSettingsBtnFooter'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', openSettings);
  });
  ['closeSettingsModal', 'closeSettingsModalFooter'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', closeSettings);
  });
  document.getElementById('settingsModal')?.addEventListener('click', e => {
    if (e.target.id === 'settingsModal') closeSettings();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('settingsModal')?.classList.contains('open')) closeSettings();
  });

  document.getElementById('settingsSaveReloadBtn')?.addEventListener('click', async () => {
    const gas = document.getElementById('gasUrl');
    const sheet = document.getElementById('sheetUrl');
    if (gas?.value.trim()) localStorage.setItem(GAS_URL_KEY, gas.value.trim());
    else localStorage.removeItem(GAS_URL_KEY);
    if (sheet?.value.trim()) localStorage.setItem(SHEET_URL_KEY, sheet.value.trim());
    else localStorage.removeItem(SHEET_URL_KEY);
    showToast('🔄 重新載入資料…');
    await initDataSource();
    refreshSelects(); refreshTagBar(); refreshCityBar(); render();
    renderCacheBadge(); renderConnectionStatus();
    showToast(`✅ 已載入 ${currentData.length} 間餐廳`);
  });

  document.getElementById('settingsTestConnectionBtn')?.addEventListener('click', testSheetConnection);
  document.getElementById('settingsThemeBtn')?.addEventListener('click', () => {
    document.querySelector('[data-theme-toggle]')?.click();
  });
  document.getElementById('settingsLoadSampleBtn')?.addEventListener('click', () => {
    document.getElementById('loadSampleBtn')?.click();
  });
  document.getElementById('settingsClearCacheBtn')?.addEventListener('click', () => {
    clearCache(); renderCacheBadge();
  });
  document.getElementById('settingsExportBtn')?.addEventListener('click', () => {
    document.getElementById('exportCsvBtn')?.click();
  });
  document.getElementById('settingsImportBtn')?.addEventListener('click', () => {
    document.getElementById('importCsvBtn')?.click();
  });
}

// Save sheet URL to localStorage so it persists
function initSheetUrlPersist() {
  const input = document.getElementById('sheetUrl');
  if (!input) return;
  const saved = localStorage.getItem(SHEET_URL_KEY);
  input.value = saved || SHEET_CONFIG.csvUrl;
  input.addEventListener('change', () => {
    if (input.value.trim()) localStorage.setItem(SHEET_URL_KEY, input.value.trim());
    else localStorage.removeItem(SHEET_URL_KEY);
    renderConnectionStatus();
  });
  input.addEventListener('input', renderConnectionStatus);
}

function initGasUrlPersist() {
  const input = document.getElementById('gasUrl');
  if (!input) return;
  const saved = localStorage.getItem(GAS_URL_KEY);
  input.value = saved || SHEET_CONFIG.webAppUrl || '';
  input.addEventListener('change', () => {
    const url = input.value.trim();
    if (url) localStorage.setItem(GAS_URL_KEY, url);
    else localStorage.removeItem(GAS_URL_KEY);
    renderConnectionStatus();
  });
  input.addEventListener('input', renderConnectionStatus);
}

function initAutoRefreshUI() {
  const toggle = document.getElementById('autoRefreshToggle');
  const intervalSel = document.getElementById('autoRefreshInterval');
  if (!toggle) return;

  const tryStart = () => {
    const url = document.getElementById('sheetUrl')?.value.trim();
    const gasUrl = getSheetWebAppUrl();
    if (!url && !gasUrl) { showToast('❌ 請先填入 Web App URL 或 CSV 連結'); toggle.checked = false; return; }
    const mins = parseInt(intervalSel?.value || '5');
    startAutoRefresh(url || gasUrl, mins);
    updateAutoRefreshStatus(true);
    showToast(`✅ 已啟動自動更新（每 ${mins} 分鐘）`);
  };

  toggle.addEventListener('change', () => {
    if (toggle.checked) tryStart();
    else { stopAutoRefresh(); updateAutoRefreshStatus(false); showToast('⏹ 已停止自動更新'); }
  });
  intervalSel?.addEventListener('change', () => {
    if (toggle.checked) tryStart();
  });

  updateAutoRefreshStatus(false);
}

// Cache info badge
function renderCacheBadge() {
  const el = document.getElementById('cacheBadge');
  if (!el) return;
  const info = getCacheInfo();
  if (info) {
    const age = Math.round((Date.now() - info.ts) / 60000);
    el.textContent = `📦 快取：${info.count} 間 · ${age} 分鐘前`;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}


// ═══════════════════════════════════════════════════════════════
//  STEP 7 — U2: Mobile bottom nav, U3: Fullscreen map,
//            U4: Print stylesheet support, U5: Share card
// ═══════════════════════════════════════════════════════════════

// U3: Fullscreen map toggle
function initFullscreenMap() {
  const btn = document.getElementById('fullscreenMapBtn');
  const mapPanel = document.querySelector('.map-panel');
  const layout = document.querySelector('.layout');
  if (!btn || !mapPanel) return;
  btn.addEventListener('click', () => {
    const isFs = mapPanel.classList.toggle('map-fullscreen');
    btn.textContent = isFs ? '⊠ 縮細地圖' : '⛶ 全螢幕地圖';
    btn.setAttribute('aria-pressed', String(isFs));
    if (layout) layout.classList.toggle('map-only', isFs);
    setTimeout(() => map && map.invalidateSize(), 200);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mapPanel.classList.contains('map-fullscreen')) {
      mapPanel.classList.remove('map-fullscreen');
      if (layout) layout.classList.remove('map-only');
      btn.textContent = '⛶ 全螢幕地圖';
      btn.setAttribute('aria-pressed', 'false');
      setTimeout(() => map && map.invalidateSize(), 200);
    }
  });
}

// U5: Share card — generate a shareable text snippet + copy to clipboard
function openShareCard(realIdx) {
  const item = currentData[realIdx];
  if (!item) return;
  const loc = [item.country, item.city, item.district].filter(Boolean).join(' · ');
  const gm = mapsUrl(item);
  const lines = [
    `🍽 ${item.name}`,
    loc ? `📍 ${loc}` : null,
    item.cuisine ? `料理：${item.cuisine}` : null,
    item.my_rating ? `⭐ 評分：${item.my_rating}` : null,
    item.would_revisit ? `再去：${item.would_revisit}` : null,
    item.visit_date ? `日期：${item.visit_date}` : null,
    item.price_per_head ? `人均：${item.price_per_head}` : null,
    item.notes ? `💬 ${item.notes}` : null,
    gm !== '#' ? `🗺 ${gm}` : null,
  ].filter(Boolean);
  const text = lines.join('\n');
  const modal = document.getElementById('shareModal');
  const textarea = document.getElementById('shareText');
  if (!modal || !textarea) return;
  textarea.value = text;
  modal.classList.add('open');
}
window.openShareCard = openShareCard;

function initShareCard() {
  const modal = document.getElementById('shareModal');
  if (!modal) return;
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  document.getElementById('closeShareModal')?.addEventListener('click', () => modal.classList.remove('open'));
  document.getElementById('copyShareBtn')?.addEventListener('click', () => {
    const text = document.getElementById('shareText')?.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showToast('✅ 已複製到剪貼簿')).catch(() => {
      document.getElementById('shareText').select();
      document.execCommand('copy');
      showToast('✅ 已複製到剪貼簿');
    });
  });
}

// U2: Mobile bottom nav
function initMobileNav() {
  const nav = document.getElementById('mobileNav');
  if (!nav) return;
  nav.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      nav.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (target === 'list') {
        document.querySelector('.sidebar').style.display = '';
        document.querySelector('.map-panel').style.display = 'none';
        document.querySelector('.stats-overlay')?.classList.remove('open');
      } else if (target === 'map') {
        document.querySelector('.sidebar').style.display = 'none';
        document.querySelector('.map-panel').style.display = '';
        document.querySelector('.stats-overlay')?.classList.remove('open');
        setTimeout(() => map && map.invalidateSize(), 200);
      } else if (target === 'stats') {
        openStatsPage();
        nav.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else if (target === 'add') {
        resetFormToAddMode();
        setFormMode('full');
        document.getElementById('addModal').classList.add('open');
      }
    });
  });
}

// Show share btn in each card — patch buildCard to append share button
// We override window.openEditForm to add share btn via card-footer-actions in buildCard
// Instead: add share btn in buildCard directly (Step 7 patch)
const _buildCardOriginal = window._buildCardStep7Patched;


// S4: Spending stats per city
function renderS4() {
  const cityMap = {};
  currentData.forEach(item => {
    if (!item.price_per_head || !item.city) return;
    const raw = item.price_per_head.replace(/[^0-9.]/g,'');
    const num = parseFloat(raw);
    if (!Number.isFinite(num) || num <= 0) return;
    const currency = item.price_per_head.replace(/[0-9.,\s]/g,'').trim() || '';
    const key = item.city + '|' + item.country;
    if (!cityMap[key]) cityMap[key] = { city:item.city, country:item.country, currency, vals:[] };
    cityMap[key].vals.push(num);
  });
  const rows = Object.values(cityMap)
    .map(d => ({ ...d, avg: d.vals.reduce((a,b)=>a+b,0)/d.vals.length, count: d.vals.length }))
    .sort((a,b) => b.avg - a.avg);
  if (!rows.length) return `<div class="stats-section-title">💰 各城市平均人均消費</div><div class="empty">尚無消費資料（需填寫人均消費欄）</div>`;
  const maxAvg = Math.max(...rows.map(r=>r.avg),1);
  const tableRows = rows.map(r => `
    <tr>
      <td><strong>${esc(r.city)}</strong></td>
      <td style="color:var(--color-text-muted);font-size:var(--text-xs)">${esc(r.country)}</td>
      <td>
        <div class="country-bar-wrap">
          <div class="country-bar-bg"><div class="country-bar-fill" style="width:${(r.avg/maxAvg*100).toFixed(1)}%;background:var(--color-warning)"></div></div>
          <span class="country-bar-count" style="color:var(--color-warning)">${r.currency}${Math.round(r.avg).toLocaleString()}</span>
        </div>
      </td>
      <td style="color:var(--color-text-muted);font-size:var(--text-xs)">${r.count} 間</td>
    </tr>`).join('');
  return `
    <div class="stats-section-title">💰 各城市平均人均消費</div>
    <div style="font-size:var(--text-xs);color:var(--color-text-muted)">只計算已填寫「人均消費」欄的餐廳（數字部分）</div>
    <div class="data-table-scroll">
      <table class="country-stat-table">
        <thead><tr><th>城市</th><th>國家</th><th>平均人均</th><th></th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
}

// S5: Timeline view
function renderS5() {
  const dated = currentData
    .filter(i => i.visit_date && i.status === 'visited')
    .sort((a,b) => new Date(b.visit_date) - new Date(a.visit_date));
  if (!dated.length) return `<div class="stats-section-title">🗓 旅行時間軸</div><div class="empty">尚無已填日期的到訪記錄</div>`;

  // Group by year-month
  const grouped = {};
  dated.forEach(item => {
    const d = item.visit_date.slice(0,7); // YYYY-MM
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(item);
  });

  const blocks = Object.entries(grouped)
    .sort((a,b) => b[0].localeCompare(a[0]))
    .map(([month, items]) => {
      const [y,m] = month.split('-');
      const label = `${y}年${parseInt(m)}月`;
      const cards = items.map(item => {
        const loc = [item.country, item.city].filter(Boolean).join(' · ');
        const gm = mapsUrl(item);
        return `<div class="timeline-card">
          <div class="timeline-name">${esc(item.name)}</div>
          <div class="timeline-meta">
            ${loc?`<span>${esc(loc)}</span>`:''}
            ${item.cuisine?`<span>${esc(item.cuisine)}</span>`:''}
            ${item.my_rating?`<span>⭐ ${esc(item.my_rating)}</span>`:''}
            ${item.would_revisit?`<span>${esc(item.would_revisit)}</span>`:''}
            ${gm!=='#'?`<a class="link-btn" href="${esc(gm)}" target="_blank" rel="noopener noreferrer" style="font-size:var(--text-xs)">🗺</a>`:''}
          </div>
          ${item.notes?`<div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:4px;font-style:italic">${esc(item.notes)}</div>`:''}
        </div>`;
      }).join('');
      return `<div class="timeline-month">
        <div class="timeline-month-label">${esc(label)} <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${items.length} 間</span></div>
        <div class="timeline-cards">${cards}</div>
      </div>`;
    }).join('');

  return `<div class="stats-section-title">🗓 旅行時間軸</div>
    <div style="font-size:var(--text-xs);color:var(--color-text-muted)">按到訪日期排列，共 ${dated.length} 間已食餐廳</div>
    <div class="timeline-wrap">${blocks}</div>`;
}

// S6: Cuisine pie chart (text/bar based, no external lib)
function renderS6() {
  const cuisineMap = {};
  currentData.forEach(item => {
    const c = item.cuisine || '未分類';
    cuisineMap[c] = (cuisineMap[c]||0) + 1;
  });
  const total = currentData.length || 1;
  const sorted = Object.entries(cuisineMap).sort((a,b)=>b[1]-a[1]);
  const maxCount = sorted[0]?.[1] || 1;
  // Color palette
  const colors = ['#3b82f6','#f59e0b','#22c55e','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'];
  const bars = sorted.map(([cuisine, count], i) => {
    const pct = (count/total*100).toFixed(1);
    const color = colors[i % colors.length];
    return `<div class="cuisine-row">
      <div class="cuisine-label">${esc(cuisine)}</div>
      <div class="cuisine-bar-wrap">
        <div class="cuisine-bar-bg">
          <div class="cuisine-bar-fill" style="width:${(count/maxCount*100).toFixed(1)}%;background:${color}"></div>
        </div>
        <span class="cuisine-bar-pct">${pct}%</span>
        <span class="cuisine-bar-count">${count} 間</span>
      </div>
    </div>`;
  }).join('');
  return `
    <div class="stats-section-title">🍽 料理類型分佈</div>
    <div style="font-size:var(--text-xs);color:var(--color-text-muted)">共 ${sorted.length} 種料理類型，${total} 間餐廳</div>
    <div class="cuisine-chart">${bars}</div>`;
}


// ══════════════════════════════════════════════════════════════════
// PHASE B — Supabase Cloud Notes + File Storage + Debug Log
// ══════════════════════════════════════════════════════════════════

const SB_URL = 'https://wcarivophwqdwhuvjhyc.supabase.co';
const SB_KEY = 'sb_publishable_f_WD2hyHalbA89L9XLVHBA_RL_WF1n-';
const SB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY,
  'Prefer': 'return=representation'
};

// ── Supabase REST helpers ────────────────────────────────────────
async function sbGet(table, params) {
  const q = params ? '?' + new URLSearchParams(params) : '';
  const res = await fetch(`${SB_URL}/rest/v1/${table}${q}`, {
    headers: { ...SB_HEADERS, 'Prefer': 'return=representation' }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbInsert(table, row) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: SB_HEADERS,
    body: JSON.stringify(row)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbDelete(table, id) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: SB_HEADERS
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── File upload to Supabase Storage ─────────────────────────────
async function uploadFileToStorage(file) {
  const ext = file.name.split('.').pop();
  const path = `notes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(`${SB_URL}/storage/v1/object/rmm-files/${path}`, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: file
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Storage upload failed: ' + err);
  }
  const publicUrl = `${SB_URL}/storage/v1/object/public/rmm-files/${path}`;
  return { name: file.name, type: file.type, size: file.size, url: publicUrl };
}

// ── Notes CRUD via Supabase ──────────────────────────────────────
function getRestaurantKey(item) {
  return (item.name + '|' + item.country + '|' + item.city).toLowerCase().trim();
}

async function loadNotesFromCloud(item) {
  try {
    const key = getRestaurantKey(item);
    const rows = await sbGet('notes', { restaurant_key: 'eq.' + key, order: 'ts.asc' });
    return rows.map(r => ({
      id: r.id,
      ts: r.ts,
      text: r.text || '',
      files: r.files || []
    }));
  } catch(e) {
    appLog('error', 'loadNotesFromCloud: ' + e.message);
    // Fallback to localStorage
    return loadNotesLocal(item);
  }
}

async function addNoteToCloud(item, text, fileObjects) {
  const key = getRestaurantKey(item);
  // fileObjects: array of {name, type, size, url} from uploadFileToStorage
  return sbInsert('notes', {
    restaurant_key: key,
    ts: new Date().toISOString(),
    text: text.trim(),
    files: fileObjects || []
  });
}

async function deleteNoteFromCloud(noteId) {
  return sbDelete('notes', noteId);
}

// ── localStorage fallback ────────────────────────────────────────
const NOTES_KEY = 'rmm_notes_v1';
function loadNotesLocal(item) {
  try {
    const map = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    return map[getRestaurantKey(item)] || [];
  } catch(e) { return []; }
}

// ── File helpers ─────────────────────────────────────────────────
function fmtTs(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-HK',{month:'short',day:'numeric'}) + ' ' +
         d.toLocaleTimeString('zh-HK',{hour:'2-digit',minute:'2-digit'});
}

function buildNoteBubble(note) {
  const filesHtml = (note.files||[]).map(f => {
    const isImg = f.type && f.type.startsWith('image/');
    const src = f.url || f.dataUrl || '';
    if (isImg && src)
      return `<div class="note-file-img" onclick="window.openLightbox('${src}')"><img src="${src}" alt="${esc(f.name)}" loading="lazy"></div>`;
    if (src)
      return `<a class="note-file-link" href="${src}" download="${esc(f.name)}" target="_blank">📎 ${esc(f.name)} <span class="note-file-size">${(f.size/1024).toFixed(1)}KB</span></a>`;
    return '';
  }).join('');
  return `<div class="note-bubble" data-note-id="${esc(String(note.id))}">
    <div class="note-bubble-body">
      ${note.text ? `<p class="note-text">${esc(note.text).replace(/\n/g,'<br>')}</p>` : ''}
      ${filesHtml ? `<div class="note-files">${filesHtml}</div>` : ''}
    </div>
    <div class="note-bubble-footer">
      <span class="note-ts">${fmtTs(note.ts)}</span>
      <button class="note-del-btn" onclick="window._deleteNoteUI('${esc(String(note.id))}')" aria-label="刪除">🗑</button>
    </div>
  </div>`;
}

// ── Notes Panel UI ───────────────────────────────────────────────
function openNotesPanel(realIdx) {
  const item = currentData[realIdx];
  if (!item) return;
  const panel    = document.getElementById('notesPanel');
  const title    = document.getElementById('notesPanelTitle');
  const feed     = document.getElementById('notesFeed');
  const input    = document.getElementById('notesInput');
  const fileInput= document.getElementById('notesFileInput');
  const preview  = document.getElementById('notesFilePreview');
  panel._realIdx = realIdx;
  title.textContent = item.name || '筆記';
  input.value = '';
  if (fileInput) fileInput.value = '';
  if (preview) preview.innerHTML = '';

  async function renderFeed() {
    feed.innerHTML = '<div class="notes-empty">⏳ 載入中…</div>';
    try {
      const notes = await loadNotesFromCloud(currentData[panel._realIdx]);
      feed.innerHTML = notes.length
        ? notes.map(buildNoteBubble).join('')
        : '<div class="notes-empty">暫無筆記，在下方輸入你的想法 💬</div>';
      feed.scrollTop = feed.scrollHeight;
    } catch(e) {
      feed.innerHTML = '<div class="notes-empty" style="color:var(--color-error)">⚠️ 載入失敗：' + esc(e.message) + '</div>';
    }
  }
  renderFeed();
  panel._renderFeed = renderFeed;

  window._deleteNoteUI = async function(noteId) {
    if (!confirm('刪除這條筆記？')) return;
    try {
      await deleteNoteFromCloud(noteId);
      renderFeed();
      showToast('🗑 已刪除');
    } catch(e) {
      appLog('error','deleteNote: ' + e.message);
      showToast('⚠️ 刪除失敗');
    }
  };
  panel.classList.add('open');
  setTimeout(() => input.focus(), 100);
}

function closeNotesPanel() {
  document.getElementById('notesPanel').classList.remove('open');
}

async function submitNote() {
  const panel    = document.getElementById('notesPanel');
  const input    = document.getElementById('notesInput');
  const fileInput= document.getElementById('notesFileInput');
  const preview  = document.getElementById('notesFilePreview');
  const text  = input.value.trim();
  const files = fileInput && fileInput.files.length ? Array.from(fileInput.files) : [];
  if (!text && !files.length) return;
  const item = currentData[panel._realIdx];
  if (!item) return;

  const sendBtn = document.getElementById('notesSendBtn');
  sendBtn.disabled = true;
  sendBtn.textContent = '⏳ 上傳中…';
  try {
    // Upload files first
    const uploadedFiles = [];
    for (const file of files) {
      appLog('info', 'Uploading: ' + file.name);
      const result = await uploadFileToStorage(file);
      uploadedFiles.push(result);
    }
    await addNoteToCloud(item, text, uploadedFiles);
    input.value = '';
    if (fileInput) fileInput.value = '';
    if (preview) preview.innerHTML = '';
    await panel._renderFeed();
    showToast('✅ 筆記已儲存到雲端');
  } catch(e) {
    appLog('error','submitNote: ' + e.message);
    showToast('⚠️ 失敗：' + e.message);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = '發送 ➤';
  }
}

function initNotesPanel() {
  const panel = document.getElementById('notesPanel');
  if (!panel) return;
  document.getElementById('closeNotesPanel').addEventListener('click', closeNotesPanel);
  document.getElementById('notesSendBtn').addEventListener('click', submitNote);
  document.getElementById('notesInput').addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key==='Enter') submitNote();
  });
  const fileInput = document.getElementById('notesFileInput');
  const preview   = document.getElementById('notesFilePreview');
  document.getElementById('notesAttachBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    preview.innerHTML = '';
    Array.from(fileInput.files).forEach(f => {
      if (f.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'attach-thumb';
        img.src = URL.createObjectURL(f);
        img.title = f.name;
        preview.appendChild(img);
      } else {
        const chip = document.createElement('span');
        chip.className = 'attach-file-chip';
        chip.textContent = '📎 ' + f.name;
        preview.appendChild(chip);
      }
    });
  });
  panel.addEventListener('click', e => { if (e.target===panel) closeNotesPanel(); });
}

window.openNotesPanel = openNotesPanel;
window._openNotesByName = function(name, country, city) {
  const idx = currentData.findIndex(i => i.name===name && i.country===country && i.city===city);
  if (idx > -1) openNotesPanel(idx);
};

// ── All Files Page (from Supabase) ───────────────────────────────
async function openAllFilesPage() {
  const overlay = document.getElementById('allFilesOverlay');
  if (!overlay) return;
  const body = document.getElementById('allFilesBody');
  body.innerHTML = '<div class="notes-empty" style="padding:3rem">⏳ 載入所有檔案…</div>';
  overlay.classList.add('open');
  try {
    const rows = await sbGet('notes', { order: 'ts.desc' });
    const allFiles = [];
    rows.forEach(r => {
      (r.files||[]).forEach(f => allFiles.push({...f, noteTs: r.ts, restaurantKey: r.restaurant_key}));
    });
    if (!allFiles.length) {
      body.innerHTML = '<div class="notes-empty" style="padding:3rem">暫無上傳的圖片或檔案</div>';
      return;
    }
    body.innerHTML = `<div class="all-files-grid">${allFiles.map(f => {
      const isImg = f.type && f.type.startsWith('image/');
      const src = f.url || '';
      return `<div class="all-file-card">
        ${isImg && src ? `<div class="all-file-thumb" onclick="window.openLightbox('${src}')"><img src="${src}" alt="${esc(f.name)}" loading="lazy"></div>`
                       : `<div class="all-file-icon">📎</div>`}
        <div class="all-file-name">${esc(f.name)}</div>
        <div class="all-file-meta">${fmtTs(f.noteTs)} · ${(f.size/1024).toFixed(1)}KB</div>
        ${src ? `<a class="link-btn" style="font-size:var(--text-xs)" href="${src}" target="_blank" download="${esc(f.name)}">⬇️ 下載</a>` : ''}
      </div>`;
    }).join('')}</div>`;
  } catch(e) {
    appLog('error','openAllFilesPage: ' + e.message);
    body.innerHTML = `<div class="notes-empty" style="color:var(--color-error);padding:3rem">⚠️ 載入失敗：${esc(e.message)}</div>`;
  }
}

function initAllFilesPage() {
  const btn = document.getElementById('openAllFilesBtn');
  if (btn) btn.addEventListener('click', openAllFilesPage);
  const close = document.getElementById('closeAllFilesBtn');
  if (close) close.addEventListener('click', () => document.getElementById('allFilesOverlay').classList.remove('open'));
}

// ── Debug Log Panel ──────────────────────────────────────────────
const _logBuffer = [];
function appLog(level, ...args) {
  const msg = args.map(a => typeof a==='object' ? JSON.stringify(a) : String(a)).join(' ');
  _logBuffer.push({level, msg, ts: new Date().toISOString()});
  if (_logBuffer.length > 300) _logBuffer.shift();
  const el = document.getElementById('debugLogContent');
  const panel = document.getElementById('debugLogPanel');
  if (el && panel && panel.classList.contains('open')) _renderLog(el);
}
(function(){
  const oE = console.error.bind(console), oW = console.warn.bind(console);
  console.error = (...a) => { appLog('error',...a); oE(...a); };
  console.warn  = (...a) => { appLog('warn', ...a); oW(...a); };
  window.addEventListener('error', e => appLog('error', e.message+' @ '+e.filename+':'+e.lineno));
  window.addEventListener('unhandledrejection', e => appLog('error','Promise: '+String(e.reason)));
})();
function _renderLog(el) {
  const colors = {error:'var(--color-error)',warn:'var(--color-warning)',info:'var(--color-success)'};
  el.innerHTML = _logBuffer.slice().reverse().map(e =>
    `<div class="log-entry"><span class="log-ts">${e.ts.slice(11,19)}</span> <span class="log-level" style="color:${colors[e.level]||'var(--color-text-muted)'}">${e.level.toUpperCase()}</span> <span class="log-msg">${esc(e.msg)}</span></div>`
  ).join('');
}
function initDebugLog() {
  const toggleBtn = document.getElementById('debugLogToggle');
  const panel     = document.getElementById('debugLogPanel');
  const clearBtn  = document.getElementById('debugLogClear');
  const content   = document.getElementById('debugLogContent');
  if (!toggleBtn||!panel) return;
  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) _renderLog(content);
  });
  if (clearBtn) clearBtn.addEventListener('click', () => { _logBuffer.length=0; _renderLog(content); });
  appLog('info','🚀 App loaded — Supabase Phase B active');
}
window.appLog = appLog;





window.addEventListener('DOMContentLoaded',async()=>{
  initTheme(); initLightbox(); initMap();
  bindEvents(); initRevisitFilter(); initRatingFilter(); initViewToggle(); initAddForm(); initStatsPage();
  initBulkImport(); initSheetUrlPersist(); initGasUrlPersist(); initAutoRefreshUI(); initSettingsModal();
  initFullscreenMap(); initShareCard(); initMobileNav();
  initNotesPanel(); initAllFilesPage(); initDebugLog();
  await initDataSource();
  refreshSelects(); refreshTagBar(); refreshCityBar(); render();
  renderCacheBadge(); renderConnectionStatus();
});

/* All steps complete. */
