from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models import RoleEnum, TaskStatus, TaskPriority


# ---------- Auth ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    password_confirm: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("Hasła nie są identyczne")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)
    new_password_confirm: str = Field(min_length=6, max_length=128)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.new_password_confirm:
            raise ValueError("Nowe hasła nie są identyczne")
        return self


# ---------- User ----------

class UserOut(BaseModel):
    id: int
    email: str
    display_name: str
    role: RoleEnum
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=100)


# ---------- Board ----------

class BoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class BoardOut(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BoardDetail(BoardOut):
    members: list[UserOut] = []


# ---------- Task ----------

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str = ""
    priority: TaskPriority = TaskPriority.medium
    due_date: datetime | None = None
    assignee_id: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: datetime | None = None
    assignee_id: int | None = None


class TaskMove(BaseModel):
    """Zmiana statusu (kolumny) i pozycji zadania — wywoływane przy drag & drop."""
    status: TaskStatus
    position: int = Field(ge=0)


class TaskOut(BaseModel):
    id: int
    board_id: int
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    position: int
    due_date: datetime | None
    assignee_id: int | None
    assignee: UserOut | None = None
    created_by: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
