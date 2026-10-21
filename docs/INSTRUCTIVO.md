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
python pipeline/lab.py capas chis        # paso 2b: genera las bases adicionales (pipeline/capas.json)
python pipeline/lab.py proyeccion        # paso 2c: calibra la proyección 2027 (usa todos los data/*.json)
python pipeline/lab.py sitio             # paso 3: arma index.html, inicio.html, css/, js/, data/estados.json y data/inicio/
python pipeline/lab.py nacional          # paso 4: resumen de los 32 estados para la vista general (data/nacional.json y data/inicio/nac_zonas.json)
python pipeline/lab.py zonas             # paso 4b: mapas nacionales por estado, distrito federal y municipio (solo si cambia la cartografía)
python pipeline/lab.py todo chis oax     # los tres pasos para uno o varios estados
python tests/prueba_estados.py           # prueba automática de todos los estados
python tests/prueba_inicio.py            # prueba automática de la página de inicio
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

**Agregar una base o capa por sección o por municipio (INEGI, encuestas, etc.)**
1. Pon el archivo CSV en tu carpeta "Resultados INE". Necesita una columna con el número de sección, o con el nombre del municipio, y otra con la clave del estado si trae varios estados.
2. Regístralo en `pipeline/capas.json`, copiando el bloque de CONAPO. Por cada base indicas:
   - `id`, `nombre` y `fuente`;
   - `archivo`: la ruta dentro de "Resultados INE"; puede usar `{ent}` para el número de estado;
   - `nivel`: `seccion` o `municipio`;
   - `columna_estado` y `columna_clave`.
3. Por cada variable de la base indicas:
   - `id` y `nombre`;
   - `descripcion`: la frase que aparece en la plataforma;
   - `expresion`: una columna, o una operación entre columnas, por ejemplo `P15YM_SE / P_15YMAS * 100`;
   - `unidad`: `pct`, `indice` o `n`;
   - `decimales`;
   - `sentido`: `mayor_peor`, `mayor_mejor` u omitido.
4. Corre `python pipeline/lab.py capas <estado>` y luego `python pipeline/lab.py sitio`.
5. Cada variable aparece sola:
   - en "Colorear el mapa por → Otras capas";
   - en "Explorar → Otras bases", como filtro bajo, medio o alto;
   - en la ficha al pasar el cursor;
   - como columna en la tabla y en el CSV;
   - en la tarjeta "Contexto socioeconómico".

   No hay que tocar código.

**Agregar una tarjeta nueva (módulo)**
Crea un archivo `src/7x_nombre.js` con `tarjeta({id, titulo, resumen, icono, html(ctx)})`; usa como ejemplo `src/75_contexto.js`. `ctx` trae:
- las secciones seleccionadas (`idx`);
- la elección (`ek`) y sus totales (`T`);
- el partido (`p`);
- las funciones de encabezado y fuente (`hd`, `ft`).

La tarjeta aparece en "Gráficas" sin modificar los demás archivos.

**Un partido local aparece con su sigla (por ejemplo "PLC")**
Agrega su nombre corto en el diccionario `NMX` al inicio de `src/10_core.js`. Si el INE usa varias siglas para el mismo partido, agrégalas en `ALIAS` de `pipeline/construir.py`.

## 5. Limitaciones conocidas
- **Una sola coalición por elección:** cada elección usa la misma coalición en todo el estado. En ayuntamientos, donde las alianzas cambian por municipio, se suman votos de aliados que en algunos municipios fueron por separado.
- **Votos de coalición:** se reparten en partes iguales entre los partidos que la integran.
- **Escaños de mayoría relativa:** cuando gana una coalición, se asignan al partido que la encabeza (marcado con "+"). Las plurinominales son una estimación, con umbral y tope de sobrerrepresentación de 8 puntos.
- **"Evolución del voto":** solo muestra los 7 partidos nacionales.
- **Bases municipales:** si una base es municipal (como CONAPO), todas las secciones de un municipio comparten el valor; la plataforma lo indica.

## 6. Vista Estrategia 2027
Botón "Estrategia" junto a Tabla y Mapa. Solo muestra los cargos que se eligen en 2027 en el estado (catálogo `pipeline/insumos/catalogo_eleccion_2027.csv` más diputaciones federales). Todo se calcula sobre una proyección por sección; el resultado anterior se muestra solo como referencia. Cada cálculo tiene un botón **i** con el método y su justificación.

