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

## Antes de cualquier cambio: confirmar primero

1. **Cambio visual** (pantalla, gráfica, texto, acomodo): mostrar primero una **imagen** de cómo quedaría (captura del cambio aplicado en local o maqueta) y esperar su "sí". No publicar antes.
2. **Cambio sin parte visual** (datos, cálculo, modelo): mostrar primero el antes y el después con números de un caso real (por ejemplo, Campeche) y esperar su "sí".
3. No rediseñar lo que ya funciona sin que lo pida.

## Cómo pasa un cambio de aquí a la Plataforma

Un cambio en el Laboratorio **no llega solo** a la Plataforma. Solo se pasa si Ockar dice "y pásalo a la Plataforma":

1. Correr el proceso de este repo (`pipeline/`: preparar → construir → proyeccion) para generar `privado/<estado>.json` con `meta.proy`.
2. En el repo de la Plataforma: `python herramientas/actualizar_laboratorio.py <carpeta privado> <llaves.json>`.
   - Cifra los datos con las llaves existentes.
   - Las llaves están en la tabla `lab_llaves` de Supabase.
3. Subir `public/lab/*.bin` y aumentar la versión (`?v=`) en la Plataforma.

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
- Debilidad conocida: el modelo da 75 % de peso al promedio del último año, con el arrastre presidencial de 2024, y subestima partidos locales fuertes. Recalibrar por cargo solo con permiso.
- Responder en español, claro y sin tecnicismos.
