# Laboratorio Político

Plataforma de análisis electoral por sección electoral, con agregación a municipio, distrito local y distrito federal. Usa resultados oficiales del INE de 2015 a 2025.

Estados cargados: Campeche, Chiapas, Oaxaca, Quintana Roo, Tabasco, Veracruz y Yucatán (Circunscripción 3).

## Estructura

```
index.html            página principal        ┐
css/estilos.css       estilos                 │ generados por pipeline/sitio.py:
js/app.js             código de la plataforma │ no se editan a mano
data/estados.json     estados disponibles     ┘
data/<clave>.json     datos procesados de cada estado (generados por el proceso de datos)
data/<clave>/capas/   bases adicionales del estado; se descargan solo cuando se usan
data/capas.json       registro de bases disponibles (generado)

src/                  código fuente que sí se edita (módulos JS, CSS y estructura HTML)
pipeline/             proceso de datos: de las bases crudas del INE a data/<clave>.json
  config.json         ruta a tu carpeta "Resultados INE" y fechas de corte
  capas.json          registro de bases adicionales (CONAPO hoy; INEGI y otras después)
  estados.json        claves de los 32 estados
  insumos/            catálogo legal 2027 y contorno de los estados (para el mapa de contexto)
tests/                prueba automática de la plataforma
docs/INSTRUCTIVO.md   cómo actualizar datos, agregar estados y cambiar cartografía
```

## Publicar en GitHub Pages
1. Sube todo el contenido de esta carpeta a la raíz del repositorio.
2. Ve a **Settings → Pages → Build and deployment → Source: Deploy from a branch**. Elige **Branch: main** y **/(root)**, y guarda.
3. Queda en `https://<usuario>.github.io/<repositorio>/`. Para abrir un estado directo: `#chis`, `#oax`, `#ver`, etc.

Para verla en tu computadora, ejecuta `python -m http.server` en esta carpeta y abre `http://localhost:8000`. No funciona con doble clic sobre `index.html`.

## Actualizar o agregar datos
```
pip install -r requirements.txt
python pipeline/lab.py todo chis        # prepara, construye y arma el sitio para Chiapas
python tests/prueba_estados.py chis     # verifica que todo funcione
```
Ver el detalle en [docs/INSTRUCTIVO.md](docs/INSTRUCTIVO.md).

## Fuentes
- INE, Sistema de Consulta de la Estadística Electoral (SEE), 2015–2025.
- INE, DERFE: Padrón y Lista Nominal y Base Geográfica Digital (las fechas de corte están en `pipeline/config.json`).
- INE, DECEyEC: Conteos Censales de Participación 2018, 2021 y 2024.
- CONAPO: Índice de marginación municipal 2020.
- Catálogo legal 2027 por estado (`pipeline/insumos/catalogo_eleccion_2027.csv`).

Voto duro, voto volátil, votantes ocasionales y escaños plurinominales son estimaciones propias.

## Datos personales
Este repositorio solo contiene cifras agregadas por sección. No se suben bases crudas, padrones de afiliados ni ningún dato personal; esos se quedan en tu carpeta local "Resultados INE".