**Proyección (pipeline/proyeccion.py, se guarda en `meta.proy` de cada data/<clave>.json):**
- Votación por sección = a × última elección del mismo cargo (opcionalmente con oscilación proporcional estatal) + (1 − a) × promedio de las elecciones del año más reciente.
- Se prueban 10 combinaciones (a = 0, 0.25, 0.5, 0.75, 1; con y sin oscilación) "pronosticando" 2021 y 2024 con datos anteriores. Se elige la de menor error en la diferencia entre 1.º y 2.º lugar (estado y unidades).
- Participación: se prueban tres reglas (misma elección de hace 6 años, la última, el promedio) y se usa la de menor error por sección, aplicada a la lista nominal vigente.
- Alianzas: rendimiento medido en elecciones del mismo día en que los mismos partidos fueron juntos y separados; el partido más fuerte aporta todo y los aliados la mediana medida (≈84 %, con mucha variación).
- Partidos sin registro (PRD, PES, RSP, FxM) se quitan y sus votos se reparten en proporción. Somos México y PAZ no tienen historial y no entran.
- Rango: error que cubrió 8 de cada 10 casos en la prueba. Si incluye el cero, se marca empate técnico. Confiabilidad: alta (≤ 8 pts), media (≤ 15), baja (> 15).
- Encuesta (opcional): con el porcentaje estatal por partido, cada sección se ajusta en la misma proporción (oscilación proporcional). El rango estatal pasa a ser el doble del margen de error.

**Hallazgos de la prueba (con los datos actuales):**
- Solo con historial, el resultado estatal se desvía en promedio entre 9 y 32 puntos: el historial no anticipa olas como la de 2024. Por eso la confiabilidad sin encuesta es baja.
- Con el resultado estatal conocido, el modelo acierta al ganador en 70 % a 100 % de los distritos locales y federales.
- En ayuntamientos acierta poco (pesan mucho los candidatos): error de 20 a 30 puntos.

**Panel en tres niveles:** 1) la respuesta (generales 2027, frase de conclusión, escenarios y meta segura); 2) dónde trabajar (resumen de secciones, acciones y prioritarias); 3) detalle plegado (confiabilidad, alianzas, rivales, encuesta y método).
**Escenarios:** cada partido parte solo; las posibles alianzas son las combinaciones con los partidos con que se alió desde 2021. Los rivales, por omisión, compiten por separado (se puede cambiar a "en posible alianza como en 2024").
**Qué hacer por sección:** asegurado (gana por 10+), cuidar (gana por menos de 10), movilizar o convencer (pierde por menos de 10), no invertir (pierde por más de 10). Movilizar si la participación esperada queda al menos el umbral calibrado (meta.proy.mov.th, hoy 20 puntos) por debajo del máximo histórico de la sección; si no, convencer. Calibración: en 6,124 casos reales 2018-2024 de secciones perdidas por menos de 10 y ganadas después, 27 % se ganó movilizando; con esta regla, 67 % de las marcadas como movilizar se ganó así.
**Metas:** mínima (un voto más que el rival estimado) y segura (gana aunque la estimación falle el error medido).
**Meta:** voto proyectado del rival más uno. **Secciones a ganar:** las perdidas más cerradas hasta sumar los votos que faltan (supone votos nuevos).
**¿Qué alianza ganaría?:** prueba todas las combinaciones de hasta 3 aliados (sin el bloque rival) con el rendimiento medido.


