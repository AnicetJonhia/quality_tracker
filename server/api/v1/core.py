from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from db.session import get_db
from models.delivery import Delivery
from models.nce import NCE, NCEStatus
from models.survey import Survey, SurveyType
from models.user import User, UserRole

app = APIRouter()

@app.get("/dashboard/stats")
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