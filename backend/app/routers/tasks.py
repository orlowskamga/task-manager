from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Task, Board, User, TaskStatus
from app.schemas import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/api/boards/{board_id}/tasks", tags=["tasks"])


async def _get_board_or_404(board_id: int, db: AsyncSession) -> Board:
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(status_code=404, detail="Tablica nie znaleziona")
    return board


@router.post("/", response_model=TaskOut, status_code=201)
async def create_task(
    board_id: int,
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_board_or_404(board_id, db)
    task = Task(
        board_id=board_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=data.due_date,
        assignee_id=data.assignee_id,
        created_by=current_user.id,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task, attribute_names=["assignee"])
    return task


@router.get("/", response_model=list[TaskOut])
async def list_tasks(
    board_id: int,
    status: TaskStatus | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_board_or_404(board_id, db)
    query = (
        select(Task)
        .options(selectinload(Task.assignee))
        .where(Task.board_id == board_id)
    )
    if status:
        query = query.where(Task.status == status)
    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    board_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.assignee))
        .where(Task.id == task_id, Task.board_id == board_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Zadanie nie znalezione")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    board_id: int,
    task_id: int,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.assignee))
        .where(Task.id == task_id, Task.board_id == board_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Zadanie nie znalezione")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.flush()
    await db.refresh(task, attribute_names=["assignee"])
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    board_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.board_id == board_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Zadanie nie znalezione")
    await db.delete(task)
    await db.flush()