### Voto duro, switcher y registro de partidos (calibración oct-2026)
- **Voto duro (sección):** aun en su peor elección desde 2018, el partido sacó al menos 30% de los votos esperados en la sección. Prueba con 2018-2021 como entrenamiento: 85% de las secciones así marcadas las ganó el partido en 2024 (umbral 25%: 79%; 35%: 90%). Sustituye al "tercio más alto", que por construcción siempre marcaba un tercio de las secciones.
- **Switcher:** cambió de partido ganador entre las dos últimas elecciones del mismo cargo en al menos 2 cargos (diputación local, federal, ayuntamiento, gubernatura). Prueba 2018→2021 contra 2024: estas secciones cambiaron de ganador 1.5 a 6 veces más que las demás (antes, en Quintana Roo, la definición anterior no distinguía: 21.6% contra 19.3%). En estados con ola en 2024 (Yucatán, Campeche) muchas secciones salen switcher porque realmente cambiaron.
- **Registro 2027:** `pipeline/insumos/registro_2027.json`. Nacionales: Morena, PAN, PRI, PVEM, PT, MC (Somos México y PAZ sin historial). PRD con registro local confirmado en Tabasco (IEPCT, oct-2024) y Oaxaca (IEEPCO, ene-2025); Nueva Alianza en Yucatán. Los demás partidos locales se conservan solo con 3% o más en la última elección de diputados o gubernatura. Actualizar con la lista oficial de cada instituto local.

## Página de inicio (inicio.html)

**Qué es.** La entrada al Laboratorio. Abre en México con los 32 estados y, al elegir un estado con datos, baja a su detalle con una transición animada. Todo el tablero sigue a lo que se elige: país, circunscripción, estado, municipio o distrito, y la elección.
- **Nivel México:** ficha del país, mapa con capas (participación, resultados, quién gobierna y qué se elige en 2027), resultados por partido, lista de estados, evolución del voto y distritos federales ganados. Arranca con la última elección presidencial.
- **Nivel estado:** ficha del estado, mapa por municipio, distrito local o federal, resultados, lista, evolución, participación por edad y competencia en las secciones. El botón del mapa "Análisis y estrategia 2027" abre la plataforma (index.html) en ese estado. Desde la plataforma, el primer botón del riel regresa al inicio.
- **Línea de tiempo del encabezado:** sale de `pipeline/insumos/calendario_2027.csv`. Se oculta sola después de la jornada.

**De dónde salen los datos.**
- `data/nacional.json`: lo genera `python pipeline/lab.py nacional` con los archivos nacionales por sección del INE (`01_FEDERAL`) y la última gubernatura de cada estado (`02_LOCAL`). Se corre de nuevo solo cuando hay una elección nueva o cambia el catálogo 2027.
- `data/inicio/<clave>.json` y `data/inicio/mx32.json`: los genera `python pipeline/lab.py sitio` a partir de `data/<clave>.json`. No necesitan las bases crudas.
- Un estado tiene detalle en el inicio cuando existe su `data/<clave>.json`; los demás muestran su información nacional.

**Reglas de cálculo (iguales a la plataforma).**
- Votos de coalición repartidos en partes iguales entre sus partidos.
- El ganador de una zona es el bloque con más votos; su color es el del partido que lo encabezó.
- "Gobierna" es el partido con más votos dentro de la coalición que ganó la última gubernatura (en la CDMX, la Jefatura de Gobierno).
- Congreso local: estimado con la última elección de diputaciones locales (mayoría por distrito más representación proporcional con umbral y tope de +8 puntos). No es la integración oficial.
- Distritos federales ganados: los 300 distritos de mayoría relativa. La Cámara tiene 500 curules, así que la mitad y los dos tercios del semicírculo son de los distritos, no de la Cámara.
- Circunscripción: suma de los resultados de sus estados.

**Mapa nacional por distrito federal y municipio.**
- Con una elección federal, el mapa de México se puede ver por estados, distritos federales o municipios. Al elegir una diputación federal cambia solo a distritos.
- Cartografía: Marco Geográfico Seccional del INE (`CARTO/MGS`). Para regenerarla, descomprime `MGSAN_Shapefile.zip` y el `SHAPEFILE.7z` que trae dentro en `CARTO/MGS/SHAPEFILE/` y corre `python pipeline/lab.py zonas`. Crea `data/inicio/mx32.json`, `mx_df.json`, `mx_mun.json` y `pipeline/insumos/secciones_mgs.csv.gz` (sección → distrito federal y municipio vigentes).
- Resultados por zona: `python pipeline/lab.py nacional` suma cada sección en su distrito y municipio **vigentes**. En elecciones anteriores a 2024 el mapa los muestra así ("resultados sumados en los distritos actuales"); por eso pueden no coincidir con quién ganó cada distrito en esa elección. El semicírculo de distritos ganados sí usa los distritos de cada elección.
