import hmac
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

_bearer = HTTPBearer(auto_error=False)
_ALG = "HS256"


def password_ok(password: str) -> bool:
    return hmac.compare_digest(password.encode(), settings.admin_password.encode())


def create_token() -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": "admin", "exp": exp}, settings.jwt_secret, algorithm=_ALG)


def require_admin(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> None:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Falta iniciar sesión")
    try:
        jwt.decode(creds.credentials, settings.jwt_secret, algorithms=[_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión inválida o expirada")
