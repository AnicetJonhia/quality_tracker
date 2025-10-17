from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from models.delivery import Delivery, DeliveryStatus
from schemas.delivery import DeliveryCreate, DeliveryResponse, DeliveryResponseWithProject, DeliveryResponseWithTotal
from db.session import get_db
from models.user import User, UserRole
from core.dependencies import get_current_user
from models.project import Project
from models.notification import Notification
from datetime import datetime, date


from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from schemas.delivery import DeliveryResponseWithProject


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





@router.get("/", response_model=DeliveryResponseWithTotal)
def get_deliveries(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    project_name: Optional[str] = None,
    client_email: Optional[str] = None,
    start_date: Optional[date] = Query(None, description="Filtrer à partir de cette date"),
    end_date: Optional[date] = Query(None, description="Filtrer jusqu'à cette date"),
    sort_by: Optional[str] = Query("created_at", description="Champ de tri"),
    sort_order: Optional[str] = Query("desc", description="asc ou desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Delivery)

    # Filtrage selon le rôle de l'utilisateur
    if current_user.role == UserRole.PRODUCER:
        query = query.filter(Delivery.created_by == current_user.id)
    elif current_user.role == UserRole.CLIENT:
        query = query.join(Project).filter(Project.client_id == current_user.id)

    # Recherche textuelle
    if search:
        query = query.filter(
            or_(
                Delivery.title.ilike(f"%{search}%"),
                Delivery.description.ilike(f"%{search}%"),
            )
        )

    # Filtrer par status
    if status_filter:
        query = query.filter(Delivery.status == status_filter)

    # Filtrer par nom de projet
    if project_name:
        query = query.join(Project).filter(Project.name.ilike(f"%{project_name}%"))
    
    # Filtrer par email client
    if client_email:
        query = query.join(Project).join(User).filter(User.email.ilike(f"%{client_email}%"))

    # 🔹 Filtrage par date
    if start_date and end_date:
        query = query.filter(
            and_(
                func.date(Delivery.created_at) >= start_date,
                func.date(Delivery.created_at) <= end_date
            )
        )
    elif start_date:
        query = query.filter(func.date(Delivery.created_at) >= start_date)
    elif end_date:
        query = query.filter(func.date(Delivery.created_at) <= end_date)

    # 🔹 Tri dynamique
    sort_attr = getattr(Delivery, sort_by, Delivery.created_at)
    query = query.order_by(sort_attr.asc() if sort_order == "asc" else sort_attr.desc())

    total = query.count()

    # Pagination
    deliveries = query.offset(skip).limit(limit).all()
    return DeliveryResponseWithTotal(total=total, deliveries=deliveries)


@router.get("/{delivery_id}", response_model=DeliveryResponseWithProject)
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