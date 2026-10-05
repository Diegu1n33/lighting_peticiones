from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..limiter import limiter
from ..models import Peticion
from ..schemas import PeticionCreate, PeticionOut, PeticionUpdate
from ..security import require_admin
from ..ws import manager

router = APIRouter(prefix="/peticiones", tags=["peticiones"])


def _event(kind: str, p: Peticion) -> dict:
    return {"type": kind, "peticion": PeticionOut.model_validate(p).model_dump(mode="json")}


async def _get_or_404(session: AsyncSession, peticion_id: int) -> Peticion:
    p = await session.get(Peticion, peticion_id)
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Petición no encontrada")
    return p


@router.get("", response_model=list[PeticionOut])
async def listar(session: AsyncSession = Depends(get_session)):
    result = await session.scalars(select(Peticion).order_by(Peticion.id.desc()))
    return result.all()


@router.post("", response_model=PeticionOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def crear(
    request: Request,
    data: PeticionCreate,
    session: AsyncSession = Depends(get_session),
):
    p = Peticion(**data.model_dump())
    session.add(p)
    await session.commit()
    await session.refresh(p)
    await manager.broadcast(_event("created", p))
    return p


@router.patch("/{peticion_id}", response_model=PeticionOut)
@limiter.limit("30/minute")
async def actualizar(
    request: Request,
    peticion_id: int,
    data: PeticionUpdate,
    session: AsyncSession = Depends(get_session),
):
    p = await _get_or_404(session, peticion_id)
    for campo, valor in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(p, campo, valor)
    await session.commit()
    await session.refresh(p)
    await manager.broadcast(_event("updated", p))
    return p


@router.delete(
    "/{peticion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def eliminar(peticion_id: int, session: AsyncSession = Depends(get_session)):
    p = await _get_or_404(session, peticion_id)
    await session.delete(p)
    await session.commit()
    await manager.broadcast({"type": "deleted", "id": peticion_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
