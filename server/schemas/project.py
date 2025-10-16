from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional
from datetime import datetime
from .user import UserInProjectResponse

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: Optional[int] = None
    client_email: Optional[EmailStr] = None

    @model_validator(mode="before")
    def check_client(cls, values):
        client_id = values.get("client_id")
        client_email = values.get("client_email")
        if not client_id and not client_email:
            raise ValueError("You must provide either client_id or client_email")
        if client_id and client_email:
            raise ValueError("Provide either client_id or client_email, not both")
        return values


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    client: Optional[UserInProjectResponse] = None 
    created_at: datetime

    class Config:
        from_attributes = True