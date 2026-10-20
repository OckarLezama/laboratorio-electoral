# Instructivo del proceso de datos

## 1. Instalación (una sola vez)
1. Instala Python 3.10 o posterior.
2. En la carpeta del repositorio, ejecuta:
   ```
   pip install -r requirements.txt
   python -m playwright install chromium     # solo si vas a correr las pruebas
   ```
3. Abre `pipeline/config.json` y pon en `base` la ruta de tu carpeta "Resultados INE". Usa `/` en lugar de `\`.

## 2. Bases crudas que necesita cada estado
Van dentro de la carpeta `base`, con estas rutas. Nunca se suben al repositorio.

| Insumo | Ruta dentro de "Resultados INE" | Fuente |
|---|---|---|
| Presidencia, por sección | `LAB_POLITICO_DATOS/01_FEDERAL/PRESIDENCIA/<año>/*NAL_SEC.csv` | INE, SEE |
| Senadurías MR, por sección | `LAB_POLITICO_DATOS/01_FEDERAL/SENADURIAS_MR/<año>/*NAL_SEC.csv` | INE, SEE |
| Diputaciones federales MR, por sección | `LAB_POLITICO_DATOS/01_FEDERAL/DIPUTACIONES_FED_MR/<año>/*NAL_SEC.csv` | INE, SEE |
| Gubernatura, por sección | `LAB_POLITICO_DATOS/02_LOCAL/<ESTADO>/<año>/GUBERNATURA/*_SEC.csv` | INE, SEE |
| Diputaciones locales MR, por sección | `LAB_POLITICO_DATOS/02_LOCAL/<ESTADO>/<año>/DIPUTACIONES_LOC_MR/*_SEC.csv` | INE, SEE |
| Ayuntamientos, por sección | `LAB_POLITICO_DATOS/02_LOCAL/<ESTADO>/<año>/AYUNTAMIENTOS/*_SEC.csv` | INE, SEE |
| Padrón y lista nominal por sección, edad y sexo | ruta `padron` de `config.json` (Excel) | INE, DERFE |
| Base Geográfica Digital | `CARTO/BGD/bgd_<número de estado>_Shapefile.zip` | INE, DERFE |
| Conteos Censales de Participación | `FUENTES_COMPLEMENTARIAS/INE_CONTEOS_CENSALES_PARTICIPACION/DatosAbiertos_DECEyEC_ConteosCensales<año>.zip` | INE, DECEyEC |
| Índice de marginación | `FUENTES_COMPLEMENTARIAS/CONAPO_MARGINACION_2020/CONAPO_imm_2020-3.csv` | CONAPO |

- **Años incluidos:** a partir de 2015 (`anio_minimo` en `config.json`).
- **Elecciones extraordinarias:** se excluyen. Se detectan porque el nombre del archivo contiene "EXT".
- **Carpetas `<ESTADO>`:** usan la abreviatura de `carpeta_local` en `pipeline/estados.json` (CHIS, OAX, TAMPS…).
- **Catálogo legal 2027:** este archivo sí vive en el repositorio, en `pipeline/insumos/catalogo_eleccion_2027.csv`. Ahí se editan los escaños de mayoría relativa (MR) y representación proporcional (RP), el umbral y qué se elige en 2027.

## 3. Comandos
```
python pipeline/lab.py estados           # lista las claves (chis, oax, ver…)
python pipeline/lab.py preparar chis     # paso 1: extrae lo del estado a "Resultados INE/LAB_POLITICO_DATOS/_tmp/chis"
python pipeline/lab.py construir chis    # paso 2: genera data/chis.json
python pipeline/lab.py sitio             # paso 3: arma index.html, css/, js/ y data/estados.json
python pipeline/lab.py todo chis oax     # los tres pasos para uno o varios estados
python tests/prueba_estados.py           # prueba automática de todos los estados
```
Al terminar, sube a GitHub los archivos que cambiaron: `data/` y, si cambió el código, `index.html`, `css/`, `js/` y `src/`.

## 4. Casos frecuentes

**Agregar un estado nuevo**
1. Verifica que estén sus bases (sección 2).
2. Corre `python pipeline/lab.py todo <clave>`.
3. Corre la prueba. El estado aparece solo en "Cambiar estado".

**Nuevo corte del padrón**
1. Pon el Excel nuevo en la carpeta.
2. Actualiza `rutas.padron` y `cortes.padron` en `config.json`.
3. Corre `todo` para los estados cargados.

**Resultados de una elección nueva** (por ejemplo, 2027)
1. Coloca los `*_SEC.csv` en su carpeta, con el mismo formato.
2. Corre `todo`. La elección aparece sola en el selector.

**Actualizar la cartografía** (nuevo corte de la Base Geográfica Digital)
1. Reemplaza los `bgd_<n>_Shapefile.zip`.
2. Actualiza `cortes.cartografia` en `config.json`.
3. Corre `todo` para cada estado.

Ten en cuenta:
- Los resultados históricos se acomodan por número de sección.
- Las secciones nuevas quedan marcadas como "nuevas", sin historial.
- Las secciones que desaparecen pierden sus votos históricos. Hoy es cerca de 2% en el peor caso.
- Si hay redistritación, los distritos se recalculan solos. Revisa el número de escaños MR en el catálogo 2027.

**Cambiar algo de la plataforma**
1. Edita los archivos de `src/`: los módulos `10_core.js` a `90_boot.js`, `style.css`, `extra.css` y `body.html`.
2. Corre `python pipeline/lab.py sitio`.
3. Corre la prueba.

No edites `js/app.js` ni `css/estilos.css`: se sobrescriben.

**Un partido local aparece con su sigla (por ejemplo "PLC")**
Agrega su nombre corto en el diccionario `NMX` al inicio de `src/10_core.js`. Si el INE usa varias siglas para el mismo partido, agrégalas en `ALIAS` de `pipeline/construir.py`.

## 5. Limitaciones conocidas
- **Una sola coalición por elección:** cada elección usa la misma coalición en todo el estado. En ayuntamientos, donde las alianzas cambian por municipio, se suman votos de aliados que en algunos municipios fueron por separado.
- **Votos de coalición:** se reparten en partes iguales entre los partidos que la integran.
- **Escaños de mayoría relativa:** cuando gana una coalición, se asignan al partido que la encabeza (marcado con "+"). Las plurinominales son una estimación, con umbral y tope de sobrerrepresentación de 8 puntos.
- **"Evolución del voto":** solo muestra los 7 partidos nacionales.
