# Coaliciones por lugar (E.bx) — 18-nov-2026

Arreglo de las coaliciones parciales (p. ej. Tomatlán 2024: la coalición de Morena no fue y ganó MC).

1. En la laptop (carpeta Resultados INE conectada): `cx.py` (en la sesión, `~/cx/loc.py` y `fed.py`) lee de cada elección el archivo
   por sección (`*_SEC.csv`) y el de candidaturas por municipio/distrito (`*MUNCAND`, `*DISCAND`) y deja
   `Downloads/_coaliciones_lab.json.gz`.
2. `decall.js` descifra los `.bin` de la Plataforma (llaves de `lab_llaves` / `lab_llaves_lab` en `keys.json`, que NUNCA se sube).
3. `fix.py` arma `E[ek].bx = [[bloques como compitieron], [secciones]]`, repara candidaturas comunes que se juntaron
   donde fueron separados y columnas repetidas del INE, y valida contra el ganador oficial de cada lugar.
4. `enc.js` vuelve a cifrar con las mismas llaves.

Pendiente: llevar esto a `construir.py`/`coaliciones.py` para que una nueva corrida del proceso no lo pierda,
y recifrar `data/seguro/` del sitio (necesita `privado/claves.json`).
