import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["ADMIN_PASSWORD"] = "secreto"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c
    if os.path.exists("test.db"):
        os.remove("test.db")


def admin_headers(client):
    r = client.post("/api/auth/login", json={"password": "secreto"})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_crear_y_listar(client):
    r = client.post("/api/peticiones", json={"nombre": " Ana ", "texto": "Por mi familia"})
    assert r.status_code == 201
    assert r.json()["nombre"] == "Ana"
    assert [p["nombre"] for p in client.get("/api/peticiones").json()] == ["Ana"]


def test_validacion(client):
    assert client.post("/api/peticiones", json={"nombre": "   "}).status_code == 422
    assert client.post("/api/peticiones", json={"nombre": "x", "texto": "a" * 1001}).status_code == 422


def test_editar_es_publico_y_borrar_requiere_admin(client):
    pid = client.post("/api/peticiones", json={"nombre": "Luis"}).json()["id"]

    r = client.patch(f"/api/peticiones/{pid}", json={"texto": "hola"})
    assert r.status_code == 200 and r.json()["texto"] == "hola"

    assert client.delete(f"/api/peticiones/{pid}").status_code == 401
    h = admin_headers(client)
    assert client.delete(f"/api/peticiones/{pid}", headers=h).status_code == 204
    assert client.get("/api/peticiones").json() == []


def test_login_incorrecto(client):
    assert client.post("/api/auth/login", json={"password": "mal"}).status_code == 401


def test_websocket_recibe_eventos(client):
    with client.websocket_connect("/api/ws") as ws:
        client.post("/api/peticiones", json={"nombre": "Marta", "texto": "salud"})
        evento = ws.receive_json()
        assert evento["type"] == "created"
        assert evento["peticion"]["nombre"] == "Marta"

        h = admin_headers(client)
        pid = evento["peticion"]["id"]
        client.delete(f"/api/peticiones/{pid}", headers=h)
        assert ws.receive_json() == {"type": "deleted", "id": pid}
