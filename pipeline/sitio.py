"""Paso 3. Arma el sitio publicable a partir del código fuente (src/) y de data/.

Genera en la raíz del repositorio:
  index.html, inicio.html, css/estilos.css, js/app.js, data/estados.json (lista de estados disponibles)
  y data/inicio/ (datos ligeros de la página de inicio).
No hay que editar esos archivos a mano: se editan los de src/ y se vuelve a correr este paso.

uso: python pipeline/lab.py sitio
"""
import glob
import json
import os

from comun import REPO

SRC = REPO / 'src'


def sitio():
    # 1) lista de estados disponibles, a partir de los archivos que existan en data/
    av = []
    for f in sorted(glob.glob(str(REPO / 'data' / '*.json'))):
        if os.path.basename(f) in ('estados.json', 'capas.json', 'nacional.json'):
            continue
        d = json.load(open(f, encoding='utf-8'))
        m = d['meta']
        av.append({'cab': m['cab'], 'estado': m['estado'],
                   'info': f"{len(m['municipios'])} municipios · {len(d['S']):,} secciones"})
    av.sort(key=lambda x: x['estado'])
    (REPO / 'data' / 'estados.json').write_text(json.dumps(av, ensure_ascii=False, indent=1), encoding='utf-8')

    # 1b) registro de bases adicionales para la plataforma (solo metadatos; los valores se cargan al usarse)
    reg = json.loads((REPO / 'pipeline' / 'capas.json').read_text(encoding='utf-8'))['bases']
    pub = []
    for b in reg:
        est = [x['cab'] for x in av if (REPO / 'data' / x['cab'] / 'capas' / f'{b["id"]}.json').exists()]
        if est:
            pub.append({'id': b['id'], 'nombre': b['nombre'], 'fuente': b['fuente'], 'nivel': b['nivel'], 'estados': est,
                        'variables': [{k: v[k] for k in ('id', 'nombre', 'descripcion', 'unidad', 'decimales', 'sentido') if k in v} for v in b['variables']]})
    (REPO / 'data' / 'capas.json').write_text(json.dumps(pub, ensure_ascii=False, indent=1), encoding='utf-8')

    # 2) estilos
    (REPO / 'css').mkdir(exist_ok=True)
    css = (SRC / 'style.css').read_text(encoding='utf-8') + '\n' + (SRC / 'extra.css').read_text(encoding='utf-8')
    (REPO / 'css' / 'estilos.css').write_text(css, encoding='utf-8')

    # 3) código: módulos de src/ en orden numérico dentro de APP(DATA), más el cargador
    (REPO / 'js').mkdir(exist_ok=True)
    mods = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(str(SRC / '[0-9]*.js'))))
    js = f"""/* Laboratorio Político · generado por pipeline/sitio.py desde src/. No editar aquí. */
let AVAIL=[],CAPAS=[];
function APP(DATA){{
{mods}
}}
(async()=>{{const msg=t=>{{const b=document.getElementById('bootm'); if(b) b.textContent=t;}};
  try{{const r0=await fetch('data/estados.json',{{cache:'no-cache'}}); AVAIL=await r0.json(); try{{const r1=await fetch('data/capas.json',{{cache:'no-cache'}}); if(r1.ok) CAPAS=await r1.json();}}catch(e){{}}}}catch(e){{msg('No se pudo cargar la lista de estados.'); console.error(e); return;}}
  const cab=(location.hash||'').slice(1),a=AVAIL.find(x=>x.cab===cab)||AVAIL[0];
  try{{const r=await fetch('data/'+a.cab+'.json'); if(!r.ok) throw new Error(r.status); let DATA; const tot=+r.headers.get('content-length')||0; if(r.body&&r.body.getReader){{const rd=r.body.getReader(),ch=[]; let got=0; for(;;){{const x=await rd.read(); if(x.done) break; ch.push(x.value); got+=x.value.length; msg('Cargando '+a.estado+'… '+(got/1e6).toFixed(1)+' MB'+(tot&&tot>=got?' de '+(tot/1e6).toFixed(1)+' MB':''));}} const u=new Uint8Array(got); let o=0; ch.forEach(c=>{{u.set(c,o); o+=c.length;}}); DATA=JSON.parse(new TextDecoder().decode(u));}} else DATA=await r.json(); APP(DATA); document.getElementById('boot').remove();}}
  catch(e){{msg('No se pudieron cargar los datos de '+a.estado+'. Recarga la página.'); console.error(e);}}}})();
"""
    (REPO / 'js' / 'app.js').write_text(js, encoding='utf-8')

    # 4) página
    body = (SRC / 'body.html').read_text(encoding='utf-8')
    html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Laboratorio Político</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap">
<link rel="stylesheet" href="css/estilos.css">
</head>
<body>
{body}
<div class="boot" id="boot"><div><b>Laboratorio Político</b><span id="bootm">Cargando datos del estado…</span></div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="js/app.js"></script>
</body>
</html>
"""
    (REPO / 'index.html').write_text(html, encoding='utf-8')

    # 5) página de inicio (vista nacional → estado) y sus datos ligeros
    from inicio import generar
    generar()
    (REPO / 'inicio.html').write_text((SRC / 'inicio.html').read_text(encoding='utf-8'), encoding='utf-8')
    print(f'[sitio] index.html, inicio.html, css/estilos.css, js/app.js y data/estados.json listos ({len(av)} estados: '
          + ', '.join(x['estado'] for x in av) + ')')
