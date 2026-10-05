from fastapi import WebSocket


class ConnectionManager:
    """Difunde eventos a todos los clientes conectados.

    Vive en memoria del proceso, por eso la API corre con UN worker.
    Para varios workers, reemplazar `broadcast` por Redis pub/sub.
    """

    def __init__(self) -> None:
        self.active: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.active.discard(ws)

    async def broadcast(self, message: dict) -> None:
        for ws in list(self.active):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(ws)


manager = ConnectionManager()
