from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime
import hashlib
import os

from core.config import settings
from core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user_id,
    security
)
from db.session import get_db, engine
from db.base import Base

from models.user import User, UserRole
from models.project import Project
from models.delivery import Delivery, DeliveryStatus
from models.delivery_file import DeliveryFile
from models.nce import NCE, NCEStatus, NCESeverity
from models.survey import Survey, SurveyType
from models.notification import Notification

from pydantic import BaseModel, EmailStr

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.PRODUCER

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    client_name: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    client_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DeliveryCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None

class DeliveryResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str]
    status: DeliveryStatus
    version: int
    created_at: datetime
    delivered_at: Optional[datetime]

    class Config:
        from_attributes = True

class NCECreate(BaseModel):
    delivery_id: int
    title: str
    description: str
    severity: NCESeverity = NCESeverity.MEDIUM

class NCEResponse(BaseModel):
    id: int
    delivery_id: int
    title: str
    description: str
    severity: NCESeverity
    status: NCEStatus
    created_at: datetime

    class Config:
        from_attributes = True

class SurveyCreate(BaseModel):
    delivery_id: int
    survey_type: SurveyType
    score: int
    comment: Optional[str] = None

class SurveyResponse(BaseModel):
    id: int
    delivery_id: int
    survey_type: SurveyType
    score: Optional[int]
    comment: Optional[str]
    sent_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    link: Optional[str]

    class Config:
        from_attributes = True

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

@app.get("/")
def read_root():
    return {"message": "QualityTracker API", "version": settings.VERSION, "documentation": "/docs"}

@app.post("/api/auth/register", response_model=TokenResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.id, "role": new_user.role.value})
    refresh_token = create_refresh_token(data={"sub": new_user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[UserResponse])
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

@app.get("/api/clients", response_model=List[UserResponse])
def get_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY, UserRole.PRODUCER]:
        raise HTTPException(status_code=403, detail="Not authorized")

    clients = db.query(User).filter(User.role == UserRole.CLIENT).all()
    return clients

@app.post("/api/projects", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY]:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_project = Project(**project.dict())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/api/projects", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if search:
        query = query.filter(
            or_(
                Project.name.contains(search),
                Project.description.contains(search),
                Project.client_name.contains(search)
            )
        )

    projects = query.offset(skip).limit(limit).all()
    return projects

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/api/deliveries", response_model=DeliveryResponse)
def create_delivery(
    delivery: DeliveryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY, UserRole.PRODUCER]:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_delivery = Delivery(**delivery.dict(), created_by=current_user.id)
    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)
    return new_delivery

@app.get("/api/deliveries", response_model=List[DeliveryResponse])
def get_deliveries(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_filter: Optional[DeliveryStatus] = None,
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Delivery)

    if current_user.role == UserRole.PRODUCER:
        query = query.filter(Delivery.created_by == current_user.id)
    elif current_user.role == UserRole.CLIENT:
        query = query.filter(
            Delivery.project.has(Project.client_name == current_user.full_name)
        )

    if search:
        query = query.filter(
            or_(
                Delivery.title.contains(search),
                Delivery.description.contains(search)
            )
        )

    if status_filter:
        query = query.filter(Delivery.status == status_filter)

    if project_id:
        query = query.filter(Delivery.project_id == project_id)

    deliveries = query.order_by(Delivery.created_at.desc()).offset(skip).limit(limit).all()
    return deliveries

