from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Board, User
from app.schemas import BoardCreate, BoardOut, BoardDetail

router = APIRouter(prefix="/api/boards", tags=["boards"])


@router.post("/", response_model=BoardOut, status_code=201)
async def create_board(
    data: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board = Board(name=data.name, owner_id=current_user.id)
    board.members.append(current_user)
    db.add(board)
    await db.flush()
    await db.refresh(board)
    return board


@router.get("/", response_model=list[BoardOut])
async def list_my_boards(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Board)
        .join(Board.members)
        .where(User.id == current_user.id)
        .order_by(Board.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{board_id}", response_model=BoardDetail)
async def get_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Board)
        .options(selectinload(Board.members))
        .where(Board.id == board_id)
    )
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(status_code=404, detail="Tablica nie znaleziona")
    return board


@router.post("/{board_id}/members/{user_id}", status_code=204)
async def add_member(
    board_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Board).options(selectinload(Board.members)).where(Board.id == board_id)
    )
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(status_code=404, detail="Tablica nie znaleziona")
    if board.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Brak uprawnień")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")

    if user not in board.members:
        board.members.append(user)
    await db.flush()


@router.delete("/{board_id}", status_code=204)
async def delete_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(status_code=404, detail="Tablica nie znaleziona")
    if board.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Brak uprawnień")
    await db.delete(board)
    await db.flush()
