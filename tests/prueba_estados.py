"""Prueba automática de la plataforma.

Abre cada estado de data/ en un navegador sin ventana y recorre: todas las elecciones con
4 vistas de partido, los colores del mapa, la tabla en todas sus combinaciones, las ventanas
de resultados y evolución, y los filtros por distrito y municipio. Falla si aparece un error
de JavaScript o un texto roto (NaN, undefined, Infinity, null).

uso:   python tests/prueba_estados.py            (todos los estados)
       python tests/prueba_estados.py chis oax   (solo esos)
requisitos: pip install playwright  y  python -m playwright install chromium
"""
import asyncio
import functools
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path

from playwright.async_api import async_playwright

REPO = Path(__file__).resolve().parent.parent
ROTO = r"/.{0,50}(NaN|undefined|Infinity|\[object|\bnull\b).{0,40}/g"


def servidor():
    class Silencioso(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    h = functools.partial(Silencioso, directory=str(REPO))
    s = socketserver.TCPServer(('127.0.0.1', 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, s.server_address[1]


async def probar(b, url, cab):
    errs, prob = [], []
    pg = await b.new_page(viewport={'width': 1366, 'height': 860})
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    await pg.goto(f'{url}/index.html#{cab}')
    await pg.wait_for_function('window.LAB', timeout=60000)
    await pg.wait_for_timeout(800)

    async def ver(tag):
        if errs:
            prob.append((tag, 'error JS', errs[:])); errs.clear()
        m = await pg.evaluate(f"()=>{{const m=document.body.innerText.match({ROTO}); return m?m.slice(0,3):[];}}")
        if m:
            prob.append((tag, 'texto roto', m))

    async def js(code, tag):
        try:
            await pg.evaluate(code)
        except Exception as e:  # noqa: BLE001
            prob.append((tag, 'excepción', str(e)[:200]))

    await js("document.getElementById('addb').click()", 'catálogo')
    cats = await pg.evaluate("[...document.querySelectorAll('[data-cat]')].map(b=>b.dataset.cat)")
    await js(f"LAB.st.cards={json.dumps(cats)}; LAB.st.cat=false; LAB.render(true)", 'tarjetas')
    await ver('todas las tarjetas')
    elecs = await pg.evaluate("[...document.getElementById('elec').options].map(o=>o.value)")
    for ek in elecs + ['']:
        for p in ['', 'MORENA', 'PAN', 'MC']:
            await js(f"LAB.setElec('{ek}'); const s=document.getElementById('party'); s.value='{p}'; s.onchange()", f'{ek}|{p}')
            await ver(f'elección {ek or "ninguna"} · partido {p or "general"}')
    await js(f"LAB.setElec('{elecs[-1]}')", 'elección')
    for mt in ['mar', 'win', 'par', 'vol', 'abs', 'nul', 'pv', 'pen', 'duro']:
        await js(f"LAB.st.metric='{mt}'; LAB.render(true)", mt); await ver('mapa ' + mt)
    # bases adicionales registradas: cada variable como color del mapa, filtro y columna de tabla
    xs = await pg.evaluate("Object.keys(LAB.XV||{})")
    for x in xs:
        await js(f"LAB.st.metric='x_{x}'; LAB.xEnsure('x_{x}',()=>LAB.render(true))", 'capa ' + x); await pg.wait_for_timeout(400); await ver('capa ' + x)
        await js(f"LAB.st.f['x_{x}']=['a']; LAB.render(true)", 'filtro ' + x); await ver('filtro ' + x)
        await js(f"LAB.st.f['x_{x}']=[]; LAB.render(true)", 'filtro ' + x)
    await js("const s=document.getElementById('party'); s.value='MORENA'; s.onchange(); LAB.st.metric=Object.keys(LAB.XV||{}).length?'x_'+Object.keys(LAB.XV)[0]:LAB.st.metric; LAB.setView2('tbl')", 'tabla')
    await pg.wait_for_timeout(2000)   # la tabla termina de abrirse antes de medir
    for tg in ['sec', 'mun', 'dl', 'df']:
        for tv in ['all', 'def', 'dis', 'rec', 'bas']:
            await js(f"LAB.st.tg='{tg}'; LAB.st.tv='{tv}'; LAB.renderTbl(LAB.scope())", f'tabla {tg} {tv}')
            await ver(f'tabla {tg} {tv}')
            await pg.wait_for_timeout(150)
            ancho = await pg.evaluate("(()=>{const t=document.querySelector('.tbl table'); return t?[t.offsetWidth,t.parentElement.clientWidth]:[0,0];})()")
            if ancho[0] > ancho[1] + 2:
                prob.append((f'tabla {tg} {tv}', 'tabla más ancha que su espacio', ancho))
    await js("LAB.setView2('map')", 'mapa')
    # Estrategia: cada elección objetivo y cada nivel, para dos partidos
    for par in ['MORENA', 'PAN']:
        await js(f"const s=document.getElementById('party'); s.value='{par}'; s.onchange(); LAB.setView2('est')", 'estrategia')
        await pg.wait_for_timeout(300)
        objs = await pg.evaluate("[...document.querySelectorAll('[data-eobj]')].map(b=>b.dataset.eobj)")
        for o in objs:
            await js(f"document.querySelector('[data-eobj=\"{o}\"]').click()", f'est {par} {o}'); await pg.wait_for_timeout(250)
            await ver(f'estrategia {par} {o}')
            lvs = await pg.evaluate("[...document.querySelectorAll('[data-elv]')].map(b=>b.dataset.elv)")
            for lv in lvs:
                await js(f"document.querySelector('[data-elv=\"{lv}\"]').click()", f'est {par} {o} {lv}'); await pg.wait_for_timeout(200)
                await js("const b=document.querySelector('.es-ul button[data-eu]:not([data-eu=\"\"])'); if(b) b.click()", f'est unidad {o} {lv}'); await pg.wait_for_timeout(250)
                await ver(f'estrategia {par} {o} {lv}')
            for sc in ['s1', 's2', 's3']:
                await js(f"const b=document.querySelector('[data-esc=\"{sc}\"]'); if(b) b.click()", f'escenario {sc}'); await pg.wait_for_timeout(150)
            await js("const b=document.querySelector('[data-eal]'); if(b) b.click()", 'alianza'); await pg.wait_for_timeout(150)
            await js("document.getElementById('etab').click(); const u=document.querySelector('[data-etab=\"uni\"]'); if(u) u.click()", 'tabla estrategia'); await pg.wait_for_timeout(250)
            n = await pg.evaluate("document.querySelectorAll('#estm tbody tr').length")
            if not n: prob.append(f'tabla de estrategia vacía {par} {o}')
            await js("document.getElementById('estx').click()", 'cerrar tabla')
            await js("document.querySelector('[data-ecol=\"win\"]').click()", 'ganador'); await js("document.querySelector('[data-ecol=\"seg\"]').click()", 'tipo')
        await js("document.getElementById('eback').click()", 'volver')
        if await pg.evaluate("LAB.st.view") != 'map': prob.append('Volver no regresa al mapa')
    await js("LAB.st.party=''; document.getElementById('party').value=''; LAB.setView2('est')", 'panorama'); await pg.wait_for_timeout(300); await ver('estrategia panorama')
    await js("document.getElementById('etab').click()", 'tabla panorama'); await pg.wait_for_timeout(250)
    if not await pg.evaluate("document.querySelectorAll('#estm tbody tr').length"): prob.append('tabla panorama vacía')
    await js("document.getElementById('estx').click(); LAB.setView2('map')", 'mapa')
    await js("document.querySelector('[data-res]').click()", 'resultados'); await pg.wait_for_timeout(500); await ver('ventana resultados')
    await js("LAB.closeRes()", 'cerrar')
    await js("document.querySelector('[data-big]').click()", 'evolución'); await pg.wait_for_timeout(500); await ver('ventana evolución')
    await js("LAB.closeBig()", 'cerrar')
    for sc in [("df", "1"), ("dl", "1")]:
        await js(f"LAB.applyScope('{sc[0]}','{sc[1]}')", str(sc)); await pg.wait_for_timeout(300); await ver(f'filtro {sc}')
        await js("LAB.applyScope('all','0')", 'todo')
    await js("LAB.setTerr('1')", 'municipio'); await pg.wait_for_timeout(300); await ver('municipio 1')
    await pg.close()
    return prob


async def main(sel):
    estados = json.loads((REPO / 'data' / 'estados.json').read_text(encoding='utf-8'))
    cabs = [e['cab'] for e in estados if not sel or e['cab'] in sel]
    s, port = servidor(); url = f'http://127.0.0.1:{port}'; fallas = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for cab in cabs:
            prob = await probar(b, url, cab); fallas += len(prob)
            print(f'{"OK   " if not prob else "FALLA"} {cab}' + ('' if not prob else f'  ({len(prob)} problemas)'))
            for x in prob[:15]:
                print('      ', x)
        await b.close()
    s.shutdown()
    print('Sin problemas.' if not fallas else f'{fallas} problemas en total.')
    sys.exit(1 if fallas else 0)


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1:]))
