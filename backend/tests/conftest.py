import os

os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/todoapp_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

import pytest
import mongomock
from fastapi.testclient import TestClient

import app.main as main_module
import app.api.routes.auth as auth_routes
import app.api.routes.todos as todos_routes
import app.api.deps as deps_module


@pytest.fixture()
def db():
    client = mongomock.MongoClient()
    db = client["todoapp_test"]
    db.users.create_index("email", unique=True)
    db.todos.create_index("user_id")
    return db


@pytest.fixture()
def client(db, monkeypatch):
    monkeypatch.setattr(main_module, "connect_to_mongo", lambda: None)
    monkeypatch.setattr(main_module, "close_mongo_connection", lambda: None)

    monkeypatch.setattr(auth_routes, "get_database", lambda: db)
    monkeypatch.setattr(todos_routes, "get_database", lambda: db)
    monkeypatch.setattr(deps_module, "get_database", lambda: db)

    with TestClient(main_module.app) as c:
        yield c
