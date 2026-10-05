"""Importa las tarjetas de Firestore a la base de datos de la app.

Uso (con la app levantada, desde la raíz del proyecto):

    docker compose exec -e FIREBASE_API_KEY=tu_api_key api \
        python -m app.scripts.import_firestore --dry-run     # solo muestra qué haría
    docker compose exec -e FIREBASE_API_KEY=tu_api_key api \
        python -m app.scripts.import_firestore               # importa de verdad

La API key es la `apiKey` de firebaseConfig (la que tenía el index.html viejo).
Usa la API REST de Firestore, así que no necesita credenciales de administrador,
siempre que las reglas de Firestore permitan lectura pública (como la app vieja).
Es seguro correrlo más de una vez: omite las peticiones que ya existen.
"""
import argparse
import asyncio
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.models import Peticion

PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "muro-peticiones")
COLLECTION = os.getenv("FIREBASE_COLLECTION", "tarjetas")
BASE_URL = (
    f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}"
    f"/databases/(default)/documents/{COLLECTION}"
)
MAX_NOMBRE, MAX_TEXTO = 80, 1000


def fetch_documents(api_key: str) -> list[dict]:
    docs: list[dict] = []
    token = None
    while True:
        params = {"pageSize": 300, "key": api_key}
        if token:
            params["pageToken"] = token
        url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"
        try:
            with urllib.request.urlopen(url, timeout=30) as res:
                data = json.load(res)
        except urllib.error.HTTPError as e:
            detalle = e.read().decode(errors="replace")[:300]
            sys.exit(f"Firestore respondió {e.code}: {detalle}")
        except urllib.error.URLError as e:
            sys.exit(f"No se pudo conectar a Firestore: {e.reason}")
        docs += data.get("documents", [])
        token = data.get("nextPageToken")
        if not token:
            return docs


def _ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def parse(doc: dict) -> dict | None:
    fields = doc.get("fields", {})
    nombre = fields.get("nombre", {}).get("stringValue", "").strip()
    texto = fields.get("texto", {}).get("stringValue", "").strip()
    if not nombre:
        print(f"  - omitida (sin nombre): {doc.get('name', '?').rsplit('/', 1)[-1]}")
        return None
    if len(nombre) > MAX_NOMBRE or len(texto) > MAX_TEXTO:
        print(f"  ! recortada por longitud: {nombre[:30]}")
    created = _ts(doc["createTime"]) if "createTime" in doc else datetime.now(timezone.utc)
    updated = _ts(doc["updateTime"]) if "updateTime" in doc else created
    return {
        "nombre": nombre[:MAX_NOMBRE],
        "texto": texto[:MAX_TEXTO],
        "created_at": created,
        "updated_at": updated,
    }


async def importar(items: list[dict], dry_run: bool) -> tuple[int, int]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        existentes = {(p.nombre, p.texto) for p in (await session.scalars(select(Peticion))).all()}
        nuevos = []
        # De más vieja a más nueva, para que los ids conserven el orden histórico.
        for item in sorted(items, key=lambda i: i["created_at"]):
            clave = (item["nombre"], item["texto"])
            if clave in existentes:
                continue
            existentes.add(clave)
            nuevos.append(Peticion(**item))
        if not dry_run:
            session.add_all(nuevos)
            await session.commit()
        return len(nuevos), len(items) - len(nuevos)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="no escribe nada, solo informa")
    args = ap.parse_args()

    api_key = os.getenv("FIREBASE_API_KEY")
    if not api_key:
        sys.exit("Falta FIREBASE_API_KEY (la apiKey de firebaseConfig).")

    print(f"Leyendo '{COLLECTION}' de {PROJECT_ID}…")
    docs = fetch_documents(api_key)
    print(f"{len(docs)} documentos encontrados.")
    items = [i for i in (parse(d) for d in docs) if i]

    nuevos, repetidos = asyncio.run(importar(items, args.dry_run))
    accion = "se importarían" if args.dry_run else "importadas"
    print(f"Listo: {nuevos} {accion}, {repetidos} ya existían o estaban repetidas.")


if __name__ == "__main__":
    main()
