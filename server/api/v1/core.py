from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from core.dependencies import get_current_user
from db.session import get_db
from models.delivery import Delivery
from models.nce import NCE, NCEStatus
from models.survey import Survey, SurveyType
from models.user import User, UserRole

router = APIRouter( tags=["core"])

@router.get("/dashboard/stats")
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







def get_delivery_title_color(status: str):
    """Retourne un titre et une couleur selon le status de la livraison"""
    mapping = {
        "DRAFT": ("New delivery created", "bg-primary"),
        "DELIVERED": ("Delivery delivered", "bg-green-500"),
        "APPROVED": ("Delivery approved", "bg-blue-500"),
        "REJECTED": ("Delivery rejected", "bg-red-500"),
    }
    return mapping.get(status.upper(), ("Delivery update", "bg-primary"))

@router.get("/dashboard/activities")
def get_dashboard_activities(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 🔹 Deliveries
    deliveries_query = db.query(Delivery)
    if current_user.role == UserRole.PRODUCER:
        deliveries_query = deliveries_query.filter(Delivery.created_by == current_user.id)
    deliveries = deliveries_query.order_by(desc(Delivery.created_at)).limit(limit).all()

    delivery_activities = []
    for d in deliveries:
        title, color = get_delivery_title_color(d.status)
        delivery_activities.append({
            "type": "delivery",
            "title": title,
            "color": color,
            "name": d.title if d.title else "Unknown",
            "date": d.created_at
        })

    # 🔹 NCEs
    nces_query = db.query(NCE)
    if current_user.role == UserRole.PRODUCER:
        nces_query = nces_query.filter(NCE.created_by == current_user.id)
    nces = nces_query.order_by(desc(NCE.created_at)).limit(limit).all()

    nce_activities = [
        {
            "type": "nce",
            "title": f"NCE {n.status.value.lower()}",
            "color": "bg-accent",
            "name": n.title if n.title else "Unknown",
            "date": n.created_at
        }
        for n in nces
    ]

    # 🔹 Surveys
    surveys_query = db.query(Survey)

    """
    # plus tard
    if current_user.role == UserRole.PRODUCER:
        surveys_query = surveys_query.filter(Survey.user_id == current_user.id)
    
    """
    surveys = surveys_query.order_by(desc(Survey.completed_at)).limit(limit).all()
    survey_activities = [
        {
            "type": "survey",
            "title": f"{s.survey_type.value} completed",
            "color": "bg-primary",
            "name": s.survey_type if s.survey_type else "Unknown",
            "date": s.completed_at
        }
        for s in surveys
    ]

    # 🔹 Fusionner et trier toutes les activités
    all_activities = delivery_activities + nce_activities + survey_activities
    all_activities.sort(key=lambda x: x["date"], reverse=True)

    # 🔹 Retourner les `limit` dernières
    return all_activities[:limit]
