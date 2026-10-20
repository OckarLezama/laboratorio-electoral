"""Configuración compartida del proceso de datos.

Todas las rutas salen de pipeline/config.json (carpeta "Resultados INE") y
pipeline/estados.json (claves de cada estado). Ningún script tiene rutas fijas.
"""
import json
import os
from pathlib import Path

PIPE = Path(__file__).resolve().parent          # .../pipeline
REPO = PIPE.parent                              # raíz del repositorio
CFG = json.loads((PIPE / 'config.json').read_text(encoding='utf-8'))
ESTADOS = json.loads((PIPE / 'estados.json').read_text(encoding='utf-8'))['estados']

# La variable de entorno LAB_BASE permite usar otra carpeta sin editar config.json
BASE = Path(os.environ.get('LAB_BASE') or CFG['base'])


def ruta(clave):
    """Ruta absoluta de una entrada de config.json → rutas."""
    return BASE / CFG['rutas'][clave]


def estado(x):
    """Busca un estado por clave ('chis'), número (7) o nombre ('Chiapas')."""
    s = str(x).strip().lower()
    for e in ESTADOS:
        if s in (e['clave'], str(e['ent']), e['nombre'].lower()):
            return e
    raise SystemExit(f'Estado no reconocido: {x}. Usa la clave de pipeline/estados.json, por ejemplo "chis".')


def temporal(e):
    """Carpeta intermedia del estado (fuera del repositorio)."""
    d = ruta('temporal') / e['clave']
    d.mkdir(parents=True, exist_ok=True)
    return d
