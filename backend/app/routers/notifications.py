from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Task, Board, User, TaskStatus, board_members
from app.schemas import TaskOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/upcoming", response_model=list[TaskOut])
async def upcoming_deadlines(
    days: int = Query(default=3, ge=1, le=14, description="Ile dni do przodu sprawdzać"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Zwraca zadania przypisane do bieżącego użytkownika (lub na jego tablicach),
    których termin mija w ciągu najbliższych `days` dni lub jest już przekroczony.
    Nie zwraca zadań ze statusem 'done'.
    """
    now = datetime.now(timezone.utc)
    horizon = now + timedelta(days=days)

    # Tablice, do których należy użytkownik
    boards_q = select(board_members.c.board_id).where(
        board_members.c.user_id == current_user.id
    )

    query = (
        select(Task)
        .options(selectinload(Task.assignee))
        .where(
            Task.board_id.in_(boards_q),
            Task.status != TaskStatus.done,
            Task.due_date.isnot(None),
            Task.due_date <= horizon,
        )
        .order_by(Task.due_date.asc())
    )

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/overdue-count")
async def overdue_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Liczba przeterminowanych + kończących się dziś zadań (do badge'a w UI)."""
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)

    boards_q = select(board_members.c.board_id).where(
        board_members.c.user_id == current_user.id
    )

    from sqlalchemy import func as sa_func

    result = await db.execute(
        select(sa_func.count(Task.id)).where(
            Task.board_id.in_(boards_q),
            Task.status != TaskStatus.done,
            Task.due_date.isnot(None),
            Task.due_date <= tomorrow,
        )
    )
    count = result.scalar()
    return {"count": count}
