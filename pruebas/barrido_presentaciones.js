/* Barrido nocturno de la presentación: genera la presentación de cada territorio de los 32 estados
   (estado completo, cada distrito federal, cada distrito local y cada municipio) y anota cualquier falla.
   No es parte del sitio: se pega en la página ya abierta y con sesión (navegador del panel de Claude).
   Avance y resultados en localStorage 'barrido_pres' (si la página se recarga, se vuelve a pegar y sigue donde iba).
   window.__BARRIDO_RES() devuelve el resumen; window.__BARRIDO_ALTO = true lo detiene. */
(function () {
  const K = 'barrido_pres', sl = t => new Promise(r => setTimeout(r, t));
  const load = () => { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } };
  const save = o => { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} };
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const lista = () => AVAIL.filter(x => x.ent).map(x => ({ cab: x.cab, est: x.estado, t: [['est', '', x.estado]]
    .concat((x.ids.df || []).map(n => ['df', 'distrito federal ' + n, 'Distrito federal ' + n]))
    .concat((x.ids.dl || []).map(n => ['dl', 'distrito local ' + n, 'Distrito local ' + n]))
    .concat((x.muns || []).map(m => ['mun', m, m])) }));
  async function go(q) {
    const qt = [...document.querySelectorAll('button,a')].find(x => /Quitar todo/.test(x.textContent)); if (qt) { qt.click(); await sl(400); }
    if (!q) return;
    const inp = document.querySelector('input[placeholder^="Ir a municipio"]'); inp.focus(); inp.value = q; inp.dispatchEvent(new Event('input', { bubbles: true })); await sl(600);
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await sl(1000);
  }
  async function deck() {
    const errs = [], oe = console.error; console.error = (...x) => { errs.push(String((x[0] && x[0].stack) || x[0]).slice(0, 160)); oe(...x); };
    const b = document.getElementById('presb'); if (!b) { console.error = oe; return { n: 0, errs: ['sin botón de presentación'] }; }
    b.click(); let d = null; for (let i = 0; i < 90 && !(d = document.getElementById('deck')); i++) await sl(400);
    console.error = oe; const ss = [...document.querySelectorAll('#deck section.sl')], txt = ss.map(s => s.innerText).join(' ');
    const t1 = ss[0] ? (ss[0].querySelector('h1') || {}).textContent : '';
    document.getElementById('dkx')?.click(); await sl(200);
    return { n: ss.length, errs, bad: /undefined|NaN|\[object|Infinity/.test(txt), t1 };
  }
  async function run() {
    let S = load(); if (!S || S.fin) { S = { i: 0, j: 0, ini: new Date().toISOString(), ok: 0, fallas: [], omitidos: [] }; save(S); }
    const L = lista();
    for (; S.i < L.length; S.i++, S.j = 0, save(S)) {
      const e = L[S.i]; let DATA;
      try { DATA = await LAB_DATOS(e.cab, () => {}); DATA = LAB_RECORTE(DATA, LAB_SES()); APP(DATA); await sl(1500); }
      catch (x) { S.fallas.push({ e: e.cab, t: '(abrir estado)', m: String(x).slice(0, 160) }); continue; }
      for (; S.j < e.t.length; S.j++) {
        if (window.__BARRIDO_ALTO) { save(S); return S; }
        const [k, q, nom] = e.t[S.j];
        try {
          await go(q); const r = await deck();
          if (!r.n || r.errs.length || r.bad) S.fallas.push({ e: e.cab, t: nom, n: r.n, errs: r.errs.slice(0, 3), bad: r.bad });
          else if (k !== 'est' && norm(r.t1) !== norm(nom)) S.omitidos.push({ e: e.cab, t: nom, salio: r.t1 }); /* el buscador eligió otro lugar */
          else S.ok++;
        } catch (x) { S.fallas.push({ e: e.cab, t: nom, m: String(x).slice(0, 160) }); }
        if (S.j % 5 === 0) save(S);
      }
    }
    S.fin = new Date().toISOString(); save(S); return S;
  }
  window.__BARRIDO_RES = () => { const S = load(); if (!S) return 'sin barrido'; const L = lista(), tot = L.reduce((a, e) => a + e.t.length, 0);
    return { inicio: S.ini, fin: S.fin || null, estado_actual: L[S.i] ? L[S.i].cab : null, hechos: S.ok + S.fallas.length + S.omitidos.length, total: tot, bien: S.ok, fallas: S.fallas.length, omitidos: S.omitidos.length, detalle_fallas: S.fallas.slice(0, 60), detalle_omitidos: S.omitidos.slice(0, 30) }; };
  if (!window.__BARRIDO_CORRE) { window.__BARRIDO_CORRE = true; run().finally(() => { window.__BARRIDO_CORRE = false; }); }
})();
