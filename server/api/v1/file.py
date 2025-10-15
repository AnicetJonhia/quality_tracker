# routers/file.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os

from db.session import get_db
from core.dependencies import get_current_user
from models.delivery import Delivery
from models.file import File as FileModel
from fastapi.responses import FileResponse as FastAPIFileResponse
from schemas.file import FileResponse
from models.user import User, UserRole

router = APIRouter(prefix="/deliveries", tags=["Files"])

UPLOAD_DIR = "uploads/deliveries"

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/{delivery_id}/files/", response_model=List[FileResponse])
async def upload_files_to_delivery(
    delivery_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1️⃣ Vérifier la livraison
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    # 2️⃣ Vérifier permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY, UserRole.PRODUCER]:
        raise HTTPException(status_code=403, detail="Not authorized")

    saved_files = []

    # 3️⃣ Sauvegarde physique des fichiers
    for uploaded_file in files:
        delivery_folder = os.path.join(UPLOAD_DIR, str(delivery_id))
        os.makedirs(delivery_folder, exist_ok=True)

        file_path = os.path.join(delivery_folder, uploaded_file.filename)

        with open(file_path, "wb") as f:
            f.write(await uploaded_file.read())

        # 4️⃣ Enregistrement en base
        file_record = FileModel(
            filename=uploaded_file.filename,
            storage_key=file_path.replace("\\", "/"),
            delivery_id=delivery_id
        )
        db.add(file_record)
        saved_files.append(file_record)

    db.commit()

    # 5️⃣ Retourner la liste des fichiers uploadés
    return saved_files


@router.get("/{delivery_id}/files/{file_id}/download")
def download_file(delivery_id: int, file_id: int, db: Session = Depends(get_db)):
    file = db.query(FileModel).filter(FileModel.id == file_id, FileModel.delivery_id == delivery_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Construire le chemin complet
    file_path = os.path.join(UPLOAD_DIR, str(delivery_id), file.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FastAPIFileResponse(
        path=file_path,
        filename=file.filename,
        media_type="application/octet-stream"  # force le download
    )

@router.get("/{delivery_id}/files/", response_model=List[FileResponse])
def list_files_for_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    return delivery.files



@router.delete("/{delivery_id}/files/{file_id}")
def delete_file(
    delivery_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_record = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.delivery_id == delivery_id
    ).first()

    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    # Supprimer du disque si existe
    if os.path.exists(file_record.storage_key):
        os.remove(file_record.storage_key)

    db.delete(file_record)
    db.commit()

    return {"message": "File deleted successfully"}
