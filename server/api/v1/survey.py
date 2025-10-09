from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.survey import Survey
from schemas.survey import SurveyCreate, SurveyResponse
from db.session import get_db
from models.user import User, UserRole
from core.dependencies import get_current_user
from datetime import datetime
from sqlalchemy import or_

router = APIRouter(prefix="/surveys", tags=["surveys"])

@router.post("/", response_model=SurveyResponse)
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

@router.get("/", response_model=List[SurveyResponse])
def get_surveys(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    surveys = db.query(Survey).offset(skip).limit(limit).all()
    return surveys