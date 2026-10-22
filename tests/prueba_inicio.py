"""Prueba automática del Panorama nacional (inicio.html).

Recorre: capas del mapa y play; circunscripciones; cada estado (congreso, resultados, evolución,
composición); un municipio y un distrito de cada estado; ampliar mapa, resultados y evolución;
encabezado con buscador; zoom; tablet y celular. Falla si hay un error de JavaScript o un texto roto
(NaN, undefined, Infinity…).

uso:   python tests/prueba_inicio.py
"""
import asyncio
import functools
import http.server
import socketserver
import sys
import threading
from pathlib import Path

from playwright.async_api import async_playwright

REPO = Path(__file__).resolve().parent.parent
ROTO = r"/.{0,50}(NaN|undefined|Infinity|\[object).{0,40}/g"


def servidor():
    class Silencioso(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    s = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Silencioso, directory=str(REPO)))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, s.server_address[1]


async def roto(pg, donde, prob):
    t = await pg.evaluate(f"(document.body.innerText.match({ROTO})||[]).concat([...document.querySelectorAll('svg text')].map(x=>x.textContent).filter(x=>/NaN|undefined|Infinity/.test(x)))")
    if t:
        prob.append(f'{donde}: {t[:3]}')


async def main():
    srv, port = servidor()
    url = f'http://127.0.0.1:{port}/inicio.html'
    errs, prob = [], []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1440, 'height': 860})
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto(url); await pg.wait_for_selector('#boot', state='detached', timeout=30000); await pg.wait_for_timeout(800)
        await roto(pg, 'México', prob)
        for l in ['gob', 'dfp', 'pre', 'mun', 'comp']:
            await pg.click(f'#lens button[data-l={l}]'); await pg.wait_for_timeout(250); await roto(pg, f'capa {l}', prob)
        await pg.click('#play'); await pg.wait_for_timeout(2500); await pg.click('#play')
        await pg.click('#camSeg button[data-c=s]'); await pg.wait_for_timeout(300); await roto(pg, 'Senado', prob)
        for c in range(1, 6):
            await pg.click(f'#cir button[data-c="{c}"]'); await pg.wait_for_timeout(500); await roto(pg, f'circunscripción {c}', prob)
        for x in ['res', 'evo']:
            await pg.click(f'.xp[data-x={x}]'); await pg.wait_for_timeout(700); await roto(pg, f'ampliar {x}', prob)
            await pg.click('#rpl' if x == 'res' else '#bpl'); await pg.wait_for_timeout(1500)
            await pg.click(f'.xp[data-x={x}]'); await pg.wait_for_timeout(400)
        await pg.click('#mxp'); await pg.wait_for_timeout(600); await pg.click('#mxp'); await pg.wait_for_timeout(400)
        ents = await pg.evaluate("[...new Set([...document.querySelectorAll('#map path.st')].map(p=>+p.dataset.e))]")
        for e in ents:
            await pg.evaluate(f'setSel({e})'); await pg.wait_for_timeout(350); await roto(pg, f'estado {e}', prob)
            z = await pg.evaluate(f"[[...document.querySelectorAll('#mnz path')].map(p=>p.dataset.id).find(id=>+id.split('_')[0]==={e}),[...document.querySelectorAll('#dfz path')].map(p=>p.dataset.id).find(id=>+id.split('_')[0]==={e})]")
            if z[0]:
                await pg.evaluate(f"pickZone({{t:'m',id:'{z[0]}',n:'municipio'}})"); await pg.wait_for_timeout(350); await roto(pg, f'municipio {z[0]}', prob)
            if z[1]:
                await pg.evaluate(f"pickZone({{t:'f',id:'{z[1]}',n:'Distrito federal'}})"); await pg.wait_for_timeout(350); await roto(pg, f'distrito {z[1]}', prob)
        v0 = await pg.evaluate('PANO.vb.join()')
        await pg.evaluate('setSel(30)'); await pg.wait_for_timeout(900)
        await pg.evaluate("pickZone({t:'m',id:'30_193',n:'Veracruz'})"); await pg.wait_for_timeout(1300)
        if await pg.evaluate('PANO.vb.join()') == v0 or await pg.evaluate('PANO.vb[2]') > 120:
            prob.append('el mapa no se acerca al municipio elegido')
        await pg.close()
        for nombre, w, h in [('tablet', 820, 1180), ('celular', 390, 844)]:
            pg = await b.new_page(viewport={'width': w, 'height': h}, has_touch=True)
            pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.goto(url); await pg.wait_for_selector('#boot', state='detached', timeout=30000); await pg.wait_for_timeout(600)
            await pg.evaluate('setSel(4)'); await pg.wait_for_timeout(500)
            if nombre == 'celular':
                for t in ['evo', 'cam', 'ele', 'res']:
                    await pg.click(f'#mtabs button[data-t={t}]'); await pg.wait_for_timeout(300)
            await roto(pg, nombre, prob)
            ancho = await pg.evaluate('document.documentElement.scrollWidth')
            if ancho > w + 1:
                prob.append(f'{nombre}: la página se desborda a lo ancho ({ancho}px)')
            await pg.close()
        await b.close()
    srv.shutdown()
    for x in errs + prob:
        print('·', x)
    print('Sin problemas.' if not errs and not prob else f'{len(errs)} errores de JavaScript, {len(prob)} problemas.')
    sys.exit(1 if errs or prob else 0)


asyncio.run(main())
