from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from models.project import Project
from schemas.project import ProjectCreate, ProjectResponse
from db.session import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from lib.email import send_magic_link_email
from datetime import datetime
from sqlalchemy import or_, desc, asc
from typing import List, Optional



router = APIRouter(prefix="/projects", tags=["projects"])



@router.post("/", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Seuls les admins et quality peuvent créer un projet
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY]:
        raise HTTPException(status_code=403, detail="Not authorized")

    client_user: Optional[User] = None

    # 1️⃣ Si client_id fourni, vérifier qu'il existe
    if project_in.client_id:
        client_user = db.query(User).filter(User.id == project_in.client_id, User.role == UserRole.CLIENT).first()
        if not client_user:
            raise HTTPException(status_code=404, detail="Client not found")

    # 2️⃣ Sinon créer client via client_email si fourni
    if not client_user and project_in.client_email:
        email = project_in.client_email.lower()
        client_user = db.query(User).filter(User.email == email).first()
        if not client_user:
            new_client = User(
                email=email,
                role=UserRole.CLIENT,
                full_name=None,
                hashed_password=None,
                is_active=True
            )
            db.add(new_client)
            db.commit()
            db.refresh(new_client)
            client_user = new_client

            
    # 3️⃣ Créer le projet
    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        client_id=client_user.id if client_user else None
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project



@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    search: Optional[str] = Query(None, description="Search by name or description"),
    client_email: Optional[str] = Query(None, description="Filter by client email"),
    start_date: Optional[datetime] = Query(None, description="Filter start date"),
    end_date: Optional[datetime] = Query(None, description="Filter end date"),
    sort_order: Optional[str] = Query("desc", description="Sort by creation date: asc or desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    # 🔍 Recherche texte (nom, description, client_name)
    if search:
        query = query.filter(
            or_(
                Project.name.ilike(f"%{search}%"),
                Project.description.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )

    # 📧 Filtrer par email du client
    if client_email:
        query = query.filter(User.email.ilike(f"%{client_email}%"))

    # 🗓️ Filtrer par intervalle de date
    if start_date:
        query = query.filter(Project.created_at >= start_date)
    if end_date:
        query = query.filter(Project.created_at <= end_date)

    # ↕️ Tri par date
    if sort_order == "asc":
        query = query.order_by(asc(Project.created_at))
    else:
        query = query.order_by(desc(Project.created_at))

    # 📄 Pagination
    projects = query.offset(skip).limit(limit).all()

    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project