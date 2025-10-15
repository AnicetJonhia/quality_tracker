from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.delivery import Delivery, DeliveryStatus
from schemas.delivery import DeliveryCreate, DeliveryResponse
from db.session import get_db
from models.user import User, UserRole
from core.dependencies import get_current_user
from models.project import Project
from sqlalchemy import or_
from models.notification import Notification
from datetime import datetime

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


@router.post("/", response_model=DeliveryResponse)
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

@router.get("/", response_model=List[DeliveryResponse])
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

@router.get("/{delivery_id}", response_model=DeliveryResponse)
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

@router.put("/{delivery_id}/status")
def update_delivery_status(
    delivery_id: int,
    status: DeliveryStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.QUALITY]:
        raise HTTPException(status_code=403, detail="Not authorized")

    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    old_status = delivery.status
    delivery.status = status

    if status == DeliveryStatus.APPROVED:
        delivery.delivered_at = datetime.utcnow()

    db.commit()
    db.refresh(delivery)

    notification = Notification(
        user_id=delivery.created_by,
        title="Delivery Status Updated",
        message=f"Delivery '{delivery.title}' status changed from {old_status.value} to {status.value}",
        type="delivery_status",
        link=f"/deliveries/{delivery.id}"
    )
    db.add(notification)
    db.commit()

    return delivery