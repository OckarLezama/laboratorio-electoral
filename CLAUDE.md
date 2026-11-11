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
- Responder en español, claro y sin tecnicismos.
