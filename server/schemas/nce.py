from pydantic import BaseModel
from datetime import datetime
from models.nce import NCEStatus, NCESeverity
from typing import Optional

class NCECreate(BaseModel):
    delivery_id: int
    title: str
    description: str


# Update NCE : tous les champs optionnels, patchable
class NCEUpdate(BaseModel):
    status: Optional[NCEStatus] = None
    severity: Optional[NCESeverity] = None
    category: Optional[str] = None

class NCEResponse(BaseModel):
    id: int
    delivery_id: int
    title: str
    description: str
    severity: NCESeverity
    status: NCEStatus
    category: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
