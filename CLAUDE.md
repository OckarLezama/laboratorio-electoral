# Laboratorio Electoral — leer antes de tocar nada

Este repositorio es el **Laboratorio Electoral** de Ockar (`OckarLezama/laboratorio-electoral`), publicado en https://ockarlezama.github.io/laboratorio-electoral/.

Es el motor de análisis: resultados por sección desde 2015, proyección 2027 y estrategia, para los 32 estados.

## Los dos productos (no mezclarlos)

| Producto | Repositorio | Dirección |
|---|---|---|
| Laboratorio Electoral (este) | `OckarLezama/laboratorio-electoral` | ockarlezama.github.io/laboratorio-electoral |
| Plataforma Electoral | `OckarLezama/plataforma-electoral` | plataforma-electoral.benignolezama.workers.dev |

- La Plataforma usa los datos y el modelo de este Laboratorio en su módulo "Laboratorio", por cliente. No rehace el análisis.
- Atención Municipal es otro proyecto aparte. No se toca desde aquí.
- Si Ockar dice "En el Laboratorio Electoral: …", el cambio va **solo en este repo**.
- Si una petición es de otro producto, decirlo antes de tocar algo.

## Al empezar a trabajar: corroborar que es el proyecto correcto

Cuando Ockar diga "vamos a trabajar con el Laboratorio Electoral" (o con este proyecto), lo primero es enviarle una **captura de pantalla** de la página publicada (https://ockarlezama.github.io/laboratorio-electoral/) para que confirme que es el correcto. No se cambia nada hasta que confirme.

No rediseñar lo que ya funciona sin preguntarle primero.

## Cómo pasa un cambio de aquí a la Plataforma

Un cambio en el Laboratorio **no llega solo** a la Plataforma. Solo se pasa si Ockar dice "y pásalo a la Plataforma":

1. Correr el proceso de este repo (`pipeline/`: preparar → construir → proyeccion) para generar `privado/<estado>.json` con `meta.proy`.
2. En el repo de la Plataforma: `python herramientas/actualizar_laboratorio.py <carpeta privado> <llaves.json>`.
   - Cifra los datos con las llaves existentes.
   - Las llaves están en la tabla `lab_llaves` de Supabase.
3. Subir `public/lab/*.bin` y aumentar la versión (`?v=`) en la Plataforma.

## Capas (datos nuevos sin rehacer el proceso)

- La lista nominal nueva se sube en la Plataforma ("Datos del Laboratorio") y este sitio la aplica sola al abrir un estado (`src/capas.js`, igual a `public/lab-capas.js` de la Plataforma).
- Si se corre `pipeline/sitio.py` sin los datos privados, reescribe `data/*.json` vacíos: no subir esos cambios (`git checkout -- data/`).

## Reglas de este repo

- `index.html`, `css/estilos.css` y `js/app.js` se generan con `pipeline/sitio.py`. Se edita `src/`, no esos archivos.
- Los datos crudos del INE están en la computadora de Ockar (carpeta "Resultados INE"), no en el repo.
- Lenguaje siempre condicional: "Según la estimación…", "ganaría", "con posibilidades". Nunca "gana", "pierde" ni "asegura".
- Situaciones con los términos ya acordados:
  - Conservar: margen de 10 puntos o más.
  - Defender: de 0 a 10.
  - Disputar: de −10 a 0.
  - Contener: −10 o menos.
- Las metas no se definen aquí; van en la parte de campaña de la Plataforma.
- Recalibración por cargo (10-nov-2026, con permiso de Ockar): misma prueba contra el pasado (2021 y 2024 con datos anteriores, 32 estados), pero cada cargo puede usar su propia combinación si baja su error al menos 1 punto frente a la nacional (`meta.proy.at` / `swt`; la plataforma y el sitio usan `at[cargo] ?? a`). Resultado: Gubernatura pasa a 100 % el año más reciente (error en la diferencia 1.º–2.º de 20.1 a 16.5 puntos); los demás cargos se quedan con la nacional (25 % última del cargo, 75 % año reciente) porque ninguna otra los mejora. Se probó también "desinflar el arrastre presidencial" (mezclar el año presidencial con el de 3 años antes): no mejoró en ningún cargo, así que no se usa.
- Debilidad que sigue: subestima partidos locales fuertes y, en Gubernatura, el error medio es alto (~16 puntos): las encuestas lo corrigen. El sitio ya muestra la recalibración (data/seguro recifrado el 11-nov-2026 con las mismas llaves; acceso.json no cambió).
- Coaliciones por lugar (18-nov-2026): `data/bx/<estado>.json` (público, sin votos) dice cómo compitió cada municipio y distrito según las candidaturas registradas del INE; `LAB_DATOS` lo pega a `D.E[ek].bx` por número de sección y `totals()` lo usa cuando el territorio es un solo lugar (`BXL`). Se arma solo dentro del proceso: `pipeline/lugares.py` corre después de `construir` (y con `python pipeline/lab.py lugares <estado>`) y escribe también `data/bx/<estado>.json` (probado: idéntico a lo publicado en los 32 estados). El 18-nov `data/seguro/` se recifró con las mismas llaves (`claves.json`) con las mismas reparaciones de votos que la Plataforma (candidaturas comunes juntadas donde fueron separados y columnas repetidas del INE: 10,723 secciones en BCS, CDMX, DGO, HGO, MOR, OAX, PUE, SLP, SON y TLAX) y con `bx` adentro; `acceso.json` no cambió.
- Revisión completa del 18-nov-2026 (coaliciones por lugar en todo lo que calcula ganadores): `totals()` del sitio, `data/municipios.json` (quién gobierna en el buscador: 551 municipios corregidos), `data/nacional.json` (distritos federales ganados: ahora con el ganador de cada distrito según el archivo de candidaturas del INE `*_DISCAND`; 2015 y 2021 tenían coaliciones parciales) y la calibración del modelo (`modelo.py`/`proyeccion.py`: `bl_lugar` usa `E.bx` antes que `E.sx`). Se recalibró con los mismos parámetros (a = 25 %, por cargo GOB y PRE): solo cambian las cifras de validación (acierto en ayuntamientos ~59 % → ~53 %, más honesto) y `data/modelo.json` (sigma y calibración). `data/seguro/` recifrado con las mismas llaves.
- Responder en español, claro y sin tecnicismos.
- Coaliciones por lugar dentro del proceso (18-nov-2026): `pipeline/lugares.py` lee de la carpeta del INE el archivo por sección y el de candidaturas (`*MUNCAND`, `*DISCAND`, `*_NAL_DISCAND`) de cada elección, devuelve sus votos a los partidos de una candidatura común donde fueron separados y arma `E[ek].bx`; revisa el ganador de cada municipio y distrito contra el archivo de candidaturas y no guarda si acierta menos que antes. Corre dentro de `lab.py construir|todo` (antes de la proyección) y se puede repetir sin cambiar nada. `construir.py` suma las columnas que el INE repite (antes se perdían votos). Probado: con los mismos archivos da exactamente lo publicado (11,106 de 11,232 lugares) y Tomatlán 2024 sale MC. La herramienta de la Plataforma (`actualizar_laboratorio.py`) ya lleva `bx` porque pasa `privado/` completo. Ya no existe `pipeline/bx/` (eran pasos a mano).
