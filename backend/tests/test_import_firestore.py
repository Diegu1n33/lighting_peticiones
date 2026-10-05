import asyncio
import os

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Peticion
from app.scripts.import_firestore import importar, parse


def doc(nombre, texto, created):
    fields = {"nombre": {"stringValue": nombre}}
    if texto is not None:
        fields["texto"] = {"stringValue": texto}
    return {"name": f"projects/p/databases/(default)/documents/tarjetas/{nombre}",
            "fields": fields, "createTime": created, "updateTime": created}


def test_parse_y_importacion_idempotente():
    docs = [
        doc("Beto", "segunda", "2026-02-01T10:00:00.123456789Z"),
        doc("Ana", "primera", "2026-01-01T10:00:00Z"),
        doc("Sin texto", None, "2026-03-01T10:00:00Z"),
        {"name": "x/vacia", "fields": {}, "createTime": "2026-01-01T00:00:00Z"},
        doc("L" * 120, "t" * 2000, "2026-04-01T10:00:00Z"),
    ]
    items = [i for i in (parse(d) for d in docs) if i]
    assert len(items) == 4  # la tarjeta sin nombre se omite
    assert len(items[3]["nombre"]) == 80 and len(items[3]["texto"]) == 1000

    async def run():
        assert await importar(items, dry_run=True) == (4, 0)
        assert await importar(items, dry_run=False) == (4, 0)
        assert await importar(items, dry_run=False) == (0, 4)  # segunda corrida: nada nuevo
        async with SessionLocal() as s:
            return [p.nombre for p in (await s.scalars(select(Peticion).order_by(Peticion.id))).all()]

    nombres = asyncio.run(run())
    assert nombres[:3] == ["Ana", "Beto", "Sin texto"]  # orden cronológico
    if os.path.exists("test.db"):
        os.remove("test.db")
