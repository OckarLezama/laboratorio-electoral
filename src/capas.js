/* Capas del Laboratorio: datos que llegan después de los datos base (lista nominal, y luego encuestas, secciones
   nuevas, metas…). Los datos base nunca se modifican: cada capa se guarda aparte y se aplica al abrir.
   El mismo archivo lo usan la Plataforma Electoral y el Laboratorio Electoral, para que ambos calculen igual.
   Si una capa trae algo que no se puede aplicar, se ignora y se sigue con los datos base. */
(function (raiz) {
  'use strict';
  const num = v => { const n = Number(String(v ?? '').replace(/,/g, '').trim()); return Number.isFinite(n) ? Math.round(n) : 0; };
  const limpia = c => String(c ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
  // grupos de edad que usa el Laboratorio (iguales al proceso original)
  const GRUPOS = [['18', '19', '20_24'], ['25_29'], ['30_34', '35_39'], ['40_44', '45_49'], ['50_54', '55_59'], ['60_64'], ['65_Y_MAS']];

  /* Lee el archivo de padrón y lista nominal por sección del INE (DERFE, por edad y sexo).
     filas: arreglo de arreglos (la primera fila con "SECCION" es el encabezado; lo anterior se ignora).
     Devuelve { estados: { <clave entidad>: Map(<sección> → { v:[18], m, df, n }) }, avisos:[...] } */
  function leePadron(filas) {
    const avisos = []; let h = null, k = 0;
    for (; k < filas.length; k++) { const f = (filas[k] || []).map(limpia); if (f.includes('SECCION') && f.includes('LISTA NOMINAL')) { h = f; break; } }
    if (!h) return { estados: {}, avisos: ['No se encontró el encabezado del INE (columnas SECCION y LISTA NOMINAL). ¿Es el archivo de padrón y lista nominal por sección, edad y sexo?'], error: true };
    const col = n => h.indexOf(n), cE = col('CLAVE ENTIDAD'), cS = col('SECCION'), cM = col('CLAVE MUNICIPIO'), cD = col('CLAVE DISTRITO');
    const falta = ['CLAVE ENTIDAD', 'SECCION', 'PADRON ELECTORAL', 'LISTA NOMINAL', 'LISTA HOMBRES', 'LISTA MUJERES', 'LISTA_18_HOMBRES', 'LISTA_65_Y_MAS_MUJERES'].filter(n => col(n) < 0);
    if (falta.length) return { estados: {}, avisos: ['Faltan columnas del formato del INE: ' + falta.join(', ') + '.'], error: true };
    const cols = n => col(n);
    const iPad = cols('PADRON ELECTORAL'), iLn = cols('LISTA NOMINAL'), iLh = cols('LISTA HOMBRES'), iLm = cols('LISTA MUJERES');
    const iH = GRUPOS.map(G => G.map(a => cols(`LISTA_${a}_HOMBRES`)).filter(x => x >= 0)), iM = GRUPOS.map(G => G.map(a => cols(`LISTA_${a}_MUJERES`)).filter(x => x >= 0));
    const estados = {}; let malas = 0;
    for (let r = k + 1; r < filas.length; r++) {
      const f = filas[r]; if (!f || !f.length) continue;
      const e = num(f[cE]), s = num(f[cS]); if (!e || s <= 0) { if (f.some(x => String(x ?? '').trim())) malas++; continue; }
      const g = i => num(f[i]);
      const v = [g(iPad), g(iLn), g(iLh), g(iLm), ...iH.map(G => G.reduce((a, i) => a + g(i), 0)), ...iM.map(G => G.reduce((a, i) => a + g(i), 0))];
      const E = estados[e] || (estados[e] = new Map()), y = E.get(s); // Map: conserva el orden del archivo (el proceso original depende de él)
      if (y) { y.v = y.v.map((x, j) => x + v[j]); y.n++; } // misma sección repetida: se suma
      else E.set(s, { v, m: cM >= 0 ? num(f[cM]) : 0, df: cD >= 0 ? num(f[cD]) : 0, n: 1 });
    }
    if (malas > 200) avisos.push(`${malas} filas sin entidad o sin sección se ignoraron.`); // las notas y totales del INE al final del archivo son normales
    return { estados, avisos };
  }

  /* Convierte el padrón de un estado en la capa para los datos del Laboratorio de ese estado.
     Secciones nuevas del INE que todavía no están en el mapa se suman a la sección dada de baja de su mismo municipio
     y distrito (mismo criterio que el proceso original), para que el total cuadre exacto con el INE. */
  function capaPadron(D, porSec, corte, origen) {
    const S = D.S, N = S.length, cart = S.map(x => x[0]), enMapa = new Map(cart.map((s, i) => [s, i]));
    const lastE = Object.keys(D.E).reduce((x, y) => (x === null || D.E[y].year > D.E[x].year ? y : x), null); // la primera de las más recientes, como el proceso original
    const lnPrev = i => { const r = D.E[lastE]?.r?.[i]; return r ? r[r.length - 1] || 0 : 0; };
    const pad = new Map(), nps = new Map();
    const PS = porSec instanceof Map ? porSec : new Map(Object.entries(porSec).map(([s, x]) => [+s, x]));
    for (const [s, x] of PS) pad.set(+s, x.v.slice());
    cart.forEach(c => nps.set(c, pad.has(c) ? (PS.get(c).n || 1) : 0));
    const gone = cart.filter(c => !pad.has(c)), nuevas = [...pad.keys()].filter(s => !enMapa.has(s)), acc = new Map(), asig = new Map();
    const cmd = c => { const r = S[enMapa.get(c)]; return [r[1], r[3]]; };
    nuevas.sort((a, b) => pad.get(b)[1] - pad.get(a)[1]);
    for (const x of nuevas) {
      const { m, df } = PS.get(x); const o = origen && origen.get(x); let cand = gone.filter(c => { const [a, b] = cmd(c); return a === m && b === df; }), c;
      if (!cand.length) cand = gone.filter(c => cmd(c)[0] === m);
      if (o !== undefined && enMapa.has(o)) c = o; // el mapa del INE dice dentro de cuál sección quedó
      else if (cand.length) c = cand.reduce((best, y) => ((acc.get(y) || 0) / Math.max(1, lnPrev(enMapa.get(y)))) < ((acc.get(best) || 0) / Math.max(1, lnPrev(enMapa.get(best)))) ? y : best);
      else {
        cand = cart.filter(y => { const [a, b] = cmd(y); return a === m && b === df; }); if (!cand.length) cand = cart.filter(y => cmd(y)[0] === m); if (!cand.length) cand = cart;
        c = cand.reduce((best, y) => ((pad.get(y) || [0, 0])[1] > (pad.get(best) || [0, 0])[1] ? y : best));
      }
      const base = pad.get(c) || new Array(18).fill(0); pad.set(c, base.map((u, j) => u + pad.get(x)[j])); nps.set(c, nps.get(c) + (PS.get(x).n || 1)); acc.set(c, (acc.get(c) || 0) + pad.get(x)[1]); asig.set(x, c);
    }
    const p = cart.map(c => pad.get(c) || new Array(18).fill(0)), n = cart.map(c => nps.get(c) || 0);
    const x = nuevas.map(s => [s, asig.get(s), PS.get(s).n || 1, ...PS.get(s).v]); // nuevas: sección, a cuál se sumó, repeticiones, valores
    // resumen para la revisión antes de aplicar
    const antes = S.reduce((a, r) => a + (r[5] || 0), 0), ahora = p.reduce((a, r) => a + r[1], 0);
    const cambios = cart.map((c, i) => ({ s: c, a: S[i][5] || 0, b: p[i][1] })).filter(x => x.a >= 50 && Math.abs(x.b - x.a) / x.a > .2).sort((x, y) => Math.abs(y.b - y.a) - Math.abs(x.b - x.a));
    const res = { antes, ahora, nuevas: nuevas.length, sinElectores: gone.length, cambiosGrandes: cambios.length, ejemplos: cambios.slice(0, 15).map(x => [x.s, x.a, x.b]) };
    return { tipo: 'padron', corte, s: cart, p, n, x, res };
  }

  /* Cartografía del INE (SECCION del shapefile, ya en grados). Compara con el mapa base:
     - secciones que cambian de forma: nuevo trazo;
     - secciones nuevas: su trazo y la sección del mapa base en la que quedan (por ubicación);
     - secciones dadas de baja: se muestran con el trazo de las nuevas que las reemplazan.
     El análisis sigue por sección del mapa base (las nuevas no tienen historia propia). */
  function capaCarto(D, features, corte) {
    const G = D.meta.gps, pj = ([x, y]) => [(x - G.minx) * G.k * G.sc, (G.maxy - y) * G.sc], TOL = .125;
    const r2 = v => Math.round(v * 100) / 100;
    const dp = (pts, tol) => { // Douglas-Peucker
      if (pts.length < 5) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
      while (st.length) { const [a, b] = st.pop(); let mx = 0, k = -1; const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-12;
        for (let i = a + 1; i < b; i++) { const t = Math.max(0, Math.min(1, ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / L2)), ex = ax + t * dx - pts[i][0], ey = ay + t * dy - pts[i][1], d = ex * ex + ey * ey; if (d > mx) { mx = d; k = i; } }
        if (k > 0 && mx > tol * tol) { keep[k] = 1; st.push([a, k], [k, b]); } }
      return pts.filter((_, i) => keep[i]);
    };
    const area = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2; };
    const anillos = geom => (geom?.type === 'Polygon' ? [geom.coordinates] : geom?.type === 'MultiPolygon' ? geom.coordinates : []).map(p => p.map(r => r.map(pj)));
    const traza = polys => polys.flatMap(p => p.map((r, j) => { let q = dp(r.map(([x, y]) => [r2(x), r2(y)]), TOL); q = q.filter((v, i) => !i || v[0] !== q[i - 1][0] || v[1] !== q[i - 1][1]); if (q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop(); return q.length >= 3 && (j === 0 || Math.abs(area(q)) > .5) ? 'M' + q.map(v => v.join(',')).join(' ') + 'Z' : ''; })).join('');
    const deTrazo = p => (String(p || '').match(/M[^MZ]+Z/g) || []).map(r => r.slice(1, -1).trim().split(/\s+/).map(v => v.split(',').map(Number)));
    const caja = rs => { const b = [1e9, 1e9, -1e9, -1e9]; for (const r of rs) for (const [x, y] of r) { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; } return b; };
    const dentro = ([x, y], r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
    const punto = rs => { // un punto dentro de la sección: el centro de su anillo mayor, o la mitad de una línea que lo cruce
      const r = rs.reduce((a, b) => Math.abs(area(b)) > Math.abs(area(a)) ? b : a); const b = caja([r]); let c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; if (dentro(c, r)) return c;
      const y = c[1], xs = []; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y)) xs.push((xj - xi) * (y - yi) / (yj - yi) + xi); } xs.sort((a, b) => a - b); return xs.length >= 2 ? [(xs[0] + xs[1]) / 2, y] : r[0];
    };
    const pos = new Map(D.S.map((r, i) => [r[0], i])), vistas = new Set(), cambia = [], nuevas = [], avisos = [];
    const base = D.paths.map(p => { const rs = deTrazo(p); return { rs, b: caja(rs), a: rs.reduce((s, r) => s + Math.abs(area(r)), 0) }; });
    for (const f of features) {
      const pr = f.properties || {}, s = Number(pr.seccion ?? pr.SECCION), polys = anillos(f.geometry); if (!s || !polys.length) continue; vistas.add(s);
      const d = traza(polys); if (!d) continue;
      if (pos.has(s)) { // ¿cambió de forma?
        const i = pos.get(s), rs = deTrazo(d), b = caja(rs), a = rs.reduce((x, r) => x + Math.abs(area(r)), 0), B = base[i];
        const db = Math.max(...b.map((v, j) => Math.abs(v - B.b[j]))), da = Math.abs(a - B.a) / Math.max(a, B.a, 1e-9);
        if (db > 1 || (da > .1 && Math.max(a, B.a) > 2)) cambia.push([s, d]);
      } else nuevas.push({ s, d, polys, m: Number(pr.municipio ?? pr.MUNICIPIO) || 0, dl: Number(pr.distrito_l ?? pr.DISTRITO_L) || 0, df: Number(pr.distrito_f ?? pr.DISTRITO_F) || 0 });
    }
    const bajas = D.S.map(r => r[0]).filter(s => !vistas.has(s)), esBaja = new Set(bajas);
    const contiene = (pt, i) => { const B = base[i]; return pt[0] >= B.b[0] && pt[0] <= B.b[2] && pt[1] >= B.b[1] && pt[1] <= B.b[3] && B.rs.some(r => dentro(pt, r)); };
    const salida = nuevas.map(n => { const pt = punto(n.polys.map(p => p[0])); let o = null;
      for (const s of bajas) if (contiene(pt, pos.get(s))) { o = s; break; }
      if (o === null) for (let i = 0; i < base.length; i++) if (contiene(pt, i)) { o = D.S[i][0]; break; }
      return [n.s, o, n.d, n.m, n.dl, n.df]; });
    const sinOrigen = salida.filter(x => x[1] === null).map(x => x[0]);
    if (sinOrigen.length) avisos.push(`${sinOrigen.length} secciones nuevas quedan fuera del mapa actual (${sinOrigen.slice(0, 8).join(', ')}${sinOrigen.length > 8 ? '…' : ''}); se muestran en la lista pero no en el mapa.`);
    const bajasSinNueva = bajas.filter(s => !salida.some(x => x[1] === s));
    const res = { secciones: vistas.size, nuevas: salida.length, bajas: bajas.length, cambian: cambia.length, sinOrigen: sinOrigen.length, bajasSinNueva: bajasSinNueva.length, avisos };
    return { tipo: 'carto', corte, cambia, nuevas: salida, bajas, res };
  }

  /* Promedio de encuestas por cargo, igual que el Laboratorio Electoral (pipeline/escenarios.py):
     porcentajes por partido reescalados a 100; peso = muestra (hasta 3,000) / 1,000 × mitad cada 30 días;
     "Otros" no se usa (se reparte entre el resto al ajustar). Devuelve { <cargo>: {v, moe, n, ult, lista} }. */
  const PARTIDOS_ENC = ['MORENA', 'PAN', 'PRI', 'PVEM', 'PT', 'MC', 'OTROS'];
  function promedioEncuestas(lista, hoy) {
    const H = hoy ? new Date(hoy) : new Date(), grupos = {};
    // coaliciones ("MORENA+PT+PVEM"): si una encuesta del mismo cargo preguntó por coalición, las que preguntaron
    // por partido se suman a esa coalición para poder promediarlas juntas
    const norm = k => k.includes('+') ? k.split('+').sort().join('+') : k; // MORENA+PT+PVEM = PT+MORENA+PVEM
    lista = (lista || []).map(e => ({ ...e, v: Object.fromEntries(Object.entries(e.v || {}).map(([k, x]) => [norm(k), x])) }));
    const coal = {}; for (const e of lista || []) for (const k of Object.keys(e.v || {})) if (k.includes('+')) { const ps = k.split('+'); (coal[e.cargo] = coal[e.cargo] || []).some(g => g.join('+') === ps.join('+')) || coal[e.cargo].push(ps); }
    const valido = (o, k) => o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== '' && Number.isFinite(Number(o[k]));
    for (const e of lista || []) {
      const v = {}; for (const k of Object.keys(e.v || {})) if (k !== 'NS' && /^[A-Z0-9+]+$/.test(k) && valido(e.v, k)) v[k] = Number(e.v[k]);
      for (const ps of coal[e.cargo] || []) { const k = ps.join('+'); if (k in v || !ps.some(p => p in v)) continue; v[k] = ps.reduce((a, p) => a + (v[p] || 0), 0); ps.forEach(p => delete v[p]); }
      const s = Object.values(v).reduce((a, b) => a + b, 0); if (!s || !e.cargo || !e.fecha) continue;
      for (const p in v) v[p] = 100 * v[p] / s;
      const dias = Math.max(0, Math.floor((H - new Date(e.fecha + 'T12:00:00')) / 864e5)), m = Number(e.muestra) || 800;
      (grupos[e.cargo] = grupos[e.cargo] || []).push({ casa: e.casa || '', fecha: e.fecha, n: m, moe: Number(e.moe) || 3.5, v, w: Math.min(m, 3000) / 1000 * Math.pow(.5, dias / 30) });
    }
    const out = {};
    for (const [c, L] of Object.entries(grupos)) {
      const W = L.reduce((a, x) => a + x.w, 0) || 1, prom = {};
      for (const p of new Set(L.flatMap(x => Object.keys(x.v)))) prom[p] = Math.round(L.reduce((a, x) => a + x.w * (x.v[p] || 0), 0) / W * 10) / 10;
      delete prom.OTROS;
      out[c] = { v: prom, moe: Math.round(L.reduce((a, x) => a + x.w * x.moe, 0) / W * 10) / 10, n: L.length, ult: L.map(x => x.fecha).sort().pop(), lista: L.map(x => ({ casa: x.casa, fecha: x.fecha, n: x.n, moe: x.moe, peso: Math.round(100 * x.w / W) })) };
    }
    return out;
  }

  /* Aplica las capas a los datos ya descifrados. Nunca lanza error: si una capa no cuadra, se omite y se avisa. */
  function aplicaCapas(D, capas) {
    const hechas = [], orden = { carto: 0, padron: 1, encuestas: 2 }, pos = new Map(D.S.map((r, i) => [r[0], i])), origen = new Map();
    for (const c of [...(capas || [])].sort((a, b) => (orden[a.tipo] ?? 9) - (orden[b.tipo] ?? 9))) {
      try {
        if (c.tipo === 'carto' && (c.datos?.cambia || c.datos?.nuevas)) {
          const d = c.datos, P = D.paths.slice(); let k = 0; const porOrigen = new Map();
          for (const [s, tr] of d.cambia || []) { const i = pos.get(s); if (i !== undefined && typeof tr === 'string' && tr) { P[i] = tr; k++; } }
          for (const [s, o, tr] of d.nuevas || []) { if (o === null || !pos.has(o) || typeof tr !== 'string') continue; origen.set(s, o); if (!porOrigen.has(o)) porOrigen.set(o, []); porOrigen.get(o).push([s, tr]); }
          const baja = new Set(d.bajas || []);
          for (const [o, xs] of porOrigen) { const i = pos.get(o); P[i] = (baja.has(o) ? '' : P[i]) + xs.map(x => x[1]).join(''); k++; }
          D.paths = P; D.meta = D.meta || {}; D.meta.secNuevas = Object.fromEntries([...porOrigen].map(([o, xs]) => [o, xs.map(x => x[0])]));
          if (D.meta.fuentes) D.meta.fuentes.carto = 'INE, DERFE, Base Geográfica Digital, ' + (d.corte || c.corte || '');
          hechas.push({ tipo: 'carto', corte: d.corte || c.corte, secciones: k });
        }
        if (c.tipo === 'encuestas' && Array.isArray(c.datos?.lista) && c.datos.lista.length) { // reemplaza, por cargo, las encuestas que trae el archivo del Laboratorio
          const pr = promedioEncuestas(c.datos.lista); if (!Object.keys(pr).length) continue;
          D.meta = D.meta || {}; D.meta.esc = D.meta.esc || { al: {}, enc: {} }; D.meta.esc.enc = Object.assign({}, D.meta.esc.enc || {}, pr);
          hechas.push({ tipo: 'encuestas', cargos: Object.keys(pr), encuestas: c.datos.lista.length });
        }
        if (c.tipo === 'padron' && c.datos?.s?.length) {
          const d = c.datos; let k = 0, p = d.p, n = d.n;
          if (origen.size && Array.isArray(d.x)) { // reasignar las secciones nuevas a donde el mapa del INE dice que quedaron
            p = p.map(r => r.slice()); n = n.slice(); const idx = new Map(d.s.map((s, j) => [s, j]));
            for (const [s, a, nn, ...v] of d.x) { const o = origen.get(s); if (o === undefined || o === a || !idx.has(o) || !idx.has(a) || v.length !== 18) continue;
              const ja = idx.get(a), jo = idx.get(o); p[ja] = p[ja].map((u, j) => u - v[j]); p[jo] = p[jo].map((u, j) => u + v[j]); n[ja] -= nn; n[jo] += nn; }
          }
          d.s.forEach((s, j) => { const i = pos.get(s); if (i === undefined || !Array.isArray(p[j]) || p[j].length !== 18) return; D.S[i][5] = p[j][1]; if (D.S[i].length > 7) D.S[i][7] = n[j]; if (D.DM) D.DM[i] = p[j]; k++; });
          if (!k) continue;
          if (D.meta?.fuentes) D.meta.fuentes.pad = 'INE, DERFE, Padrón y Lista Nominal, corte ' + (d.corte || c.corte || '');
          hechas.push({ tipo: 'padron', corte: d.corte || c.corte, secciones: k });
        }
      } catch (e) { console.warn('capa omitida', c?.tipo, e); }
    }
    D.meta = D.meta || {}; D.meta.capas = hechas;
    return D;
  }

  // clave del INE de cada estado (la misma que usa el archivo del padrón)
  const ENT = { ags: 1, bc: 2, bcs: 3, camp: 4, coah: 5, col: 6, chis: 7, chih: 8, cdmx: 9, dgo: 10, gto: 11, gro: 12, hgo: 13, jal: 14, mex: 15, mich: 16, mor: 17, nay: 18, nl: 19, oax: 20, pue: 21, qro: 22, qroo: 23, slp: 24, sin: 25, son: 26, tab: 27, tam: 28, tlax: 29, ver: 30, yuc: 31, zac: 32 };
  const api = { leePadron, capaPadron, capaCarto, promedioEncuestas, aplicaCapas, ENT, PARTIDOS_ENC };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.LabCapas = api;
})(typeof window !== 'undefined' ? window : globalThis);
