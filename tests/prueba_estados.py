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
    await js("const s=document.getElementById('party'); s.value='MORENA'; s.onchange(); LAB.setView2('tbl')", 'tabla')
    for tg in ['sec', 'mun', 'dl', 'df']:
        for tv in ['all', 'def', 'dis', 'rec', 'bas']:
            await js(f"LAB.st.tg='{tg}'; LAB.st.tv='{tv}'; LAB.renderTbl(LAB.scope())", f'tabla {tg} {tv}')
            await ver(f'tabla {tg} {tv}')
    await js("LAB.setView2('map')", 'mapa')
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
