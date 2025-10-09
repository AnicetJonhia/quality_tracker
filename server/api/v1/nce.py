from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.nce import NCE, NCEStatus, NCESeverity
from schemas.nce import NCECreate, NCEResponse
from db.session import get_db
from models.user import User, UserRole
from core.security import get_current_user
from models.delivery import Delivery
from models.notification import Notification
from datetime import datetime
from sqlalchemy import or_

router = APIRouter(prefix="/nces", tags=["nces"])


@router.post("/", response_model=NCEResponse)
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

    return nce

@router.patch("/{nce_id}/status")
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