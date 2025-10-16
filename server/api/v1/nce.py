from typing import List, Optional
from models.file import File as FileModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from models.nce import NCE, NCEStatus, NCESeverity
from schemas.nce import NCECreate, NCEResponse, NCEUpdate
from db.session import get_db
from models.user import User, UserRole
from core.dependencies import get_current_user
from models.delivery import Delivery
from models.notification import Notification
from datetime import datetime
from sqlalchemy import or_
from fastapi.responses import FileResponse as FastAPIFileResponse
import os

router = APIRouter(prefix="/nces", tags=["nces"])

UPLOAD_DIR = "uploads/nces"


@router.post("/", response_model=NCEResponse)
async def create_nce(
    delivery_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY, UserRole.PRODUCER, UserRole.CLIENT]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 1️⃣ Créer le NCE
    new_nce = NCE(
        delivery_id=delivery_id,
        title=title,
        description=description,
        created_by=current_user.id
    )
    db.add(new_nce)
    db.commit()
    db.refresh(new_nce)

    # 2️⃣ Sauvegarder les fichiers uploadés et lier au NCE
    upload_folder = f"uploads/nces/{new_nce.id}"
    os.makedirs(upload_folder, exist_ok=True)

    for uploaded_file in files:
        file_path = os.path.join(upload_folder, uploaded_file.filename)
        with open(file_path, "wb") as f:
            f.write(await uploaded_file.read())

        file_record = FileModel(
            filename=uploaded_file.filename,
            storage_key=file_path.replace("\\", "/"),
            nce_id=new_nce.id,
            delivery_id=None 
        )
        db.add(file_record)

    db.commit()

    return new_nce



@router.get("/", response_model=List[NCEResponse])
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

@router.get("/{nce_id}", response_model=NCEResponse)
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


    nce.files

    return nce




@router.patch("/{nce_id}")
def update_nce(
    nce_id: int,
    nce_update: NCEUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY]:
        raise HTTPException(status_code=403, detail="Not authorized")

    nce = db.query(NCE).filter(NCE.id == nce_id).first()
    if not nce:
        raise HTTPException(status_code=404, detail="NCE not found")

    # Met à jour les champs si fournis
    if nce_update.status is not None:
        nce.status = nce_update.status
        

        if nce_update.status == NCEStatus.RESOLVED:
            nce.resolved_at = datetime.utcnow()
        else :
            nce.resolved_at = None
          
            

    if nce_update.severity is not None:
        nce.severity = nce_update.severity

    if nce_update.category is not None:
        nce.category = nce_update.category

    db.commit()
    db.refresh(nce)

    notification = Notification(
        user_id=nce.created_by,
        title="NCE Updated",
        message=f"NCE '{nce.title}' updated",
        type="nce_status",
        link=f"/nce/{nce.id}"
    )
    db.add(notification)
    db.commit()
    
    return nce









@router.get("/{nce_id}/files/{file_id}/download")
def download_nce_file(
    nce_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1️⃣ Récupérer le fichier
    file = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.nce_id == nce_id
    ).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # 2️⃣ Vérifier que le fichier existe physiquement
    file_path = file.storage_key
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # 3️⃣ Retourner le fichier avec FileResponse de FastAPI
    
    return FastAPIFileResponse(
        path=file_path,
        filename=file.filename,
        media_type="application/octet-stream"  # force download
    )
