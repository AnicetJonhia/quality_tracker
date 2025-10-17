from pydantic import BaseModel
from datetime import datetime
from models.survey import SurveyType
from typing import Optional
from .delivery import DeliveryResponseWithProject

class SurveyCreate(BaseModel):
    delivery_id: int
    survey_type: SurveyType
    score: int
    comment: Optional[str] = None

class SurveyResponse(BaseModel):
    id: int
    delivery: Optional[DeliveryResponseWithProject] = None
    survey_type: SurveyType
    score: Optional[int]
    comment: Optional[str]
    sent_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True