

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from models.user import User, UserRole
from schemas.user import UserCreate, UserResponse
from core.dependencies import get_current_user
from typing import List


from core.security import get_password_hash
from db.session import get_db


router = APIRouter(tags=["users"])



@router.post("/users", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Seuls les admins peuvent créer un utilisateur
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Vérifier que l'email n'existe pas
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_in.password) if user_in.password else None

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

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


