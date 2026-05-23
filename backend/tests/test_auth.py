import pytest
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_register_success(client):
    resp = await client.post("/api/auth/register", json={
        "email": "new@example.com",
        "password": "secret123",
        "password_confirm": "secret123",
        "display_name": "Nowy",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@example.com"
    assert data["display_name"] == "Nowy"
    assert data["role"] == "member"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {
        "email": "dup@example.com",
        "password": "secret123",
        "password_confirm": "secret123",
        "display_name": "Dup",
    }
    resp1 = await client.post("/api/auth/register", json=payload)
    assert resp1.status_code == 201
    resp2 = await client.post("/api/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "zarejestrowany" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_password_mismatch(client):
    resp = await client.post("/api/auth/register", json={
        "email": "mismatch@example.com",
        "password": "secret123",
        "password_confirm": "other456",
        "display_name": "Mismatch",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password(client):
    resp = await client.post("/api/auth/register", json={
        "email": "short@example.com",
        "password": "ab",
        "password_confirm": "ab",
        "display_name": "Short",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client):
    # Najpierw rejestracja
    await client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "secret123",
        "password_confirm": "secret123",
        "display_name": "Login",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={
        "email": "wrong@example.com",
        "password": "secret123",
        "password_confirm": "secret123",
        "display_name": "Wrong",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "bad_password",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client):
    resp = await client.post("/api/auth/login", json={
        "email": "ghost@example.com",
        "password": "whatever",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_token_refresh(client, test_user):
    resp = await client.post("/api/auth/refresh", headers=auth_headers(test_user))
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_change_password(client, test_user):
    resp = await client.post("/api/auth/change-password", json={
        "current_password": "test123",
        "new_password": "newpass123",
        "new_password_confirm": "newpass123",
    }, headers=auth_headers(test_user))
    assert resp.status_code == 204

    # Stare hasło już nie działa
    resp2 = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "test123",
    })
    assert resp2.status_code == 401

    # Nowe działa
    resp3 = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "newpass123",
    })
    assert resp3.status_code == 200


@pytest.mark.asyncio
async def test_protected_endpoint_no_token(client):
    resp = await client.get("/api/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_endpoint_bad_token(client):
    resp = await client.get("/api/users/me", headers={"Authorization": "Bearer fake.token.here"})
    assert resp.status_code == 401
