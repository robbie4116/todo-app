def register_user(client, email="test@example.com", password="TestPass123", name="Test User"):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name},
    )


def login_user(client, email="test@example.com", password="TestPass123"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_register_returns_token_and_user(client):
    res = register_user(client)
    assert res.status_code == 201, res.text
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"
    assert "id" in data["user"]


def test_login_success(client):
    register_user(client)
    res = login_user(client)
    assert res.status_code == 200, res.text
    assert "access_token" in res.json()


def test_todos_require_auth(client):
    res = client.get("/api/todos/")
    assert res.status_code in (401, 403)


def test_create_update_status_deadline_priority_description_delete_todo(client):
    reg = register_user(client).json()
    token = reg["access_token"]

    create_res = client.post(
        "/api/todos/",
        json={
            "title": "Write tests",
            "description": "Long-form description for this task.",
            "deadline": "2026-12-31",
            "priority": "high",
        },
        headers=auth_headers(token),
    )
    assert create_res.status_code == 201, create_res.text
    todo = create_res.json()
    todo_id = todo["id"]

    assert todo["status"] == "not_started"
    assert todo["priority"] == "high"
    assert todo["description"] == "Long-form description for this task."
    assert todo["deadline"] is not None
    assert "time_left_seconds" in todo
    assert "time_left_human" in todo
    assert "is_overdue" in todo

    update_res = client.patch(
        f"/api/todos/{todo_id}",
        json={"status": "in_progress", "priority": "urgent"},
        headers=auth_headers(token),
    )
    assert update_res.status_code == 200, update_res.text
    updated = update_res.json()
    assert updated["status"] == "in_progress"
    assert updated["priority"] == "urgent"

    desc_update_res = client.patch(
        f"/api/todos/{todo_id}",
        json={"description": "Updated description text."},
        headers=auth_headers(token),
    )
    assert desc_update_res.status_code == 200, desc_update_res.text
    assert desc_update_res.json()["description"] == "Updated description text."

    finish_res = client.patch(
        f"/api/todos/{todo_id}",
        json={"status": "finished"},
        headers=auth_headers(token),
    )
    assert finish_res.status_code == 200, finish_res.text
    assert finish_res.json()["status"] == "finished"

    delete_res = client.delete(f"/api/todos/{todo_id}", headers=auth_headers(token))
    assert delete_res.status_code == 200, delete_res.text
