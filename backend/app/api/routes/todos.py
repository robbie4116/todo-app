from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from datetime import datetime, timezone
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from app.models.todo import Todo
from app.core.database import get_database
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=List[TodoResponse])
async def get_todos(current_user: dict = Depends(get_current_user)):
    db = get_database()
    todos = list(db.todos.find({"user_id": str(current_user["_id"])}))
    return [Todo.to_dict(todo) for todo in todos]


@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo: TodoCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()

    todo_doc = Todo.create(
        title=todo.title,
        description=todo.description,
        user_id=str(current_user["_id"]),
        deadline=todo.deadline,
        priority=todo.priority.value,
    )

    result = db.todos.insert_one(todo_doc)
    todo_doc["_id"] = result.inserted_id
    return Todo.to_dict(todo_doc)


@router.patch("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: str,
    todo_update: TodoUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()

    try:
        obj_id = ObjectId(todo_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid todo ID"
        )

    existing = db.todos.find_one({
        "_id": obj_id,
        "user_id": str(current_user["_id"])
    })
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    updates = {}
    fields_set = todo_update.model_fields_set

    if "title" in fields_set:
        updates["title"] = todo_update.title
    if "description" in fields_set:
        updates["description"] = todo_update.description   
    if "status" in fields_set:
        updates["status"] = todo_update.status.value if todo_update.status else None
    if "deadline" in fields_set:
        updates["deadline"] = todo_update.deadline
    if "priority" in fields_set:
        updates["priority"] = todo_update.priority.value if todo_update.priority else None


    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update"
        )

    updates["updated_at"] = datetime.now(timezone.utc)

    db.todos.update_one({"_id": obj_id}, {"$set": updates})
    updated = db.todos.find_one({"_id": obj_id})
    return Todo.to_dict(updated)


@router.delete("/{todo_id}")
async def delete_todo(
    todo_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()

    try:
        obj_id = ObjectId(todo_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid todo ID"
        )

    result = db.todos.delete_one({
        "_id": obj_id,
        "user_id": str(current_user["_id"])
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    return {"message": "Todo deleted successfully"}
