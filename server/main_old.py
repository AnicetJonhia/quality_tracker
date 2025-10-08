from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import enum
import os
import hashlib
import secrets
import jwt

# # Database setup
# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/quality_tracker")
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

#  Database setup with SQLite fallback
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sqlite_path = os.path.join(BASE_DIR, "database.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{sqlite_path}")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# 🧩 Création de la session et du modèle de base
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    CLIENT = "client"

class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DELIVERED = "delivered"
    REJECTED = "rejected"

class NCEStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class NCESeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SurveyType(str, enum.Enum):
    NPS = "nps"
    CSAT = "csat"

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    deliveries = relationship("Delivery", back_populates="created_by_user")
    surveys = relationship("Survey", back_populates="user")
    nces_created = relationship("NCE", foreign_keys="[NCE.created_by]", back_populates="created_by_user")
    nces_assigned = relationship("NCE", foreign_keys="[NCE.assigned_to]", back_populates="assigned_to_user")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    client_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    deliveries = relationship("Delivery", back_populates="project")

class Delivery(Base):
    __tablename__ = "deliveries"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(SQLEnum(DeliveryStatus), default=DeliveryStatus.PENDING)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime)
    receipt_url = Column(String)
    checksum = Column(String)
    
    project = relationship("Project", back_populates="deliveries")
    created_by_user = relationship("User", back_populates="deliveries")
    files = relationship("DeliveryFile", back_populates="delivery")
    surveys = relationship("Survey", back_populates="delivery")
    nces = relationship("NCE", back_populates="delivery")

class DeliveryFile(Base):
    __tablename__ = "delivery_files"
    
    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer)
    checksum = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    delivery = relationship("Delivery", back_populates="files")

class Survey(Base):
    __tablename__ = "surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    survey_type = Column(SQLEnum(SurveyType), nullable=False)
    score = Column(Integer)
    comment = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    delivery = relationship("Delivery", back_populates="surveys")
    user = relationship("User", back_populates="surveys")

class NCE(Base):
    __tablename__ = "nces"
    
    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(SQLEnum(NCESeverity), default=NCESeverity.MEDIUM)
    status = Column(SQLEnum(NCEStatus), default=NCEStatus.OPEN)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    delivery = relationship("Delivery", back_populates="nces")
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="nces_created")
    assigned_to_user = relationship("User", foreign_keys=[assigned_to], back_populates="nces_assigned")

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.USER

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

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

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

    class Config:
        orm_mode = True


# FastAPI App
app = FastAPI(title="Buildingmap API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def calculate_checksum(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

def get_current_user(user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Create tables
Base.metadata.create_all(bind=engine)

# API Endpoints

@app.get("/")
def read_root():
    return {"message": "QualityTracker API", "version": "1.0.0", "documentation:": "/docs"}

# Authentication
@app.post("/api/auth/register", response_model=TokenResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or user.hashed_password != hash_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Users
@app.post("/api/users", response_model=UserResponse)
def create_user(user: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only admins can create users
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

# Projects
@app.post("/api/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_project = Project(**project.dict())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/api/projects", response_model=List[ProjectResponse])
def get_projects(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).offset(skip).limit(limit).all()
    return projects

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# Deliveries
@app.post("/api/deliveries", response_model=DeliveryResponse)
def create_delivery(delivery: DeliveryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_delivery = Delivery(**delivery.dict(), created_by=current_user.id)
    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)
    return new_delivery

@app.get("/api/deliveries", response_model=List[DeliveryResponse])
def get_deliveries(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    deliveries = db.query(Delivery).offset(skip).limit(limit).all()
    return deliveries

@app.get("/api/deliveries/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(delivery_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return delivery

@app.put("/api/deliveries/{delivery_id}/status")
def update_delivery_status(delivery_id: int, status: DeliveryStatus, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    delivery.status = status
    if status == DeliveryStatus.DELIVERED:
        delivery.delivered_at = datetime.utcnow()
    
    db.commit()
    db.refresh(delivery)
    return delivery

# NCEs
@app.post("/api/nces", response_model=NCEResponse)
def create_nce(nce: NCECreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_nce = NCE(**nce.dict(), created_by=current_user.id)
    db.add(new_nce)
    db.commit()
    db.refresh(new_nce)
    return new_nce

@app.get("/api/nces", response_model=List[NCEResponse])
def get_nces(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    nces = db.query(NCE).offset(skip).limit(limit).all()
    return nces

@app.get("/api/nces/{nce_id}", response_model=NCEResponse)
def get_nce(nce_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    nce = db.query(NCE).filter(NCE.id == nce_id).first()
    if not nce:
        raise HTTPException(status_code=404, detail="NCE not found")
    return nce

@app.put("/api/nces/{nce_id}/status")
def update_nce_status(nce_id: int, status: NCEStatus, resolution_notes: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    nce = db.query(NCE).filter(NCE.id == nce_id).first()
    if not nce:
        raise HTTPException(status_code=404, detail="NCE not found")
    
    nce.status = status
    if status == NCEStatus.RESOLVED or status == NCEStatus.CLOSED:
        nce.resolved_at = datetime.utcnow()
        if resolution_notes:
            nce.resolution_notes = resolution_notes
    
    db.commit()
    db.refresh(nce)
    return nce

# Surveys
@app.post("/api/surveys", response_model=SurveyResponse)
def create_survey(survey: SurveyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_survey = Survey(**survey.dict(), user_id=current_user.id, completed_at=datetime.utcnow())
    db.add(new_survey)
    db.commit()
    db.refresh(new_survey)
    return new_survey

@app.get("/api/surveys", response_model=List[SurveyResponse])
def get_surveys(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    surveys = db.query(Survey).offset(skip).limit(limit).all()
    return surveys

# Dashboard Stats
@app.get("/api/dashboard/stats")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_deliveries = db.query(Delivery).count()
    total_nces = db.query(NCE).count()
    open_nces = db.query(NCE).filter(NCE.status == NCEStatus.OPEN).count()
    
    # Calculate average NPS
    nps_surveys = db.query(Survey).filter(Survey.survey_type == SurveyType.NPS, Survey.score.isnot(None)).all()
    avg_nps = sum([s.score for s in nps_surveys]) / len(nps_surveys) if nps_surveys else 0
    
    # Calculate average CSAT
    csat_surveys = db.query(Survey).filter(Survey.survey_type == SurveyType.CSAT, Survey.score.isnot(None)).all()
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
    uvicorn.run(app, host="localhost", port=8000)
