from fastapi import APIRouter, HTTPException, Request, status

from ..limiter import limiter
from ..schemas import LoginIn, TokenOut
from ..security import create_token, password_ok

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
@limiter.limit("5/minute")
async def login(request: Request, data: LoginIn) -> TokenOut:
    if not password_ok(data.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Contraseña incorrecta")
    return TokenOut(access_token=create_token())
