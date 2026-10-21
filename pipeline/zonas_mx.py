"""Paso 4b. Mapas nacionales de la página de inicio a partir del Marco Geográfico Seccional del INE.

Lee CARTO/MGS/SHAPEFILE/ (descomprime antes MGSAN_Shapefile.zip y el SHAPEFILE.7z que trae dentro) y genera:
  data/inicio/mx32.json     estados
  data/inicio/mx_df.json    300 distritos federales
  data/inicio/mx_mun.json   municipios
  pipeline/insumos/secciones_mgs.csv.gz   a qué distrito federal y municipio pertenece cada sección
Todos en la misma proyección, para que las capas coincidan. Solo se corre cuando el INE cambia la cartografía.

uso: python pipeline/lab.py zonas
"""
import csv
import gzip
import json
import math

import geopandas as gpd

from comun import BASE, CFG, PIPE, REPO

SHP = BASE / CFG['rutas'].get('mgs', 'CARTO/MGS/SHAPEFILE')


def main():
    dst = REPO / 'data' / 'inicio'; dst.mkdir(parents=True, exist_ok=True)
    ent = gpd.read_file(SHP / 'ENTIDAD.shp').to_crs(4326)
    x0, y0, x1, y1 = ent.total_bounds; k = math.cos(math.radians(23)); sc = 1000 / ((x1 - x0) * k)
    pj = lambda x, y: (round((x - x0) * k * sc, 1), round((y1 - y) * sc, 1))

    def path(geom, tol, amin):
        ps = [geom] if geom.geom_type == 'Polygon' else list(geom.geoms)
        out = []
        for p in ps:
            if p.area < amin:
                continue
            s = p.simplify(tol, preserve_topology=True)
            if s.is_empty:
                continue
            out.append('M' + ' '.join(f'{a},{b}' for a, b in (pj(*c) for c in s.exterior.coords)) + 'Z')
        return ''.join(out)

    st = []
    for _, r in ent.iterrows():
        c = r.geometry.representative_point() if r.geometry.geom_type == 'Polygon' else max(r.geometry.geoms, key=lambda p: p.area).representative_point()
        cx, cy = pj(c.x, c.y)
        st.append({'ent': int(r['ENTIDAD']), 'd': path(r.geometry, .02, .003), 'x': cx, 'y': cy})
    (dst / 'mx32.json').write_text(json.dumps({'w': 1000, 'h': round((y1 - y0) * sc), 'st': st}, separators=(',', ':')), encoding='utf-8')

    df = gpd.read_file(SHP / 'DISTRITO_FEDERAL.shp').to_crs(4326)
    out = [{'id': f"{int(r['ENTIDAD'])}_{int(r['DISTRITO_F'])}", 'd': path(r.geometry, .008, .0002)} for _, r in df.iterrows()]
    (dst / 'mx_df.json').write_text(json.dumps(out, separators=(',', ':')), encoding='utf-8')

    mu = gpd.read_file(SHP / 'MUNICIPIO.shp').to_crs(4326)
    out = [{'id': f"{int(r['ENTIDAD'])}_{int(r['MUNICIPIO'])}", 'n': str(r['NOMBRE']).strip().title(), 'd': path(r.geometry, .006, .00005)} for _, r in mu.iterrows()]
    (dst / 'mx_mun.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    se = gpd.read_file(SHP / 'SECCION.shp', ignore_geometry=True)
    with gzip.open(PIPE / 'insumos' / 'secciones_mgs.csv.gz', 'wt', encoding='utf-8', newline='') as g:
        w = csv.writer(g); w.writerow(['ENTIDAD', 'SECCION', 'DISTRITO_F', 'MUNICIPIO'])
        for r in se[['ENTIDAD', 'SECCION', 'DISTRITO_F', 'MUNICIPIO']].itertuples(index=False):
            w.writerow([int(r[0]), int(r[1]), int(r[2]), int(r[3])])
    for f in ('mx32.json', 'mx_df.json', 'mx_mun.json'):
        print(f'  inicio/{f}: {(dst / f).stat().st_size / 1e6:.2f} MB')
    print(f'  insumos/secciones_mgs.csv.gz: {len(se):,} secciones')


if __name__ == '__main__':
    main()
