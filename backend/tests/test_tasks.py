import pytest
from tests.conftest import auth_headers


async def _create_board(client, user):
    resp = await client.post("/api/boards/", json={"name": "Test Board"},
                             headers=auth_headers(user))
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_task(client, test_user):
    board_id = await _create_board(client, test_user)
    resp = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Zrobić testy",
        "description": "Pytest + httpx",
        "priority": "high",
    }, headers=auth_headers(test_user))
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Zrobić testy"
    assert data["status"] == "todo"
    assert data["priority"] == "high"
    assert data["position"] == 0
    assert data["created_by"] == test_user["id"]


@pytest.mark.asyncio
async def test_create_task_minimal(client, test_user):
    board_id = await _create_board(client, test_user)
    resp = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Minimalne zadanie",
    }, headers=auth_headers(test_user))
    assert resp.status_code == 201
    data = resp.json()
    assert data["priority"] == "medium"
    assert data["status"] == "todo"
    assert data["description"] == ""


@pytest.mark.asyncio
async def test_create_task_empty_title(client, test_user):
    board_id = await _create_board(client, test_user)
    resp = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "",
    }, headers=auth_headers(test_user))
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_tasks(client, test_user):
    board_id = await _create_board(client, test_user)
    for i in range(3):
        await client.post(f"/api/boards/{board_id}/tasks/", json={
            "title": f"Zadanie {i}",
        }, headers=auth_headers(test_user))

    resp = await client.get(f"/api/boards/{board_id}/tasks/",
                            headers=auth_headers(test_user))
    assert resp.status_code == 200
    assert len(resp.json()) == 3


@pytest.mark.asyncio
async def test_list_tasks_filter_priority(client, test_user):
    board_id = await _create_board(client, test_user)
    await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Pilne", "priority": "high",
    }, headers=auth_headers(test_user))
    await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Spokojne", "priority": "low",
    }, headers=auth_headers(test_user))

    resp = await client.get(f"/api/boards/{board_id}/tasks/?priority=high",
                            headers=auth_headers(test_user))
    tasks = resp.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Pilne"


@pytest.mark.asyncio
async def test_list_tasks_search(client, test_user):
    board_id = await _create_board(client, test_user)
    await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Naprawić bug w logowaniu",
    }, headers=auth_headers(test_user))
    await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Dodać testy",
    }, headers=auth_headers(test_user))

    resp = await client.get(f"/api/boards/{board_id}/tasks/?search=bug",
                            headers=auth_headers(test_user))
    tasks = resp.json()
    assert len(tasks) == 1
    assert "bug" in tasks[0]["title"].lower()


@pytest.mark.asyncio
async def test_update_task(client, test_user):
    board_id = await _create_board(client, test_user)
    create_resp = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Stary tytuł",
    }, headers=auth_headers(test_user))
    task_id = create_resp.json()["id"]

    resp = await client.patch(f"/api/boards/{board_id}/tasks/{task_id}", json={
        "title": "Nowy tytuł",
        "priority": "high",
    }, headers=auth_headers(test_user))
    assert resp.status_code == 200
    assert resp.json()["title"] == "Nowy tytuł"
    assert resp.json()["priority"] == "high"


@pytest.mark.asyncio
async def test_update_task_status(client, test_user):
    board_id = await _create_board(client, test_user)
    create_resp = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Do przeniesienia",
    }, headers=auth_headers(test_user))
    task_id = create_resp.json()["id"]

    resp = await client.patch(f"/api/boards/{board_id}/tasks/{task_id}", json={
        "status": "in_progress",
    }, headers=auth_headers(test_user))
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_move_task(client, test_user):
    board_id = await _create_board(client, test_user)
    create_resp = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Drag me",
    }, headers=auth_headers(test_user))
    task_id = create_resp.json()["id"]

    resp = await client.put(f"/api/boards/{board_id}/tasks/{task_id}/move", json={
        "status": "done",
        "position": 0,
    }, headers=auth_headers(test_user))
    assert resp.status_code == 200
    assert resp.json()["status"] == "done"
    assert resp.json()["position"] == 0


@pytest.mark.asyncio
async def test_delete_task(client, test_user):
    board_id = await _create_board(client, test_user)
    create_resp = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Do usunięcia",
    }, headers=auth_headers(test_user))
    task_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/boards/{board_id}/tasks/{task_id}",
                               headers=auth_headers(test_user))
    assert resp.status_code == 204

    resp2 = await client.get(f"/api/boards/{board_id}/tasks/{task_id}",
                             headers=auth_headers(test_user))
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_task_not_found(client, test_user):
    board_id = await _create_board(client, test_user)
    resp = await client.get(f"/api/boards/{board_id}/tasks/9999",
                            headers=auth_headers(test_user))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_task_on_nonexistent_board(client, test_user):
    resp = await client.post("/api/boards/9999/tasks/", json={
        "title": "Ghost",
    }, headers=auth_headers(test_user))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_task_position_auto_increment(client, test_user):
    board_id = await _create_board(client, test_user)
    r1 = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "First",
    }, headers=auth_headers(test_user))
    r2 = await client.post(f"/api/boards/{board_id}/tasks/", json={
        "title": "Second",
    }, headers=auth_headers(test_user))

    assert r1.json()["position"] == 0
    assert r2.json()["position"] == 1
