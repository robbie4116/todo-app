from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime, date, time, timezone
from enum import Enum


class TodoStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    finished = "finished"


class TodoPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


def normalize_deadline(value):
    if value is None:
        return None

    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime.combine(value, time(23, 59, 59, tzinfo=timezone.utc))

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    return value


class TodoBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(default="", max_length=20000)  # long text allowed


class TodoCreate(TodoBase):
    deadline: Optional[datetime | date] = None
    priority: TodoPriority = TodoPriority.medium

    @field_validator("deadline")
    @classmethod
    def _normalize_deadline(cls, v):
        return normalize_deadline(v)


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = Field(default=None, max_length=20000)
    status: Optional[TodoStatus] = None
    deadline: Optional[datetime | date] = None
    priority: Optional[TodoPriority] = None

    @field_validator("deadline")
    @classmethod
    def _normalize_deadline(cls, v):
        return normalize_deadline(v)


class TodoResponse(TodoBase):
    id: str
    status: TodoStatus
    priority: TodoPriority
    user_id: str
    deadline: Optional[datetime] = None
    time_left_seconds: Optional[int] = None
    time_left_human: Optional[str] = None
    is_overdue: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
