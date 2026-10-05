from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

Nombre = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
Texto = Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)]


class PeticionCreate(BaseModel):
    nombre: Nombre
    texto: Texto = ""


class PeticionUpdate(BaseModel):
    nombre: Nombre | None = None
    texto: Texto | None = None


class PeticionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    texto: str
    created_at: datetime
    updated_at: datetime


class LoginIn(BaseModel):
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
