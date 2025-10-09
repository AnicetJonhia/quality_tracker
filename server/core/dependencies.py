from typing import Optional
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from models.user import User, UserRole
from core.security import get_current_user_id
from db.session import get_db

from schemas.user import UserCreate

def get_current_user(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def check_permission(user: User, action: str, resource: str, resource_owner_id: Optional[int] = None) -> bool:
    if user.role == UserRole.ADMIN or user.role == UserRole.QUALITY:
        return True

    if user.role == UserRole.PRODUCER:
        if action == "read" and resource == "clients":
            return True
        if action in ["create", "read", "update", "delete"] and resource_owner_id == user.id:
            return True
        return False

    if user.role == UserRole.CLIENT:
        if action == "create" and resource == "nce":
            return True
        if action in ["read", "update", "delete"] and resource_owner_id == user.id:
            return True
        return False

    return False