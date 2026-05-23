from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.models import User
from app.schemas import UserCreate, UserLogin, Token, UserOut, ChangePassword

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email już zarejestrowany")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")

    token = create_access_token(user.id)
    return Token(access_token=token)


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Wydaje nowy token dla zalogowanego użytkownika (przedłużenie sesji)."""
    token = create_access_token(current_user.id)
    return Token(access_token=token)


@router.post("/change-password", status_code=204)
async def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Aktualne hasło jest nieprawidłowe")

    current_user.password_hash = hash_password(data.new_password)
    await db.flush()
