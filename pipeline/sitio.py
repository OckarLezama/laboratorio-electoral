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

import shutil

from comun import PLANO, REPO
from ficha import ficha

SRC = REPO / 'src'


def sitio():
    # 1) lista de estados disponibles, a partir de los archivos que existan en data/
    av = []
    # los datos completos están en privado/ (sin cifrar, solo local); aquí solo salen totales públicos por estado
    for f in sorted(glob.glob(str(PLANO / '*.json'))):
        if os.path.basename(f) == 'claves.json':
            continue
        d = json.load(open(f, encoding='utf-8'))
        m = d['meta']
        x = {'cab': m['cab'], 'estado': m['estado'], 'ent': int(m['ent']),
             'info': f"{len(m['municipios'])} municipios · {sum(r[7] if len(r) > 7 else 1 for r in d['S']):,} secciones",
             'ln': sum(r[5] or 0 for r in d['S']), 'sec': sum(r[7] if len(r) > 7 else 1 for r in d['S']), 'mun': len(m['municipios'])}
        x.update(ficha(d))
        av.append(x)
    av.sort(key=lambda x: x['estado'])
    # contexto nacional ligero para la vista sin estado elegido (gobierno vigente y qué se elige en 2027)
    nac = REPO / 'data' / 'nacional.json'
    if nac.exists():
        ne = {e['clave']: e for e in json.load(open(nac, encoding='utf-8'))['est']}
        for x in av:
            e = ne.get(x['cab'])
            if e:
                x['gob'] = {k: e['gob'][k] for k in ('l', 'y', 'p') if k in e['gob']} if e.get('gob') else None
                x['c27'] = e['c27']
    (REPO / 'data' / 'estados.json').write_text(json.dumps(av, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

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
    # letras guardadas en el propio sitio (no dependen de Google Fonts: funcionan en redes que lo bloquean y en el PDF)
    (REPO / 'fonts').mkdir(exist_ok=True)
    caras = ''
    for f in sorted((SRC / 'fonts').glob('*.woff2')):
        shutil.copyfile(f, REPO / 'fonts' / f.name)
        fam, _, w = f.stem.split('-')[:3]
        caras += f"@font-face{{font-family:'{fam.capitalize()}';font-style:normal;font-weight:{w};font-display:swap;src:url(../fonts/{f.name}) format('woff2')}}\n"
    css = caras + (SRC / 'style.css').read_text(encoding='utf-8') + '\n' + (SRC / 'extra.css').read_text(encoding='utf-8')
    (REPO / 'css' / 'estilos.css').write_text(css, encoding='utf-8')

    # 3) código: módulos de src/ en orden numérico dentro de APP(DATA), más el cargador
    (REPO / 'js').mkdir(exist_ok=True)
    entrada = (SRC / 'entrada.js').read_text(encoding='utf-8')
    ent_css = json.dumps((SRC / 'entrada.css').read_text(encoding='utf-8'), ensure_ascii=False)
    mods = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(str(SRC / '[0-9]*.js'))))
    js = f"""/* Laboratorio Político · generado por pipeline/sitio.py desde src/. No editar aquí. */
let AVAIL=[],CAPAS=[],MODELO=null;
function APP(DATA){{
{mods}
}}
const ENT_CSS={ent_css};
{entrada}
(async()=>{{const msg=t=>{{const b=document.getElementById('bootm'); if(b) b.textContent=t;}};
  try{{const r0=await fetch('data/estados.json',{{cache:'no-cache'}}); AVAIL=await r0.json(); try{{const r1=await fetch('data/capas.json',{{cache:'no-cache'}}); if(r1.ok) CAPAS=await r1.json();}}catch(e){{}} try{{const r2=await fetch('data/modelo.json',{{cache:'no-cache'}}); if(r2.ok) MODELO=await r2.json();}}catch(e){{}}}}catch(e){{msg('No se pudo cargar la lista de estados.'); console.error(e); return;}}
  addEventListener('hashchange',()=>location.reload());
  const cab=(location.hash||'').slice(1),a=AVAIL.find(x=>x.cab===cab);
  const boot=()=>{{const b=document.getElementById('boot'); if(b) b.remove();}};
  if(!a){{boot(); ENTRADA(); return;}}
  if(!LAB_PUEDE(a.cab)){{boot(); ENTRADA(a.cab); return;}}
  try{{msg('Cargando '+a.estado+'…'); let DATA=await LAB_DATOS(a.cab,(got,tot)=>msg('Cargando '+a.estado+'… '+(got/1e6).toFixed(1)+' MB'+(tot&&tot>=got?' de '+(tot/1e6).toFixed(1)+' MB':'')));
    const ses=LAB_SES(); DATA=LAB_RECORTE(DATA,ses); APP(DATA); boot(); LAB_VIGILA();
    try{{const mm=JSON.parse(sessionStorage.getItem('lab_mun')||'null'); sessionStorage.removeItem('lab_mun'); if(mm&&mm.cab===a.cab&&DATA.meta.municipios[mm.m]&&window.LAB) setTimeout(()=>LAB.setTerr(String(mm.m)),300);}}catch(e){{}} try{{localStorage.setItem('lab_ultimo_ok',a.cab);}}catch(e){{}}
    const av=document.querySelector('.rail .av'); if(av){{av.textContent=(ses.u||'?').slice(0,1).toUpperCase(); av.title='Sesión: '+ses.u; av.setAttribute('role','button'); av.tabIndex=0; av.style.cursor='pointer';
      av.onclick=()=>{{let p=document.getElementById('sesp'); if(p){{p.remove(); return;}} p=document.createElement('div'); p.id='sesp'; p.className='epop sesp'; p.innerHTML='<div class="sesu">Sesión: <b></b></div><button id="sesx">Salir</button>'; p.querySelector('b').textContent=ses.u; document.body.appendChild(p); const r=av.getBoundingClientRect(); p.style.left=(r.right+10)+'px'; p.style.top=Math.max(8,r.bottom-p.offsetHeight)+'px'; document.getElementById('sesx').onclick=()=>{{LAB_SALIR(); location.hash='';}};}};}}
    const out=document.getElementById('rOut'); if(out){{out.querySelector('b').textContent='Cerrar sesión ('+ses.u+')'; out.onclick=()=>{{LAB_SALIR(); location.hash='';}};}}}}
  catch(e){{console.error(e); if(e&&e.name==='OperationError'){{LAB_SALIR(); boot(); ENTRADA(a.cab); return;}} msg('No se pudieron cargar los datos de '+a.estado+'. Revisa tu conexión y recarga la página.');}}}})();
"""
    (REPO / 'js' / 'app.js').write_text(js, encoding='utf-8')

    # 4) página
    body = (SRC / 'body.html').read_text(encoding='utf-8')
    html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
<title>Laboratorio Político</title>
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
    from municipios import generar as munis
    munis()
    from inicio import generar
    generar()
    (REPO / 'inicio.html').unlink(missing_ok=True)  # el Panorama nacional se quitó (oct 2026): Inicio lleva a la entrada
    print(f'[sitio] index.html, css/estilos.css, js/app.js y data/estados.json listos ({len(av)} estados: '
          + ', '.join(x['estado'] for x in av) + ')')
