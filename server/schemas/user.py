

from datetime import datetime
from models.user import  UserRole
from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: UserRole = UserRole.PRODUCER

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ClientResponse(BaseModel):
    total : int
    clients : List[UserResponse] = []


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse




class UserInProjectResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None  

    class Config:
        from_attributes = True