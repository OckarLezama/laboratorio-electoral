/* Entrada del Laboratorio Político: lista de estados, ficha pública de cada estado y acceso con usuario y clave.
   Se muestra cuando no hay estado en la dirección (index.html) o cuando falta la clave del estado pedido.
   La ficha solo usa data/estados.json (totales públicos). Los datos por sección están cifrados en data/seguro/
   y se abren con la clave de cada usuario (ver pipeline/acceso.py). */

/* ---------- sesión y cifrado (también los usa el cargador del análisis) ---------- */
const LAB_SK = 'lab_sesion';
function LAB_SES() {
  for (const st of [sessionStorage, localStorage]) {
    try { const s = JSON.parse(st.getItem(LAB_SK) || 'null'), t = Date.now();
      if (s && s.la && (!s.exp || s.exp > t) && !(s.ia && t - s.la > s.ia * 6e4)) return s; /* sesiones sin registro de uso (versión anterior) piden entrar de nuevo */ if (s) st.removeItem(LAB_SK); } catch (e) {}
  }
  return null;
}
/* cierre automático: cada uso de la plataforma renueva la sesión; sin uso por ia minutos (o al pasar exp) se cierra,
   se borran las llaves y la página se recarga para soltar los datos de la memoria */
function LAB_VIGILA() {
  const st = () => { for (const x of [sessionStorage, localStorage]) { try { if (x.getItem(LAB_SK)) return x; } catch (e) {} } return null; };
  let ult = 0;
  const uso = () => { const t = Date.now(); if (t - ult < 2e4) return; ult = t; const x = st(); if (!x) return; try { const s = JSON.parse(x.getItem(LAB_SK)); if (s && LAB_SES()) { s.la = t; x.setItem(LAB_SK, JSON.stringify(s)); } } catch (e) {} };
  const fin = () => { LAB_SALIR(); const d = document.createElement('div'); d.className = 'lab-fin';
    d.innerHTML = '<div><b>Tu sesión se cerró</b><p>Por seguridad, se cierra sola después de un tiempo sin usar la plataforma.</p><button>Entrar de nuevo</button></div>';
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(20,32,31,.55);backdrop-filter:blur(6px);font-size:15px;line-height:1.5';
    d.firstChild.style.cssText = 'background:#fff;border-radius:16px;padding:26px 28px;max-width:360px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25)';
    d.querySelector('button').style.cssText = 'margin-top:12px;border:0;border-radius:10px;background:#1C7F79;color:#fff;font-weight:600;font-size:14px;font-family:inherit;padding:10px 18px;cursor:pointer';
    d.querySelector('button').onclick = () => { location.hash = ''; location.reload(); };
    document.body.innerHTML = ''; document.body.appendChild(d); clearInterval(iv); };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, uso, { passive: true }));
  const iv = setInterval(() => { if (!LAB_SES()) fin(); }, 3e4);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !LAB_SES()) fin(); });
}
function LAB_PUEDE(cab) { const s = LAB_SES(); return !!(s && s.k && s.k[cab]); }
function LAB_SALIR() { for (const st of [sessionStorage, localStorage]) { try { st.removeItem(LAB_SK); } catch (e) {} } }
const _b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const _hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
let _ACC = null;
async function _acceso() { if (_ACC) return _ACC; const r = await fetch('data/acceso.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('sin acceso.json'); return _ACC = await r.json(); }
async function LAB_ENTRAR(usuario, clave, recordar) {
  const A = await _acceso(), te = new TextEncoder();
  const u = usuario.trim().toLowerCase(), h = _hex(await crypto.subtle.digest('SHA-256', te.encode(A.sal + '|' + u)));
  const e = A.u[h]; if (!e) return { error: 'Usuario o clave incorrectos.' };
  if (e.vig && new Date(e.vig + 'T23:59:59') < new Date()) return { error: 'Tu acceso venció. Pide a tu administrador que lo renueve.' };
  const base = await crypto.subtle.importKey('raw', te.encode(clave), 'PBKDF2', false, ['deriveKey']);
  const kek = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: _b64(e.s), iterations: A.it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const k = {};
  try {
    for (const cab in e.k) { const b = _b64(e.k[cab]); k[cab] = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, kek, b.slice(12))))); }
  } catch (err) { return { error: 'Usuario o clave incorrectos.' }; }
  const C = A.ses || { inact: 30, max_h: 12, rec_d: 7 }, t = Date.now();
  const s = { u: usuario.trim(), n: e.n, a: e.a || [], k, exp: t + (recordar ? C.rec_d * 864e5 : C.max_h * 36e5), ia: e.ia || C.inact, la: t };
  try { (recordar ? localStorage : sessionStorage).setItem(LAB_SK, JSON.stringify(s)); } catch (err) {}
  return { ok: s };
}
/* descarga, descifra y descomprime los datos de un estado */
async function LAB_DATOS(cab, avance) {
  const s = LAB_SES(); if (!s || !s.k[cab]) throw new Error('sin clave');
  const r = await fetch('data/seguro/' + cab + '.bin', { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status);
  const tot = +r.headers.get('content-length') || 0; let u;
  if (r.body && r.body.getReader) { const rd = r.body.getReader(), ch = []; let got = 0; for (;;) { const x = await rd.read(); if (x.done) break; ch.push(x.value); got += x.value.length; avance && avance(got, tot); } u = new Uint8Array(got); let o = 0; ch.forEach(c => { u.set(c, o); o += c.length; }); }
  else u = new Uint8Array(await r.arrayBuffer());
  const key = await crypto.subtle.importKey('raw', _b64(s.k[cab]), 'AES-GCM', false, ['decrypt']);
  const gz = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(4, 16) }, key, u.slice(16));
  const txt = await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(txt);
}
/* niveles 3, 4 y 5: se recortan los datos a su distrito o municipio antes de abrir el análisis */
function LAB_RECORTE(D, s) {
  const col = { 3: 3, 4: 2, 5: 1 }[s.n]; if (!col || !s.a || !s.a.length) return D;
  const ok = new Set(s.a.map(Number)), S = D.S, N = S.length, I = [];
  for (let i = 0; i < N; i++) if (ok.has(+S[i][col])) I.push(i);
  if (!I.length) throw new Error('ámbito vacío');
  const f = o => { if (Array.isArray(o)) return o.length === N ? I.map(i => o[i]) : o; if (o && typeof o === 'object') { for (const k in o) o[k] = f(o[k]); } return o; };
  ['S', 'paths', 'DM'].forEach(k => D[k] = I.map(i => D[k][i])); for (const ek in D.E) D.E[ek].r = I.map(i => D.E[ek].r[i]); f(D.V);
  const keep = c => new Set(D.S.map(r => +r[c]));
  [['mun', 1], ['dl', 2], ['df', 3]].forEach(([g, c]) => { if (Array.isArray(D.geo[g])) { const k = keep(c); D.geo[g] = D.geo[g].filter(x => k.has(+x.id)); } });
  const km = keep(1); for (const m in D.meta.municipios) if (!km.has(+m)) delete D.meta.municipios[m];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  D.paths.forEach(p => { const n = (p || '').match(/-?\d+(\.\d+)?/g) || []; for (let j = 0; j + 1 < n.length; j += 2) { const x = +n[j], y = +n[j + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } });
  if (x1 > x0) { const p = Math.max(x1 - x0, y1 - y0) * .04; D.vb = [x0 - p, y0 - p, x1 - x0 + 2 * p, y1 - y0 + 2 * p]; }
  const nom = { 3: 'Distrito federal', 4: 'Distrito local', 5: 'Municipio' }[s.n];
  const et = s.n === 5 ? s.a.map(m => (D.meta.municipios[m] || m)).join(', ') : (s.a.length > 1 ? { 3: 'Distritos federales', 4: 'Distritos locales' }[s.n] : nom) + ' ' + s.a.join(', ');
  D.meta.estado = D.meta.estado + ' · ' + et; D.meta.recorte = { n: s.n, a: s.a };
  window.SUBIDX = I; return D;
}

/* ---------- pantalla de entrada ---------- */
async function ENTRADA(pedido) {
  document.body.classList.add('entmode');
  const host = document.createElement('div'); host.id = 'ent'; document.body.appendChild(host);
  const R = host.attachShadow({ mode: 'open' });
  R.innerHTML = `<style>${ENT_CSS}</style><div class="ent"><div class="wrap">
 <aside class="side" id="SD"><h1>Elige un estado</h1><p class="s">32 estados · resultados por sección 2015–2024</p>
  <div class="ses" id="SES" hidden></div>
  <label class="q"><svg viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.6"/><path d="M8 8l3 3"/></svg><input id="QI" placeholder="Buscar estado o municipio" autocomplete="off" aria-label="Buscar estado o municipio"><kbd>/</kbd></label>
  <div class="list" id="L" role="listbox"></div></aside>
 <main class="main" id="M"></main>
</div></div><div id="scrim"></div><div id="tip" role="tooltip"></div>
<div class="mo" id="MO" role="dialog" aria-modal="true" aria-labelledby="MT"><form class="acc" id="AF" autocomplete="on"><button type="button" class="cl" id="MC" aria-label="Cerrar">×</button>
 <h4 id="MT">Acceder al análisis</h4><p id="MS"></p>
 <label for="AU">Usuario</label><input type="text" id="AU" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required>
 <label for="AP">Clave</label><input type="password" id="AP" name="password" autocomplete="current-password" required>
 <label class="ck"><input type="checkbox" id="AR">Recordar en este dispositivo</label>
 <div class="err" id="AE" aria-live="polite"></div>
 <button class="btn" id="AB" type="submit">Entrar</button><div class="hl">¿No tienes clave? Pídela a tu administrador.</div></form></div>`;
  const $ = id => R.getElementById(id);
  const EST = AVAIL.filter(x => x.ent), byC = {}, byE = {}; EST.forEach(x => { byC[x.cab] = x; byE[x.ent] = x; });
  let MX = { w: 1000, h: 624, st: [] }; try { MX = await (await fetch('data/inicio/mx32.json')).json(); } catch (e) {}
  const PC = { MORENA: '#A9455E', PAN: '#3F72B5', PRI: '#2F8F64', MC: '#E9813F', PVEM: '#7FB24E', PT: '#CF4B42', PRD: '#E5B533' }, pc = p => PC[p] || '#9AA5A5', pn = p => ({ MORENA: 'Morena', PVEM: 'Verde' }[p] || p);
  const fmt = n => n == null ? '—' : n >= 1e6 ? (n / 1e6).toFixed(2) + ' M' : Math.round(n).toLocaleString('es-MX');
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nz = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let cur = pedido && byC[pedido] ? pedido : null; if (!cur) { try { cur = localStorage.getItem('lab_ultimo'); } catch (e) {} } if (!byC[cur]) cur = null;
  let q = '', curMun = null, MUNS = null, munsCargando = false;
  const cargaMuns = () => { if (MUNS || munsCargando) return; munsCargando = true; fetch('data/municipios.json').then(r => r.json()).then(j => { MUNS = j; if (q) lista(); }).catch(() => {}); };
  const HOY = new Date(), tip = $('tip'), scrim = $('scrim');
  const showTip = (h, e) => { tip.innerHTML = h; tip.classList.add('on'); const w = tip.offsetWidth; let x = e.clientX + 14; if (x + w > innerWidth - 8) x = e.clientX - w - 14; tip.style.left = Math.max(8, x) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; };
  function qg(lbl, o, extra) {
    const e = Object.entries(o || {}).sort((a, b) => b[1] - a[1]), t = e.reduce((s, x) => s + x[1], 0);
    if (!t) return `<div><small>${lbl}</small><em><i class="x">sin dato</i></em></div>`;
    const top = e.slice(0, 2), rest = e.slice(2);
    return `<div data-tip="${encodeURIComponent(`<b>${lbl}: ${t}</b>` + e.map(([p, v]) => `${pn(p)}: ${v}`).join('<br>') + (extra || '') + '<span class="tnote">Si ganó una coalición, se cuenta al partido que la encabeza.</span>')}"><small>${lbl} · ${t}</small><u>${e.map(([p, v]) => `<b style="flex:${v};background:${pc(p)}"></b>`).join('')}</u><em>${top.map(([p, v]) => `<i><span class="dot" style="background:${pc(p)}"></span>${pn(p)} ${v}</i>`).join('')}${rest.map(([p, v]) => `<i class="x">${pn(p)} ${v}</i>`).join('')}</em></div>`;
  }
  function cal() {
    const S = +new Date('2026-09-10'), E = +new Date('2027-08-31'), x = d => Math.max(0, Math.min(100, (+new Date(d) - S) / (E - S) * 100)).toFixed(2) + '%', w = (a, b) => ((+new Date(b) - +new Date(a)) / (E - S) * 100).toFixed(2) + '%';
    const J = new Date('2027-06-06T12:00'); if (HOY > new Date('2027-06-07T00:00')) return `<p class="src">Fuente: INE. Lista nominal al 8 de octubre de 2026; resultados electorales por sección 2015–2024. <a class="pan" href="inicio.html">Panorama nacional</a></p>`;
    const hoyP = x(HOY), fal = Math.ceil((J - HOY) / 864e5), hs = HOY.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    const M = ['sep', 'oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago'];
    const F = [['2027-01-04', 'Precampañas, desde enero'], ['2027-02-12', 'Precampañas, hasta el 12 de febrero'], ['2027-04-03', 'Campañas, desde el 3 de abril'], ['2027-06-02', 'Campañas, hasta el 2 de junio'], ['2027-06-06', 'Jornada electoral, 6 de junio']], nx = F.find(f => new Date(f[0]) > HOY);
    return `<div class="foot"><div class="fh"><h3>Rumbo a la elección del 6 de junio de 2027</h3><span class="cd">Faltan <b>${fal}</b> días</span></div><div class="nx" style="display:none">${nx ? 'Siguiente etapa: ' + nx[1] : ''}</div>
 <div class="tlw"><div class="tr" style="--w:${hoyP}"><div class="base"></div><div class="done"></div>
  <div class="ph" style="left:${x('2027-01-04')};width:${w('2027-01-04', '2027-02-12')}"></div><div class="ph c" style="left:${x('2027-04-03')};width:${w('2027-04-03', '2027-06-02')}"></div>
  <div class="pl" style="left:0;transform:none"><b>Inicio</b> 10 sep</div><div class="pl" style="left:${x('2027-01-23')}"><b>Precampañas</b> ene – 12 feb</div><div class="pl" style="left:${x('2027-05-03')}"><b>Campañas</b> 3 abr – 2 jun</div><div class="pl" style="left:${x('2027-08-15')};transform:translateX(-80%)"><b>Plurinominales</b> ago</div>
  ${M.map((m, i) => { const p = (i + .5) / 12 * 100; return Math.abs(p - parseFloat(hoyP)) < 5 ? '' : `<div class="tk" style="left:${p.toFixed(1)}%">${m}</div>`; }).join('')}
  <div class="jd" style="left:${x('2027-06-06')}"></div><div class="jl" style="left:${x('2027-06-06')}">Jornada · 6 jun</div>
  <div class="hoy"><i></i><span>Hoy · ${hs}</span></div></div></div>
<p class="src">Fuente: INE. Lista nominal al 8 de octubre de 2026; resultados electorales por sección 2015–2024. <a class="pan" href="inicio.html">Panorama nacional</a></p></div>`;
  }
  function lista() {
    const qq = nz(q); let h = '';
    const est = EST.filter(x => !qq || nz(x.estado).includes(qq)).sort((a, b) => a.estado.localeCompare(b.estado, 'es'));
    h += est.map(x => `<div class="r${x.cab === cur ? ' on' : ''}" data-cab="${x.cab}" role="option" tabindex="0"><span class="n">${esc(x.estado)}</span><span class="v">${fmt(x.ln)}</span><span class="g">${x.gob ? `<i style="background:${pc(x.gob.l)}"></i>Gobierna ${pn(x.gob.l)}` : ''}${x.c27 && x.c27.g ? ' · gubernatura 2027' : ''}</span></div>`).join('');
    if (qq.length >= 3) {
      cargaMuns();
      const mu = [];
      if (MUNS) EST.forEach(x => Object.entries(MUNS[x.cab] || {}).forEach(([id, m]) => { if (nz(m.n).includes(qq)) mu.push([id, m, x]); }));
      mu.sort((a, b) => b[1].ln - a[1].ln);
      if (mu.length) h += `<div class="lh">Municipios</div>` + mu.slice(0, 12).map(([id, m, x]) => `<div class="r mu" data-cab="${x.cab}" data-mid="${id}" role="option" tabindex="0"><span class="n">${esc(m.n)}</span><span class="v">${fmt(m.ln)}</span><span class="g">${esc(x.estado)}</span></div>`).join('');
      else if (!MUNS) h += `<p class="nores">Buscando municipios…</p>`;
    }
    $('L').innerHTML = h || `<p class="nores">Ningún estado ni municipio coincide con “${esc(q)}”.</p>`;
    $('SD').classList.toggle('qon', !!q);
  }
  function sesion() {
    const s = LAB_SES(), b = $('SES');
    if (!s) { b.hidden = true; return; }
    const n = Object.keys(s.k).length; b.hidden = false;
    b.innerHTML = `<span>Sesión: <b>${esc(s.u)}</b>${s.n === 1 ? ' · todos los estados' : n === 1 ? ' · ' + esc((byC[Object.keys(s.k)[0]] || {}).estado || '') : ''}</span><button id="SX">Salir</button>`;
    $('SX').onclick = () => { LAB_SALIR(); sesion(); };
  }
  function munFicha(s, al) {
    if (!curMun || curMun.cab !== s.cab || !MUNS || !MUNS[s.cab] || !MUNS[s.cab][curMun.m]) return '';
    const m = MUNS[s.cab][curMun.m], w = m.w;
    return `<div class="mf"><div class="mfin"><div class="mfh"><div><small>${al ? 'Alcaldía' : 'Municipio'} de ${esc(s.estado)}</small><b>${esc(m.n)}</b></div><button class="mx" aria-label="Quitar ${esc(m.n)}">Ver todo el estado ×</button></div>
  <div class="mfk"><div><b>${w ? `<i class="dot" style="background:${pc(w[0])}"></i>${pn(w[0])}` : '—'}</b><span>Gobierna</span><em>${w ? `ganó en ${w[1]}${w[2] != null ? ' por ' + w[2] + ' pts' : ''}` : 'sin votación por partidos'}</em></div>
  <div><b>${fmt(m.ln)}</b><span>Lista nominal</span><em>${(100 * m.ln / s.ln).toFixed(1)}% del estado</em></div>
  <div><b>${m.p != null ? m.p.toFixed(1) + '%' : '—'}</b><span>Participación</span><em>promedio 2015–2024</em></div>
  <div data-tip="${encodeURIComponent(`<b>Dónde está el voto</b>${m.s70} de ${m.sec} secciones reúnen el 70% de la lista nominal de ${esc(m.n)}.`)}"><b>${m.sec.toLocaleString('es-MX')}</b><span>Secciones</span><em>${m.s70} (${Math.round(100 * m.s70 / m.sec)}%) concentran el 70%</em></div>
  <div><b>${m.dl.join(', ')}</b><span>Distritos locales</span><em>federales ${m.df.join(', ')}</em></div></div></div></div>`;
  }
  function vacia() {
    $('M').innerHTML = `<div class="hd"><div><div class="eyebrow">Ficha del estado</div><h2>Elige un estado</h2><span class="hint">Toca un estado en el mapa o en la lista para ver su ficha y entrar al análisis.</span></div></div>
 <div class="bigmap"><svg viewBox="0 0 ${MX.w} ${MX.h}" role="img" aria-label="Mapa de México">${MX.st.map(p => byE[p.ent] ? `<path data-cab="${byE[p.ent].cab}" d="${p.d}"/>` : '').join('')}</svg></div>${cal()}`;
  }
  function ficha() {
    lista(); sesion();
    if (!cur) { vacia(); return; }
    const s = byC[cur], al = s.cab === 'cdmx', c27 = s.c27 || {}, Q = s.q || {}, D = s.dem || { h: 1, m: 0, g: [0, 0, 0, 0, 0, 0, 0] }, mj = 100 * D.m / (D.h + D.m), [n70, nt] = s.v70 || [0, 0];
    const q2 = MX.st.find(p => p.ent === s.ent) || { x: 0, y: 0 }, T = D.h + D.m, L = ['18–24', '25–29', '30–39', '40–49', '50–59', '60–64', '65+'];
    const ay = Q.ayu ? qg(al ? 'Alcaldías' : 'Municipios', Q.ayu[1], Q.ayu[2] ? `<br><span class="tnote">${Q.ayu[2]} sin votación por partidos en ${Q.ayu[0]} (usos y costumbres o elección anulada).</span>` : '') : qg(al ? 'Alcaldías' : 'Municipios', null);
    const go = `<button class="go" aria-label="Acceder al análisis de ${esc(s.estado)}" data-lbl="Acceder al análisis"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h11"/><path d="M11 5.5 15.5 10 11 14.5"/></svg></button>`;
    $('M').innerHTML = `
 <div class="hd"><div><div class="eyebrow">Ficha del estado</div><h2>${esc(s.estado)}${go}</h2>
  <span class="gobl">${s.gob ? `<i style="background:${pc(s.gob.l)}"></i>Gobierna ${pn(s.gob.l)} desde ${s.gob.y}${s.gob.p ? `, ganó con ${s.gob.p}%` : ''}` : ''}</span>
  <div class="qgh">Quién gobierna hoy</div><div class="qg">${ay}${qg('Dip. locales', Q.dl && Q.dl[1])}${qg('Dip. federales', Q.df && Q.df[1])}${qg('Senado', Q.sen && Q.sen[1])}</div></div>
  <div class="loc"><svg viewBox="0 0 ${MX.w} ${MX.h}" role="img" aria-label="Ubicación de ${esc(s.estado)}">${MX.st.map(p => byE[p.ent] ? `<path data-cab="${byE[p.ent].cab}" class="${p.ent === s.ent ? 'on' : ''}" d="${p.d}"/>` : '').join('')}<g class="pulse"><circle class="c1" cx="${q2.x}" cy="${q2.y}" r="44"/><circle class="c2" cx="${q2.x}" cy="${q2.y}" r="44"/><circle class="c0" cx="${q2.x}" cy="${q2.y}" r="6"/></g></svg></div></div>
 ${munFicha(s, al)}
 <div class="body"><div class="kp">
  <div><b>${fmt(s.ln)}</b><span>Lista nominal</span></div>
  <div><b>${(s.sec || 0).toLocaleString('es-MX')}</b><span>Secciones</span></div>
  <div><b>${s.mun}</b><span>${al ? 'Alcaldías' : 'Municipios'}</span></div>
  <div><b>${s.ndl}</b><span>Distritos locales</span></div>
  <div><b>${s.ndf}</b><span>Distritos federales</span></div>
  <div class="tn" data-tip="${encodeURIComponent(`<b>Participación promedio</b>Promedio de las ${s.nel} elecciones del estado entre 2015 y 2024 (presidencia, senado, diputaciones, gubernatura y ayuntamientos).`)}"><b>${s.pavg != null ? s.pavg.toFixed(1) + '%' : '—'}</b><span>Participación</span><em>promedio 2015–2024</em></div>
  <div class="tn" data-tip="${encodeURIComponent(`<b>Dónde está el voto</b>${n70} de ${nt} ${al ? 'alcaldías' : 'municipios'} reúnen el 70% de la lista nominal. Concentrar el trabajo ahí cubre a 7 de cada 10 electores.`)}"><b>${n70} <small>de ${nt}</small></b><span>Dónde está el voto</span><em>${al ? 'alcaldías' : 'municipios'} reúnen el 70%</em></div>
  <div class="tn" data-tip="${encodeURIComponent(`<b>Lista nominal por sexo</b>Mujeres: ${fmt(D.m)}<br>Hombres: ${fmt(D.h)}`)}"><b>${mj.toFixed(1)}%</b><span>Mujeres</span><em>hombres ${(100 - mj).toFixed(1)}%</em></div>
  <div class="tn" data-tip="${encodeURIComponent('<b>Lista nominal por edad</b>' + D.g.map((v, i) => `${L[i]}: ${fmt(v)} (${(100 * v / T).toFixed(1)}%)`).join('<br>'))}"><b>${(100 * (D.g[0] + D.g[1]) / T).toFixed(1)}%</b><span>Jóvenes de 18 a 29</span><em>65 y más ${(100 * D.g[6] / T).toFixed(1)}%</em></div>
  <div class="tn" data-tip="${encodeURIComponent('<b>Nuevos electores desde 2024</b>Personas de 18 y 19 años en la lista nominal: tenían 16 o 17 años en la elección de 2024.')}"><b>${fmt(s.nv)}</b><span>Nuevos electores</span><em>18 y 19 años, ya en jóvenes</em></div>
 </div></div>
 <div class="bot">${(() => { const it = [[1, s.ndf, 'Diputaciones federales'], [c27.c, s.ndl, 'Diputaciones locales de mayoría'], [c27.a, c27.na || s.mun, al ? 'Alcaldías' : 'Ayuntamientos'], [c27.g, 1, 'Gubernatura']];
      return `<div class="e27"><h3>Qué se elige en 2027</h3><ul>${it.map(([on, n, t]) => `<li class="${on ? '' : 'no'}"><b>${n}</b><span>${on ? t.toLowerCase() : 'sin ' + t.toLowerCase()}</span></li>`).join('')}</ul></div>`; })()}
 ${cal()}</div><button class="btn btnm go2" style="display:none"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>Acceder al análisis</button>`;
  }
  /* acceso */
  let destino = null;
  const ir = cab => { try { localStorage.setItem('lab_ultimo_ok', cab); } catch (e) {} if (location.hash === '#' + cab) location.reload(); else location.hash = cab; };
  function abrirAcceso(cab) {
    destino = cab; const x = byC[cab];
    $('MS').textContent = 'Entra con tu usuario y clave.'; $('AE').textContent = ''; $('MO').classList.add('on');
    setTimeout(() => ($('AU').value ? $('AP') : $('AU')).focus(), 30);
  }
  function cerrarAcceso() { $('MO').classList.remove('on'); }
  /* estado al que entra el usuario: el elegido si lo tiene; si no, el último que consultó de los suyos o el primero */
  const destinoDe = (ses, cab) => { if (ses.k[cab]) return cab; const mio = Object.keys(ses.k).sort(); let u = null; try { u = localStorage.getItem('lab_ultimo_ok'); } catch (e) {} return mio.includes(u) ? u : mio[0]; };
  function acceder(cab) {
    try { if (curMun && curMun.cab === cab) sessionStorage.setItem('lab_mun', JSON.stringify(curMun)); else sessionStorage.removeItem('lab_mun'); } catch (e) {}
    const s = LAB_SES();
    if (s) { ir(destinoDe(s, cab)); return; }
    abrirAcceso(cab);
  }
  $('MC').onclick = cerrarAcceso; $('MO').addEventListener('click', e => { if (e.target === $('MO')) cerrarAcceso(); });
  $('AF').addEventListener('submit', async e => {
    e.preventDefault(); const b = $('AB'); b.disabled = true; b.textContent = 'Verificando…'; $('AE').textContent = '';
    try {
      const r = await LAB_ENTRAR($('AU').value, $('AP').value, $('AR').checked);
      if (r.error) { $('AE').textContent = r.error; $('AP').value = ''; $('AP').focus(); }
      else ir(destinoDe(r.ok, destino));
    } catch (err) { console.error(err); $('AE').textContent = 'No se pudo verificar. Revisa tu conexión e intenta de nuevo.'; }
    b.disabled = false; b.textContent = 'Entrar';
  });
  /* tocar y pasar el cursor */
  let pinned = false;
  const closeTip = () => { pinned = false; tip.classList.remove('on', 'pin'); scrim.classList.remove('on'); };
  scrim.addEventListener('click', closeTip);
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTip(); cerrarAcceso(); }
    if (e.key === '/' && !$('MO').classList.contains('on') && R.activeElement !== $('QI')) { e.preventDefault(); $('QI').focus(); }
  });
  const elegir = (cab, mid) => { if (!mid && cab === cur && !curMun) { cur = null; try { localStorage.removeItem('lab_ultimo'); } catch (e) {} closeTip(); ficha(); return; } curMun = mid ? { cab, m: mid } : null; cur = cab; try { localStorage.setItem('lab_ultimo', cur); } catch (e) {} closeTip(); q = ''; $('QI').value = ''; ficha(); };
  R.addEventListener('click', e => {
    if (e.target.closest('#tip .x')) { closeTip(); return; }
    if (e.target.closest('.go,.go2')) { acceder(cur); return; }
    const d = e.target.closest('[data-tip]');
    if (d) { showTip(decodeURIComponent(d.dataset.tip) + '<button class="x" aria-label="Cerrar">×</button>', e); tip.classList.add('pin'); pinned = true; if (innerWidth <= 700) scrim.classList.add('on'); return; }
    if (pinned && !e.target.closest('#tip')) closeTip();
    if (e.target.closest('.mx')) { curMun = null; const f = R.querySelector('.mf'); if (f) { f.classList.add('out'); setTimeout(() => f.remove(), 320); } return; }
    const t = e.target.closest('[data-cab]'); if (t) elegir(t.dataset.cab, t.dataset.mid);
  });
  R.addEventListener('keydown', e => { if (e.key === 'Enter') { const t = e.target.closest && e.target.closest('.r[data-cab]'); if (t) elegir(t.dataset.cab); } });
  R.addEventListener('mousemove', e => {
    if (pinned) return; const t = e.target.closest('[data-tip],.loc path,.bigmap path'); if (!t) { tip.classList.remove('on'); return; }
    if (t.dataset.tip) showTip(decodeURIComponent(t.dataset.tip), e); else showTip(`<b>${esc(byC[t.dataset.cab].estado)}</b>Clic para ver su ficha`, e);
  });
  $('QI').addEventListener('input', e => { q = e.target.value.trim(); lista(); });
  $('QI').addEventListener('keydown', e => { if (e.key === 'Enter') { const f = $('L').querySelector('.r[data-cab]'); if (f) elegir(f.dataset.cab); } });
  ficha();
  if (pedido && byC[pedido]) acceder(pedido);
}
