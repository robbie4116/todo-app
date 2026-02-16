from datetime import datetime, timezone
from typing import Optional


def format_time_left(seconds: int) -> str:
    overdue = seconds < 0
    total = abs(seconds)

    days = total // 86400
    total %= 86400
    hours = total // 3600
    total %= 3600
    minutes = total // 60
    secs = total % 60

    text = f"{days}d {hours}h {minutes}m {secs}s"
    return f"{text} overdue" if overdue else f"{text} left"


class Todo:
    @staticmethod
    def create(
        title: str,
        description: str,
        user_id: str,
        deadline: Optional[datetime] = None,
        priority: str = "medium",
    ) -> dict:
        now = datetime.now(timezone.utc)
        return {
            "title": title,
            "description": description,
            "status": "not_started",
            "priority": priority,
            "user_id": user_id,
            "deadline": deadline,
            "created_at": now,
            "updated_at": now,
        }

    @staticmethod
    def to_dict(todo_doc: dict) -> dict:
        if not todo_doc:
            return todo_doc

        todo = dict(todo_doc)
        todo["id"] = str(todo["_id"])
        del todo["_id"]

        if "status" not in todo:
            todo["status"] = "finished" if todo.get("completed") else "not_started"
        if "priority" not in todo:
            todo["priority"] = "medium"
        if "description" not in todo:
            todo["description"] = ""

        deadline = todo.get("deadline")
        if deadline and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
            todo["deadline"] = deadline

        if deadline:
            secs = int((deadline - datetime.now(timezone.utc)).total_seconds())
            todo["time_left_seconds"] = secs
            todo["time_left_human"] = format_time_left(secs)
            todo["is_overdue"] = secs < 0
        else:
            todo["time_left_seconds"] = None
            todo["time_left_human"] = None
            todo["is_overdue"] = False

        return todo
