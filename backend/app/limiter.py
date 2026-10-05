from fastapi import Request
from slowapi import Limiter


def client_ip(request: Request) -> str:
    # nginx sobrescribe X-Forwarded-For con la IP real del cliente.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=client_ip)
