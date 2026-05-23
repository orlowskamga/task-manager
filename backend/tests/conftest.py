import asyncio
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import User, Board, Task, TaskStatus, TaskPriority
from app.dependencies import hash_password, create_access_token

# Testowa baza SQLite in-memory (async)
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Tworzy tabele przed każdym testem, czyści po."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user():
    """Tworzy testowego użytkownika i zwraca (user_dict, token)."""
    async with TestSession() as session:
        user = User(
            email="test@example.com",
            password_hash=hash_password("test123"),
            display_name="Tester",
            role="member",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        token = create_access_token(user.id)
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role.value,
            "token": token,
        }


@pytest_asyncio.fixture
async def admin_user():
    """Tworzy testowego admina i zwraca (user_dict, token)."""
    async with TestSession() as session:
        user = User(
            email="admin@example.com",
            password_hash=hash_password("admin123"),
            display_name="Admin",
            role="admin",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        token = create_access_token(user.id)
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role.value,
            "token": token,
        }


def auth_headers(user_dict: dict) -> dict:
    return {"Authorization": f"Bearer {user_dict['token']}"}
