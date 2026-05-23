from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Task, Board, User, TaskStatus, TaskPriority
from app.schemas import TaskCreate, TaskUpdate, TaskMove, TaskOut

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

    # Nowe zadanie dostaje pozycję na końcu kolumny "todo"
    result = await db.execute(
        select(sa_func.coalesce(sa_func.max(Task.position), -1))
        .where(Task.board_id == board_id, Task.status == TaskStatus.todo)
    )
    max_pos = result.scalar()

    task = Task(
        board_id=board_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=data.due_date,
        assignee_id=data.assignee_id,
        created_by=current_user.id,
        position=max_pos + 1,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task, attribute_names=["assignee"])
    return task


@router.get("/", response_model=list[TaskOut])
async def list_tasks(
    board_id: int,
    status: TaskStatus | None = Query(None, description="Filtruj po statusie"),
    priority: TaskPriority | None = Query(None, description="Filtruj po priorytecie"),
    assignee_id: int | None = Query(None, description="Filtruj po przypisanej osobie"),
    search: str | None = Query(None, max_length=200, description="Szukaj w tytule i opisie"),
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
    if priority:
        query = query.where(Task.priority == priority)
    if assignee_id is not None:
        query = query.where(Task.assignee_id == assignee_id)
    if search:
        pattern = f"%{search}%"
        query = query.where(Task.title.ilike(pattern) | Task.description.ilike(pattern))

    query = query.order_by(Task.status, Task.position, Task.created_at.desc())
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
    result2 = await db.execute(
        select(Task).options(selectinload(Task.assignee)).where(Task.id == task_id)
    )
    return result2.scalar_one()


@router.put("/{task_id}/move", response_model=TaskOut)
async def move_task(
    board_id: int,
    task_id: int,
    data: TaskMove,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Przenosi zadanie do innej kolumny i/lub na inną pozycję (drag & drop)."""
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.assignee))
        .where(Task.id == task_id, Task.board_id == board_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Zadanie nie znalezione")

    old_status = task.status
    new_status = data.status
    new_position = data.position

    # Jeśli zadanie zmienia kolumnę — zamknij lukę w starej kolumnie
    if old_status != new_status:
        siblings_old = await db.execute(
            select(Task)
            .where(
                Task.board_id == board_id,
                Task.status == old_status,
                Task.id != task_id,
                Task.position > task.position,
            )
        )
        for t in siblings_old.scalars():
            t.position -= 1

    # Zrób miejsce w docelowej kolumnie
    siblings_new = await db.execute(
        select(Task)
        .where(
            Task.board_id == board_id,
            Task.status == new_status,
            Task.id != task_id,
            Task.position >= new_position,
        )
    )
    for t in siblings_new.scalars():
        t.position += 1

    task.status = new_status
    task.position = new_position

    await db.flush()
    result2 = await db.execute(
        select(Task).options(selectinload(Task.assignee)).where(Task.id == task_id)
    )
    return result2.scalar_one()


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

    # Zamknij lukę w pozycjach
    siblings = await db.execute(
        select(Task)
        .where(
            Task.board_id == board_id,
            Task.status == task.status,
            Task.id != task_id,
            Task.position > task.position,
        )
    )
    for t in siblings.scalars():
        t.position -= 1

    await db.delete(task)
    await db.flush()
