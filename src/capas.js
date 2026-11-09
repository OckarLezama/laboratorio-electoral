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
  function capaPadron(D, porSec, corte) {
    const S = D.S, N = S.length, cart = S.map(x => x[0]), enMapa = new Map(cart.map((s, i) => [s, i]));
    const lastE = Object.keys(D.E).reduce((x, y) => (x === null || D.E[y].year > D.E[x].year ? y : x), null); // la primera de las más recientes, como el proceso original
    const lnPrev = i => { const r = D.E[lastE]?.r?.[i]; return r ? r[r.length - 1] || 0 : 0; };
    const pad = new Map(), nps = new Map();
    const PS = porSec instanceof Map ? porSec : new Map(Object.entries(porSec).map(([s, x]) => [+s, x]));
    for (const [s, x] of PS) pad.set(+s, x.v.slice());
    cart.forEach(c => nps.set(c, pad.has(c) ? (PS.get(c).n || 1) : 0));
    const gone = cart.filter(c => !pad.has(c)), nuevas = [...pad.keys()].filter(s => !enMapa.has(s)), acc = new Map();
    const cmd = c => { const r = S[enMapa.get(c)]; return [r[1], r[3]]; };
    nuevas.sort((a, b) => pad.get(b)[1] - pad.get(a)[1]);
    for (const x of nuevas) {
      const { m, df } = PS.get(x); let cand = gone.filter(c => { const [a, b] = cmd(c); return a === m && b === df; }), c;
      if (!cand.length) cand = gone.filter(c => cmd(c)[0] === m);
      if (cand.length) c = cand.reduce((best, y) => ((acc.get(y) || 0) / Math.max(1, lnPrev(enMapa.get(y)))) < ((acc.get(best) || 0) / Math.max(1, lnPrev(enMapa.get(best)))) ? y : best);
      else {
        cand = cart.filter(y => { const [a, b] = cmd(y); return a === m && b === df; }); if (!cand.length) cand = cart.filter(y => cmd(y)[0] === m); if (!cand.length) cand = cart;
        c = cand.reduce((best, y) => ((pad.get(y) || [0, 0])[1] > (pad.get(best) || [0, 0])[1] ? y : best));
      }
      const base = pad.get(c) || new Array(18).fill(0); pad.set(c, base.map((u, j) => u + pad.get(x)[j])); nps.set(c, nps.get(c) + (PS.get(x).n || 1)); acc.set(c, (acc.get(c) || 0) + pad.get(x)[1]);
    }
    const p = cart.map(c => pad.get(c) || new Array(18).fill(0)), n = cart.map(c => nps.get(c) || 0);
    // resumen para la revisión antes de aplicar
    const antes = S.reduce((a, r) => a + (r[5] || 0), 0), ahora = p.reduce((a, r) => a + r[1], 0);
    const cambios = cart.map((c, i) => ({ s: c, a: S[i][5] || 0, b: p[i][1] })).filter(x => x.a >= 50 && Math.abs(x.b - x.a) / x.a > .2).sort((x, y) => Math.abs(y.b - y.a) - Math.abs(x.b - x.a));
    const res = { antes, ahora, nuevas: nuevas.length, sinElectores: gone.length, cambiosGrandes: cambios.length, ejemplos: cambios.slice(0, 15).map(x => [x.s, x.a, x.b]) };
    return { tipo: 'padron', corte, s: cart, p, n, res };
  }

  /* Aplica las capas a los datos ya descifrados. Nunca lanza error: si una capa no cuadra, se omite y se avisa. */
  function aplicaCapas(D, capas) {
    const hechas = [];
    for (const c of capas || []) {
      try {
        if (c.tipo === 'padron' && c.datos?.s?.length) {
          const d = c.datos, pos = new Map(D.S.map((r, i) => [r[0], i])); let k = 0;
          d.s.forEach((s, j) => { const i = pos.get(s); if (i === undefined || !Array.isArray(d.p[j]) || d.p[j].length !== 18) return; D.S[i][5] = d.p[j][1]; if (D.S[i].length > 7) D.S[i][7] = d.n[j]; if (D.DM) D.DM[i] = d.p[j]; k++; });
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
  const api = { leePadron, capaPadron, aplicaCapas, ENT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.LabCapas = api;
})(typeof window !== 'undefined' ? window : globalThis);
