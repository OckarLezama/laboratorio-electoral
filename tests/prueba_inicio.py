"""Prueba automática de la página de inicio (inicio.html).

Abre la vista nacional, recorre las capas del mapa, las elecciones federales, las circunscripciones
y el orden de la lista; entra a cada estado con datos, cambia de elección y de capa, abre las ventanas
ampliadas, prueba el zoom y regresa a México. Falla si aparece un error de JavaScript o un texto roto (NaN, undefined…).

uso:   python tests/prueba_inicio.py
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
    s = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Silencioso, directory=str(REPO)))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, s.server_address[1]


async def main():
    srv, port = servidor()
    cabs = [x['cab'] for x in json.loads((REPO / 'data' / 'estados.json').read_text(encoding='utf-8'))]
    errs, prob = [], []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1440, 'height': 860})
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        async def roto(donde):
            t = await pg.evaluate(f"(document.body.innerText.match({ROTO})||[]).slice(0,3)")
            if t:
                prob.append(f'{donde}: {t}')
        await pg.goto(f'http://127.0.0.1:{port}/inicio.html'); await pg.wait_for_timeout(2500)
        for m in ['p', 'w']:
            await pg.click(f'#lrow [data-m="{m}"]'); await pg.wait_for_timeout(250)
        await pg.click('#fi [data-act="27"]'); await pg.wait_for_timeout(400); await roto('2027 en el mapa')
        await pg.click('#m27x'); await pg.wait_for_timeout(300)
        for k in await pg.eval_on_selector_all('#elec option', 'o=>o.map(x=>x.value)'):
            await pg.select_option('#elec', k); await pg.wait_for_timeout(350); await roto(f'México {k}')
        for z in ['f', 'm', 'e']:
            await pg.click(f'#lrow [data-z="{z}"]'); await pg.wait_for_timeout(2500); await roto(f'capa {z}')
            if z != 'e':
                await pg.click('#rank .r >> nth=0'); await pg.wait_for_timeout(1500); await roto(f'zona {z}')
            elif await pg.evaluate("document.querySelectorAll('#gzn path').length"):
                prob.append('la capa Estados no borró distritos o municipios')
        caja = await pg.eval_on_selector('#map', 'e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}')
        await pg.mouse.move(*caja); await pg.mouse.wheel(0, -400); await pg.wait_for_timeout(500)
        await pg.mouse.down(); await pg.mouse.move(caja[0] - 80, caja[1] - 40, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(300)
        await pg.click('#zfit'); await pg.wait_for_timeout(900); await roto('zoom')
        for c in ['1', '2', '3', '4', '5', '0']:
            await pg.evaluate(f'INICIO.setCirc({c})'); await pg.wait_for_timeout(900); await roto(f'circunscripción {c}')
        for r in ['p', 'l', 'm']:
            await pg.click(f'#rkt [data-r="{r}"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-open="res"]'); await pg.wait_for_timeout(700); await roto('resultados ampliados'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.click('[data-open="tr"]'); await pg.wait_for_timeout(700); await roto('evolución ampliada'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        for cab in cabs:
            await pg.evaluate(f"INICIO.toState('{cab}')"); await pg.wait_for_timeout(3500)
            e = await pg.evaluate('INICIO.estado()')
            if e['nivel'] != 'st':
                prob.append(f'{cab}: no entró al estado'); continue
            for k in (await pg.eval_on_selector_all('#elec option', 'o=>o.map(x=>x.value)'))[:4]:
                await pg.select_option('#elec', k); await pg.wait_for_timeout(350); await roto(f'{cab} {k}')
            for l in ['d', 'f', 'm']:
                await pg.click(f'#lrow [data-l="{l}"]'); await pg.wait_for_timeout(500)
            await pg.click('#rank .r >> nth=0'); await pg.wait_for_timeout(1200); await roto(f'{cab} zona')
            await pg.click('[data-open="res"]'); await pg.wait_for_timeout(700); await roto(f'{cab} resultados ampliados'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
            await pg.click('#crumb button >> nth=0'); await pg.wait_for_timeout(3200)
            if (await pg.evaluate('INICIO.estado()'))['nivel'] != 'mx':
                prob.append(f'{cab}: no regresó a México')
            print(f'OK    {cab}' if not errs else f'ERROR {cab}: {errs[-1]}')
        await b.close()
    srv.shutdown()
    for x in errs + prob:
        print('  ', x)
    print('Sin problemas.' if not errs and not prob else 'Hay problemas.')
    sys.exit(1 if errs or prob else 0)


if __name__ == '__main__':
    asyncio.run(main())
