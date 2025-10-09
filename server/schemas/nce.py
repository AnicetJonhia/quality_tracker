from pydantic import BaseModel
from datetime import datetime
from models.nce import NCEStatus, NCESeverity

class NCECreate(BaseModel):
    delivery_id: int
    title: str
    description: str
    severity: NCESeverity = NCESeverity.MEDIUM

class NCEResponse(BaseModel):
    id: int
    delivery_id: int
    title: str
    description: str
    severity: NCESeverity
    status: NCEStatus
    created_at: datetime

    class Config:
        from_attributes = True
