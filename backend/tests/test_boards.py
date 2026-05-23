import pytest
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_create_board(client, test_user):
    resp = await client.post("/api/boards/", json={"name": "Sprint 1"},
                             headers=auth_headers(test_user))
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Sprint 1"
    assert data["owner_id"] == test_user["id"]


@pytest.mark.asyncio
async def test_list_boards_empty(client, test_user):
    resp = await client.get("/api/boards/", headers=auth_headers(test_user))
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_boards_after_create(client, test_user):
    await client.post("/api/boards/", json={"name": "Board A"},
                      headers=auth_headers(test_user))
    await client.post("/api/boards/", json={"name": "Board B"},
                      headers=auth_headers(test_user))
    resp = await client.get("/api/boards/", headers=auth_headers(test_user))
    assert resp.status_code == 200
    boards = resp.json()
    assert len(boards) == 2


@pytest.mark.asyncio
async def test_get_board_detail(client, test_user):
    create_resp = await client.post("/api/boards/", json={"name": "Detail Board"},
                                    headers=auth_headers(test_user))
    board_id = create_resp.json()["id"]

    resp = await client.get(f"/api/boards/{board_id}", headers=auth_headers(test_user))
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Detail Board"
    assert "members" in data
    # Twórca jest automatycznie członkiem
    assert len(data["members"]) == 1
    assert data["members"][0]["id"] == test_user["id"]


@pytest.mark.asyncio
async def test_rename_board(client, test_user):
    create_resp = await client.post("/api/boards/", json={"name": "Old Name"},
                                    headers=auth_headers(test_user))
    board_id = create_resp.json()["id"]

    resp = await client.patch(f"/api/boards/{board_id}", json={"name": "New Name"},
                              headers=auth_headers(test_user))
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_board(client, test_user):
    create_resp = await client.post("/api/boards/", json={"name": "To Delete"},
                                    headers=auth_headers(test_user))
    board_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/boards/{board_id}", headers=auth_headers(test_user))
    assert resp.status_code == 204

    resp2 = await client.get(f"/api/boards/{board_id}", headers=auth_headers(test_user))
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_board_not_found(client, test_user):
    resp = await client.get("/api/boards/9999", headers=auth_headers(test_user))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_add_member(client, test_user, admin_user):
    create_resp = await client.post("/api/boards/", json={"name": "Team Board"},
                                    headers=auth_headers(test_user))
    board_id = create_resp.json()["id"]

    resp = await client.post(f"/api/boards/{board_id}/members/{admin_user['id']}",
                             headers=auth_headers(test_user))
    assert resp.status_code == 204

    detail = await client.get(f"/api/boards/{board_id}", headers=auth_headers(test_user))
    member_ids = [m["id"] for m in detail.json()["members"]]
    assert admin_user["id"] in member_ids


@pytest.mark.asyncio
async def test_remove_member(client, test_user, admin_user):
    create_resp = await client.post("/api/boards/", json={"name": "Remove Board"},
                                    headers=auth_headers(test_user))
    board_id = create_resp.json()["id"]

    await client.post(f"/api/boards/{board_id}/members/{admin_user['id']}",
                      headers=auth_headers(test_user))

    resp = await client.delete(f"/api/boards/{board_id}/members/{admin_user['id']}",
                               headers=auth_headers(test_user))
    assert resp.status_code == 204

    detail = await client.get(f"/api/boards/{board_id}", headers=auth_headers(test_user))
    member_ids = [m["id"] for m in detail.json()["members"]]
    assert admin_user["id"] not in member_ids


@pytest.mark.asyncio
async def test_cannot_remove_owner(client, test_user):
    create_resp = await client.post("/api/boards/", json={"name": "Owner Board"},
                                    headers=auth_headers(test_user))
    board_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/boards/{board_id}/members/{test_user['id']}",
                               headers=auth_headers(test_user))
    assert resp.status_code == 400
