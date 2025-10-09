

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from models.user import User, UserRole
from schemas.user import UserCreate, UserResponse
from core.dependencies import get_current_user

router = APIRouter(prefix="", tags=["users"])
@router.get("/users", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY]:
        raise HTTPException(status_code=403, detail="Not authorized")

    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/clients", response_model=List[UserResponse])
def get_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY, UserRole.PRODUCER]:
        raise HTTPException(status_code=403, detail="Not authorized")

    clients = db.query(User).filter(User.role == UserRole.CLIENT).all()
    return clients