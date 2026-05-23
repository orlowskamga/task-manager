from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models import User, RoleEnum, Task, Board, board_members
from app.schemas import UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.display_name is not None:
        current_user.display_name = data.display_name
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.get("/", response_model=list[UserOut])
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.display_name))
    return result.scalars().all()


# ---------- Admin endpoints ----------


@router.patch("/{user_id}/role", response_model=UserOut)
async def change_user_role(
    user_id: int,
    role: RoleEnum,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Zmiana roli użytkownika (tylko admin)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Nie możesz zmienić własnej roli")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")

    user.role = role
    await db.flush()
    await db.refresh(user)
    return user


@router.get("/stats", response_model=dict)
async def user_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Statystyki użytkowników (tylko admin)."""
    total_users = await db.execute(select(sa_func.count(User.id)))
    total_boards = await db.execute(select(sa_func.count(Board.id)))
    total_tasks = await db.execute(select(sa_func.count(Task.id)))

    return {
        "total_users": total_users.scalar(),
        "total_boards": total_boards.scalar(),
        "total_tasks": total_tasks.scalar(),
    }


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Usunięcie użytkownika (tylko admin)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Nie możesz usunąć siebie")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")

    await db.delete(user)
    await db.flush()