@app.get("/api/deliveries/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(
    delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    if current_user.role == UserRole.PRODUCER and delivery.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return delivery

@app.patch("/api/deliveries/{delivery_id}/status")
def update_delivery_status(
    delivery_id: int,
    new_status: DeliveryStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY]:
        raise HTTPException(status_code=403, detail="Not authorized")

    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    old_status = delivery.status
    delivery.status = new_status

    if new_status == DeliveryStatus.APPROVED:
        delivery.delivered_at = datetime.utcnow()

    db.commit()
    db.refresh(delivery)

    notification = Notification(
        user_id=delivery.created_by,
        title="Delivery Status Updated",
        message=f"Delivery '{delivery.title}' status changed from {old_status.value} to {new_status.value}",
        type="delivery_status",
        link=f"/deliveries/{delivery.id}"
    )
    db.add(notification)
    db.commit()

    return delivery

@app.post("/api/nces", response_model=NCEResponse)
def create_nce(
    nce: NCECreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY, UserRole.PRODUCER, UserRole.CLIENT]:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_nce = NCE(**nce.dict(), created_by=current_user.id)
    db.add(new_nce)
    db.commit()
    db.refresh(new_nce)

    delivery = db.query(Delivery).filter(Delivery.id == nce.delivery_id).first()
    if delivery:
        notification = Notification(
            user_id=delivery.created_by,
            title="New NCE Created",
            message=f"NCE '{new_nce.title}' created for delivery '{delivery.title}'",
            type="nce_created",
            link=f"/nce/{new_nce.id}"
        )
        db.add(notification)
        db.commit()

    return new_nce

@app.get("/api/nces", response_model=List[NCEResponse])
def get_nces(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_filter: Optional[NCEStatus] = None,
    severity_filter: Optional[NCESeverity] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(NCE)

    if current_user.role == UserRole.PRODUCER:
        query = query.filter(NCE.created_by == current_user.id)
    elif current_user.role == UserRole.CLIENT:
        query = query.filter(NCE.created_by == current_user.id)

    if search:
        query = query.filter(
            or_(
                NCE.title.contains(search),
                NCE.description.contains(search)
            )
        )

    if status_filter:
        query = query.filter(NCE.status == status_filter)

    if severity_filter:
        query = query.filter(NCE.severity == severity_filter)

    nces = query.order_by(NCE.created_at.desc()).offset(skip).limit(limit).all()
    return nces

@app.get("/api/nces/{nce_id}", response_model=NCEResponse)
def get_nce(
    nce_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    nce = db.query(NCE).filter(NCE.id == nce_id).first()
    if not nce:
        raise HTTPException(status_code=404, detail="NCE not found")

    if current_user.role == UserRole.PRODUCER and nce.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return nce

@app.patch("/api/nces/{nce_id}/status")
def update_nce_status(
    nce_id: int,
    new_status: NCEStatus,
    resolution_notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY]:
        raise HTTPException(status_code=403, detail="Not authorized")

    nce = db.query(NCE).filter(NCE.id == nce_id).first()
    if not nce:
        raise HTTPException(status_code=404, detail="NCE not found")

    nce.status = new_status
    if new_status in [NCEStatus.RESOLVED, NCEStatus.CLOSED]:
        nce.resolved_at = datetime.utcnow()
        if resolution_notes:
            nce.resolution_notes = resolution_notes

    db.commit()
    db.refresh(nce)

    notification = Notification(
        user_id=nce.created_by,
        title="NCE Status Updated",
        message=f"NCE '{nce.title}' status changed to {new_status.value}",
        type="nce_status",
        link=f"/nce/{nce.id}"
    )
    db.add(notification)
    db.commit()

    return nce

@app.post("/api/surveys", response_model=SurveyResponse)
def create_survey(
    survey: SurveyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_survey = Survey(**survey.dict(), user_id=current_user.id, completed_at=datetime.utcnow())
    db.add(new_survey)
    db.commit()
    db.refresh(new_survey)
    return new_survey

@app.get("/api/surveys", response_model=List[SurveyResponse])
def get_surveys(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    surveys = db.query(Survey).offset(skip).limit(limit).all()
    return surveys

@app.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()

    return {"message": "Notification marked as read"}

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role in [UserRole.ADMIN, UserRole.QUALITY]:
        total_deliveries = db.query(Delivery).count()
        total_nces = db.query(NCE).count()
    elif current_user.role == UserRole.PRODUCER:
        total_deliveries = db.query(Delivery).filter(Delivery.created_by == current_user.id).count()
        total_nces = db.query(NCE).filter(NCE.created_by == current_user.id).count()
    else:
        total_deliveries = 0
        total_nces = db.query(NCE).filter(NCE.created_by == current_user.id).count()

    open_nces = db.query(NCE).filter(NCE.status == NCEStatus.OPEN).count()

    nps_surveys = db.query(Survey).filter(
        Survey.survey_type == SurveyType.NPS,
        Survey.score.isnot(None)
    ).all()
    avg_nps = sum([s.score for s in nps_surveys]) / len(nps_surveys) if nps_surveys else 0

    csat_surveys = db.query(Survey).filter(
        Survey.survey_type == SurveyType.CSAT,
        Survey.score.isnot(None)
    ).all()
    avg_csat = sum([s.score for s in csat_surveys]) / len(csat_surveys) if csat_surveys else 0

    return {
        "total_deliveries": total_deliveries,
        "total_nces": total_nces,
        "open_nces": open_nces,
        "avg_nps": round(avg_nps, 2),
        "avg_csat": round(avg_csat, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
